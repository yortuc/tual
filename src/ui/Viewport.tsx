import React, { useRef, useEffect, useCallback } from 'react'
import { Renderer } from '../renderer/Renderer'
import { world } from '../ecs/World'
import { eventBus } from '../ecs/EventBus'
import { editorStore } from '../editor/EditorStore'

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)

  const draw = useCallback(() => {
    const renderer = rendererRef.current
    if (!renderer) return
    renderer.clear()
    const allItems = world.getEntityIds().flatMap(id => world.runPipeline(id))
    renderer.render(allItems)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    rendererRef.current = new Renderer(canvas)

    const handleResize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      rendererRef.current?.resize(parent.clientWidth, parent.clientHeight)
      draw()
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(canvas.parentElement!)
    handleResize()

    const unsub = eventBus.on('world:changed', draw)
    return () => {
      ro.disconnect()
      unsub()
    }
  }, [draw])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    // Hit test — last entity wins (top of visual stack)
    let hit: number | null = null
    for (const id of world.getEntityIds()) {
      for (const item of world.runPipeline(id)) {
        const { x, y } = item.transform
        const s = item.shape
        if (s.type === 'rect') {
          if (Math.abs(mx - x) < s.width / 2 && Math.abs(my - y) < s.height / 2) hit = id
        } else if (s.type === 'circle') {
          if (Math.hypot(mx - x, my - y) < s.radius) hit = id
        } else if (s.type === 'text') {
          if (Math.abs(mx - x) < 80 && Math.abs(my - y) < s.fontSize) hit = id
        }
      }
    }

    editorStore.select(hit)
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ display: 'block', cursor: 'default' }}
    />
  )
}
