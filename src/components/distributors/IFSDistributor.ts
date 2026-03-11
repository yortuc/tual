import { Component, PipelineStage, type GizmoContext } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'
import { EnumProp } from '../../props/EnumProp'

// ── IFS transform definition ─────────────────────────────────────────────────

interface IFSTransform {
  scale:    number   // uniform scale applied to position and item scale
  rotation: number   // degrees — local rotation of this branch
  offsetX:  number   // normalized offset (-1..1), multiplied by spread at runtime
  offsetY:  number
}

// ── Named presets ─────────────────────────────────────────────────────────────

type Preset = 'Sierpinski' | 'Cantor' | 'Tree' | 'Snowflake'

const PRESETS: Record<Preset, IFSTransform[]> = {
  // Three copies at triangle corners — the canonical IFS fractal
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

// ── Helper: apply one IFS transform to one DrawItem ──────────────────────────

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
      x:      px * cos - py * sin + ox,
      y:      px * sin + py * cos + oy,
      rotation: item.transform.rotation + rot,
      scaleX: item.transform.scaleX * scale,
      scaleY: item.transform.scaleY * scale,
    },
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export class IFSDistributor extends Component {
  readonly stage = PipelineStage.Distributor
  readonly label = 'IFS'

  preset     = new EnumProp('Preset',    { default: 'Sierpinski', options: ['Sierpinski', 'Cantor', 'Tree', 'Snowflake'] })
  depth      = new NumberProp('Depth',   { default: 4, min: 1, max: 8,   step: 1  })
  spread     = new NumberProp('Spread',  { default: 80, min: 5, max: 400, step: 1  })
  rotation   = new NumberProp('Rotation',{ default: 0, min: -180, max: 180, step: 1 })

  private getPresetTransforms(): IFSTransform[] {
    return PRESETS[this.preset.value as Preset] ?? PRESETS.Sierpinski
  }

  // Clamp depth so output never exceeds MAX_ITEMS
  private effectiveDepth(): number {
    const n = this.getPresetTransforms().length
    const maxDepth = Math.floor(Math.log(MAX_ITEMS) / Math.log(Math.max(n, 2)))
    return Math.min(Math.round(this.depth.value), maxDepth)
  }

  // Build resolved transforms: offsets scaled by spread and rotated by global rotation
  private buildTransforms(): Array<{ scale: number; rotDeg: number; ox: number; oy: number }> {
    const s       = this.spread.value
    const gr      = this.rotation.value
    const grRad   = (gr * Math.PI) / 180
    const cosGR   = Math.cos(grRad)
    const sinGR   = Math.sin(grRad)
    return this.getPresetTransforms().map(t => {
      const ox = t.offsetX * s * cosGR - t.offsetY * s * sinGR
      const oy = t.offsetX * s * sinGR + t.offsetY * s * cosGR
      return { scale: t.scale, rotDeg: t.rotation + gr, ox, oy }
    })
  }

  renderGizmo({ ctx, screenOrigins, zoom }: GizmoContext): void {
    const transforms = this.buildTransforms()
    const n          = transforms.length
    const gizmoDepth = Math.min(
      Math.floor(Math.log(400) / Math.log(Math.max(n, 2))),
      this.effectiveDepth(),
    )

    // Build gizmo dot positions via the same iteration
    type Pt = { x: number; y: number }
    let pts: Pt[] = [{ x: 0, y: 0 }]
    for (let i = 0; i < gizmoDepth; i++) {
      pts = pts.flatMap(p =>
        transforms.map(t => {
          const rot = (t.rotDeg * Math.PI) / 180
          const cos = Math.cos(rot)
          const sin = Math.sin(rot)
          const px  = p.x * t.scale
          const py  = p.y * t.scale
          return { x: px * cos - py * sin + t.ox, y: px * sin + py * cos + t.oy }
        }),
      )
    }

    ctx.save()
    ctx.fillStyle   = this.gizmoColor
    ctx.globalAlpha = 0.55
    for (const { x: ox, y: oy } of screenOrigins) {
      for (const { x, y } of pts) {
        ctx.beginPath()
        ctx.arc(ox + x * zoom, oy + y * zoom, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  process(items: DrawItem[]): DrawItem[] {
    if (items.length === 0) return []
    // Use the first item as the visual template; reset its transform to origin
    // so the IFS always builds centered at (0,0). The entity's own TransformComponent
    // (Style stage) moves the whole pattern into position afterward.
    const template = {
      ...items[0],
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    }
    const transforms = this.buildTransforms()
    const depth      = this.effectiveDepth()

    let current: DrawItem[] = [template]
    for (let i = 0; i < depth; i++) {
      current = current.flatMap(item =>
        transforms.map(t => applyTransform(item, t.scale, t.rotDeg, t.ox, t.oy)),
      )
    }
    return current
  }
}
