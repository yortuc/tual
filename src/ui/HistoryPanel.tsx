import { useState, useEffect, useRef } from 'react'
import { historyStore } from '../ecs/HistoryStore'
import { eventBus } from '../ecs/EventBus'
import type { Command } from '../ecs/Command'

export function HistoryPanel() {
  const [history, setHistory] = useState<Command[]>(() => historyStore.getHistory())
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return eventBus.on('history:changed', () => setHistory(historyStore.getHistory()))
  }, [])

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [history])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #2a2a2a', height: 180, flexShrink: 0 }}>
      <div style={{
        padding: '5px 8px 5px 12px',
        borderBottom: '1px solid #2a2a2a',
        fontSize: 10,
        color: '#555',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        History
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => historyStore.undo()}
            disabled={!historyStore.canUndo()}
            title="Undo (⌘Z)"
            style={{
              background: 'none', border: '1px solid #333', borderRadius: 3,
              color: historyStore.canUndo() ? '#aaa' : '#3a3a3a',
              cursor: historyStore.canUndo() ? 'pointer' : 'default',
              fontSize: 13, width: 26, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >↩</button>
          <button
            onClick={() => historyStore.redo()}
            disabled={!historyStore.canRedo()}
            title="Redo (⌘⇧Z)"
            style={{
              background: 'none', border: '1px solid #333', borderRadius: 3,
              color: historyStore.canRedo() ? '#aaa' : '#3a3a3a',
              cursor: historyStore.canRedo() ? 'pointer' : 'default',
              fontSize: 13, width: 26, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >↪</button>
        </div>
      </div>
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
        {history.length === 0 && (
          <div style={{ padding: '10px 12px', color: '#3a3a3a', fontSize: 11 }}>No actions yet.</div>
        )}
        {history.map((cmd, i) => (
          <div
            key={i}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              color: i === history.length - 1 ? '#ccc' : '#555',
              background: i === history.length - 1 ? '#1e2a1e' : 'transparent',
              borderLeft: i === history.length - 1 ? '2px solid #34d399' : '2px solid transparent',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {cmd.label}
          </div>
        ))}
      </div>
    </div>
  )
}
