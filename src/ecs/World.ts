import { Component, PipelineStage, GIZMO_PALETTE, type PipelineState } from './Component'
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

  /** Inserts a component at a specific index without reassigning gizmoColor (used for undo). */
  restoreComponent(entityId: number, component: Component, index: number): void {
    const components = this.entities.get(entityId)
    if (!components) return
    components.splice(index, 0, component)
    eventBus.emit('world:changed')
  }

  reorderGroup(entityId: number, groupId: string, toIndex: number): void {
    const components = this.entities.get(entityId)
    if (!components) return
    const groupIndices = components
      .map((c, i) => ({ c, i })).filter(({ c }) => c.groupId === groupId).map(({ i }) => i)
    if (groupIndices.length === 0) return
    const groupComps = groupIndices.map(i => components[i])
    for (let i = groupIndices.length - 1; i >= 0; i--) components.splice(groupIndices[i], 1)
    const removedBefore = groupIndices.filter(i => i < toIndex).length
    components.splice(Math.min(toIndex - removedBefore, components.length), 0, ...groupComps)
    eventBus.emit('world:changed')
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
    let state: PipelineState = { items: [], channels: {} }

    // Run in user-defined order — no stage sorting
    for (const comp of components) {
      if (comp.stage === PipelineStage.Shape && comp.generate) {
        const generated = comp.generate().map(item => ({ ...item, channels: {} }))
        state = { ...state, items: [...state.items, ...generated] }
      } else if (comp.processState) {
        state = comp.processState(state)
      } else if (comp.process) {
        state = { ...state, items: comp.process(state.items) }
      }
    }

    return state.items
  }
}

export const world = new World()
