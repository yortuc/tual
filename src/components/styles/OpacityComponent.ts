import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

export class OpacityComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Opacity'

  opacity = new NumberProp('Opacity', { default: 1, min: 0, max: 1, step: 0.01 })

  process(items: DrawItem[]): DrawItem[] {
    return items.map(item => ({
      ...item,
      style: { ...item.style, opacity: this.opacity.value },
    }))
  }
}
