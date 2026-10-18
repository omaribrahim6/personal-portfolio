import * as THREE from 'three'
import { Inker } from '../toon/ink'
import { cloud, cloudMaterial, ripples, toon } from '../toon/kit'
import { createSky } from './sky'

// The voyage: one world, one camera, and the page's scroll as the throttle. The world is a string of stops
// (stations) across an archipelago. Each has its own models and a few camera keys; the keys of all the stops,
// put end to end, make one rail the camera rides as the page scrolls, pausing at each key while its card is
// read and flying on between them. The light runs from morning at the first stop to sunset at the last.
// Only the stops near the camera are drawn, the sun's shadows follow wherever the camera is looking, and
// the resolution drops if the device cannot keep up.

export type V3 = [number, number, number]

/** The light at a stop. */
export type Palette = {
  sky: [string, string, string, string, string]
  sun: V3
  sunColor: string
  sunSize?: number
  key: string
  strength: number
  hemi: [string, string]
  fill: number
  water: [string, string]
  cloud: [string, string]
  fog?: [number, number]
}

/**
 * A camera key. `at` is how far through the stop's section (0 to 1), or `beat` is which of its cards: the key
 * is reached when that card is in the middle of the screen. `hold` keeps the camera there for so many
 * screen-heights of scrolling. `card` is the side of the screen the card is on, so the picture moves over.
 */
export type Key = { at?: number; beat?: number; eye: V3; look: V3; fov?: number; hold?: number; card?: 'left' | 'right' | 'none' }

export interface Station {
  id: string
  group: THREE.Object3D
  /** Where it is, for deciding whether to draw it. */
  centre: THREE.Vector3
  radius: number
  keys: Key[]
  light: Palette
  /**
   * `local` is how far through its section the page is (0 to 1); `near` whether it is being drawn; `beat`
   * which card is in the middle of the screen, as a number that runs on between cards (2.5 is half way from
   * the third card to the fourth) and holds still while a card is being read.
   */
  update?(t: number, dt: number, local: number, near: boolean, beat: number): void
  /** Something on the page changed: a lever pulled, a filter chosen. */
  set?(name: string, value: string): void
  anchors?: Record<string, THREE.Object3D>
  /** Things that can be clicked, and what clicking them says to the page. */
  pickable?: THREE.Object3D[]
  pick?(object: THREE.Object3D): { name: string; value: string } | void
}

export type Section = { id: string; top: number; height: number; beats: number[] }

type Rail = { y: number; from: number; to: number; eye: THREE.Vector3; look: THREE.Vector3; fov: number; shift: number; station: string; beat?: number }

const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const t2 = t * t, t3 = t2 * t
  return .5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}
const smooth = (t: number) => t * t * (3 - 2 * t)

export class Engine {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(32, 1, .2, 900)
  private renderer: THREE.WebGLRenderer
  private inker: Inker
  private stations: Station[] = []
  private sections = new Map<string, Section>()
  private rail: Rail[] = []
  private sky = createSky()
  private sun = new THREE.DirectionalLight('#fff1d8', 2.6)
  private hemi = new THREE.HemisphereLight('#a9c4ff', '#b5c48f', 1.6)
  private water: THREE.Mesh
  private waterMaterial: THREE.MeshToonMaterial
  private waves: THREE.Texture
  private clouds = new THREE.Group()
  private cloudShade = cloudMaterial('#fffffe', '#b9c9e7') as THREE.ShaderMaterial
  private scroll = { target: 0, now: 0, vh: 1 }
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  private size = { w: 1, h: 1, ratio: 1, max: 1.5 }
  private clock = 0
  private last = 0
  private frame = 0
  private slow = 0
  private raycaster = new THREE.Raycaster()
  private listeners = new Set<(name: string, value: string) => void>()
  private palette = {
    bands: Array.from({ length: 5 }, () => new THREE.Color()), sun: new THREE.Vector3(), sunColor: new THREE.Color(), sunSize: .05,
    key: new THREE.Color(), strength: 2.6, hemiSky: new THREE.Color(), hemiGround: new THREE.Color(), fill: 1.6,
    water: new THREE.Color(), dash: new THREE.Color(), cloudTop: new THREE.Color(), cloudUnder: new THREE.Color(), fog: [60, 260] as [number, number],
  }
  /** Whatever the camera is looking at now, in the world. */
  readonly focus = new THREE.Vector3()
  readonly fog: THREE.Fog

