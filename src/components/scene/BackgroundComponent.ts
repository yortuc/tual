import { Component, PipelineStage } from '../../ecs/Component'
import { ColorProp } from '../../props/ColorProp'

export class BackgroundComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Background'

  color = new ColorProp('Color', { default: '#141414' })
}
