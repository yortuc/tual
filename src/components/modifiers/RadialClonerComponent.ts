import { Component, PipelineStage, type GizmoContext, type GizmoHandle } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'
import { eventBus } from '../../ecs/EventBus'

export class RadialClonerComponent extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Radial Cloner'

  count  = new NumberProp('Count',  { default: 6,   min: 1, max: 200 })
  radius = new NumberProp('Radius', { default: 150, min: 0, max: 1000 })

  private _dragStartRadius = 0

  renderGizmo({ ctx, screenOrigins, zoom }: GizmoContext): void {
    const n = Math.round(this.count.value)
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle = this.gizmoColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.65

    for (const { x, y } of screenOrigins) {
      const r = this.radius.value * zoom

      // Dashed radius circle
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Direction arrow at angle 0 (first clone position)
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + r, y)
      ctx.stroke()
      const aw = 7
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + r - aw, y - aw / 2)
      ctx.lineTo(x + r - aw, y + aw / 2)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 0.65

      // Dot at each clone position
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Radius drag handle — filled square at 3 o'clock on the circle
      ctx.globalAlpha = 0.9
      const hs = 6
      ctx.fillRect(x + r - hs / 2, y - hs / 2, hs, hs)
    }

    ctx.restore()
  }

  getGizmoHandles(screenOrigins: { x: number; y: number }[], zoom: number): GizmoHandle[] {
    const r = this.radius.value * zoom
    return screenOrigins.map((o, i) => ({
      id: `radius-${i}`,
      x: o.x + r,
      y: o.y,
      cursor: 'ew-resize',
    }))
  }

  onGizmoHandleDragStart(_handleId: string): void {
    this._dragStartRadius = this.radius.value
  }

  onGizmoHandleDrag(_handleId: string, dx: number, _dy: number, zoom: number): void {
    this.radius.value = Math.max(0, this._dragStartRadius + dx / zoom)
    eventBus.emit('world:changed')
  }

  process(items: DrawItem[]): DrawItem[] {
    const result: DrawItem[] = []
    const n = Math.round(this.count.value)
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2
      const dx = Math.cos(angle) * this.radius.value
      const dy = Math.sin(angle) * this.radius.value
      for (const item of items) {
        result.push({
          ...item,
          transform: {
            ...item.transform,
            x: item.transform.x + dx,
            y: item.transform.y + dy,
            rotation: item.transform.rotation + angle,
          },
        })
      }
    }
    return result
  }
}
