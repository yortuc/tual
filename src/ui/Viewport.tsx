import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Renderer } from '../renderer/Renderer'
import { world } from '../ecs/World'
import { eventBus } from '../ecs/EventBus'
import { editorStore } from '../editor/EditorStore'
import { TransformComponent } from '../components/styles/TransformComponent'

interface ViewState {
  zoom: number
  panX: number
  panY: number
}

const ZOOM_MIN = 0.05
const ZOOM_MAX = 10
const ZOOM_STEP = 1.15

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const viewRef = useRef<ViewState>({ zoom: 1, panX: 0, panY: 0 })
  const [zoomPct, setZoomPct] = useState(100)

  const draw = useCallback(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    renderer.clear()

    const { zoom, panX, panY } = viewRef.current
    const ctx = renderer.getContext()

    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    // Main scene
    const allItems = world.getEntityIds().flatMap(id => world.runPipeline(id))
    renderer.render(allItems)

    // Selection pass
    const selectedId = editorStore.selectedEntityId
    if (selectedId !== null) {
      renderer.renderSelectionOutlines(world.runPipeline(selectedId))

      const components = world.getComponents(selectedId)
      const transform = components.find(c => c instanceof TransformComponent) as TransformComponent | undefined
      const origin = transform
        ? { x: transform.position.value.x, y: transform.position.value.y }
        : { x: 0, y: 0 }
      for (const comp of components) {
        comp.renderGizmo?.({ ctx, origin })
      }
    }

    ctx.restore()
  }, [])

  // Zoom centered on a canvas point (sx, sy in screen space)
  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    const v = viewRef.current
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v.zoom * factor))
    const zf = newZoom / v.zoom
    viewRef.current = {
      zoom: newZoom,
      panX: sx - (sx - v.panX) * zf,
      panY: sy - (sy - v.panY) * zf,
    }
    setZoomPct(Math.round(newZoom * 100))
    draw()
  }, [draw])

  const resetZoom = useCallback(() => {
    viewRef.current = { zoom: 1, panX: 0, panY: 0 }
    setZoomPct(100)
    draw()
  }, [draw])

  // Renderer init + resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    rendererRef.current = new Renderer(canvas)

    const handleResize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      rendererRef.current?.resize(parent.clientWidth, parent.clientHeight)
      draw()
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(canvas.parentElement!)
    handleResize()

    const u1 = eventBus.on('world:changed', draw)
    const u2 = eventBus.on('editor:selection-changed', draw)
    return () => { ro.disconnect(); u1(); u2() }
  }, [draw])

  // Scroll wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      zoomAt(
        e.clientX - rect.left,
        e.clientY - rect.top,
        e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP,
      )
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [zoomAt])

  // Keyboard shortcuts: Cmd/Ctrl +/-/0
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomAt(viewRef.current.panX, viewRef.current.panY, ZOOM_STEP) }
      else if (e.key === '-')             { e.preventDefault(); zoomAt(viewRef.current.panX, viewRef.current.panY, 1 / ZOOM_STEP) }
      else if (e.key === '0')             { e.preventDefault(); resetZoom() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [zoomAt, resetZoom])

  // Hit test — converts screen coords → world coords before testing
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const { zoom, panX, panY } = viewRef.current
    const wx = (e.clientX - rect.left - panX) / zoom
    const wy = (e.clientY - rect.top  - panY) / zoom

    let hit: number | null = null
    for (const id of world.getEntityIds()) {
      for (const item of world.runPipeline(id)) {
        const { x, y } = item.transform
        const s = item.shape
        if (s.type === 'rect') {
          if (Math.abs(wx - x) < s.width / 2 && Math.abs(wy - y) < s.height / 2) hit = id
        } else if (s.type === 'circle') {
          if (Math.hypot(wx - x, wy - y) < s.radius) hit = id
        } else if (s.type === 'text') {
          if (Math.abs(wx - x) < 80 && Math.abs(wy - y) < s.fontSize) hit = id
        }
      }
    }
    editorStore.select(hit)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ display: 'block', cursor: 'default' }}
      />

      {/* Zoom controls — bottom right, iPad friendly */}
      <div style={{
        position: 'absolute', bottom: 14, right: 14,
        display: 'flex', alignItems: 'center', gap: 2,
        background: '#1e1e1e', border: '1px solid #333',
        borderRadius: 6, overflow: 'hidden',
      }}>
        <button
          onClick={() => zoomAt(viewRef.current.panX, viewRef.current.panY, 1 / ZOOM_STEP)}
          style={zoomBtnStyle}
        >−</button>
        <button
          onClick={resetZoom}
          style={{ ...zoomBtnStyle, width: 52, fontSize: 11, letterSpacing: '0.3px' }}
        >{zoomPct}%</button>
        <button
          onClick={() => zoomAt(viewRef.current.panX, viewRef.current.panY, ZOOM_STEP)}
          style={zoomBtnStyle}
        >+</button>
      </div>
    </div>
  )
}

const zoomBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  cursor: 'pointer',
  fontSize: 16,
  width: 32,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}
