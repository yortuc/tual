import { Component, PipelineStage, type GizmoContext, type GizmoHandle } from '../../ecs/Component'
import { identityTransform, type DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'
import { eventBus } from '../../ecs/EventBus'

export class CircleComponent extends Component {
  readonly stage = PipelineStage.Shape
  readonly label = 'Circle'

  radius = new NumberProp('Radius', { default: 50, min: 1, max: 1000 })

  private _dragStartRadius = 0

  renderGizmo({ ctx, screenOrigins, zoom, hasModifier }: GizmoContext): void {
    const hs = 10

    ctx.save()

    // Ghost fill — only when a modifier is consuming this shape
    if (hasModifier) {
      ctx.fillStyle = this.gizmoColor
      ctx.globalAlpha = 0.15
      for (const { x, y } of screenOrigins) {
        const r = this.radius.value * zoom
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.strokeStyle = this.gizmoColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.65
    ctx.setLineDash([5, 4])

    for (const { x, y } of screenOrigins) {
      const r = this.radius.value * zoom
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.setLineDash([])

    // Radius handle (3 o'clock)
    ctx.globalAlpha = 1
    for (const { x, y } of screenOrigins) {
      const r = this.radius.value * zoom
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = this.gizmoColor
      ctx.lineWidth = 2
      ctx.fillRect(x + r - hs / 2, y - hs / 2, hs, hs)
      ctx.strokeRect(x + r - hs / 2, y - hs / 2, hs, hs)
    }

    ctx.restore()
  }

  getGizmoHandles(screenOrigins: { x: number; y: number }[], zoom: number): GizmoHandle[] {
    const r = this.radius.value * zoom
    return screenOrigins.map((o, i) => ({
      id: `radius-${i}`,
      x: o.x + r,
      y: o.y,
      cursor: 'ew-resize',
    }))
  }

  onGizmoHandleDragStart(_handleId: string): void {
    this._dragStartRadius = this.radius.value
  }

  onGizmoHandleDrag(_handleId: string, dx: number, _dy: number, zoom: number): void {
    this.radius.value = Math.max(1, this._dragStartRadius + dx / zoom)
    eventBus.emit('world:changed')
  }

  generate(): DrawItem[] {
    return [{
      shape: { type: 'circle', radius: this.radius.value },
      transform: identityTransform(),
      style: { opacity: 1 },
    }]
  }
}
