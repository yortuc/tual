import { RampSignal } from '../components/signals/RampSignal'
import { WaveSignal } from '../components/signals/WaveSignal'
import { FillComponent } from '../components/styles/FillComponent'
import { OpacityComponent } from '../components/styles/OpacityComponent'
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
