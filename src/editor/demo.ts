import { world } from '../ecs/World'
import { sceneStore } from '../editor/SceneStore'
import { GlowComponent } from '../components/scene/GlowComponent'
import { CircleComponent } from '../components/shapes/CircleComponent'
import { RectComponent } from '../components/shapes/RectComponent'
import { TransformComponent } from '../components/styles/TransformComponent'
import { FillComponent } from '../components/styles/FillComponent'
import { StrokeComponent } from '../components/styles/StrokeComponent'
import { OpacityComponent } from '../components/styles/OpacityComponent'
import { ShadowComponent } from '../components/styles/ShadowComponent'
import { ClonerComponent } from '../components/modifiers/ClonerComponent'
import { RadialDistributor } from '../components/distributors/RadialDistributor'

const CENTER = { x: 450, y: 340 }

export function initDemo(): void {
  sceneStore.addComponent(new GlowComponent())

  // --- Outer ring: thin elongated rects, 30 clones, purple ---
  const outer = world.createEntity('Outer Ring')

  const outerRect = new RectComponent()
  outerRect.width.value = 6
  outerRect.height.value = 80
  world.addComponent(outer, outerRect)

  const outerCloner = new ClonerComponent()
  outerCloner.count.value = 30
  world.addComponent(outer, outerCloner)

  const outerDist = new RadialDistributor()
  outerDist.radius.value = 200
  world.addComponent(outer, outerDist)

  const outerTransform = new TransformComponent()
  outerTransform.position.value = { ...CENTER }
  world.addComponent(outer, outerTransform)

  const outerFill = new FillComponent()
  outerFill.color.value = '#a78bfa'
  world.addComponent(outer, outerFill)

  const outerOpacity = new OpacityComponent()
  outerOpacity.opacity.value = 0.65
  world.addComponent(outer, outerOpacity)

  // --- Middle ring: small squares, 16 clones, pink + white stroke ---
  const middle = world.createEntity('Middle Ring')

  const middleRect = new RectComponent()
  middleRect.width.value = 14
  middleRect.height.value = 14
  world.addComponent(middle, middleRect)

  const middleCloner = new ClonerComponent()
  middleCloner.count.value = 16
  world.addComponent(middle, middleCloner)

  const middleDist = new RadialDistributor()
  middleDist.radius.value = 115
  world.addComponent(middle, middleDist)

  const middleTransform = new TransformComponent()
  middleTransform.position.value = { ...CENTER }
  world.addComponent(middle, middleTransform)

  const middleFill = new FillComponent()
  middleFill.color.value = '#f472b6'
  world.addComponent(middle, middleFill)

  const middleStroke = new StrokeComponent()
  middleStroke.color.value = '#ffffff'
  middleStroke.width.value = 1
  world.addComponent(middle, middleStroke)

  const middleOpacity = new OpacityComponent()
  middleOpacity.opacity.value = 0.85
  world.addComponent(middle, middleOpacity)

  // --- Center jewel: circle, yellow, strong glow ---
  const center = world.createEntity('Center Jewel')

  const centerCircle = new CircleComponent()
  centerCircle.radius.value = 28
  world.addComponent(center, centerCircle)

  const centerTransform = new TransformComponent()
  centerTransform.position.value = { ...CENTER }
  world.addComponent(center, centerTransform)

  const centerFill = new FillComponent()
  centerFill.color.value = '#fbbf24'
  world.addComponent(center, centerFill)

  const centerShadow = new ShadowComponent()
  centerShadow.blur.value = 40
  centerShadow.color.value = '#fbbf24'
  world.addComponent(center, centerShadow)
}
