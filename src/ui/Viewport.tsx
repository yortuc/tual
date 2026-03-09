import React, { useRef, useEffect, useCallback, useState } from 'react'
import { WebGLRenderer } from '../renderer/WebGLRenderer'
import { world } from '../ecs/World'
import { eventBus } from '../ecs/EventBus'
import { editorStore } from '../editor/EditorStore'
import { sceneStore } from '../editor/SceneStore'
import { GlowComponent } from '../components/scene/GlowComponent'
import { PipelineStage, type Component } from '../ecs/Component'
import { TransformComponent } from '../components/styles/TransformComponent'
import { ClonerComponent } from '../components/modifiers/ClonerComponent'
import { historyStore } from '../ecs/HistoryStore'
import { SetPropCommand } from '../ecs/Command'
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
  startWx: number
  startWy: number
  startPosX: number
  startPosY: number
}

interface GizmoHandleDragState {
  component: Component
  handleId: string
  startScreenX: number
  startScreenY: number
}

function drawTextItem(ctx: CanvasRenderingContext2D, item: DrawItem): void {
  if (item.shape.type !== 'text') return
  const { transform, style, shape } = item
  ctx.save()
  ctx.globalAlpha = style.opacity ?? 1
  if (style.shadow) {
    ctx.shadowColor = style.shadow.color
    ctx.shadowOffsetX = style.shadow.x
    ctx.shadowOffsetY = style.shadow.y
    ctx.shadowBlur = style.shadow.blur
  }
  ctx.translate(transform.x, transform.y)
  ctx.rotate(transform.rotation)
  ctx.scale(transform.scaleX, transform.scaleY)
  ctx.font = `${shape.fontSize}px ${shape.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (style.fill) { ctx.fillStyle = style.fill; ctx.fillText(shape.content, 0, 0) }
  ctx.shadowColor = 'transparent'
  if (style.stroke) { ctx.strokeStyle = style.stroke.color; ctx.lineWidth = style.stroke.width; ctx.strokeText(shape.content, 0, 0) }
  ctx.restore()
}

function drawSelectionOutline(ctx: CanvasRenderingContext2D, item: DrawItem, zoom: number): void {
  const { transform, shape } = item
  ctx.save()
  ctx.translate(transform.x, transform.y)
  ctx.rotate(transform.rotation)
  ctx.scale(transform.scaleX, transform.scaleY)
  ctx.strokeStyle = '#4a90d9'
  ctx.lineWidth = 1 / zoom
  ctx.setLineDash([4 / zoom, 3 / zoom])
  ctx.beginPath()
  if (shape.type === 'rect') {
    ctx.rect(-shape.width / 2, -shape.height / 2, shape.width, shape.height)
  } else if (shape.type === 'circle') {
    ctx.arc(0, 0, shape.radius, 0, Math.PI * 2)
  } else if (shape.type === 'text') {
    ctx.font = `${shape.fontSize}px ${shape.fontFamily}`
    const w = ctx.measureText(shape.content).width
    ctx.rect(-w / 2, -shape.fontSize / 2, w, shape.fontSize)
  }
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gizmoCanvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const viewRef = useRef<ViewState>({ zoom: 1, panX: 0, panY: 0 })
  const dragRef = useRef<DragState | null>(null)
  const objectDragRef = useRef<ObjectDragState | null>(null)
  const gizmoHandleDragRef = useRef<GizmoHandleDragState | null>(null)
  const mouseDownHitRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)
  const [zoomPct, setZoomPct] = useState(100)
  const [cursor, setCursor] = useState('default')

  const draw = useCallback(() => {
    const renderer = rendererRef.current
    const gizmoCanvas = gizmoCanvasRef.current
    if (!renderer || !gizmoCanvas) return

    const { zoom, panX, panY } = viewRef.current

    // --- WebGL: render scene ---
    renderer.clear(sceneStore.getBackground())
    const allItems = world.getEntityIds().flatMap(id => world.runPipeline(id))
    const glowComp = sceneStore.getComponents().find(c => c instanceof GlowComponent) as GlowComponent | undefined
    renderer.render(allItems, zoom, panX, panY, glowComp ? { strength: glowComp.strength.value, radius: glowComp.radius.value } : undefined)

    // --- Canvas2D: gizmos, selection outlines, text ---
    const ctx = gizmoCanvas.getContext('2d')!
    ctx.clearRect(0, 0, gizmoCanvas.width, gizmoCanvas.height)

    // Text items (world-space)
    const textItems = allItems.filter((i): i is DrawItem & { shape: { type: 'text' } } => i.shape.type === 'text')
    if (textItems.length > 0) {
      ctx.save()
      ctx.translate(panX, panY)
      ctx.scale(zoom, zoom)
      for (const item of textItems) drawTextItem(ctx, item)
      ctx.restore()
    }

    const selectedId = editorStore.selectedEntityId
    if (selectedId === null) return

    // Selection outlines (world-space)
    const selectedItems = world.runPipeline(selectedId)
    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)
    for (const item of selectedItems) drawSelectionOutline(ctx, item, zoom)
    ctx.restore()

    // Gizmos (screen-space)
    const components = world.getComponents(selectedId)
    const transform = components.find(c => c instanceof TransformComponent) as TransformComponent | undefined
    const origin = transform
      ? { x: transform.position.value.x, y: transform.position.value.y }
      : { x: 0, y: 0 }
    const entityScreenOrigin = { x: origin.x * zoom + panX, y: origin.y * zoom + panY }
    const screenOrigins = [entityScreenOrigin]
    const hasModifier = components.some(c => c.stage === PipelineStage.Modifier)

    let itemCount = 0
    for (const comp of components) {
      if (comp.renderGizmo) {
        comp.renderGizmo({ ctx, origin, screenOrigins, zoom, hasModifier, itemCount })
      }
      if (comp.stage === PipelineStage.Shape) {
        itemCount += 1
      } else if (comp instanceof ClonerComponent) {
        itemCount = itemCount * Math.max(1, Math.round(comp.count.value))
      }
    }
  }, [])

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

  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    const v = viewRef.current
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v.zoom * factor))
    const zf = newZoom / v.zoom
    viewRef.current = { zoom: newZoom, panX: sx - (sx - v.panX) * zf, panY: sy - (sy - v.panY) * zf }
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
    const gizmoCanvas = gizmoCanvasRef.current
    if (!canvas || !gizmoCanvas) return

    rendererRef.current = new WebGLRenderer(canvas)

    const handleResize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      rendererRef.current?.resize(w, h)
      gizmoCanvas.width = w
      gizmoCanvas.height = h
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

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const { zoom, panX, panY } = viewRef.current
    return { wx: (sx - rect.left - panX) / zoom, wy: (sy - rect.top - panY) / zoom }
  }, [])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const { zoom, panX, panY } = viewRef.current
    const { wx, wy } = screenToWorld(e.clientX, e.clientY)
    hasDraggedRef.current = false

    // 1. Check gizmo handles of selected entity
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top
    const selectedId = editorStore.selectedEntityId
    if (selectedId !== null) {
      const components = world.getComponents(selectedId)
      const transform = components.find(c => c instanceof TransformComponent) as TransformComponent | undefined
      const origin = transform ? transform.position.value : { x: 0, y: 0 }
      const entityScreenOrigin = { x: origin.x * zoom + panX, y: origin.y * zoom + panY }
      const screenOrigins = [entityScreenOrigin]
      for (const comp of components) {
        if (!comp.getGizmoHandles) continue
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

    // 2. Entity hit test
    const hit = getHitEntity(wx, wy)
    mouseDownHitRef.current = hit
    if (hit !== null) {
      editorStore.select(hit)
      const transform = world.getComponents(hit).find(c => c instanceof TransformComponent) as TransformComponent | undefined
      objectDragRef.current = {
        entityId: hit,
        startScreenX: e.clientX, startScreenY: e.clientY,
        startWx: wx, startWy: wy,
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
      if (gizmoHandleDragRef.current) {
        const gh = gizmoHandleDragRef.current
        gh.component.onGizmoHandleDrag?.(gh.handleId, e.clientX - gh.startScreenX, e.clientY - gh.startScreenY, viewRef.current.zoom)
        return
      }
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
      const drag = dragRef.current
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (!hasDraggedRef.current && Math.hypot(dx, dy) > 4) hasDraggedRef.current = true
      viewRef.current = { ...viewRef.current, panX: drag.startPanX + dx, panY: drag.startPanY + dy }
      draw()
    }
    const handleMouseUp = () => {
      if (gizmoHandleDragRef.current) {
        gizmoHandleDragRef.current.component.onGizmoHandleDragEnd?.(gizmoHandleDragRef.current.handleId)
      }
      if (objectDragRef.current && hasDraggedRef.current) {
        const od = objectDragRef.current
        const transform = world.getComponents(od.entityId).find(c => c instanceof TransformComponent) as TransformComponent | undefined
        if (transform) {
          const prev = { x: od.startPosX, y: od.startPosY }
          const next = transform.position.value
          if (prev.x !== next.x || prev.y !== next.y) {
            historyStore.record(new SetPropCommand(transform.position, prev, next, 'Move'))
          }
        }
      }
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
  }, [draw, screenToWorld])

  // Touch events
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
        if (!hasDraggedRef.current && Math.hypot(t.clientX - od.startScreenX, t.clientY - od.startScreenY) > 4) hasDraggedRef.current = true
        if (!hasDraggedRef.current) return
        const { wx, wy } = screenToWorld(t.clientX, t.clientY)
        const transform = world.getComponents(od.entityId).find(c => c instanceof TransformComponent) as TransformComponent | undefined
        if (transform) { transform.position.value = { x: od.startPosX + (wx - od.startWx), y: od.startPosY + (wy - od.startWy) }; eventBus.emit('world:changed') }
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
      {/* WebGL scene canvas — bottom layer, receives pointer events */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        style={{ display: 'block', cursor }}
      />
      {/* Gizmo canvas — Canvas2D overlay, transparent, no pointer events */}
      <canvas
        ref={gizmoCanvasRef}
        style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none' }}
      />

      {/* Zoom controls */}
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
        <button onClick={resetZoom} style={{ ...zoomBtnStyle, width: 52, fontSize: 11, letterSpacing: '0.3px' }}>{zoomPct}%</button>
        <button
          onClick={() => { const s = getSelectionScreenPos(); const c = canvasRef.current; const cx = s?.x ?? (c ? c.width/2 : 0); const cy = s?.y ?? (c ? c.height/2 : 0); zoomAt(cx, cy, ZOOM_STEP) }}
          style={zoomBtnStyle}
        >+</button>
      </div>
    </div>
  )
}

const zoomBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#888', cursor: 'pointer',
  fontSize: 16, width: 32, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
}
