import { eventBus } from './EventBus'
import { world } from './World'
import type { Component } from './Component'
import type { Prop } from '../props/Prop'

export interface Command {
  readonly label: string
  execute(): void
  undo(): void
}

// ---- Prop value change ----

export class SetPropCommand<T = unknown>  {
  constructor(
    private prop: Prop<T>,
    private prev: T,
    private next: T,
    readonly label: string,
    private sideEffect?: () => void,
  ) {}

  execute(): void { this.prop.value = this.next; this.sideEffect?.(); eventBus.emit('world:changed') }
  undo():    void { this.prop.value = this.prev; this.sideEffect?.(); eventBus.emit('world:changed') }
}

// ---- Multiple commands as one ----

export class CompoundCommand  {
  constructor(readonly label: string, private commands: Command[]) {}
  execute(): void { this.commands.forEach(c => c.execute()) }
  undo():    void { [...this.commands].reverse().forEach(c => c.undo()) }
}

// ---- Component lifecycle ----

export class AddComponentCommand  {
  readonly label: string
  constructor(private entityId: number, private component: Component) {
    this.label = `Add ${component.label}`
  }
  execute(): void { world.addComponent(this.entityId, this.component) }
  undo():    void { world.removeComponent(this.entityId, this.component) }
}

export class RemoveComponentCommand  {
  readonly label: string
  private index = -1
  private savedColor = ''

  constructor(private entityId: number, private component: Component) {
    this.label = `Remove ${component.label}`
  }

  execute(): void {
    this.index = world.getComponents(this.entityId).indexOf(this.component)
    this.savedColor = this.component.gizmoColor
    world.removeComponent(this.entityId, this.component)
  }

  undo(): void {
    this.component.gizmoColor = this.savedColor
    world.restoreComponent(this.entityId, this.component, this.index)
  }
}

export class RemoveGroupCommand {
  private savedMembers: { component: Component; index: number; gizmoColor: string }[] = []
  get label(): string { return `Remove ${this.savedMembers[0]?.component.groupLabel ?? 'Group'}` }

  constructor(private entityId: number, private groupId: string) {}

  execute(): void {
    const components = world.getComponents(this.entityId)
    this.savedMembers = components
      .map((c, i) => ({ component: c, index: i, gizmoColor: c.gizmoColor }))
      .filter(({ component }) => component.groupId === this.groupId)
    for (let i = this.savedMembers.length - 1; i >= 0; i--)
      world.removeComponent(this.entityId, this.savedMembers[i].component)
  }

  undo(): void {
    for (const { component, index, gizmoColor } of this.savedMembers) {
      component.gizmoColor = gizmoColor
      world.restoreComponent(this.entityId, component, index)
    }
  }
}

export class ReorderGroupCommand {
  readonly label = 'Reorder Group'
  private snapshot: Component[] = []

  constructor(private entityId: number, private groupId: string, private toIndex: number) {}

  execute(): void {
    this.snapshot = [...world.getComponents(this.entityId)]
    world.reorderGroup(this.entityId, this.groupId, this.toIndex)
  }

  undo(): void {
    const components = world.getComponents(this.entityId)
    components.length = 0
    components.push(...this.snapshot)
    eventBus.emit('world:changed')
  }
}

export class ReorderComponentCommand  {
  readonly label = 'Reorder Components'
  constructor(private entityId: number, private from: number, private to: number) {}
  execute(): void { world.reorderComponent(this.entityId, this.from, this.to) }
  undo():    void { world.reorderComponent(this.entityId, this.to, this.from) }
}
