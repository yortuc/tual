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
import { IndexSignal } from '../components/signals/IndexSignal'
import { RadialDistributor } from '../components/distributors/RadialDistributor'
import { LinearDistributor } from '../components/distributors/LinearDistributor'
import { GridDistributor } from '../components/distributors/GridDistributor'

const ADDABLE: { label: string; create: () => Component }[] = [
  { label: 'Cloner',             create: () => new ClonerComponent() },
  { label: 'Radial Distributor', create: () => new RadialDistributor() },
  { label: 'Linear Distributor', create: () => new LinearDistributor() },
  { label: 'Grid Distributor',   create: () => new GridDistributor() },
  { label: 'Mirror',             create: () => new MirrorComponent() },
  { label: 'Gradient',           create: () => new GradientMutator() },
  { label: 'Index Signal',       create: () => new IndexSignal() },
  { label: 'Fill',               create: () => new FillComponent() },
  { label: 'Stroke',             create: () => new StrokeComponent() },
  { label: 'Shadow',             create: () => new ShadowComponent() },
  { label: 'Opacity',            create: () => new OpacityComponent() },
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
      <div onPointerDown={() => { startValueRef.current = prop.value }}>
        {prop.renderEditorUnsafe(onChange, onCommit)}
      </div>
    </div>
  )
}

function ComponentSection({
  component, onRemove, onDragStart, onDragEnter, onDragEnd, onDrop,
}: {
  component: Component
  onRemove: () => void
  onDragStart?: () => void
  onDragEnter?: () => void
  onDragEnd?: () => void
  onDrop?: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
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

export function Inspector() {
  const [selectedId, setSelectedId] = useState<number | null>(() => editorStore.selectedEntityId)
  const [components, setComponents] = useState<Component[]>(() => {
    const id = editorStore.selectedEntityId
    return id !== null ? [...world.getComponents(id)] : []
  })
  const [sceneComponents, setSceneComponents] = useState<Component[]>([...sceneStore.getComponents()])
  const [showAdd, setShowAdd] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
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
      <div style={{ padding: '7px 12px', borderBottom: '1px solid #2e2e2e', fontSize: 13, color: '#ccc', fontWeight: 600 }}>
        {world.getEntityName(selectedId)}
        <span style={{ color: '#444', fontSize: 11, fontWeight: 400, marginLeft: 6 }}>#{selectedId}</span>
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
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 100,
              background: '#252525',
              border: '1px solid #3a3a3a',
              borderRadius: 4,
              overflow: 'hidden',
              marginTop: 2,
            }}>
              {ADDABLE.map(({ label, create }) => (
                <div
                  key={label}
                  onClick={() => { historyStore.execute(new AddComponentCommand(selectedId, create())); setShowAdd(false) }}
                  style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12, color: '#bbb' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#333')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
