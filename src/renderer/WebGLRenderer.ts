import type { DrawItem } from './DrawItem'

// Per-instance float counts
const RF = 11  // rect:   tx,ty, rot, w,h, sx,sy, r,g,b,a
const CF = 10  // circle: tx,ty, rot, radius, sx,sy, r,g,b,a
const INIT_CAP = 8192

// ── Shaders ────────────────────────────────────────────────────────────────

const RECT_VERT = `#version 300 es
layout(location=0) in vec2 a_quad;
layout(location=1) in vec2 a_pos;
layout(location=2) in float a_rot;
layout(location=3) in vec2 a_size;
layout(location=4) in vec2 a_scale;
layout(location=5) in vec4 a_color;
uniform mat3 u_cam;
out vec4 v_color;
void main() {
  float c = cos(a_rot), s = sin(a_rot);
  vec2 local = a_quad * a_size * a_scale;
  vec2 world = vec2(c*local.x - s*local.y, s*local.x + c*local.y) + a_pos;
  gl_Position = vec4((u_cam * vec3(world, 1.0)).xy, 0.0, 1.0);
  v_color = a_color;
}`

const SIMPLE_FRAG = `#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 fragColor;
void main() { fragColor = v_color; }`

const CIRC_VERT = `#version 300 es
layout(location=0) in vec2 a_quad;
layout(location=1) in vec2 a_pos;
layout(location=2) in float a_rot;
layout(location=3) in float a_radius;
layout(location=4) in vec2 a_scale;
layout(location=5) in vec4 a_color;
uniform mat3 u_cam;
out vec4 v_color;
out vec2 v_uv;
void main() {
  v_uv = a_quad;
  float r = a_radius * max(abs(a_scale.x), abs(a_scale.y));
  gl_Position = vec4((u_cam * vec3(a_quad * r + a_pos, 1.0)).xy, 0.0, 1.0);
  v_color = a_color;
}`

const CIRC_FRAG = `#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  float d = length(v_uv);
  float aa = fwidth(d) * 1.5;
  float alpha = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, d);
  if (alpha <= 0.0) discard;
  fragColor = vec4(v_color.rgb, v_color.a * alpha);
}`

// ── Helpers ─────────────────────────────────────────────────────────────────

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(`Shader error: ${gl.getShaderInfoLog(s)}`)
  return s
}

function link(gl: WebGL2RenderingContext, vert: string, frag: string): WebGLProgram {
  const p = gl.createProgram()!
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert))
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(`Link error: ${gl.getProgramInfoLog(p)}`)
  return p
}

