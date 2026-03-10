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

// RampSignal outputs hue (0→360) + FillComponent reads it
export function createColorGradientBundle(): Component[] {
  const ramp = new RampSignal()
  ramp.output.value = 'hue'
  ramp.start.value = 0
  ramp.end.value = 360

  const fill = new FillComponent()
  fill.hue.channel = 'hue'

  return tag([ramp, fill], makeGroupId(), 'Color Gradient')
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
