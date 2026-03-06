import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { ColorProp } from '../../props/ColorProp'

export class FillComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Fill'

  color = new ColorProp('Color', { default: '#4a90d9' })

  process(items: DrawItem[]): DrawItem[] {
    return items.map(item => ({
      ...item,
      style: { ...item.style, fill: this.color.value },
    }))
  }
}
