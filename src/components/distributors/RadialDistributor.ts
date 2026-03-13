import { Component, PipelineStage, type GizmoContext, type GizmoHandle } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'
import { eventBus } from '../../ecs/EventBus'
import { historyStore } from '../../ecs/HistoryStore'
import { SetPropCommand } from '../../ecs/Command'

export class RadialDistributor extends Component {
  readonly stage = PipelineStage.Distributor
  readonly label = 'Radial Distributor'

  radius = new NumberProp('Radius', { default: 150, min: 0, max: 1000, shortLabel: 'R' })

  private _dragStartRadius = 0

  renderGizmo({ ctx, screenOrigins, zoom, itemCount, dashOffset }: GizmoContext): void {
    const n = itemCount
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle = this.gizmoColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.65

    for (const { x, y } of screenOrigins) {
      const r = this.radius.value * zoom

      // Dashed radius circle
      ctx.setLineDash([5, 4])
      ctx.lineDashOffset = -dashOffset
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.lineDashOffset = 0

      // Direction arrow at angle 0
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

      // Dot at each item position (skip i=0 — handle is there)
      if (n > 0) {
        for (let i = 1; i < n; i++) {
          const angle = (i / n) * Math.PI * 2
          ctx.beginPath()
          ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 3.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Radius handle at i=0 (3 o'clock)
      ctx.globalAlpha = 1
      const hs = 10
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = this.gizmoColor
      ctx.lineWidth = 2
      ctx.fillRect(x + r - hs / 2, y - hs / 2, hs, hs)
      ctx.strokeRect(x + r - hs / 2, y - hs / 2, hs, hs)
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

  onGizmoHandleDragEnd(_handleId: string): void {
    if (this.radius.value !== this._dragStartRadius) {
      historyStore.record(new SetPropCommand(this.radius, this._dragStartRadius, this.radius.value, 'Resize Radius'))
    }
  }

  process(items: DrawItem[]): DrawItem[] {
    const n = items.length
    if (n === 0) return []
    return items.map((item, i) => {
      const angle = (i / n) * Math.PI * 2
      return {
        ...item,
        transform: {
          ...item.transform,
          x: item.transform.x + Math.cos(angle) * this.radius.value,
          y: item.transform.y + Math.sin(angle) * this.radius.value,
          rotation: item.transform.rotation + angle,
        },
      }
    })
  }
}
