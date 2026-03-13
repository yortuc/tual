import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

// Lissajous curve: x = radiusX · sin(freqX·t + phase),  y = radiusY · cos(freqY·t)
// t = i/count · 2π  (evenly spaced parameter)
//
// Interesting ratios:
//   freqX:freqY = 1:1  → ellipse / circle (phase=90)
//   freqX:freqY = 1:2  → figure-8
//   freqX:freqY = 2:3  → pretzel
//   freqX:freqY = 3:4  → butterfly
export class LissajousDistributor extends Component {
  readonly stage = PipelineStage.Distributor
  readonly label = 'Lissajous'

  freqX      = new NumberProp('Freq X',      { default: 3,  min: 1, max: 10,  step: 1,   shortLabel: 'Fx' })
  freqY      = new NumberProp('Freq Y',      { default: 2,  min: 1, max: 10,  step: 1,   shortLabel: 'Fy' })
  phaseShift = new NumberProp('Phase (deg)', { default: 90, min: 0, max: 360, step: 1,   shortLabel: 'Ph' })
  radiusX    = new NumberProp('Radius X',    { default: 60, min: 5, max: 300, step: 1,   shortLabel: 'Rx' })
  radiusY    = new NumberProp('Radius Y',    { default: 60, min: 5, max: 300, step: 1,   shortLabel: 'Ry' })

  private _pos(i: number, n: number): { x: number; y: number } {
    const t     = (i / n) * 2 * Math.PI
    const phase = (this.phaseShift.value * Math.PI) / 180
    return {
      x: this.radiusX.value * Math.sin(this.freqX.value * t + phase),
      y: this.radiusY.value * Math.cos(this.freqY.value * t),
    }
  }

  renderGizmo({ ctx, screenOrigins, zoom, itemCount, dashOffset }: GizmoContext): void {
    const n = itemCount
    if (n === 0) return

    const freqX  = this.freqX.value
    const freqY  = this.freqY.value
    const phase  = (this.phaseShift.value * Math.PI) / 180
    const rx     = this.radiusX.value * zoom
    const ry     = this.radiusY.value * zoom

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
        const t  = (i / steps) * 2 * Math.PI
        const px = x + rx * Math.sin(freqX * t + phase)
        const py = y + ry * Math.cos(freqY * t)
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
