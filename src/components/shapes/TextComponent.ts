import { Component, PipelineStage } from '../../ecs/Component'
import { identityTransform, type DrawItem } from '../../renderer/DrawItem'
import { NumberProp } from '../../props/NumberProp'
import { StringProp } from '../../props/StringProp'
import { EnumProp } from '../../props/EnumProp'

export class TextComponent extends Component {
  readonly stage = PipelineStage.Shape
  readonly label = 'Text'

  content = new StringProp('Content', { default: 'Hello World' })
  fontSize = new NumberProp('Font Size', { default: 24, min: 6, max: 200 })
  fontFamily = new EnumProp('Font Family', {
    default: 'sans-serif',
    options: ['sans-serif', 'serif', 'monospace', 'cursive'],
  })

  generate(): DrawItem[] {
    return [{
      shape: {
        type: 'text',
        content: this.content.value,
        fontSize: this.fontSize.value,
        fontFamily: this.fontFamily.value,
      },
      transform: identityTransform(),
      style: { opacity: 1 },
    }]
  }
}
