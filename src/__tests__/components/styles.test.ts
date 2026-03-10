import { describe, it, expect } from 'vitest'
import { FillComponent } from '../../components/styles/FillComponent'
import { StrokeComponent } from '../../components/styles/StrokeComponent'
import { ShadowComponent } from '../../components/styles/ShadowComponent'
import { OpacityComponent } from '../../components/styles/OpacityComponent'
import { TransformComponent } from '../../components/styles/TransformComponent'
import { PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'

function makeItem(overrides: Partial<DrawItem> = {}): DrawItem {
  return {
    shape: { type: 'rect', width: 100, height: 100 },
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    style: { opacity: 1 },
    channels: {},
    ...overrides,
  }
}

function makeState(items: DrawItem[], channels: Record<string, number> = {}) {
  return { items, channels }
}

describe('FillComponent', () => {
  it('is in Style stage', () => {
    expect(new FillComponent().stage).toBe(PipelineStage.Style)
  })

  it('sets fill on all items using hsl output', () => {
    const fill = new FillComponent()
    fill.setColor('#abc123')
    const result = fill.processState!(makeState([makeItem(), makeItem()])).items
    result.forEach(item => expect(item.style.fill).toMatch(/^#[0-9a-f]{6}$/))
  })

  it('does not mutate original items', () => {
    const original = makeItem()
    const fill = new FillComponent()
    fill.processState!(makeState([original]))
    expect(original.style.fill).toBeUndefined()
  })

  it('two-way sync: color picker updates H/S/L', () => {
    const fill = new FillComponent()
    fill.setColor('#ff0000')  // pure red = hsl(0, 100, 50)
    expect(fill.hue.value).toBe(0)
    expect(fill.saturation.value).toBe(100)
    expect(fill.lightness.value).toBe(50)
  })

  it('two-way sync: H/S/L update color', () => {
    const fill = new FillComponent()
    fill.hue.value = 120
    fill.saturation.value = 100
    fill.lightness.value = 50
    fill.onPropChanged!(fill.hue)
    expect(fill.color.value).toBe('#00ff00')
  })

  it('hue channel drives per-item fill', () => {
    const fill = new FillComponent()
    fill.hue.channel = 'h'
    fill.saturation.value = 100
    fill.lightness.value = 50
    const items = [
      makeItem({ channels: { h: 0 } }),
      makeItem({ channels: { h: 120 } }),
    ]
    const result = fill.processState!(makeState(items)).items
    expect(result[0].style.fill).toBe('#ff0000')
    expect(result[1].style.fill).toBe('#00ff00')
  })
})

describe('StrokeComponent', () => {
  it('sets stroke color and width on all items', () => {
    const stroke = new StrokeComponent()
    stroke.color.value = '#ffffff'
    stroke.width.value = 3
    const [result] = stroke.process!([makeItem()])
    expect(result.style.stroke?.color).toBe('#ffffff')
    expect(result.style.stroke?.width).toBe(3)
  })
})

describe('ShadowComponent', () => {
  it('is in Style stage', () => {
    expect(new ShadowComponent().stage).toBe(PipelineStage.Style)
  })

  it('sets shadow properties on all items', () => {
    const shadow = new ShadowComponent()
    shadow.offsetX.value = 5
    shadow.offsetY.value = 8
    shadow.blur.value = 16
    shadow.color.value = '#000000'
    const [result] = shadow.process!([makeItem()])
    expect(result.style.shadow).toEqual({ x: 5, y: 8, blur: 16, color: '#000000' })
  })
})

describe('OpacityComponent', () => {
  it('sets opacity on all items', () => {
    const op = new OpacityComponent()
    op.opacity.value = 0.5
    const [result] = op.processState!(makeState([makeItem()])).items
    expect(result.style.opacity).toBe(0.5)
  })

  it('reads opacity from item channel when bound', () => {
    const op = new OpacityComponent()
    op.opacity.channel = 'fade'
    const item = makeItem({ channels: { fade: 0.25 } })
    const [result] = op.processState!(makeState([item])).items
    expect(result.style.opacity).toBe(0.25)
  })

  it('falls back to literal value when channel is missing', () => {
    const op = new OpacityComponent()
    op.opacity.value = 0.7
    op.opacity.channel = 'missing'
    const [result] = op.processState!(makeState([makeItem()])).items
    expect(result.style.opacity).toBe(0.7)
  })
})

describe('TransformComponent', () => {
  it('is in Style stage', () => {
    expect(new TransformComponent().stage).toBe(PipelineStage.Style)
  })

  it('offsets position of all items', () => {
    const t = new TransformComponent()
    t.position.value = { x: 150, y: 250 }
    const { items: result } = t.processState!({ items: [makeItem(), makeItem()], channels: {} })
    result.forEach(item => {
      expect(item.transform.x).toBe(150)
      expect(item.transform.y).toBe(250)
    })
  })

  it('adds rotation in radians', () => {
    const t = new TransformComponent()
    t.rotation.value = 90
    const { items: [result] } = t.processState!({ items: [makeItem()], channels: {} })
    expect(result.transform.rotation).toBeCloseTo(Math.PI / 2)
  })

  it('multiplies scale uniformly', () => {
    const t = new TransformComponent()
    t.scale.value = 2
    const { items: [result] } = t.processState!({ items: [makeItem()], channels: {} })
    expect(result.transform.scaleX).toBe(2)
    expect(result.transform.scaleY).toBe(2)
  })

  it('accumulates with existing item transform', () => {
    const t = new TransformComponent()
    t.position.value = { x: 100, y: 100 }
    const item = makeItem({ transform: { x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1 } })
    const { items: [result] } = t.processState!({ items: [item], channels: {} })
    expect(result.transform.x).toBe(150)
    expect(result.transform.y).toBe(150)
  })
})
