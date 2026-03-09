import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

export class GridDistributor extends Component {
  readonly stage = PipelineStage.Distributor
  readonly label = 'Grid Distributor'

  columns  = new NumberProp('Columns',   { default: 4,  min: 1,  max: 50 })
  spacingX = new NumberProp('Spacing X', { default: 80, min: 0,  max: 1000 })
  spacingY = new NumberProp('Spacing Y', { default: 80, min: 0,  max: 1000 })

  renderGizmo({ ctx, screenOrigins, zoom, itemCount }: GizmoContext): void {
    const n = itemCount
    if (n === 0) return
    const cols = Math.max(1, Math.round(this.columns.value))
    const rows = Math.ceil(n / cols)
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle = this.gizmoColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.65

    for (const { x, y } of screenOrigins) {
      const sx = this.spacingX.value * zoom
      const sy = this.spacingY.value * zoom

      // Dashed bounding rect
      ctx.setLineDash([5, 4])
      ctx.strokeRect(x - sx / 2, y - sy / 2, (cols - 1) * sx + sx, (rows - 1) * sy + sy)
      ctx.setLineDash([])

      // Dot at each grid position
      for (let i = 0; i < n; i++) {
        ctx.beginPath()
        ctx.arc(x + (i % cols) * sx, y + Math.floor(i / cols) * sy, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  process(items: DrawItem[]): DrawItem[] {
    const cols = Math.max(1, Math.round(this.columns.value))
    return items.map((item, i) => ({
      ...item,
      transform: {
        ...item.transform,
        x: item.transform.x + (i % cols) * this.spacingX.value,
        y: item.transform.y + Math.floor(i / cols) * this.spacingY.value,
      },
    }))
  }
}
