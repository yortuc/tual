import { Component, PipelineStage } from './Component'
import type { DrawItem } from '../renderer/DrawItem'
import { eventBus } from './EventBus'

export class World {
  private entities = new Map<number, Component[]>()
  private entityNames = new Map<number, string>()
  private nextId = 1

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

  runPipeline(entityId: number): DrawItem[] {
    const components = this.entities.get(entityId) ?? []

    // Group by stage, preserving insertion order within each stage
    const byStage = new Map<PipelineStage, Component[]>()
    for (const comp of components) {
      if (!byStage.has(comp.stage)) byStage.set(comp.stage, [])
      byStage.get(comp.stage)!.push(comp)
    }

    const stages = [
      PipelineStage.Shape,
      PipelineStage.Modifier,
      PipelineStage.Style,
      PipelineStage.Effect,
    ]

    let items: DrawItem[] = []

    for (const stage of stages) {
      const stageComps = byStage.get(stage) ?? []
      for (const comp of stageComps) {
        if (stage === PipelineStage.Shape && comp.generate) {
          items = [...items, ...comp.generate()]
        } else if (comp.process) {
          items = comp.process(items)
        }
      }
    }

    return items
  }
}

export const world = new World()
