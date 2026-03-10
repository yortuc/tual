import React from 'react'
import { Prop } from './Prop'

export class ColorProp extends Prop<string> {
  constructor(label: string, options: { default: string }) {
    super(label, options)
  }

  renderEditor(onChange: (v: string) => void, onCommit?: (v: string) => void): React.ReactElement {
    return <ColorEditor prop={this} onChange={onChange} onCommit={onCommit} />
  }
}

function ColorEditor({
  prop, onChange, onCommit,
}: {
  prop: ColorProp
  onChange: (v: string) => void
  onCommit?: (v: string) => void
}) {
  const hexValue = /^#[0-9a-fA-F]{6}$/.test(prop.value) ? prop.value : '#000000'
  return (
    <input
      type="color"
      value={hexValue}
      onChange={e => onChange(e.target.value)}
      onBlur={e => onCommit?.(e.target.value)}
      style={{ width: '100%', height: 28, border: 'none', cursor: 'pointer', background: 'none', padding: 0, display: 'block' }}
    />
  )
}
