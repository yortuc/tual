import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

// Golden angle in radians: 2π / φ²  ≈ 137.508°
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

// Places clone i at:  angle = i * goldenAngle,  radius = spread * sqrt(i)
// This is the same algorithm nature uses for sunflower seeds, pinecone scales, etc.
export class PhyllotaxisDistributor extends Component {
  readonly stage = PipelineStage.Distributor
  readonly label = 'Phyllotaxis'

  spread = new NumberProp('Spread', { default: 22, min: 1, max: 200, step: 0.5, shortLabel: 'Sp' })

  renderGizmo({ ctx, screenOrigins, zoom, itemCount }: GizmoContext): void {
    const n = itemCount
    if (n === 0) return
    const s = this.spread.value * zoom
    ctx.save()
    ctx.strokeStyle = this.gizmoColor
    ctx.fillStyle   = this.gizmoColor
    ctx.globalAlpha = 0.5
    ctx.lineWidth   = 1
    for (const { x, y } of screenOrigins) {
      for (let i = 0; i < n; i++) {
        const angle = i * GOLDEN_ANGLE
        const r     = s * Math.sqrt(i)
        ctx.beginPath()
        ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  process(items: DrawItem[]): DrawItem[] {
    const s = this.spread.value
    return items.map((item, i) => {
      const angle = i * GOLDEN_ANGLE
      const r     = s * Math.sqrt(i)
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
