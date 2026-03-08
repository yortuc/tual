import React from 'react'
import { Prop } from './Prop'

interface Options {
  default: string
  options: string[]
}

export class EnumProp extends Prop<string> {
  options: string[]

  constructor(label: string, opts: Options) {
    super(label, opts)
    this.options = opts.options
  }

  renderEditor(onChange: (v: string) => void, onCommit?: (v: string) => void): React.ReactElement {
    return (
      <select
        value={this.value}
        onChange={e => { onChange(e.target.value); onCommit?.(e.target.value) }}
        style={{
          width: '100%',
          background: '#2a2a2a',
          border: '1px solid #444',
          color: '#ddd',
          padding: '2px 6px',
          borderRadius: 3,
          fontSize: 12,
        }}
      >
        {this.options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }
}
