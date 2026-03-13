import { Component, PipelineStage, type PipelineState, type GizmoContext } from '../../ecs/Component'
import { NumberProp } from '../../props/NumberProp'
import { Vec2Prop } from '../../props/Vec2Prop'

export class TransformComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Transform'

  position = new Vec2Prop('Position', { default: { x: 300, y: 300 } })
  rotation = new NumberProp('Rotation', { default: 0,   min: -180, max: 180,  step: 0.5,  shortLabel: 'Rot' })
  scale    = new NumberProp('Scale',    { default: 1,   min: 0.01, max: 20,   step: 0.01, shortLabel: 'Sc'  })

  renderGizmo({ ctx, screenOrigins }: GizmoContext): void {
    const { x, y } = screenOrigins[0]
    const ARM = 14
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle = this.gizmoColor
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.moveTo(x - ARM, y); ctx.lineTo(x + ARM, y)
    ctx.moveTo(x, y - ARM); ctx.lineTo(x, y + ARM)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  processState(state: PipelineState): PipelineState {
    return {
      ...state,
      items: state.items.map(item => {
        const channels = { ...state.channels, ...item.channels }
        const deg = this.rotation.resolve(channels)
        const rad = (deg * Math.PI) / 180
        const s   = this.scale.resolve(channels)
        return {
          ...item,
          transform: {
            x:        item.transform.x + this.position.value.x,
            y:        item.transform.y + this.position.value.y,
            rotation: item.transform.rotation + rad,
            scaleX:   item.transform.scaleX * s,
            scaleY:   item.transform.scaleY * s,
          },
        }
      }),
    }
  }
}
