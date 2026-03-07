import React, { useEffect, useRef } from 'react'
import { PRESETS, type Preset } from '../editor/presets'
import { loadScene, type SerializedScene } from '../editor/Serializer'
import { World } from '../ecs/World'
import { Renderer } from '../renderer/Renderer'
import { world } from '../ecs/World'

const THUMB_W = 200
const THUMB_H = 130
// Presets are designed for a ~900x600 canvas; scale down to fit thumbnail
const THUMB_SCALE = THUMB_W / 900

function PresetCard({ preset, onLoad }: { preset: Preset; onLoad: (scene: SerializedScene) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Render preset into a temporary world so it doesn't affect the main one
    const tempWorld = new World()
    loadScene(preset.scene, tempWorld)

    const renderer = new Renderer(canvas)
    renderer.resize(THUMB_W, THUMB_H)
    renderer.clear('#0d0d0d')

    const allItems = tempWorld.getEntityIds().flatMap(id => tempWorld.runPipeline(id))
    renderer.render(allItems, { scale: THUMB_SCALE })
  }, [preset])

  return (
    <div
      onClick={() => onLoad(preset.scene)}
      style={{
        cursor: 'pointer',
        border: '1px solid #2e2e2e',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#181818',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#a78bfa')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#2e2e2e')}
    >
      <canvas
        ref={canvasRef}
        width={THUMB_W}
        height={THUMB_H}
        style={{ display: 'block' }}
      />
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ddd', marginBottom: 3 }}>
          {preset.name}
        </div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>
          {preset.description}
        </div>
      </div>
    </div>
  )
}

export function PresetsModal({ onClose }: { onClose: () => void }) {
  const handleLoad = (scene: SerializedScene) => {
    loadScene(scene, world)
    onClose()
  }

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#161616',
        border: '1px solid #2e2e2e',
        borderRadius: 10,
        width: 720,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #2a2a2a',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ddd' }}>Presets</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
              Click a preset to load it — your current scene will be replaced
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, padding: '0 4px' }}
          >
            ×
          </button>
        </div>

        {/* Grid */}
        <div style={{
          overflowY: 'auto',
          padding: 16,
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${THUMB_W}px)`,
          gap: 12,
        }}>
          {PRESETS.map(preset => (
            <PresetCard key={preset.name} preset={preset} onLoad={handleLoad} />
          ))}
        </div>
      </div>
    </div>
  )
}
