import { Component, PipelineStage } from '../../ecs/Component'
import { identityTransform, type DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

export class RectComponent extends Component {
  readonly stage = PipelineStage.Shape
  readonly label = 'Rectangle'

  width = new NumberProp('Width', { default: 100, min: 1, max: 2000 })
  height = new NumberProp('Height', { default: 100, min: 1, max: 2000 })

  generate(): DrawItem[] {
    return [{
      shape: { type: 'rect', width: this.width.value, height: this.height.value },
      transform: identityTransform(),
      style: { opacity: 1 },
    }]
  }
}