  constructor(private canvas: HTMLCanvasElement, private reduced = false) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.inker = new Inker(this.renderer, { line: 1.4, boil: reduced ? 0 : 4, depthEdge: .05 })
    this.fog = new THREE.Fog('#d3ecef', 60, 260)
    this.scene.fog = this.fog

    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    const s = this.sun.shadow.camera
    s.left = -26; s.right = 26; s.top = 26; s.bottom = -26; s.near = 1; s.far = 160
    this.sun.shadow.bias = -.0006
    this.sun.shadow.normalBias = .03
    this.scene.add(this.sun, this.sun.target, this.hemi, this.sky.dome)

    // The sea: one wide sheet that travels with the camera, its ripples staying put in the world.
    this.waves = ripples('#ffffff', '#ffffff')
    this.waves.repeat.set(160, 160)
    this.waterMaterial = new THREE.MeshToonMaterial({ color: '#3fb0c2', map: this.waves, gradientMap: (toon('#3fb0c2') as THREE.MeshToonMaterial).gradientMap })
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), this.waterMaterial)
    this.water.rotation.x = -Math.PI / 2
    this.water.receiveShadow = true
    this.water.layers.enable(1)
    this.scene.add(this.water)

    // Clouds, high and far, all the way along.
    for (let i = 0; i < 46; i++) {
      const c = cloud(6 + (i * 37 % 11), 100 + i)
      c.traverse(node => { if (node instanceof THREE.Mesh) node.material = this.cloudShade })
      const a = i * 2.39996, r = 70 + (i * 53 % 160)
      c.position.set(Math.cos(a) * r * 1.4, 26 + (i * 17 % 30), -260 + Math.sin(a) * r * 1.8)
      c.rotation.y = a
      this.clouds.add(c)
    }
    this.scene.add(this.clouds)

    canvas.addEventListener('click', this.onClick)
    window.addEventListener('pointermove', this.onPointer, { passive: true })
    this.resize()
    this.last = performance.now()
    this.frame = requestAnimationFrame(this.tick)
  }

  /** Something in the world was clicked, or something in a stop changed by itself. */
  listen(listener: (name: string, value: string) => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  add(station: Station) {
    this.stations.push(station)
    this.scene.add(station.group)
    this.build()
  }

  set(id: string, name: string, value: string) {
    this.stations.find(station => station.id === id)?.set?.(name, value)
  }

  /** Where the page's sections are. Called when anything on the page changes size. */
  measure(sections: Section[], vh: number) {
    this.sections = new Map(sections.map(section => [section.id, section]))
    this.scroll.vh = vh
    this.build()
  }

  scrollTo(y: number, jump = false) {
    this.scroll.target = y
    if (jump) this.scroll.now = y
  }

  /** Where a named place in a stop is on the screen, as fractions from the top left, if it is in front. */
  locate(id: string, name: string) {
    const anchor = this.stations.find(station => station.id === id)?.anchors?.[name]
    if (!anchor) return null
    const p = anchor.getWorldPosition(new THREE.Vector3()).project(this.camera)
    if (p.z > 1) return null
    return { x: (p.x + 1) / 2, y: (1 - p.y) / 2 }
  }

  /** Which card of a stop is in the middle of the screen, running on between cards. */
  beat(id: string) {
    const y = this.scroll.now
    const beats = this.rail.filter(r => r.station === id && r.beat !== undefined)
    if (!beats.length) return 0
    if (y <= beats[0].to) return beats[0].beat! - Math.max(0, (beats[0].from - y) / this.scroll.vh)
    for (let i = 0; i < beats.length - 1; i++) {
      const a = beats[i], b = beats[i + 1]
      if (y <= a.to) return a.beat!
      if (y < b.from) return a.beat! + (b.beat! - a.beat!) * smooth((y - a.to) / Math.max(1, b.from - a.to))
    }
    const last = beats[beats.length - 1]
    return last.beat! + Math.max(0, (y - last.to) / this.scroll.vh)
  }

  /** How far through its section the page is, for a stop. */
  progress(id: string) {
    const section = this.sections.get(id)
    if (!section) return 0
    return Math.min(1, Math.max(0, (this.scroll.now - section.top) / Math.max(1, section.height - this.scroll.vh)))
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight
    this.size.w = w
    this.size.h = h
    // A cap on the pixels drawn: the ink pass draws the scene twice and then once more.
    const dpr = Math.min(window.devicePixelRatio || 1, this.size.max)
    const budget = Math.sqrt(3_400_000 / (w * h * dpr * dpr))
    this.size.ratio = dpr * Math.min(1, budget)
    this.renderer.setPixelRatio(this.size.ratio)
    this.renderer.setSize(w, h, false)
    const buffer = this.renderer.getDrawingBufferSize(new THREE.Vector2())
    this.inker.setSize(buffer.x, buffer.y)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  /** Lay all the keys end to end, in scroll positions. */
  private build() {
    const rail: Rail[] = []
    const vh = this.scroll.vh
    for (const station of this.stations) {
      const section = this.sections.get(station.id)
      if (!section) continue
      for (const key of station.keys) {
        let y = section.top
        if (key.beat !== undefined && section.beats[key.beat] !== undefined) y = section.top + section.beats[key.beat] - vh / 2
        else y = section.top + (key.at ?? 0) * Math.max(0, section.height - vh)
        const hold = (key.hold ?? 0) * vh
        rail.push({
          y, from: y - hold / 2, to: y + hold / 2,
          eye: new THREE.Vector3(...key.eye), look: new THREE.Vector3(...key.look), fov: key.fov ?? 32,
          shift: key.card === 'left' ? 1 : key.card === 'right' ? -1 : 0,
          station: station.id, beat: key.beat,
        })
      }
    }
    rail.sort((a, b) => a.y - b.y)
    // Holds may not overlap their neighbours.
    for (let i = 1; i < rail.length; i++) {
      if (rail[i].from < rail[i - 1].to) {
        const mid = (rail[i].y + rail[i - 1].y) / 2
        rail[i - 1].to = Math.min(rail[i - 1].to, mid - 1)
        rail[i].from = Math.max(rail[i].from, mid + 1)
      }
    }
    this.rail = rail
  }

  /** Where the camera is for a scroll position: on a key, or on the curve between two. */
  private ride(y: number) {
    const rail = this.rail
    if (!rail.length) return
    let k = 0
    while (k < rail.length - 1 && y > rail[k + 1].from) k++
    const a = rail[k], b = rail[Math.min(rail.length - 1, k + 1)]
    let t = 0
    if (y > a.to && b !== a) t = Math.min(1, (y - a.to) / Math.max(1, b.from - a.to))
    if (y < a.from) t = 0
    if (this.reduced) t = t < .5 ? 0 : 1
    t = smooth(t)
    const p0 = rail[Math.max(0, k - 1)], p3 = rail[Math.min(rail.length - 1, k + 2)]
    const e = this.camera.position, l = this.focus
    e.set(catmull(p0.eye.x, a.eye.x, b.eye.x, p3.eye.x, t), catmull(p0.eye.y, a.eye.y, b.eye.y, p3.eye.y, t), catmull(p0.eye.z, a.eye.z, b.eye.z, p3.eye.z, t))
    l.set(catmull(p0.look.x, a.look.x, b.look.x, p3.look.x, t), catmull(p0.look.y, a.look.y, b.look.y, p3.look.y, t), catmull(p0.look.z, a.look.z, b.look.z, p3.look.z, t))
    // On a tall screen, stand further back so the sides stay in.
    const aspect = this.size.w / this.size.h
    if (aspect < 1.2) e.sub(l).multiplyScalar(Math.pow(1.2 / aspect, .9)).add(l)
    // Flying between stops, rise a little over the water.
    const span = a.eye.distanceTo(b.eye)
    if (span > 40) e.y += Math.sin(t * Math.PI) * Math.min(18, span * .12)
    this.camera.fov = a.fov + (b.fov - a.fov) * t
    // Sway: the camera is held, not mounted.
    if (!this.reduced) {
      e.x += Math.sin(this.clock * .31) * .06 + this.pointer.x * .5
      e.y += Math.sin(this.clock * .23) * .05 + this.pointer.y * .3
    }
    this.camera.lookAt(l)
    // The card on one side: the picture moves over to the other. On a tall screen the cards are at the
    // bottom, so the picture moves up instead.
    const shift = a.shift + (b.shift - a.shift) * t
    const { w, h } = this.size
    if (w / h > .9) this.camera.setViewOffset(w, h, -shift * w * .17, 0, w, h)
    else this.camera.setViewOffset(w, h, 0, h * .16, w, h)
    this.camera.updateProjectionMatrix()
  }

  /** The light, from the stops on either side of where the page is. */
  private shine(y: number) {
    const points: { y: number; light: Palette }[] = []
    for (const station of this.stations) {
      const section = this.sections.get(station.id)
      if (section) points.push({ y: section.top + section.height / 2, light: station.light })
    }
    if (!points.length) return
    points.sort((a, b) => a.y - b.y)
    let i = 0
    while (i < points.length - 1 && y > points[i + 1].y) i++
    const a = points[i], b = points[Math.min(points.length - 1, i + 1)]
    const t = b === a ? 0 : smooth(Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y))))
    const p = this.palette, ca = new THREE.Color(), cb = new THREE.Color()
    const mix = (out: THREE.Color, x: string, z: string) => out.copy(ca.set(x)).lerp(cb.set(z), t)
    a.light.sky.forEach((c, k) => mix(p.bands[k], c, b.light.sky[k]))
    p.sun.set(...a.light.sun).lerp(new THREE.Vector3(...b.light.sun), t).normalize()
    mix(p.sunColor, a.light.sunColor, b.light.sunColor)
    p.sunSize = (a.light.sunSize ?? .05) + ((b.light.sunSize ?? .05) - (a.light.sunSize ?? .05)) * t
    mix(p.key, a.light.key, b.light.key)
    p.strength = a.light.strength + (b.light.strength - a.light.strength) * t
    mix(p.hemiSky, a.light.hemi[0], b.light.hemi[0])
    mix(p.hemiGround, a.light.hemi[1], b.light.hemi[1])
    p.fill = a.light.fill + (b.light.fill - a.light.fill) * t
    mix(p.water, a.light.water[0], b.light.water[0])
    mix(p.cloudTop, a.light.cloud[0], b.light.cloud[0])
    mix(p.cloudUnder, a.light.cloud[1], b.light.cloud[1])
    const fa = a.light.fog ?? [60, 260], fb = b.light.fog ?? [60, 260]
    this.fog.near = fa[0] + (fb[0] - fa[0]) * t
    this.fog.far = fa[1] + (fb[1] - fa[1]) * t

    this.sky.set(p.bands, p.sun, p.sunColor, p.sunSize)
    this.fog.color.copy(p.bands[0])
    this.sun.color.copy(p.key)
    this.sun.intensity = p.strength
    this.hemi.color.copy(p.hemiSky)
    this.hemi.groundColor.copy(p.hemiGround)
    this.hemi.intensity = p.fill
    this.waterMaterial.color.copy(p.water)
    this.cloudShade.uniforms.uTop.value.copy(p.cloudTop)
    this.cloudShade.uniforms.uUnder.value.copy(p.cloudUnder)
    this.cloudShade.uniforms.uSun.value.copy(p.sun)
  }

  private tick = (now: number) => {
    this.frame = requestAnimationFrame(this.tick)
    const dt = Math.min(.1, (now - this.last) / 1000)
    this.last = now
    if (document.hidden) return
    this.clock += this.reduced ? 0 : dt

    // The scroll, eased: the camera catches up rather than jumping.
    const k = this.reduced ? 1 : 1 - Math.exp(-dt * 5.5)
    this.scroll.now += (this.scroll.target - this.scroll.now) * k
    const kp = 1 - Math.exp(-dt * 3)
    this.pointer.x += (this.pointer.tx - this.pointer.x) * kp
    this.pointer.y += (this.pointer.ty - this.pointer.y) * kp
    const y = this.scroll.now
    this.ride(y)
    this.shine(y)

    // Sun and shadows travel with whatever the camera is looking at.
    this.sun.target.position.copy(this.focus)
    this.sun.position.copy(this.focus).addScaledVector(this.palette.sun, 70)
    this.sky.dome.position.copy(this.camera.position)
    this.water.position.set(Math.round(this.camera.position.x / 6) * 6, 0, Math.round(this.camera.position.z / 6) * 6)
    this.waves.offset.set(this.water.position.x / 1200 * 160, -this.water.position.z / 1200 * 160)
    this.clouds.position.x = Math.sin(this.clock * .01) * 8

    for (const station of this.stations) {
      const near = station.centre.distanceTo(this.camera.position) < station.radius + 150
      station.group.visible = near
      station.update?.(this.clock, this.reduced ? 0 : dt, this.progress(station.id), near, this.beat(station.id))
    }

    this.inker.render(this.scene, this.camera, this.clock)

    // If it cannot keep up, draw fewer pixels.
    this.slow = this.slow * .95 + (dt > 1 / 40 ? 1 : 0) * .05
    if (this.slow > .6 && this.size.max > .75) {
      this.size.max = Math.max(.75, this.size.ratio - .25)
      this.slow = 0
      this.resize()
    }
  }

  private onPointer = (event: PointerEvent) => {
    this.pointer.tx = (event.clientX / window.innerWidth - .5) * 2
    this.pointer.ty = -(event.clientY / window.innerHeight - .5) * 2
  }

  private onClick = (event: MouseEvent) => {
    const box = this.canvas.getBoundingClientRect()
    this.raycaster.setFromCamera(new THREE.Vector2((event.clientX - box.left) / box.width * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1), this.camera)
    for (const station of this.stations) {
      if (!station.group.visible || !station.pickable?.length) continue
      const hit = this.raycaster.intersectObjects(station.pickable, true)[0]
      if (!hit) continue
      let node: THREE.Object3D | null = hit.object
      while (node && !station.pickable.includes(node)) node = node.parent
      const said = node && station.pick?.(node)
      if (said) for (const listener of this.listeners) listener(said.name, said.value)
      return
    }
  }

  /** Whether the pointer is over something that can be clicked. */
  hovering(x: number, y: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(x / this.size.w * 2 - 1, -(y / this.size.h) * 2 + 1), this.camera)
    return this.stations.some(station => station.group.visible && station.pickable?.length && this.raycaster.intersectObjects(station.pickable, true).length > 0)
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.canvas.removeEventListener('click', this.onClick)
    window.removeEventListener('pointermove', this.onPointer)
    this.scene.traverse(node => { if (node instanceof THREE.Mesh) node.geometry.dispose() })
    this.inker.dispose()
    this.renderer.dispose()
  }
}
