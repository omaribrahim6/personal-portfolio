'use client'

import { useEffect, useRef } from 'react'
import { useMotionPreference } from '../useMotionPreference'
import { world } from '../scroll'
import { bank, shapeOf, thunderhead } from './clouds'
import type { ShapeReply, ShapeRequest } from './shape.worker'
import { skyAt, skyGradient } from './keys'
import { fragment, vertex } from './shader'
import styles from './Sky.module.css'

const LIGHT_A = normalize([.72, -.42, .5])
const LIGHT_B = normalize([-.62, .5, .5])
const THUNDERHEAD = { uALit: '#f6866a', uAShade: '#8d88c6', uADeep: '#9c2a40', uATop: '#eba3ad' }
/** How long the thunderhead takes to grow when the page opens. */
const BLOOM = 2600
/** Width, in texels, of the image each cloud's shape is kept in. While the thunderhead is growing it is drawn at half that. */
const SHAPE = 1152

function normalize(v: number[]) { const l = Math.hypot(...v); return v.map(n => n / l) }
function rgb(color: string) { const n = parseInt(color.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] }

function link(gl: WebGLRenderingContext) {
  const program = gl.createProgram()!
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader failed to compile')
    gl.attachShader(program, shader)
  }
  gl.bindAttribLocation(program, 0, 'aPosition')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'program failed to link')
  gl.useProgram(program)
  const found = new Map<string, WebGLUniformLocation | null>()
  return (name: string) => { if (!found.has(name)) found.set(name, gl.getUniformLocation(program, name)); return found.get(name)! }
}

