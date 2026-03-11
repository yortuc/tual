import React, { useState, useEffect, useRef } from 'react'
import { world } from '../ecs/World'
import { eventBus } from '../ecs/EventBus'
import { editorStore } from '../editor/EditorStore'
import { sceneStore } from '../editor/SceneStore'
import { Component, PipelineStage } from '../ecs/Component'
import { Prop } from '../props/Prop'
import { historyStore } from '../ecs/HistoryStore'
import {
  SetPropCommand, AddComponentCommand, RemoveComponentCommand,
  ReorderComponentCommand, RemoveGroupCommand, ReorderGroupCommand, CompoundCommand,
} from '../ecs/Command'
import { PreviewCanvas } from './PreviewCanvas'
import { CircleComponent } from '../components/shapes/CircleComponent'
import { RectComponent } from '../components/shapes/RectComponent'
import { GlowComponent } from '../components/scene/GlowComponent'
import { FillComponent } from '../components/styles/FillComponent'
import { StrokeComponent } from '../components/styles/StrokeComponent'
import { ShadowComponent } from '../components/styles/ShadowComponent'
import { OpacityComponent } from '../components/styles/OpacityComponent'
import { ClonerComponent } from '../components/modifiers/ClonerComponent'
import { MirrorComponent } from '../components/modifiers/MirrorComponent'
import { GradientMutator } from '../components/modifiers/GradientMutator'
import { RampSignal } from '../components/signals/RampSignal'
import { WaveSignal } from '../components/signals/WaveSignal'
import { NoiseSignal } from '../components/signals/NoiseSignal'
import { RadialDistributor } from '../components/distributors/RadialDistributor'
import { LinearDistributor } from '../components/distributors/LinearDistributor'
import { GridDistributor } from '../components/distributors/GridDistributor'
import { PhyllotaxisDistributor } from '../components/distributors/PhyllotaxisDistributor'
import { SpiralDistributor } from '../components/distributors/SpiralDistributor'
import { RoseDistributor } from '../components/distributors/RoseDistributor'
import { LissajousDistributor } from '../components/distributors/LissajousDistributor'
import { TransformComponent } from '../components/styles/TransformComponent'
import {
  createColorGradientBundle,
  createOpacityFadeBundle,
  createColorWaveBundle,
  createSunflowerBundle,
  createGalaxyBundle,
  createScaleFadeBundle,
  createBreathingRingsBundle,
} from '../editor/bundles'

// ---- TL (top-level) item model ----

type SoloItem  = { kind: 'solo';  component: Component; flatIndex: number }
type GroupItem = { kind: 'group'; groupId: string; groupLabel: string; members: { component: Component; flatIndex: number }[]; firstFlatIndex: number }
type TLItem = SoloItem | GroupItem

function buildTLItems(components: Component[]): TLItem[] {
  const items: TLItem[] = []
  const seen = new Set<string>()
  for (let i = 0; i < components.length; i++) {
    const comp = components[i]
    if (!comp.groupId) {
      items.push({ kind: 'solo', component: comp, flatIndex: i })
    } else if (!seen.has(comp.groupId)) {
      seen.add(comp.groupId)
      const members = components
        .map((c, j) => ({ component: c, flatIndex: j }))
        .filter(({ component: c }) => c.groupId === comp.groupId)
      items.push({ kind: 'group', groupId: comp.groupId, groupLabel: comp.groupLabel ?? comp.groupId, members, firstFlatIndex: i })
    }
  }
  return items
}

// ---- Menu config ----

type MenuCreateFn = () => Component | Component[]
type MenuItem = { label: string; create: MenuCreateFn; preview: () => Component[] }

