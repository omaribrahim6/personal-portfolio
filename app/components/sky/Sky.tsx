'use client'

import { useEffect, useRef } from 'react'
import { useMotionPreference } from '../useMotionPreference'
import { world } from '../scroll'
import { bank, thunderhead } from './clouds'
import { skyAt, skyGradient } from './keys'
import { bake, fragment, vertex } from './shader'
import styles from './Sky.module.css'

const LIGHT_A = normalize([.72, -.42, .5])
const LIGHT_B = normalize([-.62, .5, .5])
const THUNDERHEAD = { uALit: '#f6866a', uAShade: '#8d88c6', uADeep: '#9c2a40', uATop: '#eba3ad' }
/** How long the thunderhead takes to grow when the page opens. */
const BLOOM = 2600
/** Width, in texels, of the texture each cloud's shape is kept in. */
const SHAPE = 1152

function normalize(v: number[]) { const l = Math.hypot(...v); return v.map(n => n / l) }
function rgb(color: string) { const n = parseInt(color.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] }

function link(gl: WebGLRenderingContext, fragmentSource: string) {
  const program = gl.createProgram()!
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader failed to compile')
    gl.attachShader(program, shader)
  }
  gl.bindAttribLocation(program, 0, 'aPosition')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'program failed to link')
  const found = new Map<string, WebGLUniformLocation | null>()
  const at = (name: string) => { if (!found.has(name)) found.set(name, gl.getUniformLocation(program, name)); return found.get(name)! }
  return { program, at }
}

