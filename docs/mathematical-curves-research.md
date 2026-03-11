# Mathematical Curves & Patterns for CES Designer
## Research Document: Distributors and Shape Components

**Date:** 2026-03-11
**Purpose:** Candidate mathematical curves for new Distributor and Shape components in CES Designer, targeting engineers and technically-minded users.

---

## Contents

1. [Spirograph / Hypotrochoid / Epitrochoid Family](#1-spirograph--hypotrochoid--epitrochoid-family)
2. [Other Interesting Mathematical Curves](#2-other-interesting-mathematical-curves)
3. [Fractal-Adjacent Distributions](#3-fractal-adjacent-distributions)
4. [Physics-Inspired Distributions](#4-physics-inspired-distributions)
5. [Summary Table](#5-summary-table)

---

## 1. Spirograph / Hypotrochoid / Epitrochoid Family

The spirograph is the intersection of mechanical art toy and serious mathematics. All three below (spirograph = hypotrochoid, plus epitrochoid) are instances of the general "roulette" curve family: a point attached to a circle rolling on another circle. They are among the highest "wow factor" curves for this tool.

### Core Terminology

- **R** (or **a**) — radius of the **fixed** circle
- **r** (or **b**) — radius of the **rolling** circle
- **d** (or **h**) — distance from the center of the rolling circle to the tracing point P
- When **d = r**, the tracing point is on the circumference → produces a pure Hypocycloid or Epicycloid
- When **d ≠ r**, the point is inside (d < r) or outside (d > r) the rolling circle → produces the full trochoid family

### 1.1 Hypotrochoid

The rolling circle rolls **inside** the fixed circle.

#### Equations

```
x(t) = (R - r)·cos(t) + d·cos((R - r)/r · t)
y(t) = (R - r)·sin(t) - d·sin((R - r)/r · t)
```

#### Curve Closure & Number of Loops

The curve closes when `t` completes `lcm(R, r) / r` full revolutions (i.e., after `t` reaches `2π · R/gcd(R,r)`). In practice:

- Let **k = R/r** (the ratio).
- If k is rational (write k = p/q in lowest terms), the curve closes after **p** full rotations of the rolling circle. It has **q** petals/lobes (if d ≤ R−r) or **q** inner loops (if d > R−r).
- The **number of petals** (outer extrema) equals **p** when p > q, or produces a star-like form with **p** points.

**Key visual rule:**
- `d < R − r` → curtate (no self-intersections, smooth petals)
- `d = R − r` → tracing point reaches the center, produces rose-like inner cusps
- `d = r` → degenerates to a Hypocycloid (cusps instead of loops)
- `d > R − r` → prolate (inner loops appear)

#### Special Cases (Hypotrochoid)

| R/r | d condition | Result |
|-----|-------------|--------|
| 2 | any d | **Ellipse** (always!) — the "Tusi couple" |
| 3 | d = r | **Deltoid** (3-cusped) |
| 4 | d = r | **Astroid** (4-cusped) |
| n (integer) | d = r | **n-cusped Hypocycloid** |
| p/q (fraction) | d = R−r | **Rose curve** with q petals |

#### Good Defaults (600×600 canvas, centered at 300,300)

```
R = 200   (outer radius)
r = 120   (inner radius, ratio = 5/3)
d = 90    (inside rolling circle: curtate form)
t ∈ [0, 2π · R/gcd(R,r)]  = [0, 6π]
scale: 1px = 1 unit
```

This gives a smooth 3-lobed figure. For a star effect, try d = 160 (prolate).

#### Interesting Parameter Combinations

| R | r | d | Description |
|---|---|---|-------------|
| 200 | 120 | 90 | Classic 5/3 spirograph, 5-pointed star-like |
| 200 | 140 | 70 | 10/7 ratio — very dense 10-lobe figure |
| 200 | 80 | 80 | 5/2 ratio with d=r → deltoid-like 5-cusp |
| 200 | 150 | 60 | 4/3 ratio — graceful 3-petal |
| 200 | 160 | 160 | 5/4 ratio with inner loops — 4 loops inside 5-petal outer |
| 200 | 125 | 100 | 8/5 (Fibonacci!) — 8 outer loops |
| 200 | 100 | 100 | 2/1 — Tusi ellipse when d varies |

#### Implementation Notes

- Parameter **t** range: `[0, 2π · R/gcd(R,r)]` closes the curve exactly
- Use integer R, r to get exact rational ratios; floating point gives "open" spirals
- To use as **Distributor**: sample N evenly-spaced t values along the closed curve
- To use as **Shape**: draw the full parametric path

---

### 1.2 Epitrochoid

The rolling circle rolls **outside** the fixed circle.

#### Equations

```
x(t) = (R + r)·cos(t) - d·cos((R + r)/r · t)
y(t) = (R + r)·sin(t) - d·sin((R + r)/r · t)
```

Note the critical sign difference from hypotrochoid: minus on the second x term, minus on second y term.

#### Curve Closure & Loop Count

Same LCM rule applies:
- Curve closes after `t ∈ [0, 2π · R/gcd(R,r)]`
- **Loop/petal count** = R/gcd(R,r) for most d values
- When d > R+r (far outside), outer loops appear
- When d < r, inner curtate form

#### Special Cases (Epitrochoid)

| R/r | d condition | Result |
|-----|-------------|--------|
| 1 | d = r | **Cardioid** (1-cusped Epicycloid) |
| 1 | d ≠ r | **Limaçon** (Pascal's snail) |
| 2 | d = r | **Nephroid** (2-cusped) |
| n (integer) | d = r | **n-cusped Epicycloid** |

#### Good Defaults (600×600 canvas)

```
R = 120   (inner fixed circle)
r = 80    (rolling circle, ratio = 3/2)
d = 120   (outside rolling circle: prolate form)
t ∈ [0, 2π · 3]  = [0, 6π]
```

Produces a 3-lobed outer form with pronounced loops.

#### Interesting Parameter Combinations

| R | r | d | Description |
|---|---|---|-------------|
| 120 | 80 | 120 | 3/2 ratio, d=R → 3 large outer loops |
| 100 | 100 | 80 | 1/1 ratio → Limaçon with inner loop |
| 100 | 50 | 50 | 2/1 ratio, d=r → Nephroid |
| 150 | 50 | 60 | 3/1 → 3-cusped Epicycloid variant |
| 140 | 60 | 140 | 7/3 → 7-loop dense pattern |
| 100 | 40 | 120 | 5/2 → 5 outer loops with d > r (prolate) |

---

### 1.3 Hypotrochoid vs. Epitrochoid: Visual Comparison

| Property | Hypotrochoid | Epitrochoid |
|----------|-------------|-------------|
| Rolling inside | Yes | No |
| Rolling outside | No | Yes |
| Overall scale | Loops stay inside fixed circle | Loops extend outside |
| R/r = 2 special case | Always an ellipse | Limaçon |
| R/r = 1 special case | Degenerate point | Cardioid / Limaçon |
| Visual character | More compact, star-like | More expansive, petal-like |

---

### 1.4 Pure Hypocycloid (d = r in hypotrochoid)

Cusped curves only (no inner loops). Produced when the tracing point is exactly on the rolling circle.

```
x(t) = (R - r)·cos(t) + r·cos((R - r)/r · t)
y(t) = (R - r)·sin(t) - r·sin((R - r)/r · t)
```

Named instances:

| n = R/r | Name | Description |
|---------|------|-------------|
| 2 | Tusi couple | Straight line segment |
| 3 | Deltoid | 3-pointed star, tricuspoid |
| 4 | Astroid | 4-pointed star, x^(2/3) + y^(2/3) = a^(2/3) |
| 5 | Pentacycloid | 5 cusps |
| n | n-Hypocycloid | n cusps |

**Astroid simplified form:**
```
x(t) = a·cos³(t)
y(t) = a·sin³(t)
```

**Deltoid simplified form:**
```
x(t) = (2/3)a·cos(t) - (1/3)a·cos(2t)
y(t) = (2/3)a·sin(t) + (1/3)a·sin(2t)
```

---

### 1.5 Pure Epicycloid (d = r in epitrochoid)

Cusped exterior curves.

```
x(t) = (R + r)·cos(t) - r·cos((R + r)/r · t)
y(t) = (R + r)·sin(t) - r·sin((R + r)/r · t)
```

Named instances:

| n = R/r | Name | Description |
|---------|------|-------------|
| 1 | Cardioid | 1 cusp, heart-shaped |
| 2 | Nephroid | 2 cusps, kidney-shaped |
| 3 | Trefoil Epicycloid | 3 cusps |
| 5 | Ranunculoid | 5 cusps |

**Cardioid simplified form:**
```
x(t) = a·cos(t)·(1 - cos(t))
y(t) = a·sin(t)·(1 - cos(t))
```
Polar: `r = a(1 - cos θ)`, perimeter = 8a, area = (3/2)πa²

**Nephroid simplified form:**
```
x(t) = a·(3·cos(t) - cos(3t))
y(t) = a·(3·sin(t) - sin(3t))
```
Arc length = 24a, enclosed area = 12πa²

---

### 1.6 Component Classification: Spirograph Family

| Curve | Distributor | Shape | Complexity |
|-------|-------------|-------|------------|
| Hypotrochoid (general) | Yes — sample N points along closed curve | Yes — trace full path | Medium |
| Epitrochoid (general) | Yes | Yes | Medium |
| Astroid | Yes | Yes | Simple |
| Cardioid | Yes | Yes | Simple |
| Nephroid | Yes | Yes | Simple |
| Deltoid | Yes | Yes | Simple |

**Implementation note:** A single `SpirographDistributor` component with parameters R, r, d, and a toggle for hypo/epi covers the entire family. The `points` parameter N for distributor mode. For Shape mode, resolution parameter replaces N.

---

## 2. Other Interesting Mathematical Curves

### 2.1 Superellipse / Lamé Curve

#### Description

A generalization of the ellipse where the exponent 2 is replaced by a variable n. Unifies diamond, ellipse, squircle, and rectangle into a single parameter sweep — extremely useful for a technical design tool.

#### Equations

**Implicit:** `|x/a|^n + |y/b|^n = 1`

**Parametric:**
```
x(t) = a · sign(cos t) · |cos t|^(2/n)
y(t) = b · sign(sin t) · |sin t|^(2/n)
t ∈ [0, 2π]
```

Or equivalently using `cos^(2/n)(t)` meaning `sgn(cos t)·|cos t|^(2/n)`.

#### Parameters

| Parameter | Role |
|-----------|------|
| `a` | Semi-axis along x (default: 200) |
| `b` | Semi-axis along y (default: 200 for symmetric forms) |
| `n` | Shape exponent — the key control |

#### Exponent n — Visual Guide

| n value | Shape |
|---------|-------|
| 2/3 | Astroid (four-pointed star concave) |
| 1 | Diamond / rhombus |
| 1.5 | Rounded diamond |
| 2 | Ellipse / circle (when a=b) |
| 2.5 | Piet Hein's superellipse (used in Sergels Torg, Stockholm) |
| 4 | "Squircle" (when a=b) — square with very rounded corners |
| 6–10 | Near-rectangle with smoothly rounded corners |
| → ∞ | Rectangle |

#### Good Defaults (600×600 canvas)

```
a = 200
b = 200
n = 4       (squircle — immediately recognizable)
t ∈ [0, 2π]
center: (300, 300)
```

#### Interesting Combinations

- `n=2.5, a=240, b=200` — Piet Hein's proportions, elegant for furniture/architecture aesthetic
- `n=0.5, a=b=200` — extremely spiky astroid-like star
- `n=3, a=220, b=160` — asymmetric superellipse, modern industrial feel

#### Use: Both Distributor and Shape. As distributor, evenly sample N points along the perimeter. As shape, trace the full curve.

#### Complexity: Simple
#### Wow factor: High — engineers immediately recognize the squircle from iOS icons

---

### 2.2 Fermat's Spiral

#### Description

A parabolic spiral where r² is proportional to θ. Unlike the logarithmic spiral (exponential growth), Fermat's spiral has linear area-per-angle — seeds are packed with equal area between them. This is the exact spiral used by sunflowers and the basis for Phyllotaxis. Already have Phyllotaxis distributor; Fermat's spiral as a continuous curve is the complement.

#### Equations

**Polar:** `r = a·√θ`

**Parametric:**
```
x(t) = a·√t · cos(t)
y(t) = a·√t · sin(t)
t ∈ [0, T]   (e.g., T = 10π gives 5 rotations)
```

The double-arm form (both positive and negative r):
```
Branch 1: x = a·√t·cos(t),  y = a·√t·sin(t)
Branch 2: x = -a·√t·cos(t), y = -a·√t·sin(t)
```

#### Parameters

| Parameter | Role |
|-----------|------|
| `a` | Growth rate (controls spacing between arms) |
| `t_max` | How many rotations (n rotations = t_max = 2πn) |

#### Good Defaults

```
a = 15         (spacing between turns)
t_max = 8π     (4 complete rotations)
N = 100        (distributor: 100 points)
```

For distributor mode, distribute N points at `t_k = k · t_max/N`, giving even spacing along the spiral.

#### Visual Characteristics

- Two symmetric arms (positive/negative branch)
- Unlike Archimedean spiral (equal radial spacing per turn), Fermat spiral compresses near center and expands outward — naturally weighted toward center
- The complete double-armed form looks like a galaxy / pinwheel

#### Relationship to Phyllotaxis

Phyllotaxis uses the golden angle (≈137.5°) to place seeds one at a time along Fermat's spiral. The distributor version here samples the continuous curve, which gives an ordered spiral path rather than the angle-jump pattern.

#### Use: Distributor (ordered spiral path), Shape (continuous curve)
#### Complexity: Simple
#### Wow factor: Medium — familiar from nature but distinct from Archimedean

---

### 2.3 Logarithmic Spiral

#### Description

The "equiangular spiral" or "spira mirabilis" (Bernoulli). The tangent makes a constant angle with the radial direction at every point. Growth is exponential — the curve looks the same at all scales.

#### Equations

**Polar:** `r = a·e^(b·θ)`

**Parametric:**
```
x(t) = a·e^(b·t) · cos(t)
y(t) = a·e^(b·t) · sin(t)
t ∈ [−T, T]   or   t ∈ [0, T]
```

#### Parameters

| Parameter | Role |
|-----------|------|
| `a` | Initial radius (at t=0, r=a) |
| `b` | Growth rate. b > 0: expands. b < 0: shrinks inward |
| `t_max` | Number of rotations (t_max = 2πn) |

#### Growth Factor Table

| b value | Appearance |
|---------|------------|
| 0.05 | Very tight, many close turns |
| 0.1 | Moderate — good default |
| 0.2 | Loose — few rotations fill canvas |
| 0.3063 | Golden spiral (r grows by φ per 90°) |
| 0 | Circle |

**Golden spiral:** `b = ln(φ)/(π/2) ≈ 0.3063`, where φ = (1+√5)/2 ≈ 1.618

#### Good Defaults (600×600 canvas)

```
a = 5          (start small, grow outward)
b = 0.15       (moderate growth)
t ∈ [0, 4π]   (2 full rotations)
N = 80         (distributor: 80 points)
center: (300, 300)
```

#### Interesting Combinations

- `a=2, b=0.3063, t=[0, 4π]` — Golden spiral, visually resonant
- `a=100, b=-0.15, t=[0, 6π]` — Inward spiral from edge to center
- Two-arm: render both t and t+π → double nautilus effect

#### Use: Distributor (points densely packed toward center/outside), Shape (continuous path)
#### Complexity: Simple
#### Wow factor: High — the golden spiral is one of the most recognized forms

---

### 2.4 Limaçon of Pascal

#### Description

A one-parameter family containing the cardioid, inner-loop forms, and convex ovals. Technically an epitrochoid with R=r. Very elegant transition between forms as b/a changes.

#### Equations

**Polar:** `r = b + a·cos(θ)`

**Parametric:**
```
x(t) = (b + a·cos(t))·cos(t)
y(t) = (b + a·cos(t))·sin(t)
t ∈ [0, 2π]
```

#### Parameters

| Parameter | Role |
|-----------|------|
| `a` | Radius of rolling circle (amplitude of modulation) |
| `b` | Offset (base radius) |

#### Shape Classification

| b/a ratio | Form |
|-----------|------|
| b/a > 2 | Convex oval |
| 1 < b/a ≤ 2 | Dimpled (concave dent, no self-intersection) |
| b/a = 1 | **Cardioid** (cusp) |
| 0 < b/a < 1 | Inner loop (self-intersecting) |
| b/a = 0.5 | **Limaçon trisectrix** |

#### Good Defaults (600×600 canvas)

```
a = 150
b = 100    (b/a = 0.667 → inner loop form)
t ∈ [0, 2π]
center: (300, 300)
```

#### Interesting Combinations

- `a=150, b=150` — Cardioid (degenerate)
- `a=100, b=250` — Egg-shaped convex oval
- `a=150, b=75` — Inner loop: b/a=0.5 trisectrix
- `a=150, b=180` — Subtle dimple (b/a=1.2)

#### Use: Distributor and Shape. The continuous transition through cardioid is a compelling educational feature.
#### Complexity: Simple
#### Wow factor: Medium-High

---

### 2.5 Cassini Oval / Lemniscate of Bernoulli

#### Description

The locus of points where the **product** of distances to two fixed foci equals a constant b². (Ellipses use the *sum*; Cassini ovals use the *product*.) At the critical ratio b=a, the oval becomes the figure-eight Lemniscate of Bernoulli.

#### Equations (Cassini Oval)

**Cartesian:** `(x² + y² + a²)² - 4a²x² = b⁴`

**Polar:** `r² = a²·cos(2θ) ± √(b⁴ - a⁴·sin²(2θ))`

**Parametric** (derived from polar):
```
r²(t) = a²·cos(2t) + √(b⁴ - a⁴·sin²(2t))
x(t) = r(t)·cos(t)
y(t) = r(t)·sin(t)
t ∈ [0, 2π]
```

For the two-lobe case (b < a), only the branch with `+` in the polar equation traces the real curve.

#### Special Case: Lemniscate of Bernoulli (b = a)

```
x(t) = (a·cos(t)) / (1 + sin²(t))
y(t) = (a·sin(t)·cos(t)) / (1 + sin²(t))
t ∈ [0, 2π]
```

The lemniscate is the ∞ (infinity) symbol. x-extent: ±a. y-extent: ±a/(2√2) ≈ ±0.354a.

#### Parameters

| Parameter | Role |
|-----------|------|
| `a` | Half the distance between foci |
| `b` | Controls the "inflation" of the ovals |

#### Shape Classification by b/a

| b/a | Shape |
|-----|-------|
| b > a | Single inflated oval (dog-bone / peanut-like as b→a+) |
| b = a | **Lemniscate** (figure-eight, ∞) |
| b < a | Two separate ovals |

#### Good Defaults (600×600 canvas)

```
a = 150       (foci at ±150 on x-axis)
b = 150       (lemniscate — most iconic)
center: (300, 300)
```

For oval form: `b = 200` (single inflated oval).
For two-loop form: `b = 100` (two separate ovals).

#### Use: Shape primarily (the lemniscate as ∞ is iconic). Distributor possible but topology change between b<a and b>a makes it tricky.
#### Complexity: Medium (polar equation evaluation, care for two-branch case)
#### Wow factor: High — the lemniscate is the ∞ symbol, engineers love it

---

### 2.6 Butterfly Curve (Temple H. Fay, 1989)

#### Description

A transcendental polar curve that resembles butterfly wings. Not a roulette or algebraic curve — it uses exponential and trigonometric combination. Visually stunning and surprising.

#### Equations

**Polar:** `r = e^(sin θ) - 2·cos(4θ) + sin⁵((2θ - π)/24)`

**Parametric:**
```
x(t) = sin(t) · [e^(cos(t)) - 2·cos(4t) - sin⁵(t/12)]
y(t) = cos(t) · [e^(cos(t)) - 2·cos(4t) - sin⁵(t/12)]
```

Note: Some sources write `sin⁵(t/12)` and others `sin⁵((2t-π)/24)` — these are equivalent since `(2t-π)/24 = t/12 - π/24`, and the π/24 shift is negligible for the visual.

#### Parameter Range

- **t ∈ [0, 24π]** to complete the full symmetric curve (12 full rotations)
- The curve has approximately 4-fold near-symmetry

#### Scale

The curve's radius varies roughly between 0 and ~4.5 units. For a 600×600 canvas:
```
scale = 50   (multiply x,y by 50)
center: (300, 300)
t ∈ [0, 24π]
```

#### Visual Characteristics

- Two butterfly wings with intricate ruffling
- The `e^(cos(t))` term creates an organic bulge
- The `cos(4t)` term creates the 4-lobed oscillation
- The `sin⁵(t/12)` term adds slow-frequency asymmetry
- Looks mechanical/organic simultaneously — high appeal to engineers

#### Use: Shape only (too complex for distributor sampling, path is not convex or star-shaped)
#### Complexity: Simple to implement (just evaluate the formula), complex visually
#### Wow factor: Very High — most visually surprising curve in this list

---

### 2.7 Folium of Descartes

#### Description

A cubic algebraic curve with a single loop and two arms extending to infinity. Notable for being one of the curves Descartes proposed to challenge Fermat's calculus methods (1638).

#### Equations

**Implicit:** `x³ + y³ = 3axy`

**Parametric:**
```
x(t) = (3a·t) / (1 + t³)
y(t) = (3a·t²) / (1 + t³)
```

**Caution:** The parametrization has a singularity at t = -1. The three segments are:
- Loop: `t ∈ (0, +∞)` (as t → ∞, (x,y) → (0,0) from the loop)
- Two arms: `t ∈ (-∞, -1)` and `t ∈ (-1, 0)`

For a closed rendering of just the loop: `t ∈ [0, 50]` (large T approximates t→∞).

#### Parameters

| Parameter | Role |
|-----------|------|
| `a` | Overall scale. Loop area = 3a²/2. Loop arc length ≈ 4.917a |

#### Visual Characteristics

- Elegant single leaf/loop in the first quadrant
- Asymptote: `y = -x - a` (line at 45°)
- The loop has a roughly triangular appearance
- Self-intersects at origin

#### Good Defaults (600×600 canvas)

```
a = 100
t ∈ [0.001, 200]    (avoid t=0 degeneracy, large enough for loop closure)
```

For canvas positioning: the loop occupies approximately x ∈ [0, 1.5a], y ∈ [0, 1.5a]. Translate to (150, 150) to center.

#### Use: Shape (the loop makes a nice leaf form). Could be Distributor along the loop.
#### Complexity: Simple (but be careful around t=0 and t=-1 singularities)
#### Wow factor: Medium — elegant but less visually complex than spirograph family

---

### 2.8 Maclaurin Trisectrix

#### Description

Studied by Colin Maclaurin (1742) as a tool for angle trisection. Features a loop and a branch extending to an asymptote. An anallagmatic curve (invariant under circle inversion about certain circles).

#### Equations

**Parametric:**
```
x(t) = a·(t² - 3) / (t² + 1)
y(t) = a·t·(t² - 3) / (t² + 1)
```

**Polar:** `r = -2a·sin(3θ)/sin(2θ)`

**Cartesian implicit:** `y² = x²(x + 3a)/(a - x)`

#### Key Geometric Features

- Vertical asymptote at `x = a`
- Self-intersection (crunode) at origin
- Loop center at `(-2a, 0)`, negative x-intercept at `(-3a, 0)`
- Tangent lines at origin make ±60° angles
- Loop area: `3√3·a²`, loop arc length ≈ `8.245a`

#### Parametric Range

- Loop: `t ∈ (-√3, √3)` — the section where x is negative
- Full curve requires `t ∈ (-∞, ∞)` but the interesting part is `t ∈ [-5, 5]`

#### Good Defaults (600×600 canvas)

```
a = 80
t ∈ [-5, 5]    (captures the loop + nearby arms)
scale: 1px = 1 unit
translate: (250, 300)   (offset to show loop + partial arm)
```

#### Use: Shape
#### Complexity: Simple
#### Wow factor: Medium — more of a mathematical curiosity, but the 60° tangent property is elegant

---

### 2.9 Astroid (Detailed)

Already covered in Section 1.4 as a special hypocycloid, but worth noting its standalone form.

#### Equations

```
x(t) = a·cos³(t)
y(t) = a·sin³(t)
t ∈ [0, 2π]
```

**Implicit:** `x^(2/3) + y^(2/3) = a^(2/3)`
This is also a Superellipse with exponent n = 2/3.

#### Properties

- Arc length: `6a`
- Area: `(3/8)πa²`
- Tangent property: Any tangent line cuts a segment of constant length `a` between the two axis intercepts

#### Good Defaults: `a = 200`, centered

---

### 2.10 Rhodonea / Rose Curve (Extended Notes)

Already in the tool, but worth documenting for fractional k values.

**Polar:** `r = a·cos(k·θ)`

**Petal count:**
- k odd integer → k petals
- k even integer → 2k petals
- k = p/q (fraction, fully reduced) →
  - if p·q is odd → p petals
  - if p or q is even → 2p petals

**Interesting fractional k values:**
| k | Petals | Notes |
|---|--------|-------|
| 1/2 | 1 | Dürer's folium |
| 2/3 | 4 | Dense 4-petal |
| 3/2 | 6 | Elegant 6-petal open form |
| 4/3 | 8 | Requires 3 full θ rotations |
| 5/4 | 10 | Requires 4 rotations |

**t range for fractional k = p/q:** t ∈ [0, qπ] (if p+q odd) or [0, 2qπ] (if p+q even).

---

## 3. Fractal-Adjacent Distributions

### 3.1 Sierpinski Triangle Distribution (Chaos Game)

#### Description

The "chaos game" algorithm for Sierpinski triangle generates points drawn from the fractal's attractor. After a few iterations the fractal pattern emerges with arbitrary N points.

#### Algorithm

```
vertices = [(0, h), (-w/2, 0), (w/2, 0)]   (equilateral triangle)
p = random starting point
for i in 1..N:
    v = random choice from vertices
    p = midpoint(p, v)     // p = (p + v) / 2
    emit point p            // (skip first ~20 warmup points)
```

#### Parameters

| Parameter | Role |
|-----------|------|
| `size` | Triangle side length (default: 400 for 600×600 canvas) |
| `N` | Number of points (default: 1000–5000 for visual density) |
| `warmup` | Points to skip before recording (default: 20) |
| `variant` | Standard (midpoint) or 1/3-point variant |

#### Good Defaults (600×600 canvas)

```
size = 400   (equilateral triangle centered)
N = 2000
warmup = 20
```

#### Visual Characteristics

- With N=100: sparse triangular cloud
- With N=500: self-similar triangular holes become visible
- With N=2000+: clear Sierpinski pattern
- Deterministic seed gives reproducible results

#### Variants

- **Barnsley Fern**: Different IFS (Iterated Function System) — uses 4 affine transforms → fern shape
- **Sierpinski Carpet**: Square grid midpoint rule
- **Random-vertex selection with weights**: Asymmetric attractors

#### Use: Distributor (produces N points in the fractal attractor pattern)
#### Complexity: Simple (just the chaos game algorithm)
#### Wow factor: High — the fractal pattern emerging from N points is immediately striking

---

### 3.2 Cantor Set Distribution (1D → 2D)

#### Description

The Cantor set removes the middle third of intervals recursively. After n iterations, 2^n segments of length (1/3)^n remain. Points from these segments can be used as a 1D distribution (e.g., along a line, or as x-coordinates for a 2D scatter).

#### Generation Algorithm

```
// Recursive: generate all segments after n iterations
function cantor(start, end, depth):
    if depth == 0:
        sample point in [start, end]
        return
    third = (end - start) / 3
    cantor(start, start + third, depth - 1)
    // middle third [start+third, start+2*third] is REMOVED
    cantor(start + 2*third, end, depth - 1)
```

#### Parameters

| Parameter | Role |
|-----------|------|
| `depth` | Number of iterations (default: 5 → 32 segments) |
| `length` | Total span (e.g., 500px) |
| `axis` | Horizontal, vertical, or diagonal |

#### Good Defaults

```
depth = 5   (32 segments, 32 sample points)
length = 500
axis = horizontal, y-offset = random or uniform in row
```

#### 2D variant: Cantor Dust

Apply Cantor set independently to x and y → a 2D point cloud with fractal "dusty" distribution. Dimension = log(4)/log(3) ≈ 1.26.

#### Use: Distributor (1D along a line, or 2D "dust")
#### Complexity: Simple (recursive implementation)
#### Wow factor: Medium — recognizable fractal, but requires explanation to non-mathematicians

---

### 3.3 L-System Tree Branch Distribution

#### Description

L-systems (Lindenmayer systems) use string rewriting to generate fractal-like branching structures. After n iterations, the "F" symbols in the string represent line segments. The endpoints of these segments (or their midpoints) form an interesting hierarchical point distribution.

#### Key L-System Examples

**Koch Snowflake (n iterations produces 4^n points):**
```
Axiom: F--F--F
Rules: F → F+F--F+F
Angle: 60°
```

**Sierpinski Arrowhead:**
```
Axiom: XF
Rules: X → YF+XF+Y, Y → XF-YF-X
Angle: 60°
```

**Fractal Plant (Prusinkiewicz):**
```
Axiom: X
Rules: X → F+[[X]-X]-F[-FX]+X, F → FF
Angle: 25°
```

#### Turtle Graphics Interpretation

- `F` or `G`: Move forward, emit point
- `+`: Turn left by angle δ
- `-`: Turn right by angle δ
- `[`: Push position/heading onto stack
- `]`: Pop position/heading

#### For a Distributor

Collect all "draw forward" endpoints after n iterations. These form a hierarchically distributed point cloud.

#### Parameters

| Parameter | Role |
|-----------|------|
| `axiom` | Starting string |
| `rules` | Rewriting rules (max 3–4 for UI) |
| `angle` | Turn angle δ |
| `depth` | Iteration count (2–6 typical) |
| `stepLength` | Length of each F segment |

#### Good Defaults (fractal plant, 600×600 canvas)

```
depth = 4
angle = 25°
stepLength = 8
```

#### Note on Implementation

For a generative editor, offer preset L-systems (Koch, Sierpinski, plant, dragon) rather than a full rule editor. The preset approach keeps implementation Medium complexity.

#### Use: Distributor (branch endpoint positions), Shape (draw the full L-system path)
#### Complexity: Medium (string rewriting engine + turtle graphics)
#### Wow factor: High — fractal trees are immediately recognizable and beautiful

---

## 4. Physics-Inspired Distributions

### 4.1 Hexagonal Packing

#### Description

The densest packing of equal circles in the plane. Points are arranged in a hexagonal lattice — the most natural tiling pattern in crystals, honeycombs, and materials science.

#### Equations (Pointy-top orientation)

```
// For row r, column c:
x = c * spacing_x + (r % 2) * offset_x
y = r * spacing_y

// Where:
spacing_x = hexSize * sqrt(3)         // horizontal spacing
spacing_y = hexSize * 1.5             // vertical spacing
offset_x  = hexSize * sqrt(3) / 2    // half-step for odd rows
```

Flat-top orientation:
```
spacing_x = hexSize * 1.5
spacing_y = hexSize * sqrt(3)
offset_y  = hexSize * sqrt(3) / 2    // half-step for odd columns
```

#### Generating N Points in Rings

The hexagonal lattice can be generated in concentric rings from a center point:
- Ring 0: 1 point (center)
- Ring 1: 6 points
- Ring 2: 12 points
- Ring k: 6k points
- Total in k rings: 1 + 3k(k+1) points

For N points: use `k = ceil((-3 + sqrt(9 + 12(N-1))) / 6)` rings.

#### Parameters

| Parameter | Role |
|-----------|------|
| `spacing` | Distance between hex centers (default: 40px) |
| `orientation` | Flat-top or pointy-top |
| `rows` | Number of rows (or use rings) |
| `cols` | Number of columns |
| `jitter` | Add random offset (0=perfect grid, 1=displaced by spacing) |

#### Good Defaults (600×600 canvas)

```
spacing = 40
orientation = pointy-top
rows = 14
cols = 16
jitter = 0
```

This gives approximately 200 points in a near-circular region.

#### Use: Distributor
#### Complexity: Simple
#### Wow factor: Medium-High — immediately recognized by engineers (materials science, PCB design)

---

### 4.2 Electrostatic Repulsion Distribution (Thomson Problem Approximation)

#### Description

Place N points on a unit disk (or circle) such that they minimize electrostatic potential energy (Coulomb repulsion: energy ∝ 1/r between each pair). Unlike the Thomson problem (sphere), the 2D disk version converges to well-known solutions for small N.

For points on a **circle** (not disk): the answer is trivially N points evenly spaced. The interesting case is points in a **disk**.

#### Known Solutions for N Points on a Disk

| N | Configuration |
|---|---------------|
| 1 | Center |
| 2 | Two points on diameter |
| 3 | Equilateral triangle |
| 4 | Equilateral triangle + center (or square) |
| 5 | Pentagon or pentagon+center |
| 6 | Hexagon (no center — center is unstable for 6) |
| 7 | Hexagon + center |
| 12 | 6+5+1 ring configuration |

These are the "Thomson problem on a disk" solutions.

#### Simulation Algorithm (for arbitrary N)

```
initialize: place N points randomly in disk
repeat until convergence:
    for each point i:
        force = (0, 0)
        for each point j ≠ i:
            r_vec = pos[i] - pos[j]
            r_dist = length(r_vec)
            force += r_vec / r_dist³     // Coulomb repulsion
        // Optionally: boundary repulsion from circle edge
        vel[i] = vel[i] * damping + force * dt
        pos[i] += vel[i] * dt
        // Clamp to disk: if |pos[i]| > R, project onto circle
```

Convergence: typically 200–1000 iterations for N ≤ 50.

#### Parameters

| Parameter | Role |
|-----------|------|
| `N` | Number of points |
| `radius` | Disk radius |
| `boundary` | "disk" (constrained) or "circle" (on rim) or "free" (Lennard-Jones) |
| `iterations` | Simulation steps (precompute at design time) |
| `seed` | Random seed for initial placement |

#### Good Defaults

```
N = 12
radius = 200
boundary = disk
iterations = 500 (precomputed)
```

#### Note on Implementation

For a real-time tool, precompute the equilibrium positions for common N values (5–30) and interpolate, rather than running simulation on every render. The "continuous simulation" version can be a live-preview mode.

#### Use: Distributor
#### Complexity: Complex (requires simulation or lookup table)
#### Wow factor: High — the concept of physics-based optimal packing resonates strongly with engineers

---

### 4.3 Vogel / Sunflower Spiral (Extended Notes)

Already implemented as Phyllotaxis, but worth documenting the full parametric form for reference.

#### Equations

```
// Vogel 1979:
r(n) = c · √n
θ(n) = n · 137.507764°    // golden angle in degrees
// = n · (2π / φ²) radians, where φ = (1+√5)/2

x(n) = r(n) · cos(θ(n))
y(n) = r(n) · sin(θ(n))
```

The golden angle `137.507764° = 360° × (1 - 1/φ) = 360° / φ²` is irrational, ensuring seeds never align radially.

#### Variants

- **Sunflower with c scaling**: `c = spacing / √(π · R² / N)` for N seeds in radius R
- **Fermat spiral variant**: use `r = c·√(n/N)·R` for N seeds bounded in radius R
- **Anti-sunflower**: use `360°/e ≈ 132.5°` or other irrational angles → different packing modes
- **Double sunflower**: interleave two sequences with angles 137.5° and 137.5° + 60°

---

## 5. Summary Table

| Curve | Type | Distributor | Shape | Complexity | Wow Factor | Notes |
|-------|------|-------------|-------|------------|------------|-------|
| Hypotrochoid | Roulette | Yes | Yes | Medium | Very High | Core spirograph family |
| Epitrochoid | Roulette | Yes | Yes | Medium | Very High | Core spirograph family |
| Hypocycloid (n-cusp) | Roulette | Yes | Yes | Simple | High | Special case, needs n param |
| Epicycloid (n-cusp) | Roulette | Yes | Yes | Simple | High | Cardioid, nephroid, etc. |
| Astroid | Algebraic | Yes | Yes | Simple | High | Superellipse n=2/3 |
| Cardioid | Roulette | Yes | Yes | Simple | High | Epicycloid R=r |
| Nephroid | Roulette | Yes | Yes | Simple | Medium | 2-cusped epicycloid |
| Superellipse | Algebraic | Yes | Yes | Simple | High | Squircle family, n param |
| Fermat's Spiral | Spiral | Yes | Yes | Simple | Medium | Double-arm parabolic spiral |
| Logarithmic Spiral | Spiral | Yes | Yes | Simple | High | Golden spiral special case |
| Limaçon | Roulette | Yes | Yes | Simple | Medium | Epitrochoid R=r |
| Lemniscate (∞) | Algebraic | — | Yes | Medium | Very High | Cassini b=a, ∞ symbol |
| Cassini Oval | Algebraic | — | Yes | Medium | High | Three topological forms |
| Butterfly Curve | Transcendental | — | Yes | Simple | Very High | Temple Fay, pure wow |
| Folium of Descartes | Cubic | — | Yes | Simple | Medium | Leaf shape, singularity at t=-1 |
| Maclaurin Trisectrix | Cubic | — | Yes | Simple | Medium | Historical curve, loop + asymptote |
| Sierpinski (chaos game) | Fractal-IFS | Yes | — | Simple | High | N points, fractal attractor |
| Cantor Set | Fractal | Yes | — | Simple | Medium | 1D → 2D dust |
| L-System | Fractal | Yes | Yes | Medium | High | Koch, plant, dragon presets |
| Hexagonal Packing | Physics/Lattice | Yes | — | Simple | Medium-High | Crystal structure look |
| Electrostatic Repulsion | Physics-sim | Yes | — | Complex | High | Requires precomputed tables |

---

## 6. Implementation Priority Recommendations

### High Priority (high wow + simple/medium complexity)

1. **SpirographDistributor** — single component covering Hypo+Epi+trochoids with params R, r, d, mode (hypo/epi). The single most impactful addition.
2. **Superellipse** — Shape + Distributor, single `n` exponent parameter. Engineers immediately recognize squircle.
3. **Butterfly Curve** — Shape only. Pure visual impact with a 5-line implementation.
4. **Lemniscate** — Shape, the ∞ symbol is universally recognized.
5. **LogarithmicSpiral** / **FermatSpiral** — Distributor + Shape. Complements existing Archimedean spiral.

### Medium Priority (good value, manageable complexity)

6. **Sierpinski Distribution** — Distributor via chaos game. 30 lines of code, high visual impact at N=2000.
7. **HexagonalPacking** — Distributor. Engineers love crystal/material look.
8. **Cardioid / Nephroid** — Shape components. Named special cases of epicycloid, simple to add once epicycloid engine exists.
9. **Limaçon** — Shape + Distributor. Includes cardioid as special case.
10. **Cassini Oval** — Shape. Three topological forms from one component.

### Lower Priority (interesting but less immediately useful)

11. **L-System** — Complex but rewarding. Offer 5–6 preset L-systems.
12. **Electrostatic Repulsion** — Requires precomputed data or simulation; very cool concept.
13. **Folium of Descartes** — Shape only, limited utility as distributor.
14. **Maclaurin Trisectrix** — Shape only, historical curiosity.
15. **Cantor Dust** — Distributor, interesting but niche.

---

## 7. Key Formulas Reference Card

### Curve Closure for Hypo/Epitrochoids

Given R, r (both integers or rational), the curve closes after:
```
t_max = 2π · R / gcd(R, r)
```
Number of loops/petals ≈ `R / gcd(R, r)`

For floating-point R/r, approximate: use `t_max = 2π · denominator_of_nearest_fraction`.

### Petal Count Rules

| Curve | Formula |
|-------|---------|
| Rose r=cos(kθ), k odd integer | k petals |
| Rose r=cos(kθ), k even integer | 2k petals |
| Hypocycloid/Epicycloid with R/r = n (integer) | n cusps |
| Hypotrochoid, R/r = p/q (reduced) | p outer extrema, q petals/lobes |

### Canvas Scaling

For a 600×600 canvas centered at (300, 300):
- Spirograph with R=200: fits well, 10px padding each side
- Use `ctx.translate(300, 300)` then draw unscaled
- For variable-R curves: `scale = 260 / R_max` to fit with margin

### Golden Angle (Phyllotaxis)

```
golden_angle = 2π × (1 - 1/φ²) ≈ 2.399963 radians ≈ 137.508°
φ = (1 + √5) / 2 ≈ 1.6180339887
```

### Superellipse Parametrization (safe for all n)

```javascript
function superellipsePoint(t, a, b, n) {
    const cos_t = Math.cos(t);
    const sin_t = Math.sin(t);
    const x = a * Math.sign(cos_t) * Math.pow(Math.abs(cos_t), 2/n);
    const y = b * Math.sign(sin_t) * Math.pow(Math.abs(sin_t), 2/n);
    return { x, y };
}
```

### Fermat's Spiral (both arms)

```javascript
function fermatPoints(N, a, t_max) {
    const points = [];
    for (let i = 0; i < N; i++) {
        const t = (i / N) * t_max;
        const r = a * Math.sqrt(t);
        points.push({ x:  r * Math.cos(t), y:  r * Math.sin(t) }); // arm 1
        points.push({ x: -r * Math.cos(t), y: -r * Math.sin(t) }); // arm 2
    }
    return points;
}
```

### Hexagonal Grid Points (pointy-top)

```javascript
function hexGrid(rows, cols, spacing) {
    const points = [];
    const dx = spacing * Math.sqrt(3);
    const dy = spacing * 1.5;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c * dx + (r % 2) * dx / 2;
            const y = r * dy;
            points.push({ x, y });
        }
    }
    return points;
}
```

### Sierpinski Chaos Game

```javascript
function sierpinski(N, size, seed = 42) {
    const verts = [
        { x: 0,       y: -size * Math.sqrt(3) / 3 * 2 },  // top
        { x: -size/2, y:  size * Math.sqrt(3) / 6 },       // bottom-left
        { x:  size/2, y:  size * Math.sqrt(3) / 6 },       // bottom-right
    ];
    let p = { x: 0, y: 0 };
    const points = [];
    for (let i = 0; i < N + 20; i++) {
        const v = verts[Math.floor(seededRandom(seed + i) * 3)];
        p = { x: (p.x + v.x) / 2, y: (p.y + v.y) / 2 };
        if (i >= 20) points.push({ ...p });
    }
    return points;
}
```

---

## 8. Sources Consulted

- Wolfram MathWorld: Hypotrochoid, Epitrochoid, Epicycloid, Hypocycloid, Superellipse, Cassini Ovals, Cardioid, Nephroid, Deltoid, Astroid, Limacon, Rose Curve, Maclaurin Trisectrix, Folium of Descartes, Cantor Set, Lindenmayer System, Thomson Problem, Butterfly Curve
- mathcurve.com: Hypotrochoid, Epitrochoid, Fermat Spiral
- redblobgames.com: Hexagonal Grids (comprehensive reference)
- Vogel, H. (1979). "A better way to construct the sunflower head." *Mathematical Biosciences*, 44(3-4), 179–189.
- Fay, T.H. (1989). "The Butterfly Curve." *American Mathematical Monthly*, 96(5), 442–443.
- Maclaurin, C. (1742). *A Treatise of Fluxions.* Edinburgh.
- Piet Hein / Superellipse: Gardiner, M. (1965). *Scientific American* 213(3):222–234.
