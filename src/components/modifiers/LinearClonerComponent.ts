import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

export class LinearClonerComponent extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Linear Cloner'

  count    = new NumberProp('Count',     { default: 5,  min: 1, max: 200 })
  spacingX = new NumberProp('Spacing X', { default: 80, min: -1000, max: 1000 })
  spacingY = new NumberProp('Spacing Y', { default: 0,  min: -1000, max: 1000 })

  renderGizmo({ ctx, screenOrigins, zoom }: GizmoContext): void {
    const n = Math.round(this.count.value)
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle = this.gizmoColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.65

    for (const { x, y } of screenOrigins) {
      const sx = this.spacingX.value * zoom
      const sy = this.spacingY.value * zoom

      // Dashed line from first to last clone
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + (n - 1) * sx, y + (n - 1) * sy)
      ctx.stroke()
      ctx.setLineDash([])

      // Direction arrow at end
      const ex = x + (n - 1) * sx
      const ey = y + (n - 1) * sy
      const len = Math.hypot(sx, sy)
      if (len > 0) {
        const ux = sx / len, uy = sy / len
        const aw = 7
        ctx.globalAlpha = 0.9
        ctx.beginPath()
        ctx.moveTo(ex, ey)
        ctx.lineTo(ex - ux * aw - uy * aw / 2, ey - uy * aw + ux * aw / 2)
        ctx.lineTo(ex - ux * aw + uy * aw / 2, ey - uy * aw - ux * aw / 2)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 0.65
      }

      // Dot at each clone position
      for (let i = 0; i < n; i++) {
        ctx.beginPath()
        ctx.arc(x + i * sx, y + i * sy, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  process(items: DrawItem[]): DrawItem[] {
    const result: DrawItem[] = []
    const n = Math.round(this.count.value)
    for (let i = 0; i < n; i++) {
      const dx = i * this.spacingX.value
      const dy = i * this.spacingY.value
      for (const item of items) {
        result.push({
          ...item,
          transform: { ...item.transform, x: item.transform.x + dx, y: item.transform.y + dy },
        })
      }
    }
    return result
  }
}
