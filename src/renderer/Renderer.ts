import type { DrawItem } from './DrawItem'

export class Renderer {
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
  }

  resize(width: number, height: number): void {
    this.ctx.canvas.width = width
    this.ctx.canvas.height = height
  }

  clear(bg = '#141414'): void {
    const { width, height } = this.ctx.canvas
    this.ctx.fillStyle = bg
    this.ctx.fillRect(0, 0, width, height)
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }

  renderSelectionOutlines(items: DrawItem[]): void {
    const ctx = this.ctx
    for (const item of items) {
      const { transform, shape } = item
      ctx.save()
      ctx.translate(transform.x, transform.y)
      ctx.rotate(transform.rotation)
      ctx.scale(transform.scaleX, transform.scaleY)
      ctx.strokeStyle = '#4a90d9'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      if (shape.type === 'rect') {
        ctx.rect(-shape.width / 2, -shape.height / 2, shape.width, shape.height)
      } else if (shape.type === 'circle') {
        ctx.arc(0, 0, shape.radius, 0, Math.PI * 2)
      } else if (shape.type === 'text') {
        ctx.font = `${shape.fontSize}px ${shape.fontFamily}`
        const w = ctx.measureText(shape.content).width
        ctx.rect(-w / 2, -shape.fontSize / 2, w, shape.fontSize)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }
  }

  render(items: DrawItem[], viewTransform?: { scale: number }): void {
    if (viewTransform) {
      this.ctx.save()
      this.ctx.scale(viewTransform.scale, viewTransform.scale)
    }
    for (const item of items) {
      if (item.shape.type === 'text') {
        this.renderText(item)
      } else {
        this.renderShape(item)
      }
    }
    if (viewTransform) {
      this.ctx.restore()
    }
  }

  private renderShape(item: DrawItem): void {
    const ctx = this.ctx
    const { transform, style, shape } = item

    ctx.save()
    ctx.globalAlpha = style.opacity ?? 1

    if (style.shadow) {
      ctx.shadowColor = style.shadow.color
      ctx.shadowOffsetX = style.shadow.x
      ctx.shadowOffsetY = style.shadow.y
      ctx.shadowBlur = style.shadow.blur
    }

    ctx.translate(transform.x, transform.y)
    ctx.rotate(transform.rotation)
    ctx.scale(transform.scaleX, transform.scaleY)

    ctx.beginPath()
    if (shape.type === 'rect') {
      ctx.rect(-shape.width / 2, -shape.height / 2, shape.width, shape.height)
    } else if (shape.type === 'circle') {
      ctx.arc(0, 0, shape.radius, 0, Math.PI * 2)
    }

    if (style.fill) {
      ctx.fillStyle = style.fill
      ctx.fill()
    }

    // Reset shadow before stroke to avoid double shadow
    ctx.shadowColor = 'transparent'

    if (style.stroke) {
      ctx.strokeStyle = style.stroke.color
      ctx.lineWidth = style.stroke.width
      ctx.stroke()
    }

    ctx.restore()
  }

  private renderText(item: DrawItem): void {
    if (item.shape.type !== 'text') return
    const ctx = this.ctx
    const { transform, style, shape } = item

    ctx.save()
    ctx.globalAlpha = style.opacity ?? 1

    if (style.shadow) {
      ctx.shadowColor = style.shadow.color
      ctx.shadowOffsetX = style.shadow.x
      ctx.shadowOffsetY = style.shadow.y
      ctx.shadowBlur = style.shadow.blur
    }

    ctx.translate(transform.x, transform.y)
    ctx.rotate(transform.rotation)
    ctx.scale(transform.scaleX, transform.scaleY)

    ctx.font = `${shape.fontSize}px ${shape.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (style.fill) {
      ctx.fillStyle = style.fill
      ctx.fillText(shape.content, 0, 0)
    }

    ctx.shadowColor = 'transparent'

    if (style.stroke) {
      ctx.strokeStyle = style.stroke.color
      ctx.lineWidth = style.stroke.width
      ctx.strokeText(shape.content, 0, 0)
    }

    ctx.restore()
  }
}
