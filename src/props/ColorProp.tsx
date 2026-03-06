import React from 'react'
import { Prop } from './Prop'

export class ColorProp extends Prop<string> {
  constructor(label: string, options: { default: string }) {
    super(label, options)
  }

  renderEditor(onChange: (v: string) => void): React.ReactElement {
    return <ColorEditor prop={this} onChange={onChange} />
  }
}

function ColorEditor({ prop, onChange }: { prop: ColorProp; onChange: (v: string) => void }) {
  // color input only accepts 6-digit hex
  const hexValue = /^#[0-9a-fA-F]{6}$/.test(prop.value) ? prop.value : '#000000'
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        type="color"
        value={hexValue}
        onChange={e => onChange(e.target.value)}
        style={{ width: 28, height: 24, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
      />
      <input
        type="text"
        value={prop.value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1,
          background: '#2a2a2a',
          border: '1px solid #444',
          color: '#ddd',
          padding: '2px 6px',
          borderRadius: 3,
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      />
    </div>
  )
}
