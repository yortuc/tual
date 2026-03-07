import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Renderer } from '../renderer/Renderer'
import { world } from '../ecs/World'
import { eventBus } from '../ecs/EventBus'
import { editorStore } from '../editor/EditorStore'
import { sceneStore } from '../editor/SceneStore'
import { PipelineStage, type Component } from '../ecs/Component'
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

interface ObjectDragState {
  entityId: number
  startScreenX: number
  startScreenY: number
  startWx: number      // mouse world position at drag start
  startWy: number
  startPosX: number    // entity origin at drag start
  startPosY: number
}

interface GizmoHandleDragState {
  component: Component
  handleId: string
  startScreenX: number
  startScreenY: number
}

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const viewRef = useRef<ViewState>({ zoom: 1, panX: 0, panY: 0 })
  const dragRef = useRef<DragState | null>(null)
  const objectDragRef = useRef<ObjectDragState | null>(null)
  const gizmoHandleDragRef = useRef<GizmoHandleDragState | null>(null)
  const mouseDownHitRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)
  const [zoomPct, setZoomPct] = useState(100)
  const [cursor, setCursor] = useState('default')

  // Computes the screen-space origins for a component's gizmo (accounts for downstream multipliers)
  const getComponentScreenOrigins = useCallback((
    comp: Component,
    compIndex: number,
    sorted: Component[],
    entityScreenOrigin: { x: number; y: number },
    zoom: number,
    panX: number,
    panY: number,
  ): { x: number; y: number }[] => {
    if (comp.stage === PipelineStage.Modifier) {
      const seed: DrawItem = { transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }, shape: { type: 'rect', width: 0, height: 0 }, style: { opacity: 1 } }
      let items: DrawItem[] = [seed]
      for (let j = compIndex + 1; j < sorted.length; j++) {
        if (sorted[j].process) items = sorted[j].process!(items)
      }
      return items.map(item => ({
        x: item.transform.x * zoom + panX,
        y: item.transform.y * zoom + panY,
      }))
    }
    return [entityScreenOrigin]
  }, [])

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
        const screenOrigins = getComponentScreenOrigins(comp, i, sorted, entityScreenOrigin, zoom, panX, panY)
        comp.renderGizmo({ ctx, origin, screenOrigins, zoom })
      }
    }
  }, [])

  // Returns the selected entity's position in screen space, or null if nothing selected
  const getSelectionScreenPos = useCallback((): { x: number; y: number } | null => {
    const id = editorStore.selectedEntityId
    if (id === null) return null
    const components = world.getComponents(id)
    const transform = components.find(c => c instanceof TransformComponent) as TransformComponent | undefined
    const wx = transform ? transform.position.value.x : 0
    const wy = transform ? transform.position.value.y : 0
    const { zoom, panX, panY } = viewRef.current
    return { x: wx * zoom + panX, y: wy * zoom + panY }
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
      const sel = getSelectionScreenPos()
      const cx = sel ? sel.x : e.clientX - rect.left
      const cy = sel ? sel.y : e.clientY - rect.top
      zoomAt(cx, cy, e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP)
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [zoomAt, getSelectionScreenPos])

  // Keyboard shortcuts: Cmd/Ctrl +/-/0
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return
      const canvas = canvasRef.current
      const sel = getSelectionScreenPos()
      const cx = sel ? sel.x : (canvas ? canvas.width / 2 : 0)
      const cy = sel ? sel.y : (canvas ? canvas.height / 2 : 0)
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomAt(cx, cy, ZOOM_STEP) }
      else if (e.key === '-')             { e.preventDefault(); zoomAt(cx, cy, 1 / ZOOM_STEP) }
      else if (e.key === '0')             { e.preventDefault(); resetZoom() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [zoomAt, resetZoom, getSelectionScreenPos])

  // Returns entity id at world position, or null
  const getHitEntity = useCallback((wx: number, wy: number): number | null => {
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
    return hit
  }, [])

  // Converts screen coords → world coords
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const { zoom, panX, panY } = viewRef.current
    return { wx: (sx - rect.left - panX) / zoom, wy: (sy - rect.top - panY) / zoom }
  }, [])

  // Mouse down — branch into gizmo handle drag, object drag, or canvas pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const { zoom, panX, panY } = viewRef.current
    const { wx, wy } = screenToWorld(e.clientX, e.clientY)
    hasDraggedRef.current = false

    // 1. Check gizmo handles of the selected entity first
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left   // canvas-relative coords for handle hit test
    const canvasY = e.clientY - rect.top
    const selectedId = editorStore.selectedEntityId
    if (selectedId !== null) {
      const components = world.getComponents(selectedId)
      const transform = components.find(c => c instanceof TransformComponent) as TransformComponent | undefined
      const origin = transform ? transform.position.value : { x: 0, y: 0 }
      const entityScreenOrigin = { x: origin.x * zoom + panX, y: origin.y * zoom + panY }
      const sorted = [...components].sort((a, b) => a.stage - b.stage)
      for (let i = 0; i < sorted.length; i++) {
        const comp = sorted[i]
        if (!comp.getGizmoHandles) continue
        const screenOrigins = getComponentScreenOrigins(comp, i, sorted, entityScreenOrigin, zoom, panX, panY)
        const handles = comp.getGizmoHandles(screenOrigins, zoom)
        for (const handle of handles) {
          if (Math.hypot(canvasX - handle.x, canvasY - handle.y) < 10) {
            comp.onGizmoHandleDragStart?.(handle.id)
            gizmoHandleDragRef.current = { component: comp, handleId: handle.id, startScreenX: e.clientX, startScreenY: e.clientY }
            setCursor(handle.cursor ?? 'crosshair')
            return
          }
        }
      }
    }

    // 2. Entity hit test — select + object drag
    const hit = getHitEntity(wx, wy)
    mouseDownHitRef.current = hit
    if (hit !== null) {
      editorStore.select(hit)
      const transform = world.getComponents(hit).find(c => c instanceof TransformComponent) as TransformComponent | undefined
      objectDragRef.current = {
        entityId: hit,
        startScreenX: e.clientX,
        startScreenY: e.clientY,
        startWx: wx,
        startWy: wy,
        startPosX: transform?.position.value.x ?? 0,
        startPosY: transform?.position.value.y ?? 0,
      }
    } else {
      // 3. Canvas pan
      dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY }
    }
    setCursor('grabbing')
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Gizmo handle drag
      if (gizmoHandleDragRef.current) {
        const gh = gizmoHandleDragRef.current
        const dx = e.clientX - gh.startScreenX
        const dy = e.clientY - gh.startScreenY
        gh.component.onGizmoHandleDrag?.(gh.handleId, dx, dy, viewRef.current.zoom)
        return
      }
      // Object drag
      if (objectDragRef.current) {
        const od = objectDragRef.current
        if (!hasDraggedRef.current && Math.hypot(e.clientX - od.startScreenX, e.clientY - od.startScreenY) > 4) {
          hasDraggedRef.current = true
        }
        if (!hasDraggedRef.current) return
        const { wx, wy } = screenToWorld(e.clientX, e.clientY)
        const transform = world.getComponents(od.entityId).find(c => c instanceof TransformComponent) as TransformComponent | undefined
        if (transform) {
          transform.position.value = { x: od.startPosX + (wx - od.startWx), y: od.startPosY + (wy - od.startWy) }
          eventBus.emit('world:changed')
        }
        return
      }
      // Canvas pan
      const drag = dragRef.current
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (!hasDraggedRef.current && Math.hypot(dx, dy) > 4) hasDraggedRef.current = true
      viewRef.current = { ...viewRef.current, panX: drag.startPanX + dx, panY: drag.startPanY + dy }
      draw()
    }
    const handleMouseUp = () => {
      gizmoHandleDragRef.current = null
      objectDragRef.current = null
      dragRef.current = null
      setCursor('default')
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draw, screenToWorld, getComponentScreenOrigins])

  // Touch — object drag or canvas pan (iPad / Pencil)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      const { wx, wy } = screenToWorld(t.clientX, t.clientY)
      const hit = getHitEntity(wx, wy)
      mouseDownHitRef.current = hit
      hasDraggedRef.current = false
      if (hit !== null) {
        editorStore.select(hit)
        const transform = world.getComponents(hit).find(c => c instanceof TransformComponent) as TransformComponent | undefined
        objectDragRef.current = {
          entityId: hit,
          startScreenX: t.clientX, startScreenY: t.clientY,
          startWx: wx, startWy: wy,
          startPosX: transform?.position.value.x ?? 0,
          startPosY: transform?.position.value.y ?? 0,
        }
      } else {
        dragRef.current = { startX: t.clientX, startY: t.clientY, startPanX: viewRef.current.panX, startPanY: viewRef.current.panY }
      }
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      e.preventDefault()
      const t = e.touches[0]
      if (objectDragRef.current) {
        const od = objectDragRef.current
        if (!hasDraggedRef.current && Math.hypot(t.clientX - od.startScreenX, t.clientY - od.startScreenY) > 4) {
          hasDraggedRef.current = true
        }
        if (!hasDraggedRef.current) return
        const { wx, wy } = screenToWorld(t.clientX, t.clientY)
        const transform = world.getComponents(od.entityId).find(c => c instanceof TransformComponent) as TransformComponent | undefined
        if (transform) {
          transform.position.value = { x: od.startPosX + (wx - od.startWx), y: od.startPosY + (wy - od.startWy) }
          eventBus.emit('world:changed')
        }
        return
      }
      if (!dragRef.current) return
      const dx = t.clientX - dragRef.current.startX
      const dy = t.clientY - dragRef.current.startY
      if (!hasDraggedRef.current && Math.hypot(dx, dy) > 4) hasDraggedRef.current = true
      viewRef.current = { ...viewRef.current, panX: dragRef.current.startPanX + dx, panY: dragRef.current.startPanY + dy }
      draw()
    }
    const handleTouchEnd = (e: TouchEvent) => {
      if (!hasDraggedRef.current && mouseDownHitRef.current === null && e.changedTouches.length > 0) {
        editorStore.select(null)
      }
      objectDragRef.current = null
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
  }, [draw, screenToWorld, getHitEntity])

  const handleClick = () => {
    if (hasDraggedRef.current) return
    if (mouseDownHitRef.current === null) editorStore.select(null)
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
          onClick={() => { const s = getSelectionScreenPos(); const c = canvasRef.current; const cx = s?.x ?? (c ? c.width/2 : 0); const cy = s?.y ?? (c ? c.height/2 : 0); zoomAt(cx, cy, 1 / ZOOM_STEP) }}
          style={zoomBtnStyle}
        >−</button>
        <button
          onClick={resetZoom}
          style={{ ...zoomBtnStyle, width: 52, fontSize: 11, letterSpacing: '0.3px' }}
        >{zoomPct}%</button>
        <button
          onClick={() => { const s = getSelectionScreenPos(); const c = canvasRef.current; const cx = s?.x ?? (c ? c.width/2 : 0); const cy = s?.y ?? (c ? c.height/2 : 0); zoomAt(cx, cy, ZOOM_STEP) }}
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
