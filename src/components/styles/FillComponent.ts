import { Component, PipelineStage, type PipelineState } from '../../ecs/Component'
import type { Prop } from '../../props/Prop'
import { ColorProp } from '../../props/ColorProp'
import { NumberProp } from '../../props/NumberProp'
import { hexToHsl, hslToHex } from '../../utils/color'

const DEFAULT_COLOR = '#4a90d9'
const DEFAULT_HSL = hexToHsl(DEFAULT_COLOR)  // [211, 65, 57]

export class FillComponent extends Component {
  readonly stage = PipelineStage.Style
  readonly label = 'Fill'

  color      = new ColorProp('Color',      { default: DEFAULT_COLOR })
  hue        = new NumberProp('Hue',        { default: DEFAULT_HSL[0], min: 0,   max: 360, step: 1 })
  saturation = new NumberProp('Saturation', { default: DEFAULT_HSL[1], min: 0,   max: 100, step: 1 })
  lightness  = new NumberProp('Lightness',  { default: DEFAULT_HSL[2], min: 0,   max: 100, step: 1 })

  // Convenience for programmatic initialization — sets color and syncs H/S/L.
  setColor(hex: string): void {
    this.color.value = hex
    this.onPropChanged(this.color)
  }

  // Two-way sync: color picker ↔ H/S/L sliders.
  // Called by Inspector immediately after any prop value changes.
  onPropChanged(prop: Prop<unknown>): void {
    if (prop === this.color) {
      const [h, s, l] = hexToHsl(this.color.value)
      this.hue.value = h
      this.saturation.value = s
      this.lightness.value = l
    } else if (prop === this.hue || prop === this.saturation || prop === this.lightness) {
      this.color.value = hslToHex(this.hue.value, this.saturation.value, this.lightness.value)
    }
  }

  processState(state: PipelineState): PipelineState {
    return {
      ...state,
      items: state.items.map(item => {
        const merged = { ...state.channels, ...item.channels }
        const h = this.hue.resolve(merged)
        const s = this.saturation.resolve(merged)
        const l = this.lightness.resolve(merged)
        return {
          ...item,
          style: { ...item.style, fill: hslToHex(h, s, l) },
        }
      }),
    }
  }
}
