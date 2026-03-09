import type { DrawItem } from './DrawItem'

const RF = 11  // rect instance floats:   tx,ty, rot, w,h, sx,sy, r,g,b,a
const CF = 10  // circle instance floats: tx,ty, rot, radius, sx,sy, r,g,b,a
const INIT_CAP = 8192

// ── Scene shaders (instanced rect + circle) ──────────────────────────────────

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

// ── Bloom shaders ────────────────────────────────────────────────────────────

// Full-screen triangle via gl_VertexID — no vertex buffer needed
const FULLSCREEN_VERT = `#version 300 es
out vec2 v_uv;
void main() {
  float x = float(gl_VertexID == 1) * 4.0 - 1.0;
  float y = float(gl_VertexID == 2) * 4.0 - 1.0;
  gl_Position = vec4(x, y, 0.0, 1.0);
  v_uv = gl_Position.xy * 0.5 + 0.5;
}`

// Separable 9-tap Gaussian (sigma≈2). u_dir encodes direction × per-sample UV step.
const BLUR_FRAG = `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_dir;
out vec4 fragColor;
const float W[5] = float[](0.2042, 0.1801, 0.1238, 0.0663, 0.0276);
void main() {
  vec4 sum = texture(u_tex, v_uv) * W[0];
  for (int i = 1; i <= 4; i++) {
    vec2 off = u_dir * float(i);
    sum += (texture(u_tex, v_uv + off) + texture(u_tex, v_uv - off)) * W[i];
  }
  fragColor = sum;
}`

// Additive composite: scene + bloom * strength
const COMPOSITE_FRAG = `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_strength;
out vec4 fragColor;
void main() {
  vec3 scene = texture(u_scene, v_uv).rgb;
  vec3 bloom = texture(u_bloom, v_uv).rgb;
  fragColor = vec4(scene + bloom * u_strength, 1.0);
}`

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Framebuffer helpers ───────────────────────────────────────────────────────

interface FBOPair { fbo: WebGLFramebuffer; tex: WebGLTexture }

function makeFBO(gl: WebGL2RenderingContext, w: number, h: number): FBOPair {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fbo = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return { fbo, tex }
}

function deleteFBO(gl: WebGL2RenderingContext, pair: FBOPair): void {
  gl.deleteFramebuffer(pair.fbo)
  gl.deleteTexture(pair.tex)
}

// ── Renderer ─────────────────────────────────────────────────────────────────

export class WebGLRenderer {
  private readonly gl: WebGL2RenderingContext

  // Scene programs
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

