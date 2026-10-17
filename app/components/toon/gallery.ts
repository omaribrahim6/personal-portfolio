import * as THREE from 'three'
import { Inker, type InkOptions } from './ink'

// Every illustration on the page is drawn by one WebGL renderer that nobody sees. Each one has a plain 2D
// canvas in the page; when it is on screen, its scene is drawn through the ink and the finished picture is
// copied across. One context however many pictures there are, and nothing is drawn that is scrolled away.

export interface Diorama {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  ink?: InkOptions
  /** The picture's shape has changed: fit the camera to it. */
  resize?(width: number, height: number): void
  /** Move on to `t` seconds. */
  update?(t: number, dt: number): void
  /** Where the pointer is over the picture, -1..1 both ways (up is +1). */
  pointer?(x: number, y: number): void
  /** Something on the page changed what the picture should show. */
  set?(state: string): void
  /** Named places in the picture that the page lays things over. */
  anchors?: Record<string, THREE.Object3D>
  dispose?(): void
}

type View = {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  diorama: Diorama
  inker: Inker | null
  boil: number
  width: number
  height: number
  visible: boolean
  still: boolean
  /** Set when a still picture needs drawing again. */
  dirty: boolean
  born: number
  last: number
}

const MAX_PIXELS = 2_800_000

let renderer: THREE.WebGLRenderer | null = null
let failed = false
const views = new Set<View>()
let frame = 0
let observer: IntersectionObserver | null = null
let resizer: ResizeObserver | null = null
const byCanvas = new Map<Element, View>()

function getRenderer() {
  if (renderer || failed) return renderer
  try {
    const canvas = document.createElement('canvas')
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.setClearColor(0x000000, 0)
  } catch {
    failed = true
    renderer = null
  }
  return renderer
}

function measure(view: View) {
  const box = view.canvas.getBoundingClientRect()
  const ratio = Math.min(window.devicePixelRatio || 1, 1.75)
  let w = Math.max(1, Math.round(box.width * ratio)), h = Math.max(1, Math.round(box.height * ratio))
  const over = Math.sqrt(w * h / MAX_PIXELS)
  if (over > 1) { w = Math.round(w / over); h = Math.round(h / over) }
  if (w === view.width && h === view.height) return
  view.width = w
  view.height = h
  view.canvas.width = w
  view.canvas.height = h
  view.diorama.camera.aspect = w / h
  view.diorama.camera.updateProjectionMatrix()
  view.diorama.resize?.(w, h)
  view.dirty = true
}

function draw(view: View, now: number) {
  const r = getRenderer()
  if (!r || view.width < 2 || view.height < 2) return
  if (!view.inker) view.inker = new Inker(r, { ...view.diorama.ink, boil: view.still ? 0 : view.boil })
  const t = view.still ? 4 : (now - view.born) / 1000
  const dt = view.still ? 0 : Math.min(.1, (now - view.last) / 1000)
  view.last = now
  view.diorama.update?.(t, dt)

  // The renderer's own canvas only ever grows; each picture is drawn into its lower left corner.
  const size = r.getSize(new THREE.Vector2())
  if (size.x < view.width || size.y < view.height) r.setSize(Math.max(size.x, view.width), Math.max(size.y, view.height), false)
  const full = r.getSize(new THREE.Vector2())
  view.inker.setSize(view.width, view.height)
  r.setViewport(0, 0, view.width, view.height)
  view.inker.render(view.diorama.scene, view.diorama.camera, t)
  view.context.clearRect(0, 0, view.width, view.height)
  view.context.drawImage(r.domElement, 0, full.y - view.height, view.width, view.height, 0, 0, view.width, view.height)
  view.dirty = false
}

function tick(now: number) {
  frame = 0
  let running = false
  for (const view of views) {
    if (!view.visible) continue
    if (view.still) { if (view.dirty) draw(view, now) } else { draw(view, now); running = true }
  }
  if (running) frame = requestAnimationFrame(tick)
}

function wake() {
  if (!frame) frame = requestAnimationFrame(tick)
}

/** Whether pictures can be drawn here at all. */
export function supported() {
  return !!getRenderer()
}

/**
 * Hang a diorama in a canvas. It is drawn whenever the canvas is on screen; `still` draws it once (and again
 * on resize) instead of every frame. Returns a function that takes it down again.
 */
export function hang(canvas: HTMLCanvasElement, diorama: Diorama, options: { still?: boolean } = {}) {
  const context = canvas.getContext('2d')
  if (!context || !getRenderer()) return { redraw() {}, still() {}, remove() { diorama.dispose?.() } }
  const view: View = {
    canvas, context, diorama, inker: null, boil: diorama.ink?.boil ?? 5, width: 0, height: 0, visible: false,
    still: !!options.still, dirty: true, born: performance.now(), last: performance.now(),
  }
  views.add(view)
  byCanvas.set(canvas, view)
  observer ??= new IntersectionObserver(entries => {
    for (const entry of entries) {
      const v = byCanvas.get(entry.target)
      if (!v) continue
      v.visible = entry.isIntersecting
      if (v.visible) { v.dirty = true; v.last = performance.now() }
    }
    wake()
  }, { rootMargin: '120px 0px' })
  resizer ??= new ResizeObserver(entries => {
    for (const entry of entries) { const v = byCanvas.get(entry.target); if (v) measure(v) }
    wake()
  })
  observer.observe(canvas)
  resizer.observe(canvas)
  measure(view)
  return {
    /** Draw a still picture again, after something in it changed. */
    redraw() { view.dirty = true; wake() },
    /** Stop or start the clock. */
    still(still: boolean) {
      view.still = still
      view.inker?.set({ boil: still ? 0 : view.boil })
      view.dirty = true
      wake()
    },
    remove() {
      views.delete(view)
      byCanvas.delete(canvas)
      observer?.unobserve(canvas)
      resizer?.unobserve(canvas)
      view.inker?.dispose()
      diorama.dispose?.()
    },
  }
}

export type Hung = ReturnType<typeof hang>

/** Where an anchor is in its picture right now, as fractions of the width and height from the top left. */
export function locate(diorama: Diorama, name: string) {
  const anchor = diorama.anchors?.[name]
  if (!anchor) return null
  const p = anchor.getWorldPosition(new THREE.Vector3()).project(diorama.camera)
  return { x: (p.x + 1) / 2, y: (1 - p.y) / 2 }
}
