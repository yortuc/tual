import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'
import { EnumProp } from '../../props/EnumProp'

export class ClonerComponent extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Cloner'

  count = new NumberProp('Count', { default: 6, min: 1, max: 200 })
  mode = new EnumProp('Mode', { default: 'radial', options: ['radial', 'grid', 'linear'] })
  // radial
  radius = new NumberProp('Radius', { default: 150, min: 0, max: 1000 })
  // grid / linear
  spacingX = new NumberProp('Spacing X', { default: 80, min: 0, max: 1000 })
  spacingY = new NumberProp('Spacing Y', { default: 80, min: 0, max: 1000 })
  columns = new NumberProp('Columns', { default: 4, min: 1, max: 50 })

  renderGizmo({ ctx, screenOrigin, zoom }: GizmoContext): void {
    const { x, y } = screenOrigin
    const n = Math.round(this.count.value)
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle = this.gizmoColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.65
    ctx.setLineDash([5, 4])

    if (this.mode.value === 'radial') {
      const r = this.radius.value * zoom
      // Dashed circle at radius
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      // Dot at each clone position
      ctx.setLineDash([])
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(
          x + Math.cos(angle) * r,
          y + Math.sin(angle) * r,
          3.5, 0, Math.PI * 2
        )
        ctx.fill()
      }
    } else if (this.mode.value === 'linear') {
      const sx = this.spacingX.value * zoom
      const sy = this.spacingY.value * zoom
      // Dashed line from first to last clone
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + (n - 1) * sx, y + (n - 1) * sy)
      ctx.stroke()
      // Dot at each clone position
      ctx.setLineDash([])
      for (let i = 0; i < n; i++) {
        ctx.beginPath()
        ctx.arc(x + i * sx, y + i * sy, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (this.mode.value === 'grid') {
      const cols = Math.round(this.columns.value)
      const rows = Math.ceil(n / cols)
      const sx = this.spacingX.value * zoom
      const sy = this.spacingY.value * zoom
      // Dashed bounding rect
      ctx.strokeRect(
        x - sx / 2,
        y - sy / 2,
        (cols - 1) * sx + sx,
        (rows - 1) * sy + sy,
      )
      // Dot at each grid position
      ctx.setLineDash([])
      for (let i = 0; i < n; i++) {
        ctx.beginPath()
        ctx.arc(
          x + (i % cols) * sx,
          y + Math.floor(i / cols) * sy,
          3.5, 0, Math.PI * 2
        )
        ctx.fill()
      }
    }

    ctx.restore()
  }

  process(items: DrawItem[]): DrawItem[] {
    const result: DrawItem[] = []
    const n = Math.round(this.count.value)

    for (let i = 0; i < n; i++) {
      let dx = 0, dy = 0, dr = 0

      if (this.mode.value === 'radial') {
        const angle = (i / n) * Math.PI * 2
        dx = Math.cos(angle) * this.radius.value
        dy = Math.sin(angle) * this.radius.value
        dr = angle
      } else if (this.mode.value === 'linear') {
        dx = i * this.spacingX.value
        dy = i * this.spacingY.value
      } else if (this.mode.value === 'grid') {
        const cols = Math.round(this.columns.value)
        dx = (i % cols) * this.spacingX.value
        dy = Math.floor(i / cols) * this.spacingY.value
      }

      for (const item of items) {
        result.push({
          ...item,
          transform: {
            ...item.transform,
            x: item.transform.x + dx,
            y: item.transform.y + dy,
            rotation: item.transform.rotation + dr,
          },
        })
      }
    }

    return result
  }
}
