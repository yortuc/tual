import React from 'react'
import { Prop } from './Prop'

export class StringProp extends Prop<string> {
  constructor(label: string, options: { default: string }) {
    super(label, options)
  }

  renderEditor(onChange: (v: string) => void, onCommit?: (v: string) => void): React.ReactElement {
    return (
      <input
        type="text"
        value={this.value}
        onChange={e => onChange(e.target.value)}
        onBlur={e => onCommit?.(e.target.value)}
        style={{
          width: '100%',
          background: '#2a2a2a',
          border: '1px solid #444',
          color: '#ddd',
          padding: '2px 6px',
          borderRadius: 3,
          fontSize: 12,
        }}
      />
    )
  }
}