// Compact preview helpers — each creates a fresh instance configured for a 52×52 thumbnail
const pv = {
  circle: (r: number)               => { const c = new CircleComponent(); c.radius.value = r; return c },
  rect:   (w: number, h: number)    => { const c = new RectComponent();   c.width.value = w; c.height.value = h; return c },
  fill:   (hex: string)             => { const f = new FillComponent();   f.setColor(hex); return f },
  fillHCh:(ch: string)              => { const f = new FillComponent();   f.hue.channel = ch; return f },
  fillHSLCh:(h:string,s:string,l:string) => {
    const f = new FillComponent(); f.hue.channel = h; f.saturation.channel = s; f.lightness.channel = l; return f
  },
  cloner: (n: number)               => { const c = new ClonerComponent(); c.count.value = n; return c },
  linear: (sx: number, sy = 0)      => { const l = new LinearDistributor(); l.spacingX.value = sx; l.spacingY.value = sy; return l },
  radial: (r: number)               => { const d = new RadialDistributor(); d.radius.value = r; return d },
  grid:   (cols:number,sx:number,sy:number) => { const g = new GridDistributor(); g.columns.value=cols; g.spacingX.value=sx; g.spacingY.value=sy; return g },
  phyl:   (spread: number)          => { const p = new PhyllotaxisDistributor(); p.spread.value = spread; return p },
  spiral: (aStep:number,rStep:number)=> { const s = new SpiralDistributor(); s.angleStep.value=aStep; s.radiusStep.value=rStep; return s },
  rose:   (k:number,r:number)        => { const d = new RoseDistributor(); d.petals.value=k; d.radius.value=r; return d },
  liss:   (fx:number,fy:number,rx:number,ry:number,ph:number) => { const d = new LissajousDistributor(); d.freqX.value=fx; d.freqY.value=fy; d.radiusX.value=rx; d.radiusY.value=ry; d.phaseShift.value=ph; return d },
  ramp:   (ch:string,s:number,e:number) => { const r = new RampSignal(); r.output.value=ch; r.start.value=s; r.end.value=e; return r },
  wave:   (ch:string,amp:number,off:number) => { const w = new WaveSignal(); w.output.value=ch; w.amplitude.value=amp; w.offset.value=off; return w },
  noise:  (ch:string,lo:number,hi:number) => { const n = new NoiseSignal(); n.output.value=ch; n.min.value=lo; n.max.value=hi; return n },
  opacity:(v: number)               => { const o = new OpacityComponent(); o.opacity.value = v; return o },
  opacityCh:(ch: string)            => { const o = new OpacityComponent(); o.opacity.channel = ch; return o },
  stroke: (color:string,w:number)   => { const s = new StrokeComponent(); s.color.value=color; s.width.value=w; return s },
  shadow: (blur:number,color:string)=> { const s = new ShadowComponent(); s.blur.value=blur; s.color.value=color; return s },
  mirror: (axis:string,keep:boolean)=> { const m = new MirrorComponent(); m.axis.value=axis as never; m.keepOriginal.value=keep; return m },
  gradient:(ss:number,se:number,os:number,oe:number) => {
    const g = new GradientMutator(); g.scaleStart.value=ss; g.scaleEnd.value=se; g.opacityStart.value=os; g.opacityEnd.value=oe; return g
  },
  scaleCh:(ch:string) => { const t = new TransformComponent(); t.scale.channel=ch; t.position.value={x:0,y:0}; return t },
}

const BLUE = '#60a5fa'

