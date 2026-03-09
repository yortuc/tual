import { Component, PipelineStage } from '../../ecs/Component'
import { NumberProp } from '../../props/NumberProp'

export class GlowComponent extends Component {
  readonly stage = PipelineStage.Effect
  readonly label = 'Glow'

  strength = new NumberProp('Strength', { default: 1.2, min: 0,   max: 4,  step: 0.05 })
  radius   = new NumberProp('Radius',   { default: 10,  min: 1,   max: 40, step: 0.5  })
}
