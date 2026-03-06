import { Prop } from '../props/Prop'
import type { DrawItem } from '../renderer/DrawItem'

export enum PipelineStage {
  Shape = 0,
  Modifier = 1,
  Style = 2,
  Effect = 3,
}

export abstract class Component {
  abstract readonly stage: PipelineStage
  abstract readonly label: string

  // Shape components produce initial DrawItems
  generate?(): DrawItem[]

  // All other components transform the DrawItem array
  process?(items: DrawItem[]): DrawItem[]

  getProps(): Array<[string, Prop<unknown>]> {
    return Object.entries(this).filter(
      ([, v]) => v instanceof Prop
    ) as Array<[string, Prop<unknown>]>
  }
}
