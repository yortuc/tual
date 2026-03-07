import { SceneTree } from './ui/SceneTree'
import { Inspector } from './ui/Inspector'
import { Viewport } from './ui/Viewport'
import { TopBar } from './ui/TopBar'

export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: '#111',
      color: '#ddd',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <TopBar />
      {/* Panels row */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* Left: Scene Tree */}
      <div style={{
        width: 210,
        flexShrink: 0,
        borderRight: '1px solid #2a2a2a',
        background: '#181818',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '7px 12px',
          borderBottom: '1px solid #2a2a2a',
          fontSize: 10,
          color: '#555',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 600,
        }}>
          Scene
        </div>
        <SceneTree />
      </div>

      {/* Center: Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Viewport />
      </div>

      {/* Right: Inspector */}
      <div style={{
        width: 270,
        flexShrink: 0,
        borderLeft: '1px solid #2a2a2a',
        background: '#181818',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '7px 12px',
          borderBottom: '1px solid #2a2a2a',
          fontSize: 10,
          color: '#555',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 600,
        }}>
          Inspector
        </div>
        <Inspector />
      </div>

      </div> {/* end panels row */}
    </div>
  )
}
