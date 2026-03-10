import React, { useState, useEffect, useRef } from 'react'
import { world } from '../ecs/World'
import { eventBus } from '../ecs/EventBus'
import { editorStore } from '../editor/EditorStore'
import { sceneStore } from '../editor/SceneStore'
import { Component, PipelineStage } from '../ecs/Component'
import { Prop } from '../props/Prop'
import { historyStore } from '../ecs/HistoryStore'
import { SetPropCommand, AddComponentCommand, RemoveComponentCommand, ReorderComponentCommand } from '../ecs/Command'
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

const COMPONENT_CATEGORIES: { category: string; items: { label: string; create: () => Component }[] }[] = [
  {
    category: 'Modifiers',
    items: [
      { label: 'Cloner',   create: () => new ClonerComponent() },
      { label: 'Mirror',   create: () => new MirrorComponent() },
      { label: 'Gradient', create: () => new GradientMutator() },
    ],
  },
  {
    category: 'Distributors',
    items: [
      { label: 'Radial', create: () => new RadialDistributor() },
      { label: 'Linear', create: () => new LinearDistributor() },
      { label: 'Grid',   create: () => new GridDistributor() },
    ],
  },
  {
    category: 'Signals',
    items: [
      { label: 'Ramp',  create: () => new RampSignal() },
      { label: 'Wave',  create: () => new WaveSignal() },
      { label: 'Noise', create: () => new NoiseSignal() },
    ],
  },
  {
    category: 'Styles',
    items: [
      { label: 'Fill',    create: () => new FillComponent() },
      { label: 'Stroke',  create: () => new StrokeComponent() },
      { label: 'Shadow',  create: () => new ShadowComponent() },
      { label: 'Opacity', create: () => new OpacityComponent() },
    ],
  },
]

function PropRow({ prop }: { prop: Prop<unknown> }) {
  const [, tick] = useState(0)
  const startValueRef = useRef<unknown>(prop.value)

  const onChange = (v: unknown) => {
    prop.value = v
    eventBus.emit('world:changed')
    tick(n => n + 1)
  }

  const onCommit = (v: unknown) => {
    if (startValueRef.current !== v) {
      historyStore.record(new SetPropCommand(prop, startValueRef.current, v, `Change ${prop.label}`))
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

function ComponentSection({
  component, onRemove, onDragStart, onDragEnter, onDragEnd, onDrop, collapseRevision,
}: {
  component: Component
  onRemove: () => void
  onDragStart?: () => void
  onDragEnter?: () => void
  onDragEnd?: () => void
  onDrop?: () => void
  collapseRevision?: number
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
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 10px',
          background: '#222',
          cursor: 'grab',
          fontSize: 12,
          fontWeight: 600,
          color: '#ccc',
          userSelect: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#444', fontSize: 11, marginRight: 2 }}>⠿</span>
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
          {props.map(([key, prop]) => <PropRow key={key} prop={prop} />)}
        </div>
      )}
    </div>
  )
}

function AddComponentMenu({ onAdd, onClose }: {
  onAdd: (create: () => Component) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const q = query.toLowerCase().trim()

  useEffect(() => { searchRef.current?.focus() }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = q
    ? COMPONENT_CATEGORIES
        .flatMap(c => c.items.map(item => ({ ...item, category: c.category })))
        .filter(item => item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
    : null

  const itemStyle = { padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#bbb' }

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 100,
      background: '#222',
      border: '1px solid #3a3a3a',
      borderRadius: 4,
      marginTop: 2,
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    }}>
      {/* Search */}
      <div style={{ padding: '7px 8px', borderBottom: '1px solid #2e2e2e' }}>
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
            border: '1px solid #444',
            color: '#ddd',
            padding: '4px 8px',
            borderRadius: 3,
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Results */}
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {filtered ? (
          filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#555' }}>No results</div>
          ) : (
            filtered.map(({ label, create, category }) => (
              <div
                key={`${category}/${label}`}
                onClick={() => onAdd(create)}
                style={itemStyle}
                onMouseEnter={e => (e.currentTarget.style.background = '#2e2e2e')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: '#555', fontSize: 10, marginRight: 6 }}>{category}</span>
                {label}
              </div>
            ))
          )
        ) : (
          COMPONENT_CATEGORIES.map(({ category, items }) => (
            <div key={category}>
              <div style={{
                padding: '6px 10px 3px',
                fontSize: 10,
                color: '#555',
                textTransform: 'uppercase',
                letterSpacing: '0.7px',
                fontWeight: 600,
              }}>
                {category}
              </div>
              {items.map(({ label, create }) => (
                <div
                  key={label}
                  onClick={() => onAdd(create)}
                  style={{ ...itemStyle, paddingLeft: 20 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2e2e2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {label}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function Inspector() {
  const [selectedId, setSelectedId] = useState<number | null>(() => editorStore.selectedEntityId)
  const [components, setComponents] = useState<Component[]>(() => {
    const id = editorStore.selectedEntityId
    return id !== null ? [...world.getComponents(id)] : []
  })
  const [sceneComponents, setSceneComponents] = useState<Component[]>([...sceneStore.getComponents()])
  const [showAdd, setShowAdd] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [collapseRevision, setCollapseRevision] = useState(0)
  const dragIndexRef = useRef<number | null>(null)

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
        {components.map((comp, i) => (
          <React.Fragment key={i}>
            {dragOverIndex === i && dragIndexRef.current !== i && dragIndexRef.current !== i - 1 && (
              <div style={{ height: 3, background: '#60a5fa', borderRadius: 2, margin: '2px 0' }} />
            )}
            <ComponentSection
              component={comp}
              collapseRevision={collapseRevision}
              onRemove={() => historyStore.execute(new RemoveComponentCommand(selectedId, comp))}
              onDragStart={() => { dragIndexRef.current = i; setDragOverIndex(null) }}
              onDragEnter={() => setDragOverIndex(i)}
              onDragEnd={() => { dragIndexRef.current = null; setDragOverIndex(null) }}
              onDrop={() => {
                if (dragIndexRef.current !== null && dragIndexRef.current !== i) {
                  historyStore.execute(new ReorderComponentCommand(selectedId, dragIndexRef.current, i))
                }
                dragIndexRef.current = null
                setDragOverIndex(null)
              }}
            />
          </React.Fragment>
        ))}
        {dragOverIndex === components.length && dragIndexRef.current !== components.length - 1 && (
          <div style={{ height: 3, background: '#60a5fa', borderRadius: 2, margin: '2px 0' }} />
        )}
        <div
          style={{ height: 16 }}
          onDragEnter={e => { e.preventDefault(); setDragOverIndex(components.length) }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            if (dragIndexRef.current !== null && dragIndexRef.current !== components.length - 1) {
              historyStore.execute(new ReorderComponentCommand(selectedId, dragIndexRef.current, components.length - 1))
            }
            dragIndexRef.current = null
            setDragOverIndex(null)
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
              onAdd={create => { historyStore.execute(new AddComponentCommand(selectedId, create())); setShowAdd(false) }}
              onClose={() => setShowAdd(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
