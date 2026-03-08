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
        padding: '5px 12px',
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
        <span style={{ color: '#3a3a3a', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>
          {historyStore.canUndo() ? '⌘Z · ' : ''}{historyStore.canRedo() ? '⌘⇧Z' : ''}
        </span>
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
