import { describe, it, expect, beforeEach, vi } from 'vitest'
import { World } from '../../ecs/World'
import { eventBus } from '../../ecs/EventBus'
import { RectComponent } from '../../components/shapes/RectComponent'
import { CircleComponent } from '../../components/shapes/CircleComponent'
import { FillComponent } from '../../components/styles/FillComponent'
import { TransformComponent } from '../../components/styles/TransformComponent'
import { ClonerComponent } from '../../components/modifiers/ClonerComponent'

describe('World', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  describe('entity lifecycle', () => {
    it('creates entity with unique incrementing IDs', () => {
      const a = world.createEntity()
      const b = world.createEntity()
      expect(a).not.toBe(b)
      expect(world.getEntityIds()).toContain(a)
      expect(world.getEntityIds()).toContain(b)
    })

    it('assigns a default name to entity', () => {
      const id = world.createEntity()
      expect(world.getEntityName(id)).toBeTruthy()
    })

    it('assigns a custom name to entity', () => {
      const id = world.createEntity('My Rect')
      expect(world.getEntityName(id)).toBe('My Rect')
    })

    it('removes entity on delete', () => {
      const id = world.createEntity()
      world.deleteEntity(id)
      expect(world.getEntityIds()).not.toContain(id)
    })

    it('emits world:changed on createEntity', () => {
      const fn = vi.fn()
      const unsub = eventBus.on('world:changed', fn)
      world.createEntity()
      expect(fn).toHaveBeenCalled()
      unsub()
    })
  })

  describe('component management', () => {
    it('adds and retrieves components', () => {
      const id = world.createEntity()
      const rect = new RectComponent()
      world.addComponent(id, rect)
      expect(world.getComponents(id)).toContain(rect)
    })

    it('removes a component', () => {
      const id = world.createEntity()
      const rect = new RectComponent()
      world.addComponent(id, rect)
      world.removeComponent(id, rect)
      expect(world.getComponents(id)).not.toContain(rect)
    })

    it('can add multiple components of any type to same entity', () => {
      const id = world.createEntity()
      const rect = new RectComponent()
      const circle = new CircleComponent()
      world.addComponent(id, rect)
      world.addComponent(id, circle)
      const comps = world.getComponents(id)
      expect(comps).toContain(rect)
      expect(comps).toContain(circle)
    })

    it('emits world:changed on addComponent', () => {
      const id = world.createEntity()
      const fn = vi.fn()
      const unsub = eventBus.on('world:changed', fn)
      world.addComponent(id, new RectComponent())
      expect(fn).toHaveBeenCalled()
      unsub()
    })

    it('returns empty array for unknown entity', () => {
      expect(world.getComponents(9999)).toEqual([])
    })
  })

  describe('pipeline execution', () => {
    it('returns empty array for entity with no components', () => {
      const id = world.createEntity()
      expect(world.runPipeline(id)).toEqual([])
    })

    it('returns empty array for entity with only style components and no shape', () => {
      const id = world.createEntity()
      world.addComponent(id, new FillComponent())
      expect(world.runPipeline(id)).toEqual([])
    })

    it('runs shape stage and produces DrawItems', () => {
      const id = world.createEntity()
      world.addComponent(id, new RectComponent())
      const items = world.runPipeline(id)
      expect(items).toHaveLength(1)
      expect(items[0].shape.type).toBe('rect')
    })

    it('processes style stage after shape stage', () => {
      const id = world.createEntity()
      const fill = new FillComponent()
      fill.color.value = '#ff0000'
      world.addComponent(id, new RectComponent())
      world.addComponent(id, fill)
      const items = world.runPipeline(id)
      expect(items[0].style.fill).toBe('#ff0000')
    })

    it('processes modifier stage between shape and style', () => {
      const id = world.createEntity()
      const cloner = new ClonerComponent()
      cloner.count.value = 4
      world.addComponent(id, new RectComponent())
      world.addComponent(id, cloner)
      world.addComponent(id, new FillComponent())
      const items = world.runPipeline(id)
      // 4 clones, each annotated with fill
      expect(items).toHaveLength(4)
      items.forEach(item => expect(item.style.fill).toBeDefined())
    })

    it('multiple shape components produce multiple base items', () => {
      const id = world.createEntity()
      world.addComponent(id, new RectComponent())
      world.addComponent(id, new CircleComponent())
      const items = world.runPipeline(id)
      expect(items).toHaveLength(2)
      const types = items.map(i => i.shape.type)
      expect(types).toContain('rect')
      expect(types).toContain('circle')
    })

    it('applies transform position to all items', () => {
      const id = world.createEntity()
      const t = new TransformComponent()
      t.position.value = { x: 100, y: 200 }
      world.addComponent(id, new RectComponent())
      world.addComponent(id, t)
      const items = world.runPipeline(id)
      expect(items[0].transform.x).toBe(100)
      expect(items[0].transform.y).toBe(200)
    })
  })
})
