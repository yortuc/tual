import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

// Interpolates transform properties (scale, opacity, rotation) across all items
// by their index — first item gets "start" values, last item gets "end" values.
// Place after Cloner + Distributor for gradient trails, spirals, and fan effects.
export class GradientMutator extends Component {
  readonly stage = PipelineStage.Modifier
  readonly label = 'Gradient'

  scaleStart   = new NumberProp('Scale Start',   { default: 1,   min: 0,    max: 10,  step: 0.01 })
  scaleEnd     = new NumberProp('Scale End',     { default: 1,   min: 0,    max: 10,  step: 0.01 })
  opacityStart = new NumberProp('Opacity Start', { default: 1,   min: 0,    max: 1,   step: 0.01 })
  opacityEnd   = new NumberProp('Opacity End',   { default: 0,   min: 0,    max: 1,   step: 0.01 })
  rotationStep = new NumberProp('Rotation Step', { default: 0,   min: -180, max: 180, step: 1    })

  process(items: DrawItem[]): DrawItem[] {
    const n = items.length
    if (n === 0) return []
    const { scaleStart, scaleEnd, opacityStart, opacityEnd, rotationStep } = this
    const stepRad = rotationStep.value * (Math.PI / 180)

    return items.map((item, i) => {
      const t = n > 1 ? i / (n - 1) : 0
      const scale = scaleStart.value + (scaleEnd.value - scaleStart.value) * t
      const opacity = opacityStart.value + (opacityEnd.value - opacityStart.value) * t
      return {
        ...item,
        transform: {
          ...item.transform,
          scaleX:   item.transform.scaleX * scale,
          scaleY:   item.transform.scaleY * scale,
          rotation: item.transform.rotation + stepRad * i,
        },
        style: {
          ...item.style,
          opacity: item.style.opacity * opacity,
        },
      }
    })
  }
}
