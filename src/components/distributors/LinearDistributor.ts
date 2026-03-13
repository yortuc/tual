import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

export class LinearDistributor extends Component {
  readonly stage = PipelineStage.Distributor
  readonly label = 'Linear Distributor'

  spacingX = new NumberProp('Spacing X', { default: 80, min: -1000, max: 1000, shortLabel: 'X' })
  spacingY = new NumberProp('Spacing Y', { default: 0,  min: -1000, max: 1000, shortLabel: 'Y' })

  renderGizmo({ ctx, screenOrigins, zoom, itemCount, dashOffset }: GizmoContext): void {
    const n = itemCount
    if (n === 0) return
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle = this.gizmoColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.65

    for (const { x, y } of screenOrigins) {
      const sx = this.spacingX.value * zoom
      const sy = this.spacingY.value * zoom

      // Dashed line from first to last item
      ctx.setLineDash([5, 4])
      ctx.lineDashOffset = -dashOffset
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + (n - 1) * sx, y + (n - 1) * sy)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.lineDashOffset = 0

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

      // Dot at each item position
      for (let i = 0; i < n; i++) {
        ctx.beginPath()
        ctx.arc(x + i * sx, y + i * sy, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  process(items: DrawItem[]): DrawItem[] {
    return items.map((item, i) => ({
      ...item,
      transform: {
        ...item.transform,
        x: item.transform.x + i * this.spacingX.value,
        y: item.transform.y + i * this.spacingY.value,
      },
    }))
  }
}
