import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

// Rose curve: r = cos(k·θ)
// k petals when k is odd, 2k petals when k is even.
// Clone i placed at θ = i/count * 2π, then mapped onto the curve.
export class RoseDistributor extends Component {
  readonly stage = PipelineStage.Distributor
  readonly label = 'Rose'

  petals = new NumberProp('Petals (k)', { default: 5,  min: 1, max: 12,  step: 1   })
  radius = new NumberProp('Radius',     { default: 60, min: 5, max: 300, step: 1   })

  private _pos(i: number, n: number): { x: number; y: number } {
    const k = this.petals.value
    const θ = (i / n) * 2 * Math.PI
    const r = Math.cos(k * θ) * this.radius.value
    return { x: Math.cos(θ) * r, y: Math.sin(θ) * r }
  }

  renderGizmo({ ctx, screenOrigins, zoom, itemCount, dashOffset }: GizmoContext): void {
    const n = itemCount
    if (n === 0) return
    const k  = this.petals.value
    const R  = this.radius.value * zoom

    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle   = this.gizmoColor
    ctx.lineWidth   = 1

    for (const { x, y } of screenOrigins) {
      // Curve path — marching ants
      ctx.setLineDash([3, 3])
      ctx.lineDashOffset = -dashOffset
      ctx.globalAlpha = 0.35
      ctx.beginPath()
      const steps = 360
      for (let i = 0; i <= steps; i++) {
        const θ = (i / steps) * 2 * Math.PI
        const r = Math.cos(k * θ) * R
        const px = x + Math.cos(θ) * r
        const py = y + Math.sin(θ) * r
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Dots at clone positions
      ctx.globalAlpha = 0.55
      for (let i = 0; i < n; i++) {
        const { x: dx, y: dy } = this._pos(i, n)
        ctx.beginPath()
        ctx.arc(x + dx * zoom, y + dy * zoom, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  process(items: DrawItem[]): DrawItem[] {
    const n = items.length
    return items.map((item, i) => {
      const { x, y } = this._pos(i, n)
      return {
        ...item,
        transform: {
          ...item.transform,
          x: item.transform.x + x,
          y: item.transform.y + y,
        },
      }
    })
  }
}
