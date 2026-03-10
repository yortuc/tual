import type { Component } from '../ecs/Component'
import { GlowComponent } from '../components/scene/GlowComponent'
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
import { GradientMutator } from '../components/modifiers/GradientMutator'
import { RampSignal } from '../components/signals/RampSignal'
import { WaveSignal } from '../components/signals/WaveSignal'
import { NoiseSignal } from '../components/signals/NoiseSignal'
import { RadialDistributor } from '../components/distributors/RadialDistributor'
import { LinearDistributor } from '../components/distributors/LinearDistributor'
import { GridDistributor } from '../components/distributors/GridDistributor'

export const COMPONENT_REGISTRY: Record<string, () => Component> = {
  GlowComponent:      () => new GlowComponent(),
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
  GradientMutator:    () => new GradientMutator(),
  RampSignal:         () => new RampSignal(),
  WaveSignal:         () => new WaveSignal(),
  NoiseSignal:        () => new NoiseSignal(),
  RadialDistributor:  () => new RadialDistributor(),
  LinearDistributor:  () => new LinearDistributor(),
  GridDistributor:    () => new GridDistributor(),
}
