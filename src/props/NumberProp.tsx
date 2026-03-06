import React from 'react'
import { Prop } from './Prop'

interface Options {
  default: number
  min?: number
  max?: number
  step?: number
}

export class NumberProp extends Prop<number> {
  min: number
  max: number
  step: number

  constructor(label: string, options: Options) {
    super(label, options)
    this.min = options.min ?? -Infinity
    this.max = options.max ?? Infinity
    this.step = options.step ?? 1
  }

  renderEditor(onChange: (v: number) => void): React.ReactElement {
    return <NumberEditor prop={this} onChange={onChange} />
  }
}

function NumberEditor({ prop, onChange }: { prop: NumberProp; onChange: (v: number) => void }) {
  const hasRange = Number.isFinite(prop.min) && Number.isFinite(prop.max)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {hasRange && (
        <input
          type="range"
          min={prop.min}
          max={prop.max}
          step={prop.step}
          value={prop.value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#4a90d9' }}
        />
      )}
      <input
        type="number"
        value={prop.value}
        step={prop.step}
        min={Number.isFinite(prop.min) ? prop.min : undefined}
        max={Number.isFinite(prop.max) ? prop.max : undefined}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: hasRange ? 56 : '100%',
          background: '#2a2a2a',
          border: '1px solid #444',
          color: '#ddd',
          padding: '2px 4px',
          borderRadius: 3,
          fontSize: 12,
        }}
      />
    </div>
  )
}