export default function Sky() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useMotionPreference()
  const still = useRef(reduced)

  // The preference is read every frame through a ref, so flipping it never rebuilds anything.
  useEffect(() => { still.current = reduced }, [reduced])

  useEffect(() => {
    const el = canvas.current, frame = wrap.current
    if (!el || !frame) return
    // Behind the canvas there is a plain gradient of the same sky. It follows the chapters too, and it is
    // all there is when WebGL is not available.
    let shown = -1
    function backdrop() {
      const rounded = Math.round(world.chapter)
      if (rounded !== shown) { shown = rounded; frame!.style.background = skyGradient(rounded) }
    }

    // Creating a WebGL context can block for a few hundred milliseconds. Let the page paint first:
    // the ground and the words arrive, then the sky.
    const init = () => {
      const gl = el.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false })
      if (!gl) {
        let loop = requestAnimationFrame(function follow() { backdrop(); loop = requestAnimationFrame(follow) })
        return () => cancelAnimationFrame(loop)
      }
      // While the page hydrates the hook still reports the server's cautious answer. Ask the browser directly,
      // or the opening would be skipped for everyone.
      still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Start a little under native resolution; the painting is soft and the grain hides the difference.
      let scale = Math.min(window.devicePixelRatio || 1, 1.5)
      let width = 0, height = 0
      let raf = 0, last = 0, start = 0, painted = 0, slow = 0, frames = 0
      let chapter = world.chapter
      let dirty = true, lost = false, wasReduced = still.current
      // grown: the full-size thunderhead has been asked for. settled: it has arrived. banked: the bank has been asked for.
      let grown = false, settled = false, banked = false
      const pointer = [0, 0]
      let at: ReturnType<typeof link>

      /** Hand a cloud's shape to the shader as a texture. */
      function receive(image: ShapeReply) {
        if (lost) return
        gl!.activeTexture(gl!.TEXTURE0 + image.which)
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, image.width, image.height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, image.data)
        if (image.which === 0 && image.size === SHAPE) settled = true
        dirty = true
      }

      // Shapes are drawn by a worker, one request at a time. If a worker cannot be started they are drawn here instead.
      let worker: Worker | null = null
      let busy = false
      const waiting: ShapeRequest[] = []
      function shape(request: ShapeRequest) {
        if (!worker) return receive({ ...request, ...shapeOf(request.which ? bank : thunderhead, request.size, request.bloom) })
        if (busy) { waiting.push(request); return }
        busy = true
        worker.postMessage(request)
      }
      try {
        worker = new Worker(new URL('./shape.worker.ts', import.meta.url), { type: 'module' })
        worker.onmessage = (event: MessageEvent<ShapeReply>) => {
          busy = false
          receive(event.data)
          const next = waiting.shift()
          if (next) shape(next)
        }
        worker.onerror = () => { worker = null; busy = false; grown = settled = banked = false; waiting.length = 0 }
      } catch {
        worker = null
      }

      /** Everything that lives on the GPU. Built once, and again if the browser takes the context away and gives it back. */
      function build() {
        at = link(gl!)
        gl!.bindBuffer(gl!.ARRAY_BUFFER, gl!.createBuffer())
        gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW)
        gl!.enableVertexAttribArray(0)
        gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0)

        for (const unit of [0, 1]) {
          gl!.activeTexture(gl!.TEXTURE0 + unit)
          gl!.bindTexture(gl!.TEXTURE_2D, gl!.createTexture())
          gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, 1, 1, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, new Uint8Array(4))
          gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
          gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
          gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
          gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
        }

        for (const [name, color] of Object.entries(THUNDERHEAD)) gl!.uniform3fv(at(name), rgb(color))
        gl!.uniform3fv(at('uLightA'), LIGHT_A)
        gl!.uniform3fv(at('uLightB'), LIGHT_B)
        gl!.uniform1i(at('uShapeA'), 0)
        gl!.uniform1i(at('uShapeB'), 1)
        gl!.uniform4fv(at('uBoxA'), thunderhead.box)
        gl!.uniform4fv(at('uBoxB'), bank.box)
        grown = settled = banked = false
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
        backdrop()
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
        // The thunderhead grows once, as the page opens: a half-size shape for each step of the way, then the full one.
        // Without a worker, or with motion reduced, it simply arrives fully grown.
        if (!grown && !(busy && worker)) {
          const bloom = reduced || !worker ? 1 : Math.min(1, (now - start) / BLOOM)
          grown = bloom === 1
          shape({ which: 0, size: grown ? SHAPE : SHAPE / 2, bloom })
        }
        // The bank is not needed until the morning, so it waits for the opening to be over.
        const s = skyAt(chapter, width / height)
        if (!banked && (settled || s.b[3] > .01)) { banked = true; shape({ which: 1, size: SHAPE, bloom: 1 }) }

        // With motion reduced the sky is a still: redraw only when the scroll position, the size or a shape changes.
        if (reduced && !moving && !dirty) return
        // Twinkling and slow boiling do not need sixty frames a second. Scrolling and the opening do.
        if (settled && !moving && !dirty && now - painted < 30) return
        painted = now
        dirty = false

        const drift = [pointer[0] * .006, pointer[1] * .004]
        gl!.uniform2f(at('uRes'), width, height)
        gl!.uniform1f(at('uPx'), Math.max(1, scale * 1.35))
        gl!.uniform1f(at('uTime'), reduced ? 12 : (now - start) / 1000)
        gl!.uniform3fv(at('uSkyTop'), s.top)
        gl!.uniform3fv(at('uSkyMid'), s.mid)
        gl!.uniform3fv(at('uSkyLow'), s.low)
        gl!.uniform3fv(at('uGlow'), s.glow)
        gl!.uniform2fv(at('uGlowAt'), s.glowAt)
        gl!.uniform1f(at('uStars'), s.stars)
        gl!.uniform4f(at('uOrb'), s.orb[0] - drift[0] * .5, s.orb[1] + drift[1] * .5, s.orb[2], s.orb[3])
        gl!.uniform3fv(at('uOrbCol'), s.orbCol)
        gl!.uniform1f(at('uHalo'), s.halo)
        gl!.uniform4f(at('uA'), s.a[0] - drift[0], s.a[1] + drift[1], s.a[2], s.a[3])
        gl!.uniform4f(at('uB'), s.b[0] - drift[0], s.b[1] + drift[1], s.b[2], s.b[3])
        gl!.uniform3fv(at('uBLit'), s.bLit)
        gl!.uniform3fv(at('uBShade'), s.bShade)
        gl!.uniform3fv(at('uBDeep'), s.bDeep)
        gl!.uniform3fv(at('uBTop'), s.bTop)
        gl!.drawArrays(gl!.TRIANGLES, 0, 3)

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
        worker?.terminate()
        observer.disconnect()
        window.removeEventListener('pointermove', onPointer)
        window.removeEventListener('scroll', redraw)
        el.removeEventListener('webglcontextlost', onLost)
        el.removeEventListener('webglcontextrestored', boot)
      }
    }

    let dispose = () => {}
    let timer = 0, tries = 0
    let wait = requestAnimationFrame(function ready() {
      // Give the first landscape a moment to be painted; do not wait for it for ever.
      if (++tries < 40 && !document.querySelector('[data-terrain] canvas[data-painted]')) { wait = requestAnimationFrame(ready); return }
      timer = window.setTimeout(() => { dispose = init() }, 0)
    })
    return () => {
      cancelAnimationFrame(wait)
      window.clearTimeout(timer)
      dispose()
    }
  }, [])

  return (
    <div ref={wrap} className={styles.sky} style={{ background: skyGradient(0) }} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  )
}
