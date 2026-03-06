import { describe, it, expect } from 'vitest'
import { ClonerComponent } from '../../components/modifiers/ClonerComponent'
import { MirrorComponent } from '../../components/modifiers/MirrorComponent'
import { PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'

function makeItem(x = 0, y = 0): DrawItem {
  return {
    shape: { type: 'rect', width: 50, height: 50 },
    transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
    style: { opacity: 1 },
  }
}

describe('ClonerComponent', () => {
  it('is in Modifier stage', () => {
    expect(new ClonerComponent().stage).toBe(PipelineStage.Modifier)
  })

  describe('radial mode', () => {
    it('produces count × input items', () => {
      const cloner = new ClonerComponent()
      cloner.count.value = 6
      cloner.mode.value = 'radial'
      const result = cloner.process!([makeItem()])
      expect(result).toHaveLength(6)
    })

    it('distributes items evenly around a circle', () => {
      const cloner = new ClonerComponent()
      cloner.count.value = 4
      cloner.radius.value = 100
      cloner.mode.value = 'radial'
      const result = cloner.process!([makeItem()])
      // 4 items at 0°, 90°, 180°, 270°
      expect(result[0].transform.x).toBeCloseTo(100)
      expect(result[0].transform.y).toBeCloseTo(0)
      expect(result[1].transform.x).toBeCloseTo(0)
      expect(result[1].transform.y).toBeCloseTo(100)
      expect(result[2].transform.x).toBeCloseTo(-100)
      expect(result[2].transform.y).toBeCloseTo(0)
    })

    it('each clone has a rotation offset matching its angle', () => {
      const cloner = new ClonerComponent()
      cloner.count.value = 4
      cloner.mode.value = 'radial'
      const result = cloner.process!([makeItem()])
      expect(result[1].transform.rotation).toBeCloseTo(Math.PI / 2)
    })

    it('multiplies multiple input items', () => {
      const cloner = new ClonerComponent()
      cloner.count.value = 3
      cloner.mode.value = 'radial'
      const result = cloner.process!([makeItem(), makeItem()])
      expect(result).toHaveLength(6) // 3 clones × 2 input items
    })
  })

  describe('linear mode', () => {
    it('spaces items along both axes', () => {
      const cloner = new ClonerComponent()
      cloner.count.value = 3
      cloner.mode.value = 'linear'
      cloner.spacingX.value = 50
      cloner.spacingY.value = 0
      const result = cloner.process!([makeItem()])
      expect(result[0].transform.x).toBe(0)
      expect(result[1].transform.x).toBe(50)
      expect(result[2].transform.x).toBe(100)
    })
  })

  describe('grid mode', () => {
    it('arranges items in rows and columns', () => {
      const cloner = new ClonerComponent()
      cloner.count.value = 6
      cloner.mode.value = 'grid'
      cloner.columns.value = 3
      cloner.spacingX.value = 60
      cloner.spacingY.value = 60
      const result = cloner.process!([makeItem()])
      // Row 0: items 0,1,2  Row 1: items 3,4,5
      expect(result[0].transform).toMatchObject({ x: 0, y: 0 })
      expect(result[1].transform).toMatchObject({ x: 60, y: 0 })
      expect(result[3].transform).toMatchObject({ x: 0, y: 60 })
      expect(result[5].transform).toMatchObject({ x: 120, y: 60 })
    })
  })
})

describe('MirrorComponent', () => {
  it('is in Modifier stage', () => {
    expect(new MirrorComponent().stage).toBe(PipelineStage.Modifier)
  })

  it('mirrors on X axis — negates x, flips scaleX', () => {
    const mirror = new MirrorComponent()
    mirror.axis.value = 'X'
    mirror.keepOriginal.value = false
    const [result] = mirror.process!([makeItem(100, 50)])
    expect(result.transform.x).toBe(-100)
    expect(result.transform.scaleX).toBe(-1)
    expect(result.transform.y).toBe(50) // y unchanged
  })

  it('mirrors on Y axis — negates y, flips scaleY', () => {
    const mirror = new MirrorComponent()
    mirror.axis.value = 'Y'
    mirror.keepOriginal.value = false
    const [result] = mirror.process!([makeItem(100, 50)])
    expect(result.transform.y).toBe(-50)
    expect(result.transform.scaleY).toBe(-1)
    expect(result.transform.x).toBe(100) // x unchanged
  })

  it('keepOriginal=true doubles the item count', () => {
    const mirror = new MirrorComponent()
    mirror.axis.value = 'X'
    mirror.keepOriginal.value = true
    const result = mirror.process!([makeItem()])
    expect(result).toHaveLength(2)
  })

  it('keepOriginal=false keeps only mirrored items', () => {
    const mirror = new MirrorComponent()
    mirror.axis.value = 'X'
    mirror.keepOriginal.value = false
    const result = mirror.process!([makeItem()])
    expect(result).toHaveLength(1)
  })

  it('Both axis produces two mirrored items per input', () => {
    const mirror = new MirrorComponent()
    mirror.axis.value = 'Both'
    mirror.keepOriginal.value = false
    const result = mirror.process!([makeItem()])
    expect(result).toHaveLength(2)
  })
})
