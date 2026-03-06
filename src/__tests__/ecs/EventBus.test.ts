import { describe, it, expect, vi } from 'vitest'
import { eventBus } from '../../ecs/EventBus'

describe('EventBus', () => {
  it('calls listener when event is emitted', () => {
    const fn = vi.fn()
    const unsub = eventBus.on('test:event', fn)
    eventBus.emit('test:event', 42)
    expect(fn).toHaveBeenCalledWith(42)
    unsub()
  })

  it('does not call listener after unsubscribe', () => {
    const fn = vi.fn()
    const unsub = eventBus.on('test:unsub', fn)
    unsub()
    eventBus.emit('test:unsub')
    expect(fn).not.toHaveBeenCalled()
  })

  it('calls multiple listeners for the same event', () => {
    const a = vi.fn()
    const b = vi.fn()
    const u1 = eventBus.on('test:multi', a)
    const u2 = eventBus.on('test:multi', b)
    eventBus.emit('test:multi', 'payload')
    expect(a).toHaveBeenCalledWith('payload')
    expect(b).toHaveBeenCalledWith('payload')
    u1(); u2()
  })

  it('does not call listeners registered for a different event', () => {
    const fn = vi.fn()
    const unsub = eventBus.on('test:other', fn)
    eventBus.emit('test:nope')
    expect(fn).not.toHaveBeenCalled()
    unsub()
  })

  it('passes multiple arguments to listener', () => {
    const fn = vi.fn()
    const unsub = eventBus.on('test:args', fn)
    eventBus.emit('test:args', 1, 'two', true)
    expect(fn).toHaveBeenCalledWith(1, 'two', true)
    unsub()
  })
})
