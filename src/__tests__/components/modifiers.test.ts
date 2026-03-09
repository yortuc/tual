import { describe, it, expect } from 'vitest'
import { ClonerComponent } from '../../components/modifiers/ClonerComponent'
import { RadialDistributor } from '../../components/distributors/RadialDistributor'
import { LinearDistributor } from '../../components/distributors/LinearDistributor'
import { GridDistributor } from '../../components/distributors/GridDistributor'
import { MirrorComponent } from '../../components/modifiers/MirrorComponent'
import { GradientMutator } from '../../components/modifiers/GradientMutator'
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

  it('produces count × input items', () => {
    const cloner = new ClonerComponent()
    cloner.count.value = 6
    expect(cloner.process!([makeItem()])).toHaveLength(6)
  })

  it('multiplies multiple input items', () => {
    const cloner = new ClonerComponent()
    cloner.count.value = 3
    expect(cloner.process!([makeItem(), makeItem()])).toHaveLength(6)
  })
})

describe('RadialDistributor', () => {
  it('is in Distributor stage', () => {
    expect(new RadialDistributor().stage).toBe(PipelineStage.Distributor)
  })

  it('distributes items evenly around a circle', () => {
    const dist = new RadialDistributor()
    dist.radius.value = 100
    const items = Array.from({ length: 4 }, () => makeItem())
    const result = dist.process!(items)
    expect(result[0].transform.x).toBeCloseTo(100)
    expect(result[0].transform.y).toBeCloseTo(0)
    expect(result[1].transform.x).toBeCloseTo(0)
    expect(result[1].transform.y).toBeCloseTo(100)
    expect(result[2].transform.x).toBeCloseTo(-100)
    expect(result[2].transform.y).toBeCloseTo(0)
  })

  it('each item has rotation offset matching its angle', () => {
    const dist = new RadialDistributor()
    dist.radius.value = 100
    const items = Array.from({ length: 4 }, () => makeItem())
    const result = dist.process!(items)
    expect(result[1].transform.rotation).toBeCloseTo(Math.PI / 2)
  })
})

describe('LinearDistributor', () => {
  it('is in Distributor stage', () => {
    expect(new LinearDistributor().stage).toBe(PipelineStage.Distributor)
  })

  it('spaces items along both axes', () => {
    const dist = new LinearDistributor()
    dist.spacingX.value = 50
    dist.spacingY.value = 0
    const items = Array.from({ length: 3 }, () => makeItem())
    const result = dist.process!(items)
    expect(result[0].transform.x).toBe(0)
    expect(result[1].transform.x).toBe(50)
    expect(result[2].transform.x).toBe(100)
  })
})

describe('GridDistributor', () => {
  it('is in Distributor stage', () => {
    expect(new GridDistributor().stage).toBe(PipelineStage.Distributor)
  })

  it('arranges items in rows and columns', () => {
    const dist = new GridDistributor()
    dist.columns.value = 3
    dist.spacingX.value = 60
    dist.spacingY.value = 60
    const items = Array.from({ length: 6 }, () => makeItem())
    const result = dist.process!(items)
    expect(result[0].transform).toMatchObject({ x: 0,   y: 0 })
    expect(result[1].transform).toMatchObject({ x: 60,  y: 0 })
    expect(result[3].transform).toMatchObject({ x: 0,   y: 60 })
    expect(result[5].transform).toMatchObject({ x: 120, y: 60 })
  })
})

describe('GradientMutator', () => {
  it('is in Modifier stage', () => {
    expect(new GradientMutator().stage).toBe(PipelineStage.Modifier)
  })

  it('applies scale gradient across items', () => {
    const g = new GradientMutator()
    g.scaleStart.value = 2
    g.scaleEnd.value = 1
    const items = [makeItem(), makeItem(), makeItem()]
    const result = g.process!(items)
    expect(result[0].transform.scaleX).toBeCloseTo(2)
    expect(result[1].transform.scaleX).toBeCloseTo(1.5)
    expect(result[2].transform.scaleX).toBeCloseTo(1)
  })

  it('applies opacity gradient across items', () => {
    const g = new GradientMutator()
    g.opacityStart.value = 1
    g.opacityEnd.value = 0
    const items = [makeItem(), makeItem(), makeItem()]
    const result = g.process!(items)
    expect(result[0].style.opacity).toBeCloseTo(1)
    expect(result[1].style.opacity).toBeCloseTo(0.5)
    expect(result[2].style.opacity).toBeCloseTo(0)
  })

  it('accumulates rotation step per item', () => {
    const g = new GradientMutator()
    g.rotationStep.value = 45
    const items = [makeItem(), makeItem(), makeItem()]
    const result = g.process!(items)
    expect(result[0].transform.rotation).toBeCloseTo(0)
    expect(result[1].transform.rotation).toBeCloseTo(Math.PI / 4)
    expect(result[2].transform.rotation).toBeCloseTo(Math.PI / 2)
  })

  it('handles single item without division by zero', () => {
    const g = new GradientMutator()
    g.scaleStart.value = 2
    g.scaleEnd.value = 0.5
    const result = g.process!([makeItem()])
    expect(result[0].transform.scaleX).toBeCloseTo(2)
  })

  it('returns empty array for empty input', () => {
    expect(new GradientMutator().process!([])).toHaveLength(0)
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
    expect(result.transform.y).toBe(50)
  })

  it('mirrors on Y axis — negates y, flips scaleY', () => {
    const mirror = new MirrorComponent()
    mirror.axis.value = 'Y'
    mirror.keepOriginal.value = false
    const [result] = mirror.process!([makeItem(100, 50)])
    expect(result.transform.y).toBe(-50)
    expect(result.transform.scaleY).toBe(-1)
    expect(result.transform.x).toBe(100)
  })

  it('keepOriginal=true doubles the item count', () => {
    const mirror = new MirrorComponent()
    mirror.axis.value = 'X'
    mirror.keepOriginal.value = true
    expect(mirror.process!([makeItem()])).toHaveLength(2)
  })

  it('keepOriginal=false keeps only mirrored items', () => {
    const mirror = new MirrorComponent()
    mirror.axis.value = 'X'
    mirror.keepOriginal.value = false
    expect(mirror.process!([makeItem()])).toHaveLength(1)
  })

  it('Both axis produces two mirrored items per input', () => {
    const mirror = new MirrorComponent()
    mirror.axis.value = 'Both'
    mirror.keepOriginal.value = false
    expect(mirror.process!([makeItem()])).toHaveLength(2)
  })
})
