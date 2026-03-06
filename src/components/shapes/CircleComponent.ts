import { Component, PipelineStage } from '../../ecs/Component'
import { identityTransform, type DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

export class CircleComponent extends Component {
  readonly stage = PipelineStage.Shape
  readonly label = 'Circle'

  radius = new NumberProp('Radius', { default: 50, min: 1, max: 1000 })

  generate(): DrawItem[] {
    return [{
      shape: { type: 'circle', radius: this.radius.value },
      transform: identityTransform(),
      style: { opacity: 1 },
    }]
  }
}
