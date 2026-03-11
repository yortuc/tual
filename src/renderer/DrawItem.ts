export interface DrawTransform {
  x: number
  y: number
  rotation: number // radians
  scaleX: number
  scaleY: number
}

export const identityTransform = (): DrawTransform => ({
  x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
})

export type ShapeData =
  | { type: 'rect'; width: number; height: number }
  | { type: 'circle'; radius: number }
  | { type: 'text'; content: string; fontSize: number; fontFamily: string }
  | { type: 'stamp' }

export interface DrawStyle {
  fill?: string
  stroke?: { color: string; width: number }
  shadow?: { x: number; y: number; blur: number; color: string }
  opacity: number
}

export interface DrawItem {
  shape: ShapeData
  transform: DrawTransform
  style: DrawStyle
  channels: Record<string, number>  // per-item scalar bag for signal-driven props
  children?: DrawItem[]             // set by StampComponent — treated as a single atom downstream
}
