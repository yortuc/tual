import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Renderer } from '../renderer/Renderer'
import { world } from '../ecs/World'
import { eventBus } from '../ecs/EventBus'
import { editorStore } from '../editor/EditorStore'
import { sceneStore } from '../editor/SceneStore'
import { PipelineStage } from '../ecs/Component'
import { TransformComponent } from '../components/styles/TransformComponent'
import type { DrawItem } from '../renderer/DrawItem'

interface ViewState {
  zoom: number
  panX: number
  panY: number
}

const ZOOM_MIN = 0.05
const ZOOM_MAX = 10
const ZOOM_STEP = 1.15

interface DragState {
  startX: number
  startY: number
  startPanX: number
  startPanY: number
}

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const viewRef = useRef<ViewState>({ zoom: 1, panX: 0, panY: 0 })
  const dragRef = useRef<DragState | null>(null)
  const hasDraggedRef = useRef(false)
  const [zoomPct, setZoomPct] = useState(100)
  const [cursor, setCursor] = useState('default')

  const draw = useCallback(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    renderer.clear(sceneStore.getBackground())

    const { zoom, panX, panY } = viewRef.current
    const ctx = renderer.getContext()

    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    // Main scene
    const allItems = world.getEntityIds().flatMap(id => world.runPipeline(id))
    renderer.render(allItems)

    // Selection pass (inside zoom transform — outlines scale with world)
    const selectedId = editorStore.selectedEntityId
    if (selectedId !== null) {
      renderer.renderSelectionOutlines(world.runPipeline(selectedId), zoom)
    }

    ctx.restore()

    // Gizmos drawn in screen space after restore — constant size regardless of zoom
    if (selectedId !== null) {
      const components = world.getComponents(selectedId)
      const transform = components.find(c => c instanceof TransformComponent) as TransformComponent | undefined
      const origin = transform
        ? { x: transform.position.value.x, y: transform.position.value.y }
        : { x: 0, y: 0 }
      const entityScreenOrigin = { x: origin.x * zoom + panX, y: origin.y * zoom + panY }

      // Sort components by pipeline stage (stable — preserves insertion order within a stage)
      const sorted = [...components].sort((a, b) => a.stage - b.stage)

      for (let i = 0; i < sorted.length; i++) {
        const comp = sorted[i]
        if (!comp.renderGizmo) continue

        let screenOrigins: { x: number; y: number }[]

        if (comp.stage === PipelineStage.Modifier) {
          // Run a seed item through all subsequent components to find multiplied positions.
          // This causes the first cloner's gizmo to appear at each position produced by later cloners.
          const seed: DrawItem = { transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }, shape: { type: 'rect', width: 0, height: 0 }, style: { opacity: 1 } }
          let items: DrawItem[] = [seed]
          for (let j = i + 1; j < sorted.length; j++) {
            if (sorted[j].process) items = sorted[j].process!(items)
          }
          screenOrigins = items.map(item => ({
            x: item.transform.x * zoom + panX,
            y: item.transform.y * zoom + panY,
          }))
        } else {
          screenOrigins = [entityScreenOrigin]
        }

        comp.renderGizmo({ ctx, origin, screenOrigins, zoom })
      }
    }
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

  // Mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: viewRef.current.panX, startPanY: viewRef.current.panY }
    hasDraggedRef.current = false
    setCursor('grabbing')
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (!hasDraggedRef.current && Math.hypot(dx, dy) > 4) hasDraggedRef.current = true
      viewRef.current = { ...viewRef.current, panX: drag.startPanX + dx, panY: drag.startPanY + dy }
      draw()
    }
    const handleMouseUp = () => {
      if (!dragRef.current) return
      dragRef.current = null
      setCursor('default')
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draw])

  // Touch pan + tap (iPad / Pencil)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      dragRef.current = { startX: t.clientX, startY: t.clientY, startPanX: viewRef.current.panX, startPanY: viewRef.current.panY }
      hasDraggedRef.current = false
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !dragRef.current) return
      e.preventDefault()
      const t = e.touches[0]
      const dx = t.clientX - dragRef.current.startX
      const dy = t.clientY - dragRef.current.startY
      if (!hasDraggedRef.current && Math.hypot(dx, dy) > 4) hasDraggedRef.current = true
      viewRef.current = { ...viewRef.current, panX: dragRef.current.startPanX + dx, panY: dragRef.current.startPanY + dy }
      draw()
    }
    const handleTouchEnd = (e: TouchEvent) => {
      if (!dragRef.current) return
      if (!hasDraggedRef.current && e.changedTouches.length > 0) {
        const t = e.changedTouches[0]
        hitTest(t.clientX, t.clientY)
      }
      dragRef.current = null
    }
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [draw, hitTest])

  // Hit test — converts screen coords → world coords before testing
  const hitTest = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const { zoom, panX, panY } = viewRef.current
    const wx = (sx - rect.left - panX) / zoom
    const wy = (sy - rect.top  - panY) / zoom

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
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hasDraggedRef.current) return  // was a pan, not a tap
    hitTest(e.clientX, e.clientY)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        style={{ display: 'block', cursor }}
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
