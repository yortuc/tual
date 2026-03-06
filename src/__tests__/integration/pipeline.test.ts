import { describe, it, expect, beforeEach } from 'vitest'
import { World } from '../../ecs/World'
import { RectComponent } from '../../components/shapes/RectComponent'
import { CircleComponent } from '../../components/shapes/CircleComponent'
import { TransformComponent } from '../../components/styles/TransformComponent'
import { FillComponent } from '../../components/styles/FillComponent'
import { StrokeComponent } from '../../components/styles/StrokeComponent'
import { ShadowComponent } from '../../components/styles/ShadowComponent'
import { OpacityComponent } from '../../components/styles/OpacityComponent'
import { ClonerComponent } from '../../components/modifiers/ClonerComponent'
import { MirrorComponent } from '../../components/modifiers/MirrorComponent'

describe('Pipeline integration', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  it('basic rect with transform and fill renders at correct position with fill', () => {
    const id = world.createEntity('Rect')
    world.addComponent(id, new RectComponent())

    const t = new TransformComponent()
    t.position.value = { x: 400, y: 300 }
    world.addComponent(id, t)

    const fill = new FillComponent()
    fill.color.value = '#ff0000'
    world.addComponent(id, fill)

    const [item] = world.runPipeline(id)
    expect(item.shape.type).toBe('rect')
    expect(item.transform.x).toBe(400)
    expect(item.transform.y).toBe(300)
    expect(item.style.fill).toBe('#ff0000')
  })

  it('cloner + transform: clones are positioned relative to entity origin, then entity is moved', () => {
    const id = world.createEntity()
    world.addComponent(id, new CircleComponent())

    const cloner = new ClonerComponent()
    cloner.count.value = 4
    cloner.mode.value = 'radial'
    cloner.radius.value = 100
    world.addComponent(id, cloner)

    const t = new TransformComponent()
    t.position.value = { x: 200, y: 200 }
    world.addComponent(id, t)

    const items = world.runPipeline(id)
    expect(items).toHaveLength(4)

    // First clone is at angle 0: (100, 0) + entity (200, 200) = (300, 200)
    expect(items[0].transform.x).toBeCloseTo(300)
    expect(items[0].transform.y).toBeCloseTo(200)
  })

  it('chained modifiers: cloner then mirror doubles the clone count', () => {
    const id = world.createEntity()
    world.addComponent(id, new RectComponent())

    const cloner = new ClonerComponent()
    cloner.count.value = 6
    cloner.mode.value = 'radial'
    world.addComponent(id, cloner)

    const mirror = new MirrorComponent()
    mirror.axis.value = 'X'
    mirror.keepOriginal.value = true
    world.addComponent(id, mirror)

    world.addComponent(id, new TransformComponent())

    const items = world.runPipeline(id)
    // 6 clones → mirror X with keepOriginal → 12 items
    expect(items).toHaveLength(12)
  })

  it('style components apply to every item in the pipeline', () => {
    const id = world.createEntity()
    world.addComponent(id, new RectComponent())

    const cloner = new ClonerComponent()
    cloner.count.value = 5
    world.addComponent(id, cloner)

    const fill = new FillComponent()
    fill.color.value = '#0000ff'
    world.addComponent(id, fill)

    const op = new OpacityComponent()
    op.opacity.value = 0.7
    world.addComponent(id, op)

    const items = world.runPipeline(id)
    expect(items).toHaveLength(5)
    items.forEach(item => {
      expect(item.style.fill).toBe('#0000ff')
      expect(item.style.opacity).toBe(0.7)
    })
  })

  it('full stack: rect + cloner + mirror + transform + fill + stroke + shadow + opacity', () => {
    const id = world.createEntity('Full Stack')

    const rect = new RectComponent()
    rect.width.value = 60
    rect.height.value = 60
    world.addComponent(id, rect)

    const cloner = new ClonerComponent()
    cloner.count.value = 3
    cloner.mode.value = 'linear'
    cloner.spacingX.value = 80
    cloner.spacingY.value = 0
    world.addComponent(id, cloner)

    const mirror = new MirrorComponent()
    mirror.axis.value = 'Y'
    mirror.keepOriginal.value = true
    world.addComponent(id, mirror)

    const t = new TransformComponent()
    t.position.value = { x: 500, y: 400 }
    world.addComponent(id, t)

    const fill = new FillComponent()
    fill.color.value = '#e74c3c'
    world.addComponent(id, fill)

    const stroke = new StrokeComponent()
    stroke.color.value = '#fff'
    stroke.width.value = 2
    world.addComponent(id, stroke)

    const shadow = new ShadowComponent()
    shadow.blur.value = 10
    world.addComponent(id, shadow)

    const op = new OpacityComponent()
    op.opacity.value = 0.9
    world.addComponent(id, op)

    const items = world.runPipeline(id)

    // 3 clones → mirror Y keepOriginal → 6 items
    expect(items).toHaveLength(6)

    items.forEach(item => {
      expect(item.style.fill).toBe('#e74c3c')
      expect(item.style.stroke?.color).toBe('#fff')
      expect(item.style.stroke?.width).toBe(2)
      expect(item.style.shadow?.blur).toBe(10)
      expect(item.style.opacity).toBe(0.9)
      // All items have entity position added
      expect(item.transform.x).toBeGreaterThanOrEqual(500)
      expect(item.transform.y).toBeDefined()
    })

    // Shape geometry preserved
    items.forEach(item => {
      if (item.shape.type === 'rect') {
        expect(item.shape.width).toBe(60)
        expect(item.shape.height).toBe(60)
      }
    })
  })

  it('entity with no shape component but modifiers and styles produces no output', () => {
    const id = world.createEntity()
    world.addComponent(id, new FillComponent())
    world.addComponent(id, new ClonerComponent())
    world.addComponent(id, new TransformComponent())
    expect(world.runPipeline(id)).toHaveLength(0)
  })

  it('pipeline is non-destructive: running twice returns same result', () => {
    const id = world.createEntity()
    world.addComponent(id, new RectComponent())
    world.addComponent(id, new FillComponent())
    const first = world.runPipeline(id)
    const second = world.runPipeline(id)
    expect(first).toEqual(second)
  })
})
