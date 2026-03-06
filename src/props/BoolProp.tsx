import React from 'react'
import { Prop } from './Prop'

export class BoolProp extends Prop<boolean> {
  constructor(label: string, options: { default: boolean }) {
    super(label, options)
  }

  renderEditor(onChange: (v: boolean) => void): React.ReactElement {
    return (
      <input
        type="checkbox"
        checked={this.value}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: '#4a90d9', width: 14, height: 14 }}
      />
    )
  }
}
