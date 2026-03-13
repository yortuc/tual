import { Component, PipelineStage, type GizmoContext, type GizmoHandle } from '../../ecs/Component'
import { identityTransform, type DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'
import { eventBus } from '../../ecs/EventBus'
import { historyStore } from '../../ecs/HistoryStore'
import { SetPropCommand, CompoundCommand } from '../../ecs/Command'
import type { Command } from '../../ecs/Command'

export class RectComponent extends Component {
  readonly stage = PipelineStage.Shape
  readonly label = 'Rectangle'

  width  = new NumberProp('Width',  { default: 100, min: 1, max: 2000, shortLabel: 'W' })
  height = new NumberProp('Height', { default: 100, min: 1, max: 2000, shortLabel: 'H' })

  private _dragStartWidth  = 0
  private _dragStartHeight = 0

  renderGizmo({ ctx, screenOrigins, zoom, hasModifier, dashOffset }: GizmoContext): void {
    const w = this.width.value * zoom
    const h = this.height.value * zoom
    const hs = 10

    ctx.save()

    // Ghost fill — only when a modifier is consuming this shape
    if (hasModifier) {
      ctx.fillStyle = this.gizmoColor
      ctx.globalAlpha = 0.15
      for (const { x, y } of screenOrigins) {
        ctx.fillRect(x - w / 2, y - h / 2, w, h)
      }
    }

    ctx.strokeStyle = this.gizmoColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.65
    ctx.setLineDash([5, 4])
    ctx.lineDashOffset = -dashOffset

    for (const { x, y } of screenOrigins) {
      ctx.strokeRect(x - w / 2, y - h / 2, w, h)
    }

    ctx.setLineDash([])
    ctx.lineDashOffset = 0

    // Corner handles
    ctx.globalAlpha = 1
    for (const { x, y } of screenOrigins) {
      for (const [cx, cy] of [
        [x - w / 2, y - h / 2],
        [x + w / 2, y - h / 2],
        [x + w / 2, y + h / 2],
        [x - w / 2, y + h / 2],
      ] as [number, number][]) {
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = this.gizmoColor
        ctx.lineWidth = 2
        ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs)
        ctx.strokeRect(cx - hs / 2, cy - hs / 2, hs, hs)
      }
    }

    ctx.restore()
  }

  getGizmoHandles(screenOrigins: { x: number; y: number }[], zoom: number): GizmoHandle[] {
    const w = this.width.value * zoom
    const h = this.height.value * zoom
    const handles: GizmoHandle[] = []

    for (let i = 0; i < screenOrigins.length; i++) {
      const { x, y } = screenOrigins[i]
      handles.push(
        { id: `tl-${i}`, x: x - w / 2, y: y - h / 2, cursor: 'nwse-resize' },
        { id: `tr-${i}`, x: x + w / 2, y: y - h / 2, cursor: 'nesw-resize' },
        { id: `br-${i}`, x: x + w / 2, y: y + h / 2, cursor: 'nwse-resize' },
        { id: `bl-${i}`, x: x - w / 2, y: y + h / 2, cursor: 'nesw-resize' },
      )
    }
    return handles
  }

  onGizmoHandleDragStart(_handleId: string): void {
    this._dragStartWidth  = this.width.value
    this._dragStartHeight = this.height.value
  }

  onGizmoHandleDrag(handleId: string, dx: number, dy: number, zoom: number): void {
    const corner = handleId.split('-')[0]
    const dw = dx / zoom
    const dh = dy / zoom

    if (corner === 'tl') {
      this.width.value  = Math.max(1, this._dragStartWidth  - dw)
      this.height.value = Math.max(1, this._dragStartHeight - dh)
    } else if (corner === 'tr') {
      this.width.value  = Math.max(1, this._dragStartWidth  + dw)
      this.height.value = Math.max(1, this._dragStartHeight - dh)
    } else if (corner === 'br') {
      this.width.value  = Math.max(1, this._dragStartWidth  + dw)
      this.height.value = Math.max(1, this._dragStartHeight + dh)
    } else if (corner === 'bl') {
      this.width.value  = Math.max(1, this._dragStartWidth  - dw)
      this.height.value = Math.max(1, this._dragStartHeight + dh)
    }

    eventBus.emit('world:changed')
  }

  onGizmoHandleDragEnd(_handleId: string): void {
    const cmds: Command[] = []
    if (this.width.value !== this._dragStartWidth)
      cmds.push(new SetPropCommand(this.width, this._dragStartWidth, this.width.value, 'Resize Width'))
    if (this.height.value !== this._dragStartHeight)
      cmds.push(new SetPropCommand(this.height, this._dragStartHeight, this.height.value, 'Resize Height'))
    if (cmds.length > 0)
      historyStore.record(new CompoundCommand('Resize Rectangle', cmds))
  }

  generate(): DrawItem[] {
    return [{
      shape: { type: 'rect', width: this.width.value, height: this.height.value },
      transform: identityTransform(),
      style: { opacity: 1 },
    }]
  }
}
