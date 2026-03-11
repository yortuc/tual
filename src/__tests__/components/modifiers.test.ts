import { describe, it, expect } from 'vitest'
import { StampComponent } from '../../components/modifiers/StampComponent'
import { ClonerComponent } from '../../components/modifiers/ClonerComponent'
import { World } from '../../ecs/World'
import { CircleComponent } from '../../components/shapes/CircleComponent'
import { FillComponent } from '../../components/styles/FillComponent'
import { RadialDistributor } from '../../components/distributors/RadialDistributor'
import { LinearDistributor } from '../../components/distributors/LinearDistributor'
import { GridDistributor } from '../../components/distributors/GridDistributor'
import { MirrorComponent } from '../../components/modifiers/MirrorComponent'
import { GradientMutator } from '../../components/modifiers/GradientMutator'
import { RampSignal } from '../../components/signals/RampSignal'
import { WaveSignal } from '../../components/signals/WaveSignal'
import { NoiseSignal } from '../../components/signals/NoiseSignal'
import { OpacityComponent } from '../../components/styles/OpacityComponent'
import { PipelineStage } from '../../ecs/Component'
import type { DrawItem } from '../../renderer/DrawItem'

function makeItem(x = 0, y = 0): DrawItem {
  return {
    shape: { type: 'rect', width: 50, height: 50 },
    transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
    style: { opacity: 1 },
    channels: {},
  }
}

