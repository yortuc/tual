import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Renderer } from '../../renderer/Renderer'
import type { DrawItem } from '../../renderer/DrawItem'

// Minimal Canvas 2D mock that records draw calls and tracks all assigned values
function createMockCanvas() {
  // Track every value ever assigned to shadow/style properties
  const assigned: Record<string, unknown[]> = {}
  function track(key: string, value: unknown) {
    if (!assigned[key]) assigned[key] = []
    assigned[key].push(value)
  }

  const _state: Record<string, unknown> = {
    fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1,
    shadowColor: '', shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 0,
    font: '', textAlign: 'left', textBaseline: 'alphabetic',
  }

  const ctx = new Proxy({
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
    scale: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), arc: vi.fn(),
    fill: vi.fn(), stroke: vi.fn(), fillRect: vi.fn(),
    fillText: vi.fn(), strokeText: vi.fn(),
    canvas: { width: 800, height: 600 },
  }, {
    get: (target, key: string) => key in _state ? _state[key] : target[key as keyof typeof target],
    set: (target, key: string, value) => {
      if (key in _state) { _state[key] = value; track(key, value) }
      else (target as Record<string, unknown>)[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D & { _assigned: typeof assigned }

  ;(ctx as unknown as Record<string, unknown>)['_assigned'] = assigned

  const canvas = {
    getContext: () => ctx,
    width: 800,
    height: 600,
  } as unknown as HTMLCanvasElement

  return { canvas, ctx: ctx as unknown as CanvasRenderingContext2D & { _assigned: typeof assigned } }
}

function rectItem(overrides: Partial<DrawItem> = {}): DrawItem {
  return {
    shape: { type: 'rect', width: 100, height: 80 },
    transform: { x: 50, y: 60, rotation: 0, scaleX: 1, scaleY: 1 },
    style: { opacity: 1, fill: '#ff0000' },
    ...overrides,
  }
}

function circleItem(overrides: Partial<DrawItem> = {}): DrawItem {
  return {
    shape: { type: 'circle', radius: 40 },
    transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
    style: { opacity: 1, fill: '#00ff00' },
    ...overrides,
  }
}

function textItem(overrides: Partial<DrawItem> = {}): DrawItem {
  return {
    shape: { type: 'text', content: 'Hello', fontSize: 24, fontFamily: 'sans-serif' },
    transform: { x: 200, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },
    style: { opacity: 1, fill: '#ffffff' },
    ...overrides,
  }
}

describe('Renderer', () => {
  let renderer: Renderer
  let ctx: ReturnType<typeof createMockCanvas>['ctx']

  beforeEach(() => {
    const mock = createMockCanvas()
    renderer = new Renderer(mock.canvas)
    ctx = mock.ctx
  })

  describe('clear', () => {
    it('fills the canvas with background color', () => {
      renderer.clear('#1a1a1a')
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600)
    })
  })

  describe('rect rendering', () => {
    it('calls ctx.rect with correct centered coordinates', () => {
      renderer.render([rectItem()])
      // Rect is drawn centered: -width/2, -height/2
      expect(ctx.rect).toHaveBeenCalledWith(-50, -40, 100, 80)
    })

    it('calls translate with item position', () => {
      renderer.render([rectItem()])
      expect(ctx.translate).toHaveBeenCalledWith(50, 60)
    })

    it('calls fill when fill style is set', () => {
      renderer.render([rectItem({ style: { opacity: 1, fill: '#ff0000' } })])
      expect(ctx.fill).toHaveBeenCalled()
    })

    it('does not call fill when no fill style', () => {
      renderer.render([rectItem({ style: { opacity: 1 } })])
      expect(ctx.fill).not.toHaveBeenCalled()
    })

    it('calls stroke when stroke style is set', () => {
      renderer.render([rectItem({
        style: { opacity: 1, stroke: { color: '#fff', width: 2 } },
      })])
      expect(ctx.stroke).toHaveBeenCalled()
    })

    it('applies rotation', () => {
      renderer.render([rectItem({
        transform: { x: 0, y: 0, rotation: Math.PI / 4, scaleX: 1, scaleY: 1 },
      })])
      expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 4)
    })

    it('applies scale', () => {
      renderer.render([rectItem({
        transform: { x: 0, y: 0, rotation: 0, scaleX: 2, scaleY: 3 },
      })])
      expect(ctx.scale).toHaveBeenCalledWith(2, 3)
    })

    it('sets globalAlpha from opacity', () => {
      renderer.render([rectItem({ style: { opacity: 0.5, fill: '#ff0000' } })])
      expect(ctx.globalAlpha).toBe(0.5)
    })

    it('sets shadow properties when shadow style is present', () => {
      renderer.render([rectItem({
        style: {
          opacity: 1,
          fill: '#ff0000',
          shadow: { x: 4, y: 6, blur: 12, color: '#000000' },
        },
      })])
      // The renderer resets shadowColor to 'transparent' after fill, so check
      // assignment history rather than the final value
      expect(ctx._assigned['shadowOffsetX']).toContain(4)
      expect(ctx._assigned['shadowOffsetY']).toContain(6)
      expect(ctx._assigned['shadowBlur']).toContain(12)
      expect(ctx._assigned['shadowColor']).toContain('#000000')
    })

    it('saves and restores context for each item', () => {
      renderer.render([rectItem(), rectItem()])
      expect(ctx.save).toHaveBeenCalledTimes(2)
      expect(ctx.restore).toHaveBeenCalledTimes(2)
    })
  })

  describe('circle rendering', () => {
    it('calls ctx.arc with correct radius', () => {
      renderer.render([circleItem()])
      expect(ctx.arc).toHaveBeenCalledWith(0, 0, 40, 0, Math.PI * 2)
    })

    it('calls fill for circle', () => {
      renderer.render([circleItem()])
      expect(ctx.fill).toHaveBeenCalled()
    })
  })

  describe('text rendering', () => {
    it('calls fillText with correct content', () => {
      renderer.render([textItem()])
      expect(ctx.fillText).toHaveBeenCalledWith('Hello', 0, 0)
    })

    it('sets font correctly', () => {
      renderer.render([textItem()])
      expect(ctx.font).toBe('24px sans-serif')
    })

    it('uses centered text alignment', () => {
      renderer.render([textItem()])
      expect(ctx.textAlign).toBe('center')
      expect(ctx.textBaseline).toBe('middle')
    })
  })

  describe('multiple items', () => {
    it('renders all items in the array', () => {
      renderer.render([rectItem(), circleItem(), textItem()])
      expect(ctx.save).toHaveBeenCalledTimes(3)
      expect(ctx.restore).toHaveBeenCalledTimes(3)
    })

    it('renders empty array without error', () => {
      expect(() => renderer.render([])).not.toThrow()
    })
  })
})
