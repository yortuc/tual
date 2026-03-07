import React, { useState, useEffect, useRef } from 'react'
import { world } from '../ecs/World'
import { eventBus } from '../ecs/EventBus'
import { editorStore } from '../editor/EditorStore'
import { sceneStore } from '../editor/SceneStore'
import { Component, PipelineStage } from '../ecs/Component'
import { Prop } from '../props/Prop'
import { FillComponent } from '../components/styles/FillComponent'
import { StrokeComponent } from '../components/styles/StrokeComponent'
import { ShadowComponent } from '../components/styles/ShadowComponent'
import { OpacityComponent } from '../components/styles/OpacityComponent'
import { RadialClonerComponent } from '../components/modifiers/RadialClonerComponent'
import { LinearClonerComponent } from '../components/modifiers/LinearClonerComponent'
import { GridClonerComponent }   from '../components/modifiers/GridClonerComponent'
import { MirrorComponent } from '../components/modifiers/MirrorComponent'

const ADDABLE: { label: string; create: () => Component }[] = [
  { label: 'Fill',          create: () => new FillComponent() },
  { label: 'Stroke',        create: () => new StrokeComponent() },
  { label: 'Shadow',        create: () => new ShadowComponent() },
  { label: 'Opacity',       create: () => new OpacityComponent() },
  { label: 'Radial Cloner', create: () => new RadialClonerComponent() },
  { label: 'Linear Cloner', create: () => new LinearClonerComponent() },
  { label: 'Grid Cloner',   create: () => new GridClonerComponent() },
  { label: 'Mirror',        create: () => new MirrorComponent() },
]

function PropRow({ prop }: { prop: Prop<unknown> }) {
  const [, tick] = useState(0)

  const onChange = (v: unknown) => {
    prop.value = v
    eventBus.emit('world:changed')
    tick(n => n + 1)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, alignItems: 'center', marginBottom: 5 }}>
      <span style={{ color: '#777', fontSize: 11, textAlign: 'right', paddingRight: 4 }}>{prop.label}</span>
      <div>{prop.renderEditorUnsafe(onChange)}</div>
    </div>
  )
}

function ComponentSection({
  component, onRemove, onDragStart, onDragOver, onDrop,
}: {
  component: Component
  onRemove: () => void
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const props = component.getProps()

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={e => { e.preventDefault(); onDragOver?.(e) }}
      onDrop={e => { e.preventDefault(); onDrop?.() }}
      style={{ marginBottom: 6, border: '1px solid #2e2e2e', borderRadius: 4, overflow: 'hidden' }}
    >
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 10px',
          background: '#222',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          color: '#ccc',
          userSelect: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#444', fontSize: 11, cursor: 'grab', marginRight: 2 }}>⠿</span>
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
          return hasOrderWarning && (
            <div style={{
              marginBottom: 8, padding: '6px 10px',
              background: '#2a1f00', border: '1px solid #5a3f00',
              borderRadius: 4, fontSize: 11, color: '#c8922a', lineHeight: 1.5,
            }}>
              Shape component should come first in the pipeline — components above it receive no input.
            </div>
          )
        })()}
        {components.map((comp, i) => (
          <ComponentSection
            key={i}
            component={comp}
            onRemove={() => world.removeComponent(selectedId, comp)}
            onDragStart={() => { dragIndexRef.current = i }}
            onDrop={() => {
              if (dragIndexRef.current !== null && dragIndexRef.current !== i) {
                world.reorderComponent(selectedId, dragIndexRef.current, i)
              }
              dragIndexRef.current = null
            }}
          />
        ))}

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
                  onClick={() => { world.addComponent(selectedId, create()); setShowAdd(false) }}
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
