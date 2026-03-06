import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { ColorProp } from '../../props/ColorProp'
import { NumberProp } from '../../props/NumberProp'

export class ShadowComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Shadow'

  color = new ColorProp('Color', { default: '#000000' })
  offsetX = new NumberProp('Offset X', { default: 4, min: -100, max: 100 })
  offsetY = new NumberProp('Offset Y', { default: 4, min: -100, max: 100 })
  blur = new NumberProp('Blur', { default: 12, min: 0, max: 100 })

  process(items: DrawItem[]): DrawItem[] {
    return items.map(item => ({
      ...item,
      style: {
        ...item.style,
        shadow: {
          x: this.offsetX.value,
          y: this.offsetY.value,
          blur: this.blur.value,
          color: this.color.value,
        },
      },
    }))
  }
}
