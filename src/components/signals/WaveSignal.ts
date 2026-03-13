import { Component, PipelineStage, type PipelineState } from '../../ecs/Component'
import { NumberProp } from '../../props/NumberProp'
import { StringProp } from '../../props/StringProp'

// Writes a sine wave across items into a named channel.
// Each item gets: offset + amplitude * sin(frequency * 2π * t + phase)
// where t = i/(n-1). Full cycle at frequency=1 means one wave across all clones.
export class WaveSignal extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Wave Signal'

  output    = new StringProp('Channel',   { default: 'wave' })
  frequency = new NumberProp('Frequency', { default: 1,   min: 0.1, max: 20,  step: 0.1,  shortLabel: 'Hz'  })
  phase     = new NumberProp('Phase',     { default: 0,   min: 0,   max: 1,   step: 0.01, shortLabel: 'Ph'  })
  amplitude = new NumberProp('Amplitude', { default: 1,   min: -10, max: 10,  step: 0.01, shortLabel: 'Amp' })
  offset    = new NumberProp('Offset',    { default: 0,   min: -10, max: 10,  step: 0.01, shortLabel: 'Off' })

  processState(state: PipelineState): PipelineState {
    const { items, channels } = state
    const n = items.length
    if (n === 0) return state
    const key = this.output.value
    const freq = this.frequency.value
    const phase = this.phase.value * Math.PI * 2
    const amp = this.amplitude.value
    const off = this.offset.value
    return {
      channels,
      items: items.map((item, i) => {
        const t = n > 1 ? i / (n - 1) : 0
        const v = off + amp * Math.sin(freq * Math.PI * 2 * t + phase)
        return {
          ...item,
          channels: { ...item.channels, [key]: v },
        }
      }),
    }
  }
}
