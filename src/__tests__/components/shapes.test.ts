import { describe, it, expect } from 'vitest'
import { RectComponent } from '../../components/shapes/RectComponent'
import { CircleComponent } from '../../components/shapes/CircleComponent'
import { TextComponent } from '../../components/shapes/TextComponent'
import { PipelineStage } from '../../ecs/Component'

describe('RectComponent', () => {
  it('is in Shape stage', () => {
    expect(new RectComponent().stage).toBe(PipelineStage.Shape)
  })

  it('generates a single rect DrawItem at origin', () => {
    const rect = new RectComponent()
    const items = rect.generate!()
    expect(items).toHaveLength(1)
    expect(items[0].shape.type).toBe('rect')
    expect(items[0].transform.x).toBe(0)
    expect(items[0].transform.y).toBe(0)
  })

  it('generates rect with correct dimensions from props', () => {
    const rect = new RectComponent()
    rect.width.value = 200
    rect.height.value = 80
    const [item] = rect.generate!()
    if (item.shape.type !== 'rect') throw new Error('expected rect')
    expect(item.shape.width).toBe(200)
    expect(item.shape.height).toBe(80)
  })

  it('generates with identity transform', () => {
    const [item] = new RectComponent().generate!()
    expect(item.transform).toMatchObject({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 })
  })
})

describe('CircleComponent', () => {
  it('is in Shape stage', () => {
    expect(new CircleComponent().stage).toBe(PipelineStage.Shape)
  })

  it('generates a single circle DrawItem', () => {
    const [item] = new CircleComponent().generate!()
    expect(item.shape.type).toBe('circle')
  })

  it('reflects radius prop value', () => {
    const circle = new CircleComponent()
    circle.radius.value = 75
    const [item] = circle.generate!()
    if (item.shape.type !== 'circle') throw new Error('expected circle')
    expect(item.shape.radius).toBe(75)
  })
})

describe('TextComponent', () => {
  it('is in Shape stage', () => {
    expect(new TextComponent().stage).toBe(PipelineStage.Shape)
  })

  it('generates a text DrawItem with correct content', () => {
    const text = new TextComponent()
    text.content.value = 'Hello'
    text.fontSize.value = 32
    const [item] = text.generate!()
    if (item.shape.type !== 'text') throw new Error('expected text')
    expect(item.shape.content).toBe('Hello')
    expect(item.shape.fontSize).toBe(32)
  })
})
