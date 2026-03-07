import type { SerializedScene } from './Serializer'

export interface Preset {
  name: string
  description: string
  scene: SerializedScene
}

export const PRESETS: Preset[] = [
  {
    name: 'Starburst',
    description: '24 golden spikes radiating from center with glow',
    scene: {
      version: 1,
      entities: [
        {
          name: 'Spikes',
          components: [
            { type: 'RectComponent',      props: { width: 4, height: 150 } },
            { type: 'ClonerComponent',    props: { count: 24, mode: 'radial', radius: 0, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#fbbf24' } },
            { type: 'ShadowComponent',    props: { color: '#fbbf24', offsetX: 0, offsetY: 0, blur: 18 } },
            { type: 'OpacityComponent',   props: { opacity: 0.9 } },
          ],
        },
        {
          name: 'Core',
          components: [
            { type: 'CircleComponent',    props: { radius: 38 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#fbbf24' } },
            { type: 'ShadowComponent',    props: { color: '#fbbf24', offsetX: 0, offsetY: 0, blur: 50 } },
          ],
        },
      ],
    },
  },

  {
    name: 'Neon Bloom',
    description: 'Three-layer radial flower with colored neon glow',
    scene: {
      version: 1,
      entities: [
        {
          name: 'Outer Petals',
          components: [
            { type: 'CircleComponent',    props: { radius: 20 } },
            { type: 'ClonerComponent',    props: { count: 8, mode: 'radial', radius: 120, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#f472b6' } },
            { type: 'ShadowComponent',    props: { color: '#f472b6', offsetX: 0, offsetY: 0, blur: 24 } },
          ],
        },
        {
          name: 'Inner Ring',
          components: [
            { type: 'CircleComponent',    props: { radius: 12 } },
            { type: 'ClonerComponent',    props: { count: 16, mode: 'radial', radius: 65, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#fb923c' } },
            { type: 'ShadowComponent',    props: { color: '#fb923c', offsetX: 0, offsetY: 0, blur: 14 } },
          ],
        },
        {
          name: 'Core',
          components: [
            { type: 'CircleComponent',    props: { radius: 22 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#fbbf24' } },
            { type: 'ShadowComponent',    props: { color: '#fbbf24', offsetX: 0, offsetY: 0, blur: 40 } },
          ],
        },
      ],
    },
  },

  {
    name: 'Atomic',
    description: 'Nucleus with two electron orbital rings',
    scene: {
      version: 1,
      entities: [
        {
          name: 'Outer Electrons',
          components: [
            { type: 'CircleComponent',    props: { radius: 7 } },
            { type: 'ClonerComponent',    props: { count: 12, mode: 'radial', radius: 210, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#60a5fa' } },
            { type: 'ShadowComponent',    props: { color: '#60a5fa', offsetX: 0, offsetY: 0, blur: 18 } },
          ],
        },
        {
          name: 'Inner Electrons',
          components: [
            { type: 'CircleComponent',    props: { radius: 9 } },
            { type: 'ClonerComponent',    props: { count: 8, mode: 'radial', radius: 120, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#34d399' } },
            { type: 'ShadowComponent',    props: { color: '#34d399', offsetX: 0, offsetY: 0, blur: 18 } },
          ],
        },
        {
          name: 'Nucleus',
          components: [
            { type: 'CircleComponent',    props: { radius: 36 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#fbbf24' } },
            { type: 'ShadowComponent',    props: { color: '#fbbf24', offsetX: 0, offsetY: 0, blur: 50 } },
          ],
        },
      ],
    },
  },

  {
    name: 'Floating Tiles',
    description: 'Grid of squares with depth shadow',
    scene: {
      version: 1,
      entities: [
        {
          name: 'Tiles',
          components: [
            { type: 'RectComponent',      props: { width: 52, height: 52 } },
            { type: 'ClonerComponent',    props: { count: 35, mode: 'grid', radius: 150, spacingX: 78, spacingY: 78, columns: 7 } },
            { type: 'TransformComponent', props: { position: { x: 88, y: 66 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#3b82f6' } },
            { type: 'ShadowComponent',    props: { color: '#000000', offsetX: 5, offsetY: 9, blur: 22 } },
            { type: 'OpacityComponent',   props: { opacity: 0.88 } },
          ],
        },
      ],
    },
  },

  {
    name: 'Spirograph',
    description: 'Two nested radial cloners — rings of rings',
    scene: {
      version: 1,
      entities: [
        {
          name: 'Outer Ring',
          components: [
            { type: 'CircleComponent',    props: { radius: 11 } },
            { type: 'ClonerComponent',    props: { count: 6, mode: 'radial', radius: 72, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'ClonerComponent',    props: { count: 8, mode: 'radial', radius: 190, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#a78bfa' } },
            { type: 'ShadowComponent',    props: { color: '#a78bfa', offsetX: 0, offsetY: 0, blur: 16 } },
          ],
        },
        {
          name: 'Inner Ring',
          components: [
            { type: 'CircleComponent',    props: { radius: 5 } },
            { type: 'ClonerComponent',    props: { count: 10, mode: 'radial', radius: 40, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'ClonerComponent',    props: { count: 12, mode: 'radial', radius: 270, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#f472b6' } },
            { type: 'ShadowComponent',    props: { color: '#f472b6', offsetX: 0, offsetY: 0, blur: 10 } },
          ],
        },
      ],
    },
  },

  {
    name: 'DNA Wave',
    description: 'Two interleaved diagonal chains crossing in the center',
    scene: {
      version: 1,
      entities: [
        {
          name: 'Strand A',
          components: [
            { type: 'CircleComponent',    props: { radius: 12 } },
            { type: 'ClonerComponent',    props: { count: 12, mode: 'linear', radius: 150, spacingX: 58, spacingY: 22, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 100, y: 180 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#f472b6' } },
            { type: 'ShadowComponent',    props: { color: '#f472b6', offsetX: 0, offsetY: 0, blur: 14 } },
          ],
        },
        {
          name: 'Strand B',
          components: [
            { type: 'CircleComponent',    props: { radius: 12 } },
            { type: 'ClonerComponent',    props: { count: 12, mode: 'linear', radius: 150, spacingX: 58, spacingY: -22, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 100, y: 420 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#38bdf8' } },
            { type: 'ShadowComponent',    props: { color: '#38bdf8', offsetX: 0, offsetY: 0, blur: 14 } },
          ],
        },
      ],
    },
  },

  {
    name: 'Crystal',
    description: 'Two layers of radial spikes offset by 15°, ice-blue glow',
    scene: {
      version: 1,
      entities: [
        {
          name: 'Long Rays',
          components: [
            { type: 'RectComponent',      props: { width: 3, height: 210 } },
            { type: 'ClonerComponent',    props: { count: 12, mode: 'radial', radius: 0, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#e0f2fe' } },
            { type: 'ShadowComponent',    props: { color: '#e0f2fe', offsetX: 0, offsetY: 0, blur: 18 } },
            { type: 'OpacityComponent',   props: { opacity: 0.7 } },
          ],
        },
        {
          name: 'Short Rays',
          components: [
            { type: 'RectComponent',      props: { width: 3, height: 110 } },
            { type: 'ClonerComponent',    props: { count: 12, mode: 'radial', radius: 0, spacingX: 80, spacingY: 80, columns: 4 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 15, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#7dd3fc' } },
            { type: 'ShadowComponent',    props: { color: '#7dd3fc', offsetX: 0, offsetY: 0, blur: 12 } },
          ],
        },
        {
          name: 'Core',
          components: [
            { type: 'CircleComponent',    props: { radius: 18 } },
            { type: 'TransformComponent', props: { position: { x: 450, y: 300 }, rotation: 0, scale: { x: 1, y: 1 } } },
            { type: 'FillComponent',      props: { color: '#ffffff' } },
            { type: 'ShadowComponent',    props: { color: '#bae6fd', offsetX: 0, offsetY: 0, blur: 40 } },
          ],
        },
      ],
    },
  },
]
