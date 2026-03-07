import { Component, PipelineStage, GIZMO_PALETTE } from './Component'
import type { DrawItem } from '../renderer/DrawItem'
import { eventBus } from './EventBus'

export class World {
  private entities = new Map<number, Component[]>()
  private entityNames = new Map<number, string>()
  private nextId = 1
  private colorIndex = 0

  createEntity(name?: string): number {
    const id = this.nextId++
    this.entities.set(id, [])
    this.entityNames.set(id, name ?? `Entity ${id}`)
    eventBus.emit('world:changed')
    return id
  }

  deleteEntity(id: number): void {
    this.entities.delete(id)
    this.entityNames.delete(id)
    eventBus.emit('world:changed')
  }

  clear(): void {
    this.entities.clear()
    this.entityNames.clear()
    this.nextId = 1
    this.colorIndex = 0
    eventBus.emit('world:changed')
  }

  getEntityIds(): number[] {
    return Array.from(this.entities.keys())
  }

  getEntityName(id: number): string {
    return this.entityNames.get(id) ?? `Entity ${id}`
  }

  setEntityName(id: number, name: string): void {
    this.entityNames.set(id, name)
    eventBus.emit('world:changed')
  }

  addComponent(entityId: number, component: Component): void {
    component.gizmoColor = GIZMO_PALETTE[this.colorIndex % GIZMO_PALETTE.length]
    this.colorIndex++
    this.entities.get(entityId)?.push(component)
    eventBus.emit('world:changed')
  }

  removeComponent(entityId: number, component: Component): void {
    const components = this.entities.get(entityId)
    if (!components) return
    const idx = components.indexOf(component)
    if (idx !== -1) components.splice(idx, 1)
    eventBus.emit('world:changed')
  }

  getComponents(entityId: number): Component[] {
    return this.entities.get(entityId) ?? []
  }

  reorderComponent(entityId: number, fromIndex: number, toIndex: number): void {
    const components = this.entities.get(entityId)
    if (!components) return
    const [comp] = components.splice(fromIndex, 1)
    components.splice(toIndex, 0, comp)
    eventBus.emit('world:changed')
  }

  runPipeline(entityId: number): DrawItem[] {
    const components = this.entities.get(entityId) ?? []
    let items: DrawItem[] = []

    // Run in user-defined order — no stage sorting
    for (const comp of components) {
      if (comp.stage === PipelineStage.Shape && comp.generate) {
        items = [...items, ...comp.generate()]
      } else if (comp.process) {
        items = comp.process(items)
      }
    }

    return items
  }
}

export const world = new World()
