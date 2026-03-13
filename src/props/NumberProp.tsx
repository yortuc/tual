import React, { useState, useRef } from 'react'
import { Prop } from './Prop'
import { eventBus } from '../ecs/EventBus'

interface Options {
  default: number
  min?: number
  max?: number
  step?: number
  shortLabel?: string  // 1-3 char prefix shown inside the compact field
}

export class NumberProp extends Prop<number> {
  min: number
  max: number
  step: number
  shortLabel: string
  channel: string = ''  // if set, this prop is driven by a named channel

  constructor(label: string, options: Options) {
    super(label, options)
    this.min = options.min ?? -Infinity
    this.max = options.max ?? Infinity
    this.step = options.step ?? 1
    this.shortLabel = options.shortLabel ?? ''
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

const CHANNEL_INPUT_STYLE: React.CSSProperties = {
  background: '#1a2a1a',
  border: '1px solid #2d5a3d',
  color: '#4ade80',
  padding: '2px 6px',
  borderRadius: 3,
  fontSize: 11,
  width: '100%',
  boxSizing: 'border-box',
}

function NumberEditor({
  prop, onChange, onCommit,
}: {
  prop: NumberProp
  onChange: (v: number) => void
  onCommit?: (v: number) => void
}) {
  const [showBind, setShowBind] = useState(!!prop.channel)
  const driven = !!prop.channel
  const startX = useRef(0)
  const startVal = useRef(prop.value)

  const bindBtn = (
    <button
      onPointerDown={e => e.stopPropagation()}
      onClick={() => {
        if (driven) { prop.channel = ''; eventBus.emit('world:changed') }
        setShowBind(s => !s)
      }}
      title={driven ? 'Unbind channel' : 'Bind to channel'}
      style={{
        background: driven ? '#1e3a2a' : '#252525',
        border: 'none',
        borderLeft: `1px solid ${driven ? '#2d5a3d' : '#383838'}`,
        color: driven ? '#4ade80' : '#444',
        cursor: 'pointer',
        fontSize: 11,
        padding: '0 6px',
        flexShrink: 0,
        alignSelf: 'stretch',
      }}
    >~</button>
  )

  const channelInput = showBind && (
    <input
      type="text"
      placeholder="channel name"
      value={prop.channel}
      onPointerDown={e => e.stopPropagation()}
      onChange={e => { prop.channel = e.target.value; eventBus.emit('world:changed') }}
      style={CHANNEL_INPUT_STYLE}
    />
  )

  if (prop.shortLabel) {
    // ── Compact mode: [draggable label][number input][~] ──────────────────────
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{
          display: 'flex', height: 26, borderRadius: 3, overflow: 'hidden',
          border: `1px solid ${driven ? '#2d5a3d' : '#333'}`,
        }}>
          <div
            onPointerDown={e => {
              e.preventDefault()
              ;(e.target as Element).setPointerCapture(e.pointerId)
              startX.current = e.clientX
              startVal.current = prop.value
            }}
            onPointerMove={e => {
              if (!(e.buttons & 1)) return
              const raw = startVal.current + (e.clientX - startX.current) * prop.step
              onChange(Math.min(prop.max, Math.max(prop.min, raw)))
            }}
            onPointerUp={() => onCommit?.(prop.value)}
            style={{
              width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.3px',
              color: driven ? '#2d5a3d' : '#666',
              cursor: 'ew-resize', userSelect: 'none', flexShrink: 0,
              background: '#252525', borderRight: '1px solid #333',
            }}
          >{prop.shortLabel}</div>
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
              flex: 1, minWidth: 0, border: 'none', outline: 'none',
              background: '#1e1e1e', color: driven ? '#2d5a3d' : '#ddd',
              padding: '0 4px', fontSize: 11,
            }}
          />
          {bindBtn}
        </div>
        {channelInput}
      </div>
    )
  }

  // ── Legacy mode: slider + number input + ~ (for props without shortLabel) ──
  const hasRange = Number.isFinite(prop.min) && Number.isFinite(prop.max)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', minWidth: 0 }}>
        {hasRange && (
          <input
            type="range"
            min={prop.min} max={prop.max} step={prop.step} value={prop.value}
            disabled={driven}
            onChange={e => onChange(Number(e.target.value))}
            onMouseUp={e => onCommit?.(Number((e.target as HTMLInputElement).value))}
            style={{ flex: 1, minWidth: 0, accentColor: '#4a90d9', opacity: driven ? 0.3 : 1 }}
          />
        )}
        <input
          type="number"
          value={prop.value} step={prop.step} disabled={driven}
          min={Number.isFinite(prop.min) ? prop.min : undefined}
          max={Number.isFinite(prop.max) ? prop.max : undefined}
          onChange={e => onChange(Number(e.target.value))}
          onBlur={e => onCommit?.(Number(e.target.value))}
          style={{
            width: hasRange ? 56 : '100%', background: '#2a2a2a',
            border: '1px solid #444', color: driven ? '#555' : '#ddd',
            padding: '2px 4px', borderRadius: 3, fontSize: 12,
          }}
        />
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => { if (driven) { prop.channel = ''; eventBus.emit('world:changed') }; setShowBind(s => !s) }}
          title={driven ? 'Unbind channel' : 'Bind to channel'}
          style={{
            background: driven ? '#1e3a2a' : 'none',
            border: `1px solid ${driven ? '#2d5a3d' : '#383838'}`,
            color: driven ? '#4ade80' : '#555',
            borderRadius: 3, cursor: 'pointer', fontSize: 11,
            padding: '1px 5px', lineHeight: 1.4, flexShrink: 0,
          }}
        >~</button>
      </div>
      {channelInput}
    </div>
  )
}
