import { Component, PipelineStage, type PipelineState } from '../../ecs/Component'
import { ColorProp } from '../../props/ColorProp'
import { hexToHsl, hslToHex } from '../../utils/color'

export class ColorRampComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Color Ramp'

  startColor = new ColorProp('From', { default: '#3b82f6' })
  endColor   = new ColorProp('To',   { default: '#ec4899' })

  processState(state: PipelineState): PipelineState {
    const n = state.items.length
    if (n === 0) return state
    const [h1, s1, l1] = hexToHsl(this.startColor.value)
    const [h2, s2, l2] = hexToHsl(this.endColor.value)
    return {
      ...state,
      items: state.items.map((item, i) => {
        const t = n > 1 ? i / (n - 1) : 0
        return {
          ...item,
          style: {
            ...item.style,
            fill: hslToHex(
              h1 + (h2 - h1) * t,
              s1 + (s2 - s1) * t,
              l1 + (l2 - l1) * t,
            ),
          },
        }
      }),
    }
  }
}
