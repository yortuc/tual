import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

export class ClonerComponent extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Cloner'

  count = new NumberProp('Count', { default: 6, min: 1, max: 500, shortLabel: 'N' })

  process(items: DrawItem[]): DrawItem[] {
    const n = Math.round(this.count.value)
    const result: DrawItem[] = []
    for (let i = 0; i < n; i++) {
      for (const item of items) {
        result.push({ ...item, transform: { ...item.transform } })
      }
    }
    return result
  }
}
