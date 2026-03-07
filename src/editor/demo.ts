import { world } from '../ecs/World'
import { CircleComponent } from '../components/shapes/CircleComponent'
import { RectComponent } from '../components/shapes/RectComponent'
import { TransformComponent } from '../components/styles/TransformComponent'
import { FillComponent } from '../components/styles/FillComponent'
import { ShadowComponent } from '../components/styles/ShadowComponent'
import { RadialClonerComponent } from '../components/modifiers/RadialClonerComponent'

export function initDemo(): void {
  // Entity 1: radially cloned circles
  const e1 = world.createEntity('Radial Circles')
  world.addComponent(e1, new CircleComponent())

  const cloner = new RadialClonerComponent()
  cloner.count.value = 8
  cloner.radius.value = 160
  world.addComponent(e1, cloner)

  const t1 = new TransformComponent()
  t1.position.value = { x: 450, y: 320 }
  world.addComponent(e1, t1)

  const f1 = new FillComponent()
  f1.color.value = '#4a90d9'
  world.addComponent(e1, f1)

  const s1 = new ShadowComponent()
  s1.blur.value = 16
  s1.offsetY.value = 6
  world.addComponent(e1, s1)

  // Entity 2: simple rect
  const e2 = world.createEntity('Rect')
  world.addComponent(e2, new RectComponent())

  const t2 = new TransformComponent()
  t2.position.value = { x: 130, y: 200 }
  world.addComponent(e2, t2)

  const f2 = new FillComponent()
  f2.color.value = '#e74c3c'
  world.addComponent(e2, f2)
}
