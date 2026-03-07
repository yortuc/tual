import React, { useState } from 'react'
import { world } from '../ecs/World'
import { saveToLocalStorage, loadFromLocalStorage } from '../editor/Serializer'
import { PresetsModal } from './PresetsModal'

const btn: React.CSSProperties = {
  fontSize: 12,
  padding: '3px 12px',
  background: '#2a2a2a',
  border: '1px solid #3a3a3a',
  color: '#bbb',
  borderRadius: 3,
  cursor: 'pointer',
}

export function TopBar() {
  const [showPresets, setShowPresets] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  const notify = (msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(null), 1800)
  }

  const handleSave = () => {
    saveToLocalStorage(world)
    notify('Saved')
  }

  const handleLoad = () => {
    const ok = loadFromLocalStorage(world)
    notify(ok ? 'Loaded' : 'Nothing saved yet')
  }

  const handleNew = () => {
    world.clear()
  }

  return (
    <>
      <div style={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        borderBottom: '1px solid #2a2a2a',
        background: '#141414',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#ddd', letterSpacing: '0.3px' }}>
          CES Designer
        </span>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {flash && (
            <span style={{ fontSize: 11, color: '#4a90d9', marginRight: 4 }}>{flash}</span>
          )}
          <button style={btn} onClick={handleNew}>New</button>
          <button
            style={{ ...btn, color: '#a78bfa', borderColor: '#4a3a7a' }}
            onClick={() => setShowPresets(true)}
          >
            Presets
          </button>
          <button style={btn} onClick={handleSave}>Save</button>
          <button style={btn} onClick={handleLoad}>Load</button>
        </div>
      </div>

      {showPresets && <PresetsModal onClose={() => setShowPresets(false)} />}
    </>
  )
}
