# tual

A procedural / parametric graphics editor built on an Entity-Component-System (ECS) architecture. Built for engineers and technically-minded people who enjoy thinking in algorithms — a creative tool where every visual is a _description_ of how to produce it, not just what it looks like.

![tual screenshot](docs/tual_2.png)

## How it works

Each shape in the scene is an **entity**. Its appearance is defined by **components** stacked in a pipeline. Add a Circle, clone it 89 times, distribute the clones in a phyllotaxis spiral, drive the color with a ramp signal — the result is a sunflower. Change one number and the whole structure updates.

### Pipeline

Components run in the order they are added. The conventional order is:

```
Shape → Modifier → Distributor → Signal → Style
```

- **Shape** — generates the initial `DrawItem`s (rect, circle, text)
- **Modifier** — multiplies or transforms the item array (Cloner, Mirror, Gradient)
- **Distributor** — positions each clone in space (Radial, Linear, Grid, Phyllotaxis, Spiral, Rose, Lissajous)
- **Signal** — writes per-clone channel values that Style components can read (Ramp, Wave, Noise)
- **Style** — applies visual properties to every item, optionally driven by channels (Fill, Stroke, Opacity, Shadow, Transform)

A single Fill component with its hue bound to a Ramp channel colors every clone differently. A TransformComponent with its scale bound to a Ramp channel makes each clone grow or shrink along the distribution.

### Channel system

Signals write named values into each item's `channels` map. Style props can be bound to a channel name — when they resolve, they read from the item's channel first and fall back to the literal prop value. This is what makes per-clone animation possible without any special-casing: the same Fill component either uses a static color or reads a per-item hue, depending on whether a channel is bound.

### Bundles

Pre-wired groups of components that produce a specific effect in one click. Every bundle member shares a `groupId` so they move, reorder, and delete atomically in the Inspector.

| Bundle | What it does |
|--------|-------------|
| Sunflower | Circle × 89, Phyllotaxis, HSL color ramp — the classic golden-angle pattern |
| Galaxy Arm | Circle × 60, Spiral, blue→violet hue ramp, opacity + scale fade |
| Breathing Rings | Cloner × 14, concentric scale ramp (0.15→1.8), teal→violet color, opacity fade |
| Color Gradient | 3 Ramp signals (H/S/L) + Fill — blue→pink sweep across any cloner |
| Color Wave | Wave signal driving hue — oscillating rainbow across clones |
| Opacity Fade | Ramp signal driving opacity 1→0 |
| Scale Fade | Ramp signal driving uniform scale 1.5→0.15 |

### Gizmos

Components can render an animated canvas overlay (`renderGizmo`). Line-based gizmos (Spiral, Rose, Lissajous, Linear) use marching-ants dash animation to convey direction. Dot-based gizmos (Phyllotaxis, Radial, Grid) are static. Gizmos are drawn in screen space after the main render so they stay constant size at any zoom level. Drag handles let you edit props directly on the canvas — resize a rect by dragging its corner, adjust a radial cloner's radius by dragging the ring.

### Scene

Global properties (background color, glow effect) live in a `SceneStore` separate from the entity pipeline, keeping the pipeline pure.

## Components

### Shapes
| Component | Props |
|-----------|-------|
| Rectangle | width, height |
| Circle | radius |
| Text | content, font size |

### Modifiers
| Component | Props |
|-----------|-------|
| Cloner | count |
| Mirror | axis (X/Y), keep original |
| Gradient | scale start/end, opacity start/end |

### Distributors
| Component | Props |
|-----------|-------|
| Radial | count, radius |
| Linear | spacing X/Y |
| Grid | columns, spacing X/Y |
| Phyllotaxis | spread — golden-angle spiral (nature's packing algorithm) |
| Spiral | angle step, radius step — Archimedean spiral |
| Rose | petals (k), radius — rose curve r = cos(k·θ) |
| Lissajous | freq X/Y, phase shift, radius X/Y — parametric Lissajous figure |

### Signals
| Component | Output |
|-----------|--------|
| Ramp | linear / eased ramp from start to end across N items |
| Wave | sine wave with amplitude and phase offset |
| Noise | per-item random value in a min–max range |

### Styles
| Component | Props |
|-----------|-------|
| Fill | color (H/S/L, each bindable to a channel) |
| Stroke | color, width |
| Opacity | opacity (channel-bindable) |
| Shadow | blur, offset X/Y, color |
| Transform | position X/Y, rotation, scale (channel-bindable) |

### Scene
| Component | Props |
|-----------|-------|
| Background | color |
| Glow | strength, radius — WebGL bloom post-process |

## Stack

- **TypeScript** — strict, no `any`
- **React** — UI shell (inspector, scene tree, top bar) — not involved in rendering
- **WebGL** — main scene renderer with bloom post-processing
- **Canvas 2D** — gizmos, selection outlines, text rendering
- **Vite** + **Vitest** — build and unit/integration tests

## Development

```bash
npm install
npm run dev      # dev server
npm test         # run tests
npm run build    # production build
```