const COMPONENT_CATEGORIES: { category: string; items: MenuItem[] }[] = [
  {
    category: 'Bundles',
    items: [
      {
        label: 'Sunflower', create: createSunflowerBundle,
        preview: () => [
          pv.circle(3), pv.cloner(34), pv.phyl(7),
          pv.ramp('sf-h',40,200), pv.ramp('sf-s',90,60), pv.ramp('sf-l',55,40),
          pv.fillHSLCh('sf-h','sf-s','sf-l'),
        ],
      },
      {
        label: 'Galaxy Arm', create: createGalaxyBundle,
        preview: () => [
          pv.circle(2), pv.cloner(20), pv.spiral(28,2),
          pv.ramp('gx-scale',1.4,0.2), pv.ramp('gx-h',200,280),
          pv.fillHCh('gx-h'), pv.opacityCh('gx-scale'), pv.scaleCh('gx-scale'),
        ],
      },
      {
        label: 'Color Gradient', create: createColorGradientBundle,
        preview: () => [
          pv.circle(5), pv.cloner(6), pv.linear(9),
          pv.ramp('g-h',217,330), pv.ramp('g-s',91,81), pv.ramp('g-l',60,60),
          pv.fillHSLCh('g-h','g-s','g-l'),
        ],
      },
      {
        label: 'Color Wave', create: createColorWaveBundle,
        preview: () => [
          pv.circle(5), pv.cloner(7), pv.linear(8),
          pv.wave('hue',180,180), pv.fillHCh('hue'),
        ],
      },
      {
        label: 'Opacity Fade', create: createOpacityFadeBundle,
        preview: () => [
          pv.circle(5), pv.cloner(5), pv.linear(10),
          pv.ramp('fade',1,0), pv.fill(BLUE), pv.opacityCh('fade'),
        ],
      },
      {
        label: 'Scale Fade', create: createScaleFadeBundle,
        preview: () => [
          pv.circle(5), pv.cloner(5), pv.radial(18),
          pv.ramp('sf',1.4,0.1), pv.fill(BLUE), pv.scaleCh('sf'),
        ],
      },
      {
        label: 'Breathing Rings', create: createBreathingRingsBundle,
        preview: () => {
          const fill = new FillComponent(); fill.hue.channel = 'br-h'; fill.saturation.value = 75; fill.lightness.value = 60
          return [
            pv.circle(14), pv.cloner(10),
            pv.ramp('br-scale',0.15,1.8), pv.ramp('br-h',180,300), pv.ramp('br-fade',0.9,0.1),
            fill, pv.opacityCh('br-fade'), pv.scaleCh('br-scale'),
          ]
        },
      },
    ],
  },
  {
    category: 'Modifiers',
    items: [
      {
        label: 'Cloner', create: () => new ClonerComponent(),
        preview: () => [pv.circle(5), pv.cloner(6), pv.radial(18), pv.fill(BLUE)],
      },
      {
        label: 'Mirror', create: () => new MirrorComponent(),
        preview: () => [pv.rect(8,10), pv.cloner(3), pv.linear(12), pv.mirror('X',true), pv.fill(BLUE)],
      },
      {
        label: 'Gradient', create: () => new GradientMutator(),
        preview: () => [pv.circle(5), pv.cloner(6), pv.radial(18), pv.gradient(1.5,0.2,1,0), pv.fill(BLUE)],
      },
    ],
  },
  {
    category: 'Distributors',
    items: [
      {
        label: 'Radial', create: () => new RadialDistributor(),
        preview: () => [pv.circle(4), pv.cloner(8), pv.radial(18), pv.fill(BLUE)],
      },
      {
        label: 'Linear', create: () => new LinearDistributor(),
        preview: () => [pv.circle(4), pv.cloner(5), pv.linear(10), pv.fill(BLUE)],
      },
      {
        label: 'Grid', create: () => new GridDistributor(),
        preview: () => [pv.circle(3), pv.cloner(9), pv.grid(3,14,14), pv.fill(BLUE)],
      },
      {
        label: 'Phyllotaxis', create: () => new PhyllotaxisDistributor(),
        preview: () => [pv.circle(3), pv.cloner(34), pv.phyl(7), pv.fill(BLUE)],
      },
      {
        label: 'Spiral', create: () => new SpiralDistributor(),
        preview: () => [pv.circle(2.5), pv.cloner(22), pv.spiral(28,2), pv.fill(BLUE)],
      },
      {
        label: 'Rose', create: () => new RoseDistributor(),
        preview: () => [pv.circle(2), pv.cloner(40), pv.rose(5,22), pv.fill(BLUE)],
      },
      {
        label: 'Lissajous', create: () => new LissajousDistributor(),
        preview: () => [pv.circle(2), pv.cloner(30), pv.liss(3,2,22,18,90), pv.fill(BLUE)],
      },
    ],
  },
  {
    category: 'Signals',
    items: [
      {
        label: 'Ramp', create: () => new RampSignal(),
        preview: () => [pv.circle(5), pv.cloner(6), pv.linear(9), pv.ramp('hue',0,360), pv.fillHCh('hue')],
      },
      {
        label: 'Wave', create: () => new WaveSignal(),
        preview: () => [pv.circle(5), pv.cloner(8), pv.linear(7), pv.wave('hue',180,180), pv.fillHCh('hue')],
      },
      {
        label: 'Noise', create: () => new NoiseSignal(),
        preview: () => [pv.circle(5), pv.cloner(7), pv.linear(8), pv.noise('hue',0,360), pv.fillHCh('hue')],
      },
    ],
  },
  {
    category: 'Styles',
    items: [
      {
        label: 'Fill', create: () => new FillComponent(),
        preview: () => [pv.circle(18), pv.fill('#e74c3c')],
      },
      {
        label: 'Stroke', create: () => new StrokeComponent(),
        preview: () => [pv.circle(16), pv.fill('#1e1e1e'), pv.stroke(BLUE, 2)],
      },
      {
        label: 'Shadow', create: () => new ShadowComponent(),
        preview: () => [pv.circle(14), pv.fill(BLUE), pv.shadow(10, BLUE)],
      },
      {
        label: 'Opacity', create: () => new OpacityComponent(),
        preview: () => [pv.circle(18), pv.fill(BLUE), pv.opacity(0.35)],
      },
    ],
  },
]

