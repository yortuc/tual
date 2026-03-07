import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { EnumProp } from '../../props/EnumProp'
import { BoolProp } from '../../props/BoolProp'

export class MirrorComponent extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Mirror'

  axis = new EnumProp('Axis', { default: 'X', options: ['X', 'Y', 'Both'] })
  keepOriginal = new BoolProp('Keep Original', { default: true })

  renderGizmo({ ctx, screenOrigin }: GizmoContext): void {
    const { x, y } = screenOrigin
    const REACH = 220
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.65
    ctx.setLineDash([6, 5])
    ctx.beginPath()
    // axis='X' mirrors x→-x, so the axis line is vertical (about y-axis)
    if (this.axis.value === 'X' || this.axis.value === 'Both') {
      ctx.moveTo(x, y - REACH)
      ctx.lineTo(x, y + REACH)
    }
    // axis='Y' mirrors y→-y, so the axis line is horizontal (about x-axis)
    if (this.axis.value === 'Y' || this.axis.value === 'Both') {
      ctx.moveTo(x - REACH, y)
      ctx.lineTo(x + REACH, y)
    }
    ctx.stroke()
    ctx.restore()
  }

  process(items: DrawItem[]): DrawItem[] {
    const mirrored: DrawItem[] = []

    for (const item of items) {
      if (this.axis.value === 'X' || this.axis.value === 'Both') {
        mirrored.push({
          ...item,
          transform: {
            ...item.transform,
            x: -item.transform.x,
            scaleX: -item.transform.scaleX,
          },
        })
      }
      if (this.axis.value === 'Y' || this.axis.value === 'Both') {
        mirrored.push({
          ...item,
          transform: {
            ...item.transform,
            y: -item.transform.y,
            scaleY: -item.transform.scaleY,
          },
        })
      }
    }

    return this.keepOriginal.value ? [...items, ...mirrored] : mirrored
  }
}
