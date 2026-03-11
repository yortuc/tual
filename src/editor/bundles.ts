import { RampSignal } from '../components/signals/RampSignal'
import { WaveSignal } from '../components/signals/WaveSignal'
import { FillComponent } from '../components/styles/FillComponent'
import { OpacityComponent } from '../components/styles/OpacityComponent'
import { TransformComponent } from '../components/styles/TransformComponent'
import { ClonerComponent } from '../components/modifiers/ClonerComponent'
import { CircleComponent } from '../components/shapes/CircleComponent'
import { PhyllotaxisDistributor } from '../components/distributors/PhyllotaxisDistributor'
import { SpiralDistributor } from '../components/distributors/SpiralDistributor'
import type { Component } from '../ecs/Component'

function makeGroupId(): string {
  return Math.random().toString(36).slice(2)
}

function tag(components: Component[], id: string, label: string): Component[] {
  for (const c of components) {
    c.groupId = id
    c.groupLabel = label
  }
  return components
}

// 3 RampSignals (hue, saturation, lightness) + FillComponent, pre-wired
// Default: blue (HSL 217, 91, 60) → pink (HSL 330, 81, 60)
export function createColorGradientBundle(): Component[] {
  const rampH = new RampSignal()
  rampH.output.value = 'grad-h'
  rampH.start.value  = 217
  rampH.end.value    = 330

  const rampS = new RampSignal()
  rampS.output.value = 'grad-s'
  rampS.start.value  = 91
  rampS.end.value    = 81

  const rampL = new RampSignal()
  rampL.output.value = 'grad-l'
  rampL.start.value  = 60
  rampL.end.value    = 60

  const fill = new FillComponent()
  fill.hue.channel        = 'grad-h'
  fill.saturation.channel = 'grad-s'
  fill.lightness.channel  = 'grad-l'

  return tag([rampH, rampS, rampL, fill], makeGroupId(), 'Color Gradient')
}

// RampSignal outputs fade (1→0) + OpacityComponent reads it
export function createOpacityFadeBundle(): Component[] {
  const ramp = new RampSignal()
  ramp.output.value = 'fade'
  ramp.start.value = 1
  ramp.end.value = 0

  const opacity = new OpacityComponent()
  opacity.opacity.channel = 'fade'

  return tag([ramp, opacity], makeGroupId(), 'Opacity Fade')
}

// Sunflower: Cloner(89) + Phyllotaxis + Color Gradient (HSL ramps)
// 89 is a Fibonacci number — gives the cleanest sunflower spiral count
export function createSunflowerBundle(): Component[] {
  const cloner = new ClonerComponent()
  cloner.count.value = 89

  const dist = new PhyllotaxisDistributor()
  dist.spread.value = 22

  const rampH = new RampSignal()
  rampH.output.value = 'sf-h'
  rampH.start.value  = 40
  rampH.end.value    = 200

  const rampS = new RampSignal()
  rampS.output.value = 'sf-s'
  rampS.start.value  = 90
  rampS.end.value    = 60

  const rampL = new RampSignal()
  rampL.output.value = 'sf-l'
  rampL.start.value  = 55
  rampL.end.value    = 40

  const fill = new FillComponent()
  fill.hue.channel        = 'sf-h'
  fill.saturation.channel = 'sf-s'
  fill.lightness.channel  = 'sf-l'

  return tag([cloner, dist, rampH, rampS, rampL, fill], makeGroupId(), 'Sunflower')
}

// Galaxy Arm: Cloner(60) + Spiral + scale fade + opacity fade + color wave
export function createGalaxyBundle(): Component[] {
  const cloner = new ClonerComponent()
  cloner.count.value = 60

  const dist = new SpiralDistributor()
  dist.angleStep.value  = 25
  dist.radiusStep.value = 10

  const rampScale = new RampSignal()
  rampScale.output.value = 'gx-scale'
  rampScale.start.value  = 1.4
  rampScale.end.value    = 0.2

  const rampOpacity = new RampSignal()
  rampOpacity.output.value = 'gx-fade'
  rampOpacity.start.value  = 1
  rampOpacity.end.value    = 0.1

  const rampH = new RampSignal()
  rampH.output.value = 'gx-h'
  rampH.start.value  = 200
  rampH.end.value    = 280

  const fill = new FillComponent()
  fill.hue.channel        = 'gx-h'
  fill.saturation.value   = 80
  fill.lightness.value    = 65

  const opacity = new OpacityComponent()
  opacity.opacity.channel = 'gx-fade'

  const transform = new TransformComponent()
  transform.scale.channel  = 'gx-scale'
  transform.position.value = { x: 0, y: 0 }   // zero offset — entity's own Transform handles position

  return tag([cloner, dist, rampScale, rampOpacity, rampH, fill, opacity, transform], makeGroupId(), 'Galaxy Arm')
}

// Scale Fade: RampSignal drives scale 1→0.1 per clone via Transform
export function createScaleFadeBundle(): Component[] {
  const ramp = new RampSignal()
  ramp.output.value = 'scale-fade'
  ramp.start.value  = 1.5
  ramp.end.value    = 0.15

  const transform = new TransformComponent()
  transform.scale.channel  = 'scale-fade'
  transform.position.value = { x: 0, y: 0 }   // zero offset — entity's own Transform handles position

  return tag([ramp, transform], makeGroupId(), 'Scale Fade')
}

// Breathing Rings: concentric circles at origin, scale ramp expands outward,
// color sweeps teal→violet, opacity fades so outer rings are ghostly.
export function createBreathingRingsBundle(): Component[] {
  const circle = new CircleComponent()
  circle.radius.value = 20

  const cloner = new ClonerComponent()
  cloner.count.value = 14

  // No distributor — all items stack at origin, differentiated only by scale
  const rampScale = new RampSignal()
  rampScale.output.value = 'br-scale'
  rampScale.start.value  = 0.15
  rampScale.end.value    = 1.8

  const rampH = new RampSignal()
  rampH.output.value = 'br-h'
  rampH.start.value  = 180
  rampH.end.value    = 300

  const rampFade = new RampSignal()
  rampFade.output.value = 'br-fade'
  rampFade.start.value  = 0.9
  rampFade.end.value    = 0.1

  const fill = new FillComponent()
  fill.hue.channel        = 'br-h'
  fill.saturation.value   = 75
  fill.lightness.value    = 60

  const opacity = new OpacityComponent()
  opacity.opacity.channel = 'br-fade'

  const transform = new TransformComponent()
  transform.scale.channel  = 'br-scale'
  transform.position.value = { x: 0, y: 0 }

  return tag([circle, cloner, rampScale, rampH, rampFade, fill, opacity, transform], makeGroupId(), 'Breathing Rings')
}

// WaveSignal outputs hue (offset=180, amplitude=180) + FillComponent reads it
export function createColorWaveBundle(): Component[] {
  const wave = new WaveSignal()
  wave.output.value = 'hue'
  wave.amplitude.value = 180
  wave.offset.value = 180

  const fill = new FillComponent()
  fill.hue.channel = 'hue'

  return tag([wave, fill], makeGroupId(), 'Color Wave')
}
