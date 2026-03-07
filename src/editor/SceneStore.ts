import { Component, GIZMO_PALETTE } from '../ecs/Component'
import { BackgroundComponent } from '../components/scene/BackgroundComponent'
import { eventBus } from '../ecs/EventBus'

class SceneStore {
  private components: Component[] = []
  private colorIndex = 0

  constructor() {
    this.addComponent(new BackgroundComponent())
  }

  addComponent(component: Component): void {
    component.gizmoColor = GIZMO_PALETTE[this.colorIndex % GIZMO_PALETTE.length]
    this.colorIndex++
    this.components.push(component)
    eventBus.emit('world:changed')
  }

  removeComponent(component: Component): void {
    const idx = this.components.indexOf(component)
    if (idx !== -1) this.components.splice(idx, 1)
    eventBus.emit('world:changed')
  }

  getComponents(): Component[] {
    return this.components
  }

  getBackground(): string {
    const bg = this.components.find(c => c instanceof BackgroundComponent) as BackgroundComponent | undefined
    return bg?.color.value ?? '#141414'
  }
}

export const sceneStore = new SceneStore()
