import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { ColorProp } from '../../props/ColorProp'
import { NumberProp } from '../../props/NumberProp'

export class StrokeComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Stroke'

  color = new ColorProp('Color', { default: '#ffffff' })
  width = new NumberProp('Width', { default: 1, min: 0.5, max: 50, step: 0.5, shortLabel: 'W' })

  process(items: DrawItem[]): DrawItem[] {
    return items.map(item => ({
      ...item,
      style: {
        ...item.style,
        stroke: { color: this.color.value, width: this.width.value },
      },
    }))
  }
}
