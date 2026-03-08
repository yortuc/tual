import { eventBus } from './EventBus'
import type { Command } from './Command'

const MAX_HISTORY = 100

class HistoryStore {
  private undoStack: Command[] = []
  private redoStack: Command[] = []

  execute(command: Command): void {
    command.execute()
    this.undoStack.push(command)
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift()
    this.redoStack = []
    eventBus.emit('history:changed')
  }

  undo(): void {
    const command = this.undoStack.pop()
    if (!command) return
    command.undo()
    this.redoStack.push(command)
    eventBus.emit('history:changed')
  }

  redo(): void {
    const command = this.redoStack.pop()
    if (!command) return
    command.execute()
    this.undoStack.push(command)
    eventBus.emit('history:changed')
  }

  /** Push a command that has already been applied — no execute() call. */
  record(command: Command): void {
    this.undoStack.push(command)
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift()
    this.redoStack = []
    eventBus.emit('history:changed')
  }

  getHistory(): Command[] { return [...this.undoStack] }
  canUndo(): boolean { return this.undoStack.length > 0 }
  canRedo(): boolean { return this.redoStack.length > 0 }
}

export const historyStore = new HistoryStore()
