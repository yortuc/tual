import type { Component } from '../ecs/Component'
import { RectComponent } from '../components/shapes/RectComponent'
import { CircleComponent } from '../components/shapes/CircleComponent'
import { TextComponent } from '../components/shapes/TextComponent'
import { TransformComponent } from '../components/styles/TransformComponent'
import { FillComponent } from '../components/styles/FillComponent'
import { StrokeComponent } from '../components/styles/StrokeComponent'
import { ShadowComponent } from '../components/styles/ShadowComponent'
import { OpacityComponent } from '../components/styles/OpacityComponent'
import { ClonerComponent } from '../components/modifiers/ClonerComponent'
import { MirrorComponent } from '../components/modifiers/MirrorComponent'

export const COMPONENT_REGISTRY: Record<string, () => Component> = {
  RectComponent:      () => new RectComponent(),
  CircleComponent:    () => new CircleComponent(),
  TextComponent:      () => new TextComponent(),
  TransformComponent: () => new TransformComponent(),
  FillComponent:      () => new FillComponent(),
  StrokeComponent:    () => new StrokeComponent(),
  ShadowComponent:    () => new ShadowComponent(),
  OpacityComponent:   () => new OpacityComponent(),
  ClonerComponent:    () => new ClonerComponent(),
  MirrorComponent:    () => new MirrorComponent(),
}
