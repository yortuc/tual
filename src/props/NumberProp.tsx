import React, { useState } from 'react'
import { Prop } from './Prop'
import { eventBus } from '../ecs/EventBus'

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
  channel: string = ''  // if set, this prop is driven by a named channel

  constructor(label: string, options: Options) {
    super(label, options)
    this.min = options.min ?? -Infinity
    this.max = options.max ?? Infinity
    this.step = options.step ?? 1
  }

  // Returns channel value if driven, otherwise the literal value
  resolve(channels: Record<string, number>): number {
    if (this.channel && channels[this.channel] !== undefined) {
      return channels[this.channel]
    }
    return this.value
  }

  // Safely coerce — guards against old Vec2 `{ x, y }` values stored in scenes
  deserialize(v: number): void {
    const n = Number(v)
    if (!isNaN(n)) this.value = n
  }

  renderEditor(onChange: (v: number) => void, onCommit?: (v: number) => void): React.ReactElement {
    return <NumberEditor prop={this} onChange={onChange} onCommit={onCommit} />
  }
}

function NumberEditor({
  prop, onChange, onCommit,
}: {
  prop: NumberProp
  onChange: (v: number) => void
  onCommit?: (v: number) => void
}) {
  const [showBind, setShowBind] = useState(!!prop.channel)
  const hasRange = Number.isFinite(prop.min) && Number.isFinite(prop.max)
  const driven = !!prop.channel

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', minWidth: 0 }}>
        {hasRange && (
          <input
            type="range"
            min={prop.min}
            max={prop.max}
            step={prop.step}
            value={prop.value}
            disabled={driven}
            onChange={e => onChange(Number(e.target.value))}
            onMouseUp={e => onCommit?.(Number((e.target as HTMLInputElement).value))}
            style={{ flex: 1, minWidth: 0, accentColor: '#4a90d9', opacity: driven ? 0.3 : 1 }}
          />
        )}
        <input
          type="number"
          value={prop.value}
          step={prop.step}
          disabled={driven}
          min={Number.isFinite(prop.min) ? prop.min : undefined}
          max={Number.isFinite(prop.max) ? prop.max : undefined}
          onChange={e => onChange(Number(e.target.value))}
          onBlur={e => onCommit?.(Number(e.target.value))}
          style={{
            width: hasRange ? 56 : '100%',
            background: '#2a2a2a',
            border: '1px solid #444',
            color: driven ? '#555' : '#ddd',
            padding: '2px 4px',
            borderRadius: 3,
            fontSize: 12,
          }}
        />
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => {
            if (driven) { prop.channel = ''; eventBus.emit('world:changed') }
            setShowBind(s => !s)
          }}
          title={driven ? 'Unbind channel' : 'Bind to channel'}
          style={{
            background: driven ? '#1e3a2a' : 'none',
            border: `1px solid ${driven ? '#2d5a3d' : '#383838'}`,
            color: driven ? '#4ade80' : '#555',
            borderRadius: 3,
            cursor: 'pointer',
            fontSize: 11,
            padding: '1px 5px',
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >~</button>
      </div>
      {showBind && (
        <input
          type="text"
          placeholder="channel name"
          value={prop.channel}
          onPointerDown={e => e.stopPropagation()}
          onChange={e => { prop.channel = e.target.value; eventBus.emit('world:changed') }}
          style={{
            background: '#1a2a1a',
            border: '1px solid #2d5a3d',
            color: '#4ade80',
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: 11,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}
