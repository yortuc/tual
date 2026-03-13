import { Component, PipelineStage, type PipelineState } from '../../ecs/Component'
import { NumberProp } from '../../props/NumberProp'

export class OpacityComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Opacity'

  opacity = new NumberProp('Opacity', { default: 1, min: 0, max: 1, step: 0.01, shortLabel: 'Op' })

  processState(state: PipelineState): PipelineState {
    return {
      ...state,
      items: state.items.map(item => ({
        ...item,
        style: {
          ...item.style,
          opacity: this.opacity.resolve({ ...state.channels, ...item.channels }),
        },
      })),
    }
  }
}
