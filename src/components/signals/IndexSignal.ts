import { Component, PipelineStage, type PipelineState } from '../../ecs/Component'
import { NumberProp } from '../../props/NumberProp'
import { StringProp } from '../../props/StringProp'

// Writes a linear ramp (0→1 by default) across items into a named channel.
// Each item gets channels[output] = lerp(start, end, i / (n-1)).
// Downstream components can read this channel to drive any drivable NumberProp.
export class IndexSignal extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Index Signal'

  output = new StringProp('Channel', { default: 'signal' })
  start  = new NumberProp('Start',   { default: 0, min: -100, max: 100, step: 0.01 })
  end    = new NumberProp('End',     { default: 1, min: -100, max: 100, step: 0.01 })

  processState(state: PipelineState): PipelineState {
    const { items, channels } = state
    const n = items.length
    if (n === 0) return state
    const key = this.output.value
    const s = this.start.value
    const e = this.end.value
    return {
      channels,
      items: items.map((item, i) => {
        const t = n > 1 ? i / (n - 1) : 0
        return {
          ...item,
          channels: { ...item.channels, [key]: s + (e - s) * t },
        }
      }),
    }
  }
}