// ---- PropRow ----

function PropRow({ prop, onPropChanged }: { prop: Prop<unknown>; onPropChanged?: () => void }) {
  const [, tick] = useState(0)
  const startValueRef = useRef<unknown>(prop.value)

  const onChange = (v: unknown) => {
    prop.value = v
    onPropChanged?.()
    eventBus.emit('world:changed')
    tick(n => n + 1)
  }

  const onCommit = (v: unknown) => {
    if (startValueRef.current !== v) {
      historyStore.record(new SetPropCommand(prop, startValueRef.current, v, `Change ${prop.label}`, onPropChanged))
    }
    startValueRef.current = prop.value
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, alignItems: 'center', marginBottom: 5 }}>
      <span style={{ color: '#777', fontSize: 11, textAlign: 'right', paddingRight: 4 }}>{prop.label}</span>
      <div onPointerDown={() => { startValueRef.current = prop.value }} style={{ minWidth: 0, overflow: 'hidden' }}>
        {prop.renderEditorUnsafe(onChange, onCommit)}
      </div>
    </div>
  )
}

// ---- ComponentSection ----

function ComponentSection({
  component, onRemove, onDragStart, onDragEnter, onDragEnd, onDrop, collapseRevision, draggable = true,
}: {
  component: Component
  onRemove: () => void
  onDragStart?: () => void
  onDragEnter?: () => void
  onDragEnd?: () => void
  onDrop?: () => void
  collapseRevision?: number
  draggable?: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => { if (collapseRevision) setCollapsed(true) }, [collapseRevision])
  const props = component.getProps()

  return (
    <div
      onDragEnter={e => { e.preventDefault(); onDragEnter?.() }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop?.() }}
      style={{ marginBottom: 6, border: '1px solid #2e2e2e', borderRadius: 4, overflow: 'hidden' }}
    >
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 10px',
          background: '#222',
          cursor: draggable ? 'grab' : 'default',
          fontSize: 12,
          fontWeight: 600,
          color: '#ccc',
          userSelect: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {draggable && <span style={{ color: '#444', fontSize: 11, marginRight: 2 }}>⠿</span>}
          <span style={{ color: '#555', fontSize: 10 }}>{collapsed ? '▶' : '▼'}</span>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: component.gizmoColor,
            display: 'inline-block', flexShrink: 0,
          }} />
          {component.label}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      {!collapsed && props.length > 0 && (
        <div style={{ padding: '8px 10px', background: '#1a1a1a' }}>
          {props.map(([key, prop]) => <PropRow key={key} prop={prop} onPropChanged={() => component.onPropChanged?.(prop)} />)}
        </div>
      )}
    </div>
  )
}

// ---- GroupSection ----