const _colorCache = new Map<string, [number, number, number]>()
function parseHex(hex: string): [number, number, number] {
  const cached = _colorCache.get(hex)
  if (cached) return cached
  const h = hex.replace(/^#/, '')
  const s = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h
  const result: [number, number, number] = [
    parseInt(s.slice(0, 2), 16) / 255,
    parseInt(s.slice(2, 4), 16) / 255,
    parseInt(s.slice(4, 6), 16) / 255,
  ]
  _colorCache.set(hex, result)
  return result
}

// ── Renderer ────────────────────────────────────────────────────────────────

export class WebGLRenderer {
  private readonly gl: WebGL2RenderingContext
  private readonly rectProg: WebGLProgram
  private readonly circProg: WebGLProgram
  private readonly rectVAO: WebGLVertexArrayObject
  private readonly circVAO: WebGLVertexArrayObject
  private readonly rectBuf: WebGLBuffer
  private readonly circBuf: WebGLBuffer
  private readonly rectCamLoc: WebGLUniformLocation
  private readonly circCamLoc: WebGLUniformLocation
  private readonly cam = new Float32Array(9)
  private rectData = new Float32Array(INIT_CAP * RF)
  private circData = new Float32Array(INIT_CAP * CF)
  private rectCap = INIT_CAP
  private circCap = INIT_CAP

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false })
    if (!gl) throw new Error('WebGL2 not supported')
    this.gl = gl

    this.rectProg = link(gl, RECT_VERT, SIMPLE_FRAG)
    this.circProg = link(gl, CIRC_VERT, CIRC_FRAG)
    this.rectCamLoc = gl.getUniformLocation(this.rectProg, 'u_cam')!
    this.circCamLoc = gl.getUniformLocation(this.circProg, 'u_cam')!

    ;[this.rectVAO, this.rectBuf] = this.makeVAO(
      new Float32Array([-0.5,-0.5,  0.5,-0.5,  -0.5,0.5,  0.5,0.5]),
      RF * 4,
      [[2,0], [1,8], [2,12], [2,20], [4,28]],  // [floatSize, byteOffset]
    )
    ;[this.circVAO, this.circBuf] = this.makeVAO(
      new Float32Array([-1,-1,  1,-1,  -1,1,  1,1]),
      CF * 4,
      [[2,0], [1,8], [1,12], [2,16], [4,24]],
    )

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  }

  private makeVAO(
    quadVerts: Float32Array,
    instStride: number,
    attribs: [floatSize: number, byteOffset: number][],
  ): [WebGLVertexArrayObject, WebGLBuffer] {
    const { gl } = this
    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)

    // attrib 0: quad geometry (per-vertex)
    const qBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, qBuf)
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(0, 0)

    // attribs 1+: instance data (per-instance)
    const iBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, iBuf)
    attribs.forEach(([sz, off], i) => {
      gl.enableVertexAttribArray(i + 1)
      gl.vertexAttribPointer(i + 1, sz, gl.FLOAT, false, instStride, off)
      gl.vertexAttribDivisor(i + 1, 1)
    })

    gl.bindVertexArray(null)
    return [vao, iBuf]
  }

  resize(width: number, height: number): void {
    this.gl.canvas.width = width
    this.gl.canvas.height = height
    this.gl.viewport(0, 0, width, height)
  }

  clear(bg = '#141414'): void {
    const { gl } = this
    const [r, g, b] = parseHex(bg)
    gl.clearColor(r, g, b, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }

  private buildCam(zoom: number, panX: number, panY: number): void {
    const W = (this.gl.canvas as HTMLCanvasElement).width
    const H = (this.gl.canvas as HTMLCanvasElement).height
    const m = this.cam
    // Column-major 3×3 for WebGL: world → NDC
    m[0] = 2*zoom/W;  m[3] = 0;           m[6] = 2*panX/W - 1
    m[1] = 0;         m[4] = -2*zoom/H;   m[7] = 1 - 2*panY/H
    m[2] = 0;         m[5] = 0;           m[8] = 1
  }

  private flushRects(count: number): void {
    if (count === 0) return
    const { gl } = this
    gl.useProgram(this.rectProg)
    gl.uniformMatrix3fv(this.rectCamLoc, false, this.cam)
    gl.bindVertexArray(this.rectVAO)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rectBuf)
    gl.bufferData(gl.ARRAY_BUFFER, this.rectData.subarray(0, count * RF), gl.DYNAMIC_DRAW)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count)
  }

  private flushCircles(count: number): void {
    if (count === 0) return
    const { gl } = this
    gl.useProgram(this.circProg)
    gl.uniformMatrix3fv(this.circCamLoc, false, this.cam)
    gl.bindVertexArray(this.circVAO)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.circBuf)
    gl.bufferData(gl.ARRAY_BUFFER, this.circData.subarray(0, count * CF), gl.DYNAMIC_DRAW)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count)
  }

  render(items: DrawItem[], zoom: number, panX: number, panY: number): void {
    this.buildCam(zoom, panX, panY)

    // 3 passes: shadow → stroke → fill
    // Each pass: ≤2 draw calls (1 rect batch + 1 circle batch)
    for (const pass of ['shadow', 'stroke', 'fill'] as const) {
      let ri = 0, ci = 0

      for (const { transform: t, shape, style } of items) {
        if (pass === 'shadow' && !style.shadow) continue
        if (pass === 'stroke' && !style.stroke) continue
        if (pass === 'fill'   && !style.fill)   continue

        let r: number, g: number, b: number
        if (pass === 'shadow') {
          ;[r, g, b] = parseHex(style.shadow!.color)
        } else if (pass === 'stroke') {
          ;[r, g, b] = parseHex(style.stroke!.color)
        } else {
          ;[r, g, b] = parseHex(style.fill!)
        }

        const tx = t.x + (pass === 'shadow' ? (style.shadow?.x ?? 0) : 0)
        const ty = t.y + (pass === 'shadow' ? (style.shadow?.y ?? 0) : 0)
        const a  = style.opacity

        if (shape.type === 'rect') {
          if (ri >= this.rectCap) { this.rectCap *= 2; const n = new Float32Array(this.rectCap * RF); n.set(this.rectData); this.rectData = n }
          const base = ri++ * RF
          const w = pass === 'stroke' ? shape.width  + style.stroke!.width : shape.width
          const h = pass === 'stroke' ? shape.height + style.stroke!.width : shape.height
          this.rectData.set([tx, ty, t.rotation, w, h, t.scaleX, t.scaleY, r, g, b, a], base)
        } else if (shape.type === 'circle') {
          if (ci >= this.circCap) { this.circCap *= 2; const n = new Float32Array(this.circCap * CF); n.set(this.circData); this.circData = n }
          const base = ci++ * CF
          const rad = pass === 'stroke' ? shape.radius + style.stroke!.width * 0.5 : shape.radius
          this.circData.set([tx, ty, t.rotation, rad, t.scaleX, t.scaleY, r, g, b, a], base)
        }
        // text: rendered by Canvas2D gizmo overlay
      }

      this.flushRects(ri)
      this.flushCircles(ci)
    }
  }
}
