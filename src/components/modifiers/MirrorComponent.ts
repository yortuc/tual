import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { EnumProp } from '../../props/EnumProp'
import { BoolProp } from '../../props/BoolProp'

export class MirrorComponent extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Mirror'

  axis = new EnumProp('Axis', { default: 'X', options: ['X', 'Y', 'Both'] })
  keepOriginal = new BoolProp('Keep Original', { default: true })

  process(items: DrawItem[]): DrawItem[] {
    const mirrored: DrawItem[] = []

    for (const item of items) {
      if (this.axis.value === 'X' || this.axis.value === 'Both') {
        mirrored.push({
          ...item,
          transform: {
            ...item.transform,
            x: -item.transform.x,
            scaleX: -item.transform.scaleX,
          },
        })
      }
      if (this.axis.value === 'Y' || this.axis.value === 'Both') {
        mirrored.push({
          ...item,
          transform: {
            ...item.transform,
            y: -item.transform.y,
            scaleY: -item.transform.scaleY,
          },
        })
      }
    }

    return this.keepOriginal.value ? [...items, ...mirrored] : mirrored
  }
}
