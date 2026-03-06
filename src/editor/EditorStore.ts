import { eventBus } from '../ecs/EventBus'

class EditorStore {
  selectedEntityId: number | null = null

  select(id: number | null): void {
    this.selectedEntityId = id
    eventBus.emit('editor:selection-changed', id)
  }
}

export const editorStore = new EditorStore()
