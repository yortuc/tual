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
    // Compute centroid so children are stored in local space.
    // When a distributor repositions this stamp, expandStamps composes the
    // new stamp transform with each local child — without this the children
    // carry absolute world positions and get double-offset.
    const cx = items.reduce((s, i) => s + i.transform.x, 0) / items.length
    const cy = items.reduce((s, i) => s + i.transform.y, 0) / items.length
    const localChildren = items.map(item => ({
      ...item,
      transform: { ...item.transform, x: item.transform.x - cx, y: item.transform.y - cy },
    }))
    return [{
      shape:    { type: 'stamp' },
      transform: { x: cx, y: cy, rotation: 0, scaleX: 1, scaleY: 1 },
      style:    { opacity: 1 },
      channels: {},
      children: localChildren,
    }]
  }
}
