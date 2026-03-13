import { Component, PipelineStage, type PipelineState } from '../../ecs/Component'
import { NumberProp } from '../../props/NumberProp'
import { StringProp } from '../../props/StringProp'

// Seeded pseudo-random per-item value — same seed always produces the same pattern.
// Uses a fast integer hash (xorshift-based) so results are stable across renders.
function hash(n: number): number {
  n = ((n >> 16) ^ n) * 0x45d9f3b | 0
  n = ((n >> 16) ^ n) * 0x45d9f3b | 0
  n = (n >> 16) ^ n
  return (n >>> 0) / 0xffffffff  // normalise to [0, 1]
}

// Writes a stable pseudo-random value per item into a named channel.
// Each item gets: min + (max - min) * hash(seed * 1000 + i)
export class NoiseSignal extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Noise Signal'

  output = new StringProp('Channel', { default: 'noise' })
  seed   = new NumberProp('Seed',    { default: 0,   min: 0,    max: 999, step: 1,    shortLabel: 'Sd'  })
  min    = new NumberProp('Min',     { default: 0,   min: -100, max: 100, step: 0.01, shortLabel: 'Lo'  })
  max    = new NumberProp('Max',     { default: 1,   min: -100, max: 100, step: 0.01, shortLabel: 'Hi'  })

  processState(state: PipelineState): PipelineState {
    const { items, channels } = state
    if (items.length === 0) return state
    const key = this.output.value
    const seed = Math.round(this.seed.value) * 1000
    const lo = this.min.value
    const hi = this.max.value
    return {
      channels,
      items: items.map((item, i) => ({
        ...item,
        channels: { ...item.channels, [key]: lo + (hi - lo) * hash(seed + i) },
      })),
    }
  }
}
