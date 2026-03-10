import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

// Archimedean spiral: clone i placed at
//   angle = i * angleStep (degrees)
//   radius = i * radiusStep
// Simple, explicit parameters that engineers can reason about directly.
export class SpiralDistributor extends Component {
  readonly stage = PipelineStage.Distributor
  readonly label = 'Spiral Distributor'

  angleStep  = new NumberProp('Angle Step',  { default: 30,  min: 1,  max: 360, step: 0.5  })
  radiusStep = new NumberProp('Radius Step', { default: 12,  min: 0,  max: 200, step: 0.5  })

  renderGizmo({ ctx, screenOrigins, zoom, itemCount, dashOffset }: GizmoContext): void {
    const n = itemCount
    if (n === 0) return
    const aStep = (this.angleStep.value  * Math.PI) / 180
    const rStep =  this.radiusStep.value * zoom
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle   = this.gizmoColor
    ctx.globalAlpha = 0.5
    ctx.lineWidth   = 1

    for (const { x, y } of screenOrigins) {
      // Draw spiral path
      ctx.setLineDash([3, 3])
      ctx.lineDashOffset = -dashOffset
      ctx.globalAlpha = 0.35
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const angle = i * aStep
        const r     = i * rStep
        const px = x + Math.cos(angle) * r
        const py = y + Math.sin(angle) * r
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Dots at each position
      ctx.globalAlpha = 0.55
      for (let i = 0; i < n; i++) {
        const angle = i * aStep
        const r     = i * rStep
        ctx.beginPath()
        ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  process(items: DrawItem[]): DrawItem[] {
    const aStep = (this.angleStep.value  * Math.PI) / 180
    const rStep =  this.radiusStep.value
    return items.map((item, i) => {
      const angle = i * aStep
      const r     = i * rStep
      return {
        ...item,
        transform: {
          ...item.transform,
          x: item.transform.x + Math.cos(angle) * r,
          y: item.transform.y + Math.sin(angle) * r,
        },
      }
    })
  }
}
