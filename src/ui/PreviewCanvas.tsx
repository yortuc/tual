import React, { useRef, useEffect } from 'react'
import { World } from '../ecs/World'
import type { Component } from '../ecs/Component'
import type { DrawItem } from '../renderer/DrawItem'

function drawItem(ctx: CanvasRenderingContext2D, item: DrawItem): void {
  const { transform, style, shape } = item
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, style.opacity ?? 1))
  ctx.translate(transform.x, transform.y)
  ctx.rotate(transform.rotation)
  ctx.scale(transform.scaleX, transform.scaleY)

  if (shape.type === 'circle') {
    ctx.beginPath()
    ctx.arc(0, 0, shape.radius, 0, Math.PI * 2)
    if (style.fill)   { ctx.fillStyle = style.fill; ctx.fill() }
    if (style.stroke) { ctx.strokeStyle = style.stroke.color; ctx.lineWidth = style.stroke.width / Math.abs(transform.scaleX); ctx.stroke() }
  } else if (shape.type === 'rect') {
    const hw = shape.width / 2, hh = shape.height / 2
    if (style.fill)   { ctx.fillStyle = style.fill; ctx.fillRect(-hw, -hh, shape.width, shape.height) }
    if (style.stroke) { ctx.strokeStyle = style.stroke.color; ctx.lineWidth = style.stroke.width / Math.abs(transform.scaleX); ctx.strokeRect(-hw, -hh, shape.width, shape.height) }
  }

  ctx.restore()
}

function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  components: Component[],
  size: number,
): void {
  // Clear background
  ctx.fillStyle = '#141414'
  ctx.fillRect(0, 0, size, size)

  // Run pipeline on a fresh World
  const w = new World()
  const id = w.createEntity()
  for (const comp of components) w.addComponent(id, comp)
  const items = w.runPipeline(id)
  if (items.length === 0) return

  // Compute bounding box across all items
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const { transform, shape } of items) {
    const { x, y } = transform
    const sx = Math.abs(transform.scaleX), sy = Math.abs(transform.scaleY)
    const hw = shape.type === 'circle' ? shape.radius * sx
              : shape.type === 'rect'  ? (shape.width  / 2) * sx
              : 4
    const hh = shape.type === 'circle' ? shape.radius * sy
              : shape.type === 'rect'  ? (shape.height / 2) * sy
              : 4
    minX = Math.min(minX, x - hw); maxX = Math.max(maxX, x + hw)
    minY = Math.min(minY, y - hh); maxY = Math.max(maxY, y + hh)
  }

  const pad  = size * 0.08
  const W    = maxX - minX + pad * 2
  const H    = maxY - minY + pad * 2
  const scale = Math.min((size) / W, (size) / H)
  const cx   = (minX + maxX) / 2
  const cy   = (minY + maxY) / 2

  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.scale(scale, scale)
  ctx.translate(-cx, -cy)
  for (const item of items) drawItem(ctx, item)
  ctx.restore()
}

export function PreviewCanvas({
  components,
  size = 52,
}: {
  components: Component[]
  size?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width  = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    renderToCanvas(ctx, components, size)
  }, []) // intentionally run once — previews are static

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size, borderRadius: 4, display: 'block', flexShrink: 0 }}
    />
  )
}
