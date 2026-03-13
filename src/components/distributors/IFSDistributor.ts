import { Component, PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'

// ── IFS transform definition ─────────────────────────────────────────────────

export interface IFSTransform {
  scale:    number   // uniform scale
  rotation: number   // degrees
  offsetX:  number   // normalized (-1..1), multiplied by spread at runtime
  offsetY:  number
}

// ── Named presets ─────────────────────────────────────────────────────────────

export type IFSPreset = 'Sierpinski' | 'Cantor' | 'Tree' | 'Snowflake'

export const IFS_PRESETS: Record<IFSPreset, IFSTransform[]> = {
  // Three copies at triangle corners — apex up, bounding box centered at origin
  Sierpinski: [
    { scale: 0.5, rotation: 0, offsetX: -0.5, offsetY:  0.5 },
    { scale: 0.5, rotation: 0, offsetX:  0.5, offsetY:  0.5 },
    { scale: 0.5, rotation: 0, offsetX:  0,   offsetY: -0.5 },
  ],
  // Four copies at square corners — 2D Cantor dust
  Cantor: [
    { scale: 1/3, rotation: 0, offsetX: -1/3, offsetY: -1/3 },
    { scale: 1/3, rotation: 0, offsetX:  1/3, offsetY: -1/3 },
    { scale: 1/3, rotation: 0, offsetX: -1/3, offsetY:  1/3 },
    { scale: 1/3, rotation: 0, offsetX:  1/3, offsetY:  1/3 },
  ],
  // Two branches angled symmetrically — binary fractal tree
  Tree: [
    { scale: 0.6, rotation: -35, offsetX: -0.35, offsetY: -0.55 },
    { scale: 0.6, rotation:  35, offsetX:  0.35, offsetY: -0.55 },
  ],
  // Six copies at hexagonal positions — snowflake / honeycomb
  Snowflake: [
    { scale: 0.38, rotation: 0, offsetX:  0,     offsetY: -0.62 },
    { scale: 0.38, rotation: 0, offsetX:  0.537, offsetY: -0.31 },
    { scale: 0.38, rotation: 0, offsetX:  0.537, offsetY:  0.31 },
    { scale: 0.38, rotation: 0, offsetX:  0,     offsetY:  0.62 },
    { scale: 0.38, rotation: 0, offsetX: -0.537, offsetY:  0.31 },
    { scale: 0.38, rotation: 0, offsetX: -0.537, offsetY: -0.31 },
  ],
}

const MAX_ITEMS = 2000

// ── Helper ────────────────────────────────────────────────────────────────────

function applyTransform(
  item: DrawItem,
  scale: number,
  rotDeg: number,
  ox: number,
  oy: number,
): DrawItem {
  const rot = (rotDeg * Math.PI) / 180
  const cos = Math.cos(rot)
  const sin = Math.sin(rot)
  const px  = item.transform.x * scale
  const py  = item.transform.y * scale
  return {
    ...item,
    transform: {
      ...item.transform,
      x:        px * cos - py * sin + ox,
      y:        px * sin + py * cos + oy,
      rotation: item.transform.rotation + rot,
      scaleX:   item.transform.scaleX * scale,
      scaleY:   item.transform.scaleY * scale,
    },
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export class IFSDistributor extends Component {
  readonly stage = PipelineStage.Distributor
  readonly label = 'IFS'

  depth    = new NumberProp('Depth',    { default: 4, min: 1, max: 8,   step: 1 })
  spread   = new NumberProp('Spread',   { default: 80, min: 5, max: 400, step: 1 })
  rotation = new NumberProp('Rotation', { default: 0, min: -180, max: 180, step: 1 })

  // Variable-length transform array — NOT a Prop, managed manually
  transforms: IFSTransform[] = [...IFS_PRESETS.Sierpinski.map(t => ({ ...t }))]
  activePreset: IFSPreset | null = 'Sierpinski'

  // ── Preset management ──────────────────────────────────────────────────────

  loadPreset(name: IFSPreset): void {
    this.transforms = IFS_PRESETS[name].map(t => ({ ...t }))
    this.activePreset = name
  }

  addTransform(): void {
    this.transforms.push({ scale: 0.5, rotation: 0, offsetX: 0, offsetY: 0 })
    this.activePreset = null
  }

  removeTransform(index: number): void {
    if (this.transforms.length > 1) {
      this.transforms.splice(index, 1)
      this.activePreset = null
    }
  }

  // ── Self-serialization ─────────────────────────────────────────────────────

  serializeExtra(): Record<string, unknown> {
    const out: Record<string, unknown> = { transforms: this.transforms.map(t => ({ ...t })) }
    if (this.activePreset) out.activePreset = this.activePreset
    return out
  }

  deserializeExtra(data: Record<string, unknown>): void {
    if (Array.isArray(data.transforms) && data.transforms.length > 0) {
      this.transforms = (data.transforms as IFSTransform[]).map(t => ({ ...t }))
    }
    this.activePreset = (data.activePreset as IFSPreset) ?? null
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private effectiveDepth(): number {
    const n        = Math.max(this.transforms.length, 2)
    const maxDepth = Math.floor(Math.log(MAX_ITEMS) / Math.log(n))
    return Math.min(Math.round(this.depth.value), maxDepth)
  }

  private buildResolved(): Array<{ scale: number; rotDeg: number; ox: number; oy: number }> {
    const s     = this.spread.value
    const gr    = this.rotation.value
    const grRad = (gr * Math.PI) / 180
    const cosGR = Math.cos(grRad)
    const sinGR = Math.sin(grRad)
    return this.transforms.map(t => ({
      scale:  t.scale,
      rotDeg: t.rotation + gr,
      ox:     t.offsetX * s * cosGR - t.offsetY * s * sinGR,
      oy:     t.offsetX * s * sinGR + t.offsetY * s * cosGR,
    }))
  }

  // ── Pipeline ───────────────────────────────────────────────────────────────

  process(items: DrawItem[]): DrawItem[] {
    if (items.length === 0) return []

    // Capture the incoming item's world position (set by upstream TransformComponent,
    // if any) so the fractal lands at the entity origin regardless of pipeline order.
    const cx = items[0].transform.x
    const cy = items[0].transform.y

    const template = {
      ...items[0],
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    }
    const resolved = this.buildResolved()
    const depth    = this.effectiveDepth()

    let current: DrawItem[] = [template]
    for (let i = 0; i < depth; i++) {
      current = current.flatMap(item =>
        resolved.map(t => applyTransform(item, t.scale, t.rotDeg, t.ox, t.oy)),
      )
    }

    // Centre the fractal: shift all items so the bounding-box centre lands at (cx, cy).
    // This ensures every preset is visually centred on the entity origin.
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const { transform: t } of current) {
      if (t.x < minX) minX = t.x
      if (t.x > maxX) maxX = t.x
      if (t.y < minY) minY = t.y
      if (t.y > maxY) maxY = t.y
    }
    const bx = (minX + maxX) / 2
    const by = (minY + maxY) / 2
    const dx = cx - bx
    const dy = cy - by

    return current.map(item => ({
      ...item,
      transform: { ...item.transform, x: item.transform.x + dx, y: item.transform.y + dy },
    }))
  }
}
