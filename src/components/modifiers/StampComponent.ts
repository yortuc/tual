import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { identityTransform } from '../../renderer/DrawItem'

// Collapses the current DrawItem[] into a single "stamp" atom.
// Every component after Stamp treats the entire accumulated result as one unit —
// a Cloner + Distributor after Stamp will distribute N copies of the whole pattern,
// not N copies of each individual item.
//
// At the end of runPipeline, expandStamps() recursively replaces each stamp item
// with its children, composing the parent transform onto each child.
// The renderer always receives a flat array of leaf items.
export class StampComponent extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Stamp'

  process(items: DrawItem[]): DrawItem[] {
    if (items.length === 0) return []
    return [{
      shape:    { type: 'stamp' },
      transform: identityTransform(),
      style:    { opacity: 1 },
      channels: {},
      children: items,
    }]
  }
}