function makeState(items: DrawItem[], channels: Record<string, number> = {}) {
  return { items, channels }
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

describe('RampSignal', () => {
  it('is in Modifier stage', () => {
    expect(new RampSignal().stage).toBe(PipelineStage.Modifier)
  })

  it('writes linear ramp to item channels', () => {
    const sig = new RampSignal()
    sig.output.value = 'fade'
    sig.start.value = 0
    sig.end.value = 1
    const { items } = sig.processState!(makeState([makeItem(), makeItem(), makeItem()]))
    expect(items[0].channels['fade']).toBeCloseTo(0)
    expect(items[1].channels['fade']).toBeCloseTo(0.5)
    expect(items[2].channels['fade']).toBeCloseTo(1)
  })

  it('EaseIn curve starts slow', () => {
    const sig = new RampSignal()
    sig.curve.value = 'EaseIn'
    sig.start.value = 0
    sig.end.value = 1
    const { items } = sig.processState!(makeState([makeItem(), makeItem(), makeItem()]))
    // EaseIn: t² — midpoint should be 0.25, not 0.5
    expect(items[1].channels['ramp']).toBeCloseTo(0.25)
  })

  it('EaseOut curve ends slow', () => {
    const sig = new RampSignal()
    sig.curve.value = 'EaseOut'
    sig.start.value = 0
    sig.end.value = 1
    const { items } = sig.processState!(makeState([makeItem(), makeItem(), makeItem()]))
    // EaseOut: 1-(1-t)² — midpoint should be 0.75
    expect(items[1].channels['ramp']).toBeCloseTo(0.75)
  })

  it('Sine curve peaks in the middle', () => {
    const sig = new RampSignal()
    sig.curve.value = 'Sine'
    sig.start.value = 0
    sig.end.value = 1
    const { items } = sig.processState!(makeState([makeItem(), makeItem(), makeItem()]))
    expect(items[0].channels['ramp']).toBeCloseTo(0)       // sin(0) = 0
    expect(items[1].channels['ramp']).toBeCloseTo(1)       // sin(π/2) = 1
    expect(items[2].channels['ramp']).toBeCloseTo(0)       // sin(π) ≈ 0
  })

  it('Step curve splits at threshold', () => {
    const sig = new RampSignal()
    sig.curve.value = 'Step'
    sig.step.value = 0.5
    sig.start.value = 0
    sig.end.value = 1
    const items = Array.from({ length: 4 }, () => makeItem())
    const { items: out } = sig.processState!(makeState(items))
    expect(out[0].channels['ramp']).toBe(0)  // t=0.00 < 0.5
    expect(out[1].channels['ramp']).toBe(0)  // t=0.33 < 0.5
    expect(out[2].channels['ramp']).toBe(1)  // t=0.67 ≥ 0.5
    expect(out[3].channels['ramp']).toBe(1)  // t=1.00 ≥ 0.5
  })

  it('respects custom start/end range', () => {
    const sig = new RampSignal()
    sig.start.value = 2
    sig.end.value = 4
    const { items } = sig.processState!(makeState([makeItem(), makeItem()]))
    expect(items[0].channels['ramp']).toBeCloseTo(2)
    expect(items[1].channels['ramp']).toBeCloseTo(4)
  })

  it('works end-to-end with OpacityComponent', () => {
    const sig = new RampSignal()
    sig.output.value = 'fade'
    sig.start.value = 1
    sig.end.value = 0
    const op = new OpacityComponent()
    op.opacity.channel = 'fade'
    const state1 = sig.processState!(makeState([makeItem(), makeItem(), makeItem()]))
    const state2 = op.processState!(state1)
    expect(state2.items[0].style.opacity).toBeCloseTo(1)
    expect(state2.items[2].style.opacity).toBeCloseTo(0)
  })
})

describe('WaveSignal', () => {
  it('is in Modifier stage', () => {
    expect(new WaveSignal().stage).toBe(PipelineStage.Modifier)
  })

  it('produces a sine wave across items', () => {
    const sig = new WaveSignal()
    sig.output.value = 'w'
    sig.frequency.value = 1
    sig.amplitude.value = 1
    sig.offset.value = 0
    sig.phase.value = 0
    const { items } = sig.processState!(makeState([makeItem(), makeItem(), makeItem()]))
    // t=0: sin(0)=0, t=0.5: sin(π)≈0, t=1: sin(2π)≈0 — endpoints near 0
    expect(items[0].channels['w']).toBeCloseTo(0)
    expect(items[2].channels['w']).toBeCloseTo(0)
  })

  it('phase shifts the wave', () => {
    const sig = new WaveSignal()
    sig.output.value = 'w'
    sig.frequency.value = 1
    sig.amplitude.value = 1
    sig.offset.value = 0
    sig.phase.value = 0.25  // 90° shift
    const { items } = sig.processState!(makeState([makeItem()]))
    // sin(π/2) = 1
    expect(items[0].channels['w']).toBeCloseTo(1)
  })

  it('offset shifts all values up', () => {
    const sig = new WaveSignal()
    sig.amplitude.value = 1
    sig.offset.value = 5
    sig.phase.value = 0
    const { items } = sig.processState!(makeState([makeItem()]))
    expect(items[0].channels['wave']).toBeCloseTo(5)  // sin(0)=0 + offset=5
  })
})

describe('NoiseSignal', () => {
  it('is in Modifier stage', () => {
    expect(new NoiseSignal().stage).toBe(PipelineStage.Modifier)
  })

  it('produces values within min/max range', () => {
    const sig = new NoiseSignal()
    sig.min.value = 0.2
    sig.max.value = 0.8
    const items = Array.from({ length: 20 }, () => makeItem())
    const { items: out } = sig.processState!(makeState(items))
    for (const item of out) {
      expect(item.channels['noise']).toBeGreaterThanOrEqual(0.2)
      expect(item.channels['noise']).toBeLessThanOrEqual(0.8)
    }
  })

  it('same seed produces same values', () => {
    const sig = new NoiseSignal()
    sig.seed.value = 7
    const items = Array.from({ length: 5 }, () => makeItem())
    const run1 = sig.processState!(makeState(items)).items.map(i => i.channels['noise'])
    const run2 = sig.processState!(makeState(items)).items.map(i => i.channels['noise'])
    expect(run1).toEqual(run2)
  })

  it('different seeds produce different values', () => {
    const items = Array.from({ length: 5 }, () => makeItem())
    const sig1 = new NoiseSignal(); sig1.seed.value = 1
    const sig2 = new NoiseSignal(); sig2.seed.value = 2
    const out1 = sig1.processState!(makeState(items)).items.map(i => i.channels['noise'])
    const out2 = sig2.processState!(makeState(items)).items.map(i => i.channels['noise'])
    expect(out1).not.toEqual(out2)
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

describe('StampComponent', () => {
  it('is in Modifier stage', () => {
    expect(new StampComponent().stage).toBe(PipelineStage.Modifier)
  })

  it('collapses N items into a single stamp atom', () => {
    const stamp = new StampComponent()
    const result = stamp.process!([makeItem(10, 0), makeItem(20, 0), makeItem(30, 0)])
    expect(result).toHaveLength(1)
    expect(result[0].shape.type).toBe('stamp')
    expect(result[0].children).toHaveLength(3)
  })

  it('returns empty array when given no items', () => {
    expect(new StampComponent().process!([])).toHaveLength(0)
  })

  it('stamp + cloner produces N stamp atoms', () => {
    const stamp = new StampComponent()
    const cloner = new ClonerComponent()
    cloner.count.value = 4
    const stamped = stamp.process!([makeItem(5, 0), makeItem(-5, 0)])
    const cloned  = cloner.process!(stamped)
    expect(cloned).toHaveLength(4)
    cloned.forEach(item => {
      expect(item.shape.type).toBe('stamp')
      expect(item.children).toHaveLength(2)
    })
  })

  it('expandStamps composes parent translate onto children', () => {
    // Circle × 2 (linear, spacing 20) → Stamp → Cloner(3) → Linear(spacing 60)
    // Expect 6 leaf circles; each group of 2 is offset by 60 from the next.
    const w = new World()
    const id = w.createEntity()
    const circle = new CircleComponent(); circle.radius.value = 5
    const innerCloner = new ClonerComponent(); innerCloner.count.value = 2
    const innerDist = new LinearDistributor(); innerDist.spacingX.value = 20; innerDist.spacingY.value = 0
    const stampComp = new StampComponent()
    const outerCloner = new ClonerComponent(); outerCloner.count.value = 3
    const outerDist = new LinearDistributor(); outerDist.spacingX.value = 60; outerDist.spacingY.value = 0
    const fill = new FillComponent(); fill.setColor('#ff0000')
    for (const c of [circle, innerCloner, innerDist, stampComp, outerCloner, outerDist, fill])
      w.addComponent(id, c)
    const items = w.runPipeline(id)
    // 3 stamp groups × 2 children = 6 leaf items, all circles, no stamp atoms
    expect(items).toHaveLength(6)
    items.forEach(item => expect(item.shape.type).toBe('circle'))
    // Within each group the two circles are 20 apart; groups are 60 apart
    const xs = items.map(i => i.transform.x).sort((a, b) => a - b)
    expect(xs[2] - xs[0]).toBeCloseTo(60, 1)
  })
})
