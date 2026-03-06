import React, { useState, useEffect } from 'react'
import { world } from '../ecs/World'
import { eventBus } from '../ecs/EventBus'
import { editorStore } from '../editor/EditorStore'
import { RectComponent } from '../components/shapes/RectComponent'
import { CircleComponent } from '../components/shapes/CircleComponent'
import { TextComponent } from '../components/shapes/TextComponent'
import { TransformComponent } from '../components/styles/TransformComponent'
import { FillComponent } from '../components/styles/FillComponent'

const SHAPES = ['Rect', 'Circle', 'Text'] as const
type ShapeType = typeof SHAPES[number]

function createEntity(type: ShapeType): void {
  const id = world.createEntity(type)
  if (type === 'Rect') world.addComponent(id, new RectComponent())
  else if (type === 'Circle') world.addComponent(id, new CircleComponent())
  else if (type === 'Text') world.addComponent(id, new TextComponent())
  world.addComponent(id, new TransformComponent())
  world.addComponent(id, new FillComponent())
  editorStore.select(id)
}

export function SceneTree() {
  const [entityIds, setEntityIds] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    const unsub1 = eventBus.on('world:changed', () => setEntityIds([...world.getEntityIds()]))
    const unsub2 = eventBus.on('editor:selection-changed', id => setSelected(id as number | null))
    return () => { unsub1(); unsub2() }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #2e2e2e', display: 'flex', gap: 4 }}>
        {SHAPES.map(s => (
          <button
            key={s}
            onClick={() => createEntity(s)}
            style={{
              fontSize: 11,
              padding: '3px 8px',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              color: '#aaa',
              borderRadius: 3,
              cursor: 'pointer',
            }}
          >
            + {s}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {entityIds.map(id => (
          <div
            key={id}
            onClick={() => editorStore.select(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 10px 5px 12px',
              cursor: 'pointer',
              fontSize: 13,
              color: selected === id ? '#fff' : '#999',
              background: selected === id ? '#1e3a5f' : 'transparent',
              borderLeft: `2px solid ${selected === id ? '#4a90d9' : 'transparent'}`,
            }}
          >
            <span>{world.getEntityName(id)}</span>
            <button
              onClick={e => { e.stopPropagation(); world.deleteEntity(id); editorStore.select(null) }}
              style={{
                background: 'none',
                border: 'none',
                color: '#555',
                cursor: 'pointer',
                fontSize: 14,
                padding: '0 2px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
        {entityIds.length === 0 && (
          <div style={{ padding: 16, color: '#444', fontSize: 12 }}>No entities. Add one above.</div>
        )}
      </div>
    </div>
  )
}
