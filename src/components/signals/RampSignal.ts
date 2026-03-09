import { Component, PipelineStage, type PipelineState } from '../../ecs/Component'
import { NumberProp } from '../../props/NumberProp'
import { StringProp } from '../../props/StringProp'
import { EnumProp } from '../../props/EnumProp'

type Curve = 'Linear' | 'EaseIn' | 'EaseOut' | 'EaseInOut' | 'Sine' | 'Step'

function applyCurve(t: number, curve: Curve, step: number): number {
  switch (curve) {
    case 'Linear':    return t
    case 'EaseIn':    return t * t
    case 'EaseOut':   return 1 - (1 - t) * (1 - t)
    case 'EaseInOut': return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
    case 'Sine':      return Math.sin(t * Math.PI)
    case 'Step':      return t >= step ? 1 : 0
  }
}

// Writes a shaped ramp across items into a named channel.
// t = i/(n-1), then mapped through the chosen curve.
// Output range is remapped from [0,1] to [start, end].
export class RampSignal extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Ramp Signal'

  output = new StringProp('Channel', { default: 'ramp' })
  curve  = new EnumProp('Curve',   { default: 'Linear', options: ['Linear', 'EaseIn', 'EaseOut', 'EaseInOut', 'Sine', 'Step'] })
  start  = new NumberProp('Start', { default: 0, min: -100, max: 100, step: 0.01 })
  end    = new NumberProp('End',   { default: 1, min: -100, max: 100, step: 0.01 })
  step   = new NumberProp('Step',  { default: 0.5, min: 0, max: 1, step: 0.01 })

  processState(state: PipelineState): PipelineState {
    const { items, channels } = state
    const n = items.length
    if (n === 0) return state
    const key = this.output.value
    const s = this.start.value
    const e = this.end.value
    const curve = this.curve.value as Curve
    const stepThreshold = this.step.value
    return {
      channels,
      items: items.map((item, i) => {
        const t = n > 1 ? i / (n - 1) : 0
        const shaped = applyCurve(t, curve, stepThreshold)
        return {
          ...item,
          channels: { ...item.channels, [key]: s + (e - s) * shaped },
        }
      }),
    }
  }
}