  // Bloom programs + resources (lazily created)
  private blurProg: WebGLProgram | null = null
  private compositeProg: WebGLProgram | null = null
  private blurTexLoc!: WebGLUniformLocation
  private blurDirLoc!: WebGLUniformLocation
  private compositeSceneLoc!: WebGLUniformLocation
  private compositeBloomLoc!: WebGLUniformLocation
  private compositeStrLoc!: WebGLUniformLocation
  private readonly emptyVAO: WebGLVertexArrayObject
  private bloomFBOs: { main: FBOPair; ping: FBOPair; pong: FBOPair; hw: number; hh: number } | null = null

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
      [[2,0],[1,8],[2,12],[2,20],[4,28]],
    )
    ;[this.circVAO, this.circBuf] = this.makeVAO(
      new Float32Array([-1,-1,  1,-1,  -1,1,  1,1]),
      CF * 4,
      [[2,0],[1,8],[1,12],[2,16],[4,24]],
    )

    this.emptyVAO = gl.createVertexArray()!
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
    const qBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, qBuf)
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(0, 0)
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
    // Invalidate bloom FBOs — will be recreated at correct size on next bloom render
    if (this.bloomFBOs) {
      const { gl } = this
      deleteFBO(gl, this.bloomFBOs.main)
      deleteFBO(gl, this.bloomFBOs.ping)
      deleteFBO(gl, this.bloomFBOs.pong)
      this.bloomFBOs = null
    }
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

  // Render all items (shadow → stroke → fill passes). Assumes framebuffer already bound.
  private renderPasses(items: DrawItem[]): void {
    for (const pass of ['shadow', 'stroke', 'fill'] as const) {
      let ri = 0, ci = 0
      for (const { transform: t, shape, style } of items) {
        if (pass === 'shadow' && !style.shadow) continue
        if (pass === 'stroke' && !style.stroke) continue
        if (pass === 'fill'   && !style.fill)   continue
        let r: number, g: number, b: number
        if      (pass === 'shadow') [r, g, b] = parseHex(style.shadow!.color)
        else if (pass === 'stroke') [r, g, b] = parseHex(style.stroke!.color)
        else                        [r, g, b] = parseHex(style.fill!)
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
      }
      this.flushRects(ri)
      this.flushCircles(ci)
    }
  }

  // Render only the shadow-colored shapes (glow sources for bloom).
  // Shadow brightness scales with shadow.blur so heavier blur = brighter bloom source.
  private renderGlowSources(items: DrawItem[]): void {
    let ri = 0, ci = 0
    for (const { transform: t, shape, style } of items) {
      if (!style.shadow) continue
      const [r, g, b] = parseHex(style.shadow.color)
      const a = Math.min(style.shadow.blur / 20.0, 1.0) * style.opacity
      if (shape.type === 'rect') {
        if (ri >= this.rectCap) { this.rectCap *= 2; const n = new Float32Array(this.rectCap * RF); n.set(this.rectData); this.rectData = n }
        const base = ri++ * RF
        this.rectData.set([t.x, t.y, t.rotation, shape.width, shape.height, t.scaleX, t.scaleY, r, g, b, a], base)
      } else if (shape.type === 'circle') {
        if (ci >= this.circCap) { this.circCap *= 2; const n = new Float32Array(this.circCap * CF); n.set(this.circData); this.circData = n }
        const base = ci++ * CF
        this.circData.set([t.x, t.y, t.rotation, shape.radius, t.scaleX, t.scaleY, r, g, b, a], base)
      }
    }
    this.flushRects(ri)
    this.flushCircles(ci)
  }

  // ── Bloom FBO management ──────────────────────────────────────────────────

  private ensureBloomFBOs(): typeof this.bloomFBOs & object {
    const { gl } = this
    const W = (gl.canvas as HTMLCanvasElement).width
    const H = (gl.canvas as HTMLCanvasElement).height
    const hw = Math.max(1, W >> 1)
    const hh = Math.max(1, H >> 1)

    if (this.bloomFBOs && this.bloomFBOs.hw === hw && this.bloomFBOs.hh === hh) {
      return this.bloomFBOs
    }

    // First time: compile bloom programs
    if (!this.blurProg) {
      this.blurProg      = link(gl, FULLSCREEN_VERT, BLUR_FRAG)
      this.compositeProg = link(gl, FULLSCREEN_VERT, COMPOSITE_FRAG)
      this.blurTexLoc        = gl.getUniformLocation(this.blurProg, 'u_tex')!
      this.blurDirLoc        = gl.getUniformLocation(this.blurProg, 'u_dir')!
      this.compositeSceneLoc = gl.getUniformLocation(this.compositeProg!, 'u_scene')!
      this.compositeBloomLoc = gl.getUniformLocation(this.compositeProg!, 'u_bloom')!
      this.compositeStrLoc   = gl.getUniformLocation(this.compositeProg!, 'u_strength')!
    }

    // Resize FBOs
    if (this.bloomFBOs) {
      deleteFBO(gl, this.bloomFBOs.main)
      deleteFBO(gl, this.bloomFBOs.ping)
      deleteFBO(gl, this.bloomFBOs.pong)
    }
    this.bloomFBOs = {
      main: makeFBO(gl, W, H),
      ping: makeFBO(gl, hw, hh),
      pong: makeFBO(gl, hw, hh),
      hw, hh,
    }
    return this.bloomFBOs
  }

  private blurPass(
    srcTex: WebGLTexture,
    dstFBO: WebGLFramebuffer,
    w: number, h: number,
    dx: number, dy: number,
  ): void {
    const { gl } = this
    gl.bindFramebuffer(gl.FRAMEBUFFER, dstFBO)
    gl.viewport(0, 0, w, h)
    gl.useProgram(this.blurProg)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, srcTex)
    gl.uniform1i(this.blurTexLoc, 0)
    gl.uniform2f(this.blurDirLoc, dx, dy)
    gl.bindVertexArray(this.emptyVAO)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  private renderWithBloom(
    items: DrawItem[],
    zoom: number, panX: number, panY: number,
    strength: number, radius: number,
  ): void {
    const { gl } = this
    const fbos = this.ensureBloomFBOs()
    const { main, ping, pong, hw, hh } = fbos
    const W = (gl.canvas as HTMLCanvasElement).width
    const H = (gl.canvas as HTMLCanvasElement).height

    this.buildCam(zoom, panX, panY)

    // 1. Render full scene to main FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, main.fbo)
    gl.viewport(0, 0, W, H)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    this.renderPasses(items)

    // 2. Render glow sources (shadow-colored shapes) to ping FBO at half res
    gl.bindFramebuffer(gl.FRAMEBUFFER, ping.fbo)
    gl.viewport(0, 0, hw, hh)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    this.renderGlowSources(items)

    // 3. Two rounds of separable Gaussian blur (ping ↔ pong)
    const stepH = radius / (4.0 * hw)
    const stepV = radius / (4.0 * hh)
    this.blurPass(ping.tex, pong.fbo, hw, hh, stepH, 0)   // round 1 H
    this.blurPass(pong.tex, ping.fbo, hw, hh, 0,     stepV) // round 1 V
    this.blurPass(ping.tex, pong.fbo, hw, hh, stepH, 0)   // round 2 H
    this.blurPass(pong.tex, ping.fbo, hw, hh, 0,     stepV) // round 2 V

    // 4. Composite scene + blurred glow to screen (additive)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, W, H)
    gl.disable(gl.BLEND)  // composite uses raw addition, no pre-multiplied alpha blending
    gl.useProgram(this.compositeProg)
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, main.tex)
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ping.tex)
    gl.uniform1i(this.compositeSceneLoc, 0)
    gl.uniform1i(this.compositeBloomLoc, 1)
    gl.uniform1f(this.compositeStrLoc, strength)
    gl.bindVertexArray(this.emptyVAO)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.enable(gl.BLEND)  // restore blend for next frame
  }

  // ── Public API ───────────────────────────────────────────────────────────

  render(
    items: DrawItem[],
    zoom: number, panX: number, panY: number,
    bloom?: { strength: number; radius: number },
  ): void {
    const { gl } = this
    const W = (gl.canvas as HTMLCanvasElement).width
    const H = (gl.canvas as HTMLCanvasElement).height

    if (bloom && bloom.strength > 0) {
      this.renderWithBloom(items, zoom, panX, panY, bloom.strength, bloom.radius)
      return
    }

    // Direct render to screen
    this.buildCam(zoom, panX, panY)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, W, H)
    this.renderPasses(items)
  }
}