function GroupSection({
  item, onRemoveGroup, onDragStart, onDragEnter, onDragEnd, onDrop, collapseRevision, onRemoveMember,
}: {
  item: GroupItem
  onRemoveGroup: () => void
  onDragStart?: () => void
  onDragEnter?: () => void
  onDragEnd?: () => void
  onDrop?: () => void
  collapseRevision?: number
  onRemoveMember: (comp: Component) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => { if (collapseRevision) setCollapsed(true) }, [collapseRevision])
  const gizmoColor = item.members[0]?.component.gizmoColor ?? '#888'

  return (
    <div
      onDragEnter={e => { e.preventDefault(); onDragEnter?.() }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop?.() }}
      style={{ marginBottom: 6, border: '1px solid #3a2d52', borderRadius: 4, overflow: 'hidden' }}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 10px',
          background: '#1e1a2e',
          cursor: 'grab',
          fontSize: 12,
          fontWeight: 600,
          color: '#c4b5f4',
          userSelect: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#6b5a8e', fontSize: 11, marginRight: 2 }}>⠿</span>
          <span style={{ color: '#6b5a8e', fontSize: 10 }}>{collapsed ? '▶' : '▼'}</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: gizmoColor, display: 'inline-block', flexShrink: 0 }} />
          {item.groupLabel}
          <span style={{ color: '#6b5a8e', fontSize: 10, fontWeight: 400, marginLeft: 2 }}>({item.members.length})</span>
        </span>
        <button
          onClick={e => { e.stopPropagation(); onRemoveGroup() }}
          style={{ background: 'none', border: 'none', color: '#6b5a8e', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      {!collapsed && (
        <div style={{ paddingLeft: 8, paddingRight: 4, paddingBottom: 4, paddingTop: 4, background: '#131218' }}>
          {item.members.map(({ component, flatIndex }) => (
            <ComponentSection
              key={flatIndex}
              component={component}
              draggable={false}
              onRemove={() => onRemoveMember(component)}
              collapseRevision={collapseRevision}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---- AddComponentMenu ----

function AddComponentMenu({ onAdd, onClose }: {
  onAdd: (create: MenuCreateFn) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const q = query.toLowerCase().trim()

  useEffect(() => { searchRef.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { activeCat ? setActiveCat(null) : onClose() }
      if (e.key === 'Backspace' && !query && activeCat) setActiveCat(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, activeCat, query])

  useEffect(() => { if (q) setActiveCat(null) }, [q])

  const filtered = q
    ? COMPONENT_CATEGORIES
        .flatMap(c => c.items.map(item => ({ ...item, category: c.category })))
        .filter(item => item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
    : null

  const catItems = activeCat ? COMPONENT_CATEGORIES.find(c => c.category === activeCat)?.items ?? [] : []
  const onPage2 = !!activeCat && !q

  const listRow = (label: string, onClick: () => void, hint?: string) => (
    <div
      key={label}
      onClick={onClick}
      style={{ padding: '7px 14px', cursor: 'pointer', fontSize: 12, color: '#bbb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span>{label}</span>
      {hint && <span style={{ color: '#555', fontSize: 11 }}>{hint}</span>}
    </div>
  )

  const gridCard = (item: MenuItem, onClick: () => void) => (
    <div
      key={item.label}
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '6px 4px', cursor: 'pointer', borderRadius: 4 }}
      onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <PreviewCanvas components={item.preview()} size={52} />
      <span style={{ fontSize: 10, color: '#999', textAlign: 'center', lineHeight: 1.2, maxWidth: 64 }}>{item.label}</span>
    </div>
  )

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 100,
      background: '#1e1e1e',
      border: '1px solid #3a3a3a',
      borderRadius: 4,
      marginTop: 2,
      boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
      overflow: 'hidden',
    }}>

      <div style={{ borderBottom: '1px solid #2a2a2a' }}>
        {onPage2 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button
              onClick={() => setActiveCat(null)}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '8px 10px', fontSize: 13, lineHeight: 1 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#aaa')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}
            >‹</button>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{activeCat}</span>
          </div>
        ) : (
          <div style={{ padding: '7px 8px' }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search components..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#2a2a2a',
                border: '1px solid #383838',
                color: '#ddd',
                padding: '4px 8px',
                borderRadius: 3,
                fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          width: '200%',
          transform: onPage2 ? 'translateX(-50%)' : 'translateX(0)',
          transition: 'transform 0.16s ease',
        }}>

          {/* Page 1 — categories or search results */}
          <div style={{ width: '50%', maxHeight: 300, overflowY: 'auto' }}>
            {filtered ? (
              filtered.length === 0
                ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#555' }}>No results</div>
                : filtered.map(item => listRow(item.label, () => onAdd(item.create), item.category))
            ) : (
              COMPONENT_CATEGORIES.map(({ category, items }) =>
                listRow(category, () => setActiveCat(category), `${items.length} ›`)
              )
            )}
          </div>

          {/* Page 2 — live preview grid */}
          <div style={{ width: '50%', maxHeight: 300, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: '6px 8px' }}>
              {catItems.map(item => gridCard(item, () => onAdd(item.create)))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

// ---- Inspector ----

export function Inspector() {
  const [selectedId, setSelectedId] = useState<number | null>(() => editorStore.selectedEntityId)
  const [components, setComponents] = useState<Component[]>(() => {
    const id = editorStore.selectedEntityId
    return id !== null ? [...world.getComponents(id)] : []
  })
  const [sceneComponents, setSceneComponents] = useState<Component[]>([...sceneStore.getComponents()])
  const [showAdd, setShowAdd] = useState(false)
  const [dragOverTLIndex, setDragOverTLIndex] = useState<number | null>(null)
  const [collapseRevision, setCollapseRevision] = useState(0)
  const dragTLIndexRef = useRef<number | null>(null)

  useEffect(() => {
    const refresh = () => {
      const id = editorStore.selectedEntityId
      setSelectedId(id)
      setComponents(id !== null ? [...world.getComponents(id)] : [])
      setSceneComponents([...sceneStore.getComponents()])
    }
    const u1 = eventBus.on('editor:selection-changed', refresh)
    const u2 = eventBus.on('world:changed', refresh)
    return () => { u1(); u2() }
  }, [])

  if (selectedId === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '7px 12px', borderBottom: '1px solid #2e2e2e', fontSize: 13, color: '#ccc', fontWeight: 600 }}>
          Scene
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {sceneComponents.map((comp, i) => (
            <ComponentSection key={i} component={comp} onRemove={() => sceneStore.removeComponent(comp)} />
          ))}
          {!sceneComponents.some(c => c instanceof GlowComponent) && (
            <button
              onClick={() => sceneStore.addComponent(new GlowComponent())}
              style={{
                width: '100%', marginTop: 4, padding: '6px',
                background: '#1e1e1e', border: '1px dashed #383838',
                color: '#666', borderRadius: 4, cursor: 'pointer', fontSize: 12,
              }}
            >
              + Add Glow
            </button>
          )}
        </div>
      </div>
    )
  }

  const tlItems = buildTLItems(components)

  const handleDrop = (dropTLIdx: number) => {
    const dIdx = dragTLIndexRef.current
    if (dIdx === null || dIdx === dropTLIdx) { dragTLIndexRef.current = null; setDragOverTLIndex(null); return }
    const dragItem = tlItems[dIdx]
    const dropItem = tlItems[dropTLIdx]
    const toFlatIdx = dropItem.kind === 'solo' ? dropItem.flatIndex : dropItem.firstFlatIndex
    if (dragItem.kind === 'solo') {
      historyStore.execute(new ReorderComponentCommand(selectedId, dragItem.flatIndex, toFlatIdx))
    } else {
      historyStore.execute(new ReorderGroupCommand(selectedId, dragItem.groupId, toFlatIdx))
    }
    dragTLIndexRef.current = null
    setDragOverTLIndex(null)
  }

  const handleAddComponent = (create: MenuCreateFn) => {
    const result = create()
    if (Array.isArray(result)) {
      historyStore.execute(new CompoundCommand(
        `Add ${(result[0] as Component).groupLabel ?? 'Bundle'}`,
        result.map(c => new AddComponentCommand(selectedId, c))
      ))
    } else {
      historyStore.execute(new AddComponentCommand(selectedId, result))
    }
    setShowAdd(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '7px 12px', borderBottom: '1px solid #2e2e2e', fontSize: 13, color: '#ccc', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>
          {world.getEntityName(selectedId)}
          <span style={{ color: '#444', fontSize: 11, fontWeight: 400, marginLeft: 6 }}>#{selectedId}</span>
        </span>
        <button
          onClick={() => setCollapseRevision(r => r + 1)}
          title="Collapse all"
          style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#888')}
          onMouseLeave={e => (e.currentTarget.style.color = '#444')}
        >⊟</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {(() => {
          const firstShapeIdx = components.findIndex(c => c.stage === PipelineStage.Shape)
          const hasOrderWarning = firstShapeIdx > 0
          const hasCloner = components.some(c => c instanceof ClonerComponent)
          const hasDistributor = components.some(c => c.stage === PipelineStage.Distributor)
          const hasClonerWarning = hasCloner && !hasDistributor
          return (<>
            {hasOrderWarning && (
              <div style={{
                marginBottom: 8, padding: '6px 10px',
                background: '#2a1f00', border: '1px solid #5a3f00',
                borderRadius: 4, fontSize: 11, color: '#c8922a', lineHeight: 1.5,
              }}>
                Shape component should come first in the pipeline — components above it receive no input.
              </div>
            )}
            {hasClonerWarning && (
              <div style={{
                marginBottom: 8, padding: '6px 10px',
                background: '#1a1f2a', border: '1px solid #2a3a5a',
                borderRadius: 4, fontSize: 11, color: '#7aa2d4', lineHeight: 1.5,
              }}>
                Cloner has no distributor — all clones stack at the same position. Add a Radial, Linear, or Grid Distributor.
              </div>
            )}
          </>)
        })()}

        {tlItems.map((item, tlIdx) => (
          <React.Fragment key={tlIdx}>
            {dragOverTLIndex === tlIdx && dragTLIndexRef.current !== tlIdx && dragTLIndexRef.current !== tlIdx - 1 && (
              <div style={{ height: 3, background: '#60a5fa', borderRadius: 2, margin: '2px 0' }} />
            )}
            {item.kind === 'solo' ? (
              <ComponentSection
                component={item.component}
                collapseRevision={collapseRevision}
                onRemove={() => historyStore.execute(new RemoveComponentCommand(selectedId, item.component))}
                onDragStart={() => { dragTLIndexRef.current = tlIdx; setDragOverTLIndex(null) }}
                onDragEnter={() => setDragOverTLIndex(tlIdx)}
                onDragEnd={() => { dragTLIndexRef.current = null; setDragOverTLIndex(null) }}
                onDrop={() => handleDrop(tlIdx)}
              />
            ) : (
              <GroupSection
                item={item}
                collapseRevision={collapseRevision}
                onRemoveGroup={() => historyStore.execute(new RemoveGroupCommand(selectedId, item.groupId))}
                onDragStart={() => { dragTLIndexRef.current = tlIdx; setDragOverTLIndex(null) }}
                onDragEnter={() => setDragOverTLIndex(tlIdx)}
                onDragEnd={() => { dragTLIndexRef.current = null; setDragOverTLIndex(null) }}
                onDrop={() => handleDrop(tlIdx)}
                onRemoveMember={comp => historyStore.execute(new RemoveComponentCommand(selectedId, comp))}
              />
            )}
          </React.Fragment>
        ))}

        {dragOverTLIndex === tlItems.length && dragTLIndexRef.current !== tlItems.length - 1 && (
          <div style={{ height: 3, background: '#60a5fa', borderRadius: 2, margin: '2px 0' }} />
        )}
        <div
          style={{ height: 16 }}
          onDragEnter={e => { e.preventDefault(); setDragOverTLIndex(tlItems.length) }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const dIdx = dragTLIndexRef.current
            if (dIdx !== null && dIdx !== tlItems.length - 1) {
              const dragItem = tlItems[dIdx]
              if (dragItem.kind === 'solo') {
                historyStore.execute(new ReorderComponentCommand(selectedId, dragItem.flatIndex, components.length - 1))
              } else {
                historyStore.execute(new ReorderGroupCommand(selectedId, dragItem.groupId, components.length))
              }
            }
            dragTLIndexRef.current = null
            setDragOverTLIndex(null)
          }}
        />

        <div style={{ position: 'relative', marginTop: 8 }}>
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{
              width: '100%',
              padding: '6px',
              background: '#1e1e1e',
              border: '1px dashed #383838',
              color: '#666',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            + Add Component
          </button>
          {showAdd && (
            <AddComponentMenu
              onAdd={handleAddComponent}
              onClose={() => setShowAdd(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
