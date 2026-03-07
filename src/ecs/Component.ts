import { Prop } from '../props/Prop'
import type { DrawItem } from '../renderer/DrawItem'

export enum PipelineStage {
  Shape = 0,
  Modifier = 1,
  Style = 2,
  Effect = 3,
}

export const GIZMO_PALETTE = [
  '#a78bfa', // purple
  '#f472b6', // pink
  '#34d399', // green
  '#fbbf24', // yellow
  '#fb923c', // orange
  '#60a5fa', // light blue
  '#e879f9', // fuchsia
]

export interface GizmoContext {
  ctx: CanvasRenderingContext2D
  origin: { x: number; y: number }             // world space entity origin (for reference)
  screenOrigins: { x: number; y: number }[]    // screen space — draw gizmo at each position
  zoom: number                                 // convert world sizes → screen: size * zoom
}

export interface GizmoHandle {
  id: string
  x: number    // screen space
  y: number
  cursor?: string
}

export abstract class Component {
  abstract readonly stage: PipelineStage
  abstract readonly label: string

  // Assigned by World.addComponent — color used for both canvas gizmo and inspector dot
  gizmoColor: string = GIZMO_PALETTE[0]

  // Shape components produce initial DrawItems
  generate?(): DrawItem[]

  // All other components transform the DrawItem array
  process?(items: DrawItem[]): DrawItem[]

  // Optional: draw a canvas overlay explaining this component's transformation
  renderGizmo?(gctx: GizmoContext): void

  // Optional: interactive gizmo handles for direct canvas editing
  getGizmoHandles?(screenOrigins: { x: number; y: number }[], zoom: number): GizmoHandle[]
  onGizmoHandleDragStart?(handleId: string): void
  onGizmoHandleDrag?(handleId: string, dx: number, dy: number, zoom: number): void

  getProps(): Array<[string, Prop<unknown>]> {
    return Object.entries(this).filter(
      ([, v]) => v instanceof Prop
    ) as Array<[string, Prop<unknown>]>
  }
}
