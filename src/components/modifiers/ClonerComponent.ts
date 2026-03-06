import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'
import { EnumProp } from '../../props/EnumProp'

export class ClonerComponent extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Cloner'

  count = new NumberProp('Count', { default: 6, min: 1, max: 200 })
  mode = new EnumProp('Mode', { default: 'radial', options: ['radial', 'grid', 'linear'] })
  // radial
  radius = new NumberProp('Radius', { default: 150, min: 0, max: 1000 })
  // grid / linear
  spacingX = new NumberProp('Spacing X', { default: 80, min: 0, max: 1000 })
  spacingY = new NumberProp('Spacing Y', { default: 80, min: 0, max: 1000 })
  columns = new NumberProp('Columns', { default: 4, min: 1, max: 50 })

  process(items: DrawItem[]): DrawItem[] {
    const result: DrawItem[] = []
    const n = Math.round(this.count.value)

    for (let i = 0; i < n; i++) {
      let dx = 0, dy = 0, dr = 0

      if (this.mode.value === 'radial') {
        const angle = (i / n) * Math.PI * 2
        dx = Math.cos(angle) * this.radius.value
        dy = Math.sin(angle) * this.radius.value
        dr = angle
      } else if (this.mode.value === 'linear') {
        dx = i * this.spacingX.value
        dy = i * this.spacingY.value
      } else if (this.mode.value === 'grid') {
        const cols = Math.round(this.columns.value)
        dx = (i % cols) * this.spacingX.value
        dy = Math.floor(i / cols) * this.spacingY.value
      }

      for (const item of items) {
        result.push({
          ...item,
          transform: {
            ...item.transform,
            x: item.transform.x + dx,
            y: item.transform.y + dy,
            rotation: item.transform.rotation + dr,
          },
        })
      }
    }

    return result
  }
}
