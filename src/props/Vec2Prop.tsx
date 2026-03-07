import React from 'react'
import { Prop } from './Prop'

export interface Vec2 { x: number; y: number }

export class Vec2Prop extends Prop<Vec2> {
  constructor(label: string, options: { default: Vec2 }) {
    super(label, options)
  }

  renderEditor(onChange: (v: Vec2) => void): React.ReactElement {
    return <Vec2Editor prop={this} onChange={onChange} />
  }
}

function Vec2Editor({ prop, onChange }: { prop: Vec2Prop; onChange: (v: Vec2) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {(['x', 'y'] as const).map(axis => (
        <label key={axis} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
          <span style={{ color: '#666', fontSize: 11, width: 10 }}>{axis.toUpperCase()}</span>
          <input
            type="number"
            value={prop.value[axis]}
            onChange={e => onChange({ ...prop.value, [axis]: Number(e.target.value) })}
            style={{
              flex: 1,
              background: '#2a2a2a',
              border: '1px solid #444',
              color: '#ddd',
              padding: '2px 4px',
              borderRadius: 3,
              fontSize: 12,
              minWidth: 0,
            }}
          />
        </label>
      ))}
    </div>
  )
}