export default function Sky() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useMotionPreference()
  const still = useRef(reduced)

  // The preference is read every frame through a ref, so flipping it never rebuilds the shaders.
  useEffect(() => { still.current = reduced }, [reduced])

  useEffect(() => {
    const el = canvas.current, frame = wrap.current
    if (!el || !frame) return
    const gl = el.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false })
    if (!gl) return

    // Start a little under native resolution; the painting is soft and the grain hides the difference.
    let scale = Math.min(window.devicePixelRatio || 1, 1.5)
    let width = 0, height = 0
    let raf = 0, last = 0, start = 0, painted = 0, slow = 0, frames = 0
    let chapter = world.chapter, shown = -1
    let dirty = true, lost = false, grown = false, wasReduced = still.current
    const pointer = [0, 0]
    let sky: ReturnType<typeof link>, shaper: ReturnType<typeof link>
    let shapes: { texture: WebGLTexture; target: WebGLFramebuffer; size: [number, number]; box: number[] }[] = []

    /** Everything that lives on the GPU. Built once, and again if the browser takes the context away and gives it back. */
    function build() {
      sky = link(gl!, fragment)
      shaper = link(gl!, bake)
      const buffer = gl!.createBuffer()
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer)
      gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW)
      gl!.enableVertexAttribArray(0)
      gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0)

      shapes = [thunderhead, bank].map(({ box }, unit) => {
        const size: [number, number] = [SHAPE, Math.round(SHAPE * box[3] / box[2])]
        const texture = gl!.createTexture()!
        gl!.activeTexture(gl!.TEXTURE0 + unit)
        gl!.bindTexture(gl!.TEXTURE_2D, texture)
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, size[0], size[1], 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null)
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
        const target = gl!.createFramebuffer()!
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, target)
        gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0)
        return { texture, target, size, box }
      })
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)

      gl!.useProgram(sky.program)
      for (const [name, color] of Object.entries(THUNDERHEAD)) gl!.uniform3fv(sky.at(name), rgb(color))
      gl!.uniform3fv(sky.at('uLightA'), LIGHT_A)
      gl!.uniform3fv(sky.at('uLightB'), LIGHT_B)
      gl!.uniform1i(sky.at('uShapeA'), 0)
      gl!.uniform1i(sky.at('uShapeB'), 1)
      gl!.uniform4fv(sky.at('uBoxA'), shapes[0].box)
      gl!.uniform4fv(sky.at('uBoxB'), shapes[1].box)
      grown = false
      shape(1, 1)
    }

    /** Draw one cloud's shape into its texture. */
    function shape(which: number, bloom: number) {
      const { target, size, box } = shapes[which]
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target)
      gl!.viewport(0, 0, size[0], size[1])
      gl!.useProgram(shaper.program)
      gl!.uniform2f(shaper.at('uSize'), size[0], size[1])
      gl!.uniform4fv(shaper.at('uBox'), box)
      gl!.uniform1f(shaper.at('uBloom'), bloom)
      gl!.uniform1f(shaper.at('uWhich'), which)
      gl!.drawArrays(gl!.TRIANGLES, 0, 3)
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
      gl!.viewport(0, 0, width, height)
      gl!.useProgram(sky.program)
    }

    function resize() {
      width = Math.max(1, Math.round(el!.clientWidth * scale))
      height = Math.max(1, Math.round(el!.clientHeight * scale))
      el!.width = width
      el!.height = height
      gl!.viewport(0, 0, width, height)
      dirty = true
    }

    function draw(now: number) {
      raf = requestAnimationFrame(draw)
      const reduced = still.current
      if (reduced !== wasReduced) { wasReduced = reduced; dirty = true }
      if (lost || document.hidden || !world.skyVisible) { last = now; return }
      if (!start) start = now
      const dt = Math.min(.1, (now - last) / 1000 || 0)
      last = now

      const target = world.chapter
      const next = reduced ? target : chapter + (target - chapter) * Math.min(1, dt * 5)
      const moving = Math.abs(next - chapter) > .0004
      chapter = moving ? next : chapter
      if (!reduced) {
        pointer[0] += (world.pointer[0] - pointer[0]) * Math.min(1, dt * 3)
        pointer[1] += (world.pointer[1] - pointer[1]) * Math.min(1, dt * 3)
      }
      // With motion reduced the sky is a still: redraw only when the scroll position or the size changes.
      if (reduced && grown && !moving && !dirty) return
      // Twinkling and slow boiling do not need sixty frames a second. Scrolling and the opening do.
      if (grown && !moving && !dirty && now - painted < 30) return
      painted = now
      dirty = false

      // The thunderhead grows once, as the page opens. After that its shape is never computed again.
      if (!grown) {
        const bloom = reduced ? 1 : Math.min(1, (now - start) / BLOOM)
        shape(0, bloom)
        grown = bloom === 1
      }

      const s = skyAt(chapter, width / height)
      const drift = [pointer[0] * .006, pointer[1] * .004]
      gl!.uniform2f(sky.at('uRes'), width, height)
      gl!.uniform1f(sky.at('uPx'), Math.max(1, scale * 1.35))
      gl!.uniform1f(sky.at('uTime'), reduced ? 12 : (now - start) / 1000)
      gl!.uniform3fv(sky.at('uSkyTop'), s.top)
      gl!.uniform3fv(sky.at('uSkyMid'), s.mid)
      gl!.uniform3fv(sky.at('uSkyLow'), s.low)
      gl!.uniform3fv(sky.at('uGlow'), s.glow)
      gl!.uniform2fv(sky.at('uGlowAt'), s.glowAt)
      gl!.uniform1f(sky.at('uStars'), s.stars)
      gl!.uniform4f(sky.at('uOrb'), s.orb[0] - drift[0] * .5, s.orb[1] + drift[1] * .5, s.orb[2], s.orb[3])
      gl!.uniform3fv(sky.at('uOrbCol'), s.orbCol)
      gl!.uniform1f(sky.at('uHalo'), s.halo)
      gl!.uniform4f(sky.at('uA'), s.a[0] - drift[0], s.a[1] + drift[1], s.a[2], s.a[3])
      gl!.uniform4f(sky.at('uB'), s.b[0] - drift[0], s.b[1] + drift[1], s.b[2], s.b[3])
      gl!.uniform3fv(sky.at('uBLit'), s.bLit)
      gl!.uniform3fv(sky.at('uBShade'), s.bShade)
      gl!.uniform3fv(sky.at('uBDeep'), s.bDeep)
      gl!.uniform3fv(sky.at('uBTop'), s.bTop)
      gl!.drawArrays(gl!.TRIANGLES, 0, 3)

      const rounded = Math.round(chapter)
      if (rounded !== shown) { shown = rounded; frame!.style.background = skyGradient(rounded) }
      if (!el!.dataset.ready) el!.dataset.ready = 'true'

      // If the machine is struggling, paint fewer pixels rather than drop frames. Long gaps are the browser
      // throttling a background tab, not a slow frame, so they are left out of the average.
      if (!reduced && moving && dt > 0 && dt < .08) {
        slow += dt
        if (++frames === 50) {
          if (slow / frames > .027 && scale > .6) { scale = Math.max(.6, scale * .8); resize() }
          slow = 0
          frames = 0
        }
      }
    }

    function boot() {
      try {
        build()
        lost = false
        dirty = true
      } catch (error) {
        lost = true
        console.warn(`Sky shader unavailable, keeping the gradient. ${error instanceof Error ? error.message : ''}`)
      }
    }

    function onPointer(event: PointerEvent) {
      if (event.pointerType === 'touch') return
      world.pointer = [event.clientX / window.innerWidth * 2 - 1, event.clientY / window.innerHeight * 2 - 1]
    }
    function onLost(event: Event) { event.preventDefault(); lost = true; delete el!.dataset.ready }
    const redraw = () => { dirty = true }

    resize()
    boot()
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', redraw, { passive: true })
    el.addEventListener('webglcontextlost', onLost)
    el.addEventListener('webglcontextrestored', boot)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', redraw)
      el.removeEventListener('webglcontextlost', onLost)
      el.removeEventListener('webglcontextrestored', boot)
    }
  }, [])

  return (
    <div ref={wrap} className={styles.sky} style={{ background: skyGradient(0) }} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  )
}
