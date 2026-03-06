import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'
import { Vec2Prop } from '../../props/Vec2Prop'

export class TransformComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Transform'

  position = new Vec2Prop('Position', { default: { x: 300, y: 300 } })
  rotation = new NumberProp('Rotation', { default: 0, min: -180, max: 180, step: 0.5 })
  scale = new Vec2Prop('Scale', { default: { x: 1, y: 1 } })

  process(items: DrawItem[]): DrawItem[] {
    const rad = (this.rotation.value * Math.PI) / 180
    return items.map(item => ({
      ...item,
      transform: {
        x: item.transform.x + this.position.value.x,
        y: item.transform.y + this.position.value.y,
        rotation: item.transform.rotation + rad,
        scaleX: item.transform.scaleX * this.scale.value.x,
        scaleY: item.transform.scaleY * this.scale.value.y,
      },
    }))
  }
}
