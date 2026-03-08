import React from 'react'

export abstract class Prop<T> {
  label: string
  value: T

  constructor(label: string, options: { default: T }) {
    this.label = label
    this.value = options.default
  }

  abstract renderEditor(onChange: (v: T) => void, onCommit?: (v: T) => void): React.ReactElement

  // Type-erased version used by the Inspector
  renderEditorUnsafe(onChange: (v: unknown) => void, onCommit?: (v: unknown) => void): React.ReactElement {
    return this.renderEditor(
      onChange as (v: T) => void,
      onCommit as ((v: T) => void) | undefined,
    )
  }

  serialize(): T {
    return this.value
  }

  deserialize(v: T): void {
    this.value = v
  }
}
