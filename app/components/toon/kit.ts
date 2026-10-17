import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { PLAIN } from './ink'

// The pieces every diorama is built from. Everything is smooth geometry in flat colours, shaded in two tones
// (a warm sun, a cool sky in the shadows) and outlined by the ink pass, so a sphere reads as a drawn shape.
// The look is seventies retro-futurism by way of solar punk: white pods with round brass portholes, glass,
// gardens on every level, panels and turbines, a lot of green.

export const C = {
  shell: '#f7f0de', shell2: '#efe2c2', ivory: '#fbf6ea',
  yellow: '#f3c64a', coral: '#ec7b60', rose: '#f2a3b4', teal: '#6ccabd', sky: '#2f60c8',
  brass: '#cf9f45', brassDark: '#8a6326', glass: '#a8e6df', glassDark: '#24566a', glow: '#ffd27a',
  grass: '#7dbb52', grass2: '#62a046', meadow: '#94c862', leaf: '#4f9a45', leafDark: '#2f6e3c', leafLight: '#a6d46a',
  stone: '#eadcb8', stone2: '#d8c497', sand: '#f1ddb0', wood: '#9a6a43', bark: '#7a5236', rock: '#cf9d6c', rock2: '#a8735a',
  water: '#3fb0c2', waterDeep: '#2589a3', foam: '#f2fbff', panel: '#2b52b0', steel: '#e6ebf0', ink: '#16241d',
  skin: '#c98c62', cloth: ['#ec7b60', '#2f60c8', '#f3c64a', '#4f9a45', '#f7f0de'],
} as const

/* -------------------------------------------------------------- materials */

let rampTexture: THREE.DataTexture | null = null
/** Two tones: in the sun, or not. The shadow side is lit only by the sky, which is what makes it cool. */
function ramp() {
  if (rampTexture) return rampTexture
  rampTexture = new THREE.DataTexture(new Uint8Array([0, 0, 255, 255]), 4, 1, THREE.RedFormat)
  rampTexture.minFilter = rampTexture.magFilter = THREE.NearestFilter
  rampTexture.needsUpdate = true
  return rampTexture
}

const cache = new Map<string, THREE.Material>()

/** A flat colour, shaded in two tones. Cached, so a scene shares one material per colour. */
export function toon(color: string, options: { side?: THREE.Side; emissive?: string; map?: THREE.Texture } = {}) {
  const key = `${color}|${options.side ?? 0}|${options.emissive ?? ''}|${options.map?.uuid ?? ''}`
  let material = cache.get(key)
  if (!material) {
    material = new THREE.MeshToonMaterial({
      color, gradientMap: ramp(), side: options.side ?? THREE.FrontSide,
      emissive: options.emissive ?? '#000000', map: options.map ?? null,
    })
    cache.set(key, material)
  }
  return material
}

/** Unlit: a lamp, a lit window, a glow. */
export function light(color: string) {
  const key = `light|${color}`
  let material = cache.get(key)
  if (!material) { material = new THREE.MeshBasicMaterial({ color }); cache.set(key, material) }
  return material
}

/** Glass: pale, half see-through, drawn but never creased by the ink. */
export function glassMaterial(color: string = C.glass, opacity = .42) {
  const key = `glass|${color}|${opacity}`
  let material = cache.get(key)
  if (!material) {
    material = new THREE.MeshToonMaterial({ color, gradientMap: ramp(), transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide })
    cache.set(key, material)
  }
  return material
}

/** Mark an object (and everything in it) as plain: drawn, but not creased by the ink's facing pass. */
export function plain<T extends THREE.Object3D>(object: T) {
  object.traverse(node => node.layers.enable(PLAIN))
  return object
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, shadows: 'both' | 'cast' | 'receive' | 'none' = 'both') {
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = shadows === 'both' || shadows === 'cast'
  m.receiveShadow = shadows === 'both' || shadows === 'receive'
  return m
}

/* ---------------------------------------------------------------- helpers */

export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)

/** Place `object` on a surface at `point`, facing out along `normal`. */
function stick(object: THREE.Object3D, point: THREE.Vector3, normal: THREE.Vector3) {
  object.position.copy(point)
  object.quaternion.setFromUnitVectors(v(0, 0, 1), normal.clone().normalize())
  return object
}

/* ------------------------------------------------------------------- pods */

/**
 * The silhouette of a pod: a squared-off dome, `R` across and `H` tall. `n` is how square: 2 is a half
 * ellipse, higher is boxier. Returns the lathe profile and a way to find points and normals on it.
 */
function domeProfile(R: number, H: number, n: number, steps = 28) {
  const profile: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(R * .97, 0)]
  for (let i = 0; i <= steps; i++) {
    const t = i / steps * Math.PI / 2
    profile.push(new THREE.Vector2(R * Math.pow(Math.cos(t), 2 / n), H * Math.pow(Math.sin(t), 2 / n)))
  }
  profile[profile.length - 1].x = 0
  const at = (azimuth: number, up: number) => {
    const t = Math.asin(Math.min(1, Math.pow(Math.max(0, up), n / 2)))
    const r = R * Math.pow(Math.cos(t), 2 / n), y = H * Math.pow(Math.sin(t), 2 / n)
    const nr = Math.pow(Math.max(r, 1e-4) / R, n - 1) / R, ny = Math.pow(Math.max(y, 1e-4) / H, n - 1) / H
    const len = Math.hypot(nr, ny)
    const point = v(Math.sin(azimuth) * r, y, Math.cos(azimuth) * r)
    const normal = v(Math.sin(azimuth) * nr / len, ny / len, Math.cos(azimuth) * nr / len)
    return { point, normal }
  }
  return { profile, at }
}

/** A round window in a brass rim: dark glass with the sky in it, or warm with the lights on inside. */
export function porthole(size: number, lit = false) {
  const group = new THREE.Group()
  const rim = mesh(new THREE.TorusGeometry(size, size * .2, 10, 40), toon(C.brass))
  const glass = mesh(new THREE.CircleGeometry(size * .98, 40), lit ? light(C.glow) : toon(C.glassDark), 'none')
  glass.position.z = -size * .04
  group.add(rim, glass)
  if (!lit) {
    // A gleam on the glass.
    const gleam = mesh(new THREE.RingGeometry(size * .55, size * .72, 24, 1, Math.PI * .62, Math.PI * .5), light('#cdeef0'), 'none')
    gleam.position.z = -size * .02
    group.add(plain(gleam))
  }
  return group
}

export type PodOptions = {
  R: number
  H: number
  n?: number
  color?: string
  /** Bands of colour round the shell: [from, to] heights as fractions, and the colour. */
  bands?: [number, number, string][]
  /** Windows: [azimuth in radians (0 faces +Z), height as a fraction, size]. */
  windows?: [number, number, number][]
  lit?: boolean
  door?: number
  cupola?: boolean
  panels?: number
  antenna?: boolean
}

/** A pod: the round white house of the future. */
export function pod(o: PodOptions) {
  const n = o.n ?? 2.6
  const group = new THREE.Group()
  const { profile, at } = domeProfile(o.R, o.H, n)
  group.add(mesh(new THREE.LatheGeometry(profile, 56), toon(o.color ?? C.shell)))
  for (const [from, to, color] of o.bands ?? []) {
    const band: THREE.Vector2[] = []
    for (let i = 0; i <= 8; i++) {
      const up = from + (to - from) * i / 8
      const { point, normal } = at(0, up)
      band.push(new THREE.Vector2(Math.hypot(point.x, point.z) + normal.z * o.R * .012, point.y + normal.y * o.R * .012))
    }
    group.add(mesh(new THREE.LatheGeometry(band, 56), toon(color)))
  }
  for (const [azimuth, up, size] of o.windows ?? []) {
    const { point, normal } = at(azimuth, up)
    group.add(stick(porthole(size, o.lit), point.add(normal.clone().multiplyScalar(size * .12)), normal))
  }
  if (o.door !== undefined) {
    const { point, normal } = at(o.door, .2)
    const width = o.R * .26, height = o.H * .42
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, 0)
    shape.lineTo(-width / 2, height - width / 2)
    shape.absarc(0, height - width / 2, width / 2, Math.PI, 0, true)
    shape.lineTo(width / 2, 0)
    shape.closePath()
    const door = mesh(new THREE.ExtrudeGeometry(shape, { depth: o.R * .05, bevelEnabled: false, curveSegments: 16 }), o.lit ? light('#f5a54a') : toon(C.glassDark))
    const base = at(o.door, 0).point
    door.position.copy(base).add(normal.clone().setY(0).normalize().multiplyScalar(-o.R * .02))
    door.lookAt(door.position.clone().add(normal.clone().setY(0)))
    group.add(door)
    void point
  }
  if (o.cupola) {
    const dome = greenhouse(o.R * .34, 3)
    dome.position.y = o.H * .985
    group.add(dome)
  }
  for (let i = 0; i < (o.panels ?? 0); i++) {
    const azimuth = Math.PI * (1.1 + i * .28)
    const { point, normal } = at(azimuth, .78)
    const p = solarPanel(o.R * .5, o.R * .3)
    p.position.copy(point).add(normal.clone().multiplyScalar(o.R * .06))
    p.lookAt(p.position.clone().add(normal))
    p.rotateX(-Math.PI / 2)
    group.add(p)
  }
  if (o.antenna) {
    const { point } = at(Math.PI * .6, .86)
    const mast = mesh(new THREE.CylinderGeometry(o.R * .012, o.R * .016, o.H * .5, 6), toon(C.ink), 'cast')
    mast.position.copy(point).add(v(0, o.H * .25, 0))
    const lamp = mesh(new THREE.SphereGeometry(o.R * .045, 12, 10), light(C.coral), 'none')
    lamp.position.copy(point).add(v(0, o.H * .5, 0))
    group.add(mast, lamp)
  }
  return group
}

/** A tower of rounded floors, a garden spilling round the lip of each, a spire on top. */
export function tower(o: { floors: number; R: number; floor: number; color?: string; seed?: number }) {
  const rand = rng(o.seed ?? 1)
  const group = new THREE.Group()
  let y = 0
  for (let i = 0; i < o.floors; i++) {
    const r = o.R * (1 - i * .08) * (.92 + rand() * .12)
    const h = o.floor
    // The floor: a fat disc, rounded at its rim.
    const shape: THREE.Vector2[] = [new THREE.Vector2(0, 0)]
    for (let k = 0; k <= 10; k++) {
      const a = -Math.PI / 2 + Math.PI * k / 10
      shape.push(new THREE.Vector2(r - h * .3 + Math.cos(a) * h * .3, h / 2 + Math.sin(a) * h / 2))
    }
    shape.push(new THREE.Vector2(0, h))
    const floor = mesh(new THREE.LatheGeometry(shape, 48), toon(i % 2 ? C.ivory : (o.color ?? C.shell)))
    floor.position.y = y
    group.add(floor)
    // A band of glass round the middle of each floor.
    const band = mesh(new THREE.CylinderGeometry(r + h * .015, r + h * .015, h * .34, 48, 1, true), toon(C.glassDark))
    band.position.y = y + h / 2
    group.add(band)
    // The garden round the lip: a ring of shrubs.
    const shrubs: THREE.BufferGeometry[] = []
    const count = Math.round(r * 30)
    for (let k = 0; k < count; k++) {
      const a = k / count * Math.PI * 2 + rand() * .2
      const s = h * (.16 + rand() * .12)
      const g = new THREE.IcosahedronGeometry(s, 1)
      g.translate(Math.sin(a) * (r - s * .2), y + h + s * .4, Math.cos(a) * (r - s * .2))
      shrubs.push(g)
    }
    group.add(mesh(mergeGeometries(shrubs), toon(i % 2 ? C.leaf : C.grass2)))
    y += h * 1.02
  }
  const spire = mesh(new THREE.ConeGeometry(o.R * .16, o.floor * 1.6, 16), toon(C.ivory))
  spire.position.y = y + o.floor * .8
  const tip = mesh(new THREE.SphereGeometry(o.R * .07, 12, 10), toon(C.coral))
  tip.position.y = y + o.floor * 1.65
  group.add(spire, tip)
  return group
}

/** A geodesic glasshouse: struts in a hemisphere, glass between, green inside. */
export function greenhouse(r: number, seed: number, struts: string = C.ivory) {
  const group = new THREE.Group()
  const ico = new THREE.IcosahedronGeometry(r, 2).toNonIndexed()
  const pos = ico.getAttribute('position')
  const keep: number[] = []
  const edges = new Map<string, [THREE.Vector3, THREE.Vector3]>()
  for (let i = 0; i < pos.count; i += 3) {
    const tri = [0, 1, 2].map(k => v(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k)))
    if (tri.some(p => p.y < -r * .02)) continue
    for (const p of tri) keep.push(p.x, p.y, p.z)
    for (let k = 0; k < 3; k++) {
      const a = tri[k], b = tri[(k + 1) % 3]
      const key = [a, b].map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)}`).sort().join('|')
      edges.set(key, [a, b])
    }
  }
  const shell = new THREE.BufferGeometry()
  shell.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3))
  shell.computeVertexNormals()
  // What grows inside.
  const rand = rng(seed)
  const plants: THREE.BufferGeometry[] = []
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * .62
    const s = r * (.18 + rand() * .16)
    const g = new THREE.IcosahedronGeometry(s, 2)
    g.translate(Math.sin(a) * d, s * .8 + rand() * r * .2, Math.cos(a) * d)
    plants.push(g)
  }
  group.add(mesh(mergeGeometries(plants), toon(C.leaf), 'receive'))
  group.add(plain(mesh(shell, glassMaterial(), 'none')))
  // The struts, as thin rods.
  const rods: THREE.BufferGeometry[] = []
  const up = v(0, 1, 0)
  for (const [a, b] of edges.values()) {
    const length = a.distanceTo(b)
    const rod = new THREE.CylinderGeometry(r * .012, r * .012, length, 4, 1, true)
    const mid = a.clone().add(b).multiplyScalar(.5)
    const q = new THREE.Quaternion().setFromUnitVectors(up, b.clone().sub(a).normalize())
    rod.applyMatrix4(new THREE.Matrix4().compose(mid, q, v(1, 1, 1)))
    rods.push(rod)
  }
  group.add(plain(mesh(mergeGeometries(rods), toon(struts), 'cast')))
  const base = mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.06, r * .08, 40), toon(C.stone))
  base.position.y = r * .02
  group.add(base)
  return group
}

/* ------------------------------------------------------------------ power */

let cellsTexture: THREE.CanvasTexture | null = null
function cells() {
  if (cellsTexture) return cellsTexture
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#e8eef5'
  ctx.fillRect(0, 0, 128, 64)
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
    const g = ctx.createLinearGradient(0, 0, 0, 64)
    g.addColorStop(0, '#4a78d8')
    g.addColorStop(1, '#203f94')
    ctx.fillStyle = g
    ctx.fillRect(5 + i * 20, 5 + j * 18.5, 18, 16.5)
  }
  ctx.fillStyle = 'rgba(255,255,255,.35)'
  ctx.beginPath()
  ctx.moveTo(30, 0); ctx.lineTo(52, 0); ctx.lineTo(28, 64); ctx.lineTo(6, 64)
  ctx.fill()
  cellsTexture = new THREE.CanvasTexture(canvas)
  cellsTexture.colorSpace = THREE.SRGBColorSpace
  cellsTexture.anisotropy = 4
  return cellsTexture
}

/** One solar panel: cells under glass in a pale frame, on two legs, tilted back to the sun. */
export function solarPanel(width: number, depth: number, legs = 0) {
  const group = new THREE.Group()
  const face = toon('#ffffff', { map: cells() })
  const edge = toon(C.steel)
  const slab = mesh(new THREE.BoxGeometry(width, width * .03, depth), [edge, edge, face, edge, edge, edge] as unknown as THREE.Material)
  slab.rotation.x = -.5
  slab.position.y = legs + depth * .25
  group.add(slab)
  if (legs > 0) {
    for (const side of [-1, 1]) {
      const leg = mesh(new THREE.CylinderGeometry(width * .02, width * .02, legs + depth * .2, 5), toon('#5b6762'), 'cast')
      leg.position.set(side * width * .38, (legs + depth * .2) / 2, 0)
      group.add(leg)
    }
  }
  return group
}

/** Rows of panels on legs. */
export function solarArray(rows: number, cols: number, width: number, depth: number, gap = 1.25) {
  const group = new THREE.Group()
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const p = solarPanel(width, depth, depth * .35)
    p.position.set((j - (cols - 1) / 2) * width * 1.06, 0, (i - (rows - 1) / 2) * depth * gap * 1.6)
    group.add(p)
  }
  return group
}

/** A wind turbine. Its rotor is returned too, to turn. */
export function turbine(height: number) {
  const group = new THREE.Group()
  const tower = mesh(new THREE.CylinderGeometry(height * .016, height * .034, height, 16), toon(C.ivory))
  tower.position.y = height / 2
  const nacelle = mesh(new THREE.CapsuleGeometry(height * .028, height * .07, 6, 16), toon(C.ivory))
  nacelle.rotation.x = Math.PI / 2
  nacelle.position.set(0, height, -height * .02)
  const rotor = new THREE.Group()
  rotor.position.set(0, height, height * .04)
  const hub = mesh(new THREE.SphereGeometry(height * .034, 16, 12), toon(C.ivory))
  hub.scale.z = 1.4
  rotor.add(hub)
  const blade = new THREE.Shape()
  const L = height * .52, w = height * .045
  blade.moveTo(-w * .4, 0)
  blade.quadraticCurveTo(-w * .9, L * .25, -w * .2, L)
  blade.quadraticCurveTo(w * .2, L * .5, w * .55, 0)
  blade.closePath()
  const bladeGeometry = new THREE.ExtrudeGeometry(blade, { depth: height * .006, bevelEnabled: false, curveSegments: 10 })
  for (let k = 0; k < 3; k++) {
    const b = mesh(bladeGeometry, toon(C.ivory), 'cast')
    b.rotation.z = k * Math.PI * 2 / 3
    rotor.add(b)
  }
  const stripe = mesh(new THREE.CylinderGeometry(height * .021, height * .021, height * .04, 16), toon(C.coral))
  stripe.position.y = height * .82
  group.add(tower, nacelle, rotor, stripe)
  return { group, rotor }
}

/**
 * An airborne wind turbine: a puffed white ring, lobed like a pumpkin, with a rotor in its throat and fins at
 * the back. It faces along -X. Returns its rotor to turn.
 */
export function aerostat(size: number) {
  const group = new THREE.Group()
  const outer = size * .5, inner = size * .26, length = size * .95
  const profile: THREE.Vector2[] = []
  const steps = 48
  // Outer skin, back to front, puffed between seams.
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = -length / 2 + length * t
    const taper = 1 - .22 * Math.pow(Math.abs(t - .42) * 1.7, 2)
    const puff = 1 + .045 * Math.abs(Math.sin(t * Math.PI * 4))
    profile.push(new THREE.Vector2(outer * taper * puff, y))
  }
  // Round the front lip into the throat.
  for (let i = 1; i < 12; i++) {
    const a = i / 12 * Math.PI
    const r0 = profile[profile.length - 1].x
    const mid = (r0 + inner) / 2, rad = (r0 - inner) / 2
    profile.push(new THREE.Vector2(mid + Math.cos(a) * rad, length / 2 + Math.sin(a) * rad * .8))
  }
  // The throat, front to back.
  for (let i = 0; i <= 12; i++) profile.push(new THREE.Vector2(inner * (1 + .08 * Math.sin(i / 12 * Math.PI)), length / 2 - length * i / 12))
  // And round the back lip to close it.
  for (let i = 1; i < 10; i++) {
    const a = Math.PI + i / 10 * Math.PI
    const r0 = profile[0].x
    const mid = (r0 + inner) / 2, rad = (r0 - inner) / 2
    profile.push(new THREE.Vector2(mid + Math.cos(a) * -rad, -length / 2 + Math.sin(a) * rad * .6))
  }
  const body = mesh(new THREE.LatheGeometry(profile, 64), toon(C.ivory))
  const band = mesh(new THREE.CylinderGeometry(outer * 1.04, outer * 1.04, length * .1, 64, 1, true), toon(C.coral))
  band.position.y = length * .08
  const fins = new THREE.Group()
  const fin = new THREE.Shape()
  fin.moveTo(0, 0)
  fin.quadraticCurveTo(size * .1, size * .26, size * .42, size * .34)
  fin.lineTo(size * .3, 0)
  fin.closePath()
  const finGeometry = new THREE.ExtrudeGeometry(fin, { depth: size * .02, bevelEnabled: false, curveSegments: 8 })
  for (const turn of [0, Math.PI]) {
    const f = mesh(finGeometry, toon(C.shell2))
    f.rotation.set(0, 0, Math.PI / 2)
    const holder = new THREE.Group()
    holder.add(f)
    f.position.set(outer * .7, -length * .48, -size * .01)
    holder.rotation.y = turn
    fins.add(holder)
  }
  const rotor = new THREE.Group()
  const hub = mesh(new THREE.SphereGeometry(inner * .22, 14, 10), toon(C.coral))
  rotor.add(hub)
  for (let k = 0; k < 3; k++) {
    const b = mesh(new THREE.BoxGeometry(inner * .22, inner * .92, inner * .04), toon(C.ivory), 'cast')
    b.position.y = inner * .46
    const arm = new THREE.Group()
    arm.rotation.y = 0
    arm.rotation.z = k * Math.PI * 2 / 3
    arm.add(b)
    rotor.add(arm)
  }
  rotor.rotation.x = Math.PI / 2
  rotor.position.y = length * .1
  const inside = new THREE.Group()
  inside.add(body, band, fins, rotor)
  inside.rotation.z = Math.PI / 2
  group.add(inside)
  return { group, rotor }
}

/** A tether, sagging a little, from `a` to `b`. */
export function tether(a: THREE.Vector3, b: THREE.Vector3, sag: number, radius: number) {
  const mid = a.clone().add(b).multiplyScalar(.5).add(v(0, -sag, 0))
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
  return plain(mesh(new THREE.TubeGeometry(curve, 24, radius, 5), toon('#4a5a52'), 'none'))
}

/* ----------------------------------------------------------------- growing */

/** A round tree: a short trunk under a cluster of soft balls. */
export function tree(size: number, seed: number, colors: string[] = [C.leaf, C.grass2, C.leafLight]) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const trunk = mesh(new THREE.CylinderGeometry(size * .07, size * .11, size * .9, 8), toon(C.bark))
  trunk.position.y = size * .45
  group.add(trunk)
  const balls: THREE.BufferGeometry[] = []
  const count = 4 + Math.floor(rand() * 4)
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2, d = (i ? .3 + rand() * .25 : 0) * size
    const r = size * (i ? .32 + rand() * .16 : .5)
    const g = new THREE.IcosahedronGeometry(r, 3)
    g.translate(Math.sin(a) * d, size * (1.05 + rand() * .35) + (i ? 0 : size * .1), Math.cos(a) * d)
    balls.push(g)
  }
  group.add(mesh(mergeGeometries(balls), toon(colors[Math.floor(rand() * colors.length)])))
  return group
}

/** A cypress: a tall green flame. */
export function cypress(height: number, seed: number) {
  const rand = rng(seed)
  const balls: THREE.BufferGeometry[] = []
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const r = height * .11 * (1 - t * .65)
    const g = new THREE.SphereGeometry(r, 16, 12)
    g.scale(1, 1.5, 1)
    g.translate((rand() - .5) * r * .3, height * (.18 + t * .7), (rand() - .5) * r * .3)
    balls.push(g)
  }
  const group = new THREE.Group()
  group.add(mesh(mergeGeometries(balls), toon(C.leafDark)))
  const trunk = mesh(new THREE.CylinderGeometry(height * .02, height * .025, height * .2, 6), toon(C.bark))
  trunk.position.y = height * .1
  group.add(trunk)
  return group
}

/** A strip that tapers to a point along a curve: a palm frond, a reed, a ribbon. */
function frond(length: number, width: number, droop: number) {
  const steps = 14
  const positions: number[] = [], indices: number[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = length * t, y = -droop * t * t * length, w = width * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * .3)
    positions.push(x, y + w * .25, -w, x, y + w * .25, w, x, y - w * .05, 0)
    if (i < steps) {
      const a = i * 3
      indices.push(a, a + 2, a + 3, a + 2, a + 5, a + 3, a + 2, a + 1, a + 5, a + 1, a + 4, a + 5)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

/** A palm: a curved trunk, ringed, and a crown of drooping fronds. */
export function palm(height: number, seed: number, lean = .25) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const top = v(lean * height, height, 0)
  const curve = new THREE.QuadraticBezierCurve3(v(0, 0, 0), v(lean * height * .1, height * .55, 0), top)
  const trunk = mesh(new THREE.TubeGeometry(curve, 16, height * .028, 8), toon(C.wood))
  group.add(trunk)
  const fronds: THREE.BufferGeometry[] = []
  const count = 9
  for (let k = 0; k < count; k++) {
    const g = frond(height * (.42 + rand() * .12), height * .07, .5 + rand() * .3)
    g.rotateZ(.35 + rand() * .2)
    g.rotateY(k / count * Math.PI * 2 + rand() * .3)
    g.translate(top.x, top.y, top.z)
    fronds.push(g)
  }
  group.add(mesh(mergeGeometries(fronds), toon(C.leaf, { side: THREE.DoubleSide })))
  for (let k = 0; k < 3; k++) {
    const nut = mesh(new THREE.SphereGeometry(height * .035, 10, 8), toon(C.bark))
    nut.position.copy(top).add(v(Math.cos(k * 2.1) * height * .04, -height * .04, Math.sin(k * 2.1) * height * .04))
    group.add(nut)
  }
  return group
}

/** A pine, in three tiers. */
export function pine(height: number, seed: number) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const trunk = mesh(new THREE.CylinderGeometry(height * .04, height * .06, height * .3, 6), toon(C.bark))
  trunk.position.y = height * .15
  group.add(trunk)
  for (let k = 0; k < 3; k++) {
    const r = height * (.3 - k * .07), h = height * (.4 - k * .05)
    const cone = mesh(new THREE.ConeGeometry(r, h, 9), toon(k === 2 ? C.leaf : C.leafDark))
    cone.position.y = height * (.32 + k * .2) + h / 2 - height * .1
    cone.rotation.y = rand() * 3
    group.add(cone)
  }
  return group
}

/** Shrubs and flowers scattered over a disc of ground. */
export function scatter(radius: number, count: number, seed: number, y = 0, colors: string[] = [C.leaf, C.leafLight, C.grass2]) {
  const rand = rng(seed)
  const byColor = new Map<string, THREE.BufferGeometry[]>()
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * radius
    const s = radius * (.03 + rand() * .035)
    const g = new THREE.IcosahedronGeometry(s, 1)
    g.translate(Math.sin(a) * d, y + s * .5, Math.cos(a) * d)
    const color = colors[Math.floor(rand() * colors.length)]
    if (!byColor.has(color)) byColor.set(color, [])
    byColor.get(color)!.push(g)
  }
  const group = new THREE.Group()
  for (const [color, list] of byColor) group.add(mesh(mergeGeometries(list), toon(color), 'receive'))
  return group
}

/** Tiny flowers: points of colour on the grass, too small to outline. */
export function flowers(radius: number, count: number, seed: number, y = 0, colors: string[] = ['#fff6e6', C.yellow, C.rose, C.coral]) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const byColor = new Map<string, THREE.BufferGeometry[]>()
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * radius
    const s = radius * .012
    const g = new THREE.SphereGeometry(s, 6, 4)
    g.translate(Math.sin(a) * d, y + s, Math.cos(a) * d)
    const color = colors[Math.floor(rand() * colors.length)]
    if (!byColor.has(color)) byColor.set(color, [])
    byColor.get(color)!.push(g)
  }
  for (const [color, list] of byColor) group.add(plain(mesh(mergeGeometries(list), light(color), 'none')))
  return group
}

/* ------------------------------------------------------------------ ground */

/**
 * A tier of land: a round, slightly wandering slab, grass on top and stone round its side. `at(angle)` is how
 * far its edge is from the middle in that direction, so things can be set along the rim.
 */
export function tier(radius: number, height: number, seed: number, top: string = C.grass, side: string = C.stone, wobble = .08) {
  const rand = rng(seed)
  const g = new THREE.CylinderGeometry(radius, radius * 1.01, height, 96, 3)
  const harmonics = [1, 2, 3, 5].map(k => ({ k, a: (rand() - .5) * wobble / k * 2, p: rand() * 6.28 }))
  const f = (angle: number) => 1 + harmonics.reduce((s, h) => s + h.a * Math.sin(h.k * angle + h.p), 0)
  const pos = g.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    const k = f(Math.atan2(x, z))
    pos.setXYZ(i, x * k, pos.getY(i), z * k)
  }
  g.computeVertexNormals()
  const m = mesh(g, [toon(side), toon(top), toon(side)] as unknown as THREE.Material)
  return { mesh: m, at: (angle: number) => radius * f(angle) }
}

/** Shrubs heaped all the way round the lip of a tier, spilling a little over the edge. */
export function hedge(at: (angle: number) => number, y: number, size: number, seed: number, colors: string[] = [C.leaf, C.grass2, C.leafLight], gaps: [number, number][] = []) {
  const rand = rng(seed)
  const byColor = new Map<string, THREE.BufferGeometry[]>()
  const around = Math.PI * 2 * at(0)
  const count = Math.round(around / (size * 1.1))
  for (let k = 0; k < count; k++) {
    const a = k / count * Math.PI * 2 + (rand() - .5) * .05
    const wrapped = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    if (gaps.some(([from, to]) => wrapped > from && wrapped < to)) continue
    const s = size * (.55 + rand() * .55)
    const r = at(a) - s * .25
    const g = new THREE.IcosahedronGeometry(s, 2)
    g.scale(1, .8, 1)
    g.translate(Math.sin(a) * r, y + s * .35, Math.cos(a) * r)
    const color = colors[Math.floor(rand() * colors.length)]
    if (!byColor.has(color)) byColor.set(color, [])
    byColor.get(color)!.push(g)
  }
  const group = new THREE.Group()
  for (const [color, list] of byColor) group.add(mesh(mergeGeometries(list), toon(color)))
  return group
}

/** Ivy down a wall: strings of small leaves hanging from the rim of a tier. */
export function ivy(at: (angle: number) => number, top: number, drop: number, angles: number[], seed: number) {
  const rand = rng(seed)
  const leaves: THREE.BufferGeometry[] = []
  for (const a of angles) {
    const length = drop * (.45 + rand() * .55)
    const n = Math.round(length / .16)
    for (let i = 0; i < n; i++) {
      const t = i / n
      const s = .11 * (1 - t * .5) * (.8 + rand() * .4)
      const swing = Math.sin(t * 5 + a * 7) * .08
      const r = at(a + swing * .05) + .02
      const g = new THREE.IcosahedronGeometry(s, 1)
      g.translate(Math.sin(a + swing * .04) * r, top - t * length, Math.cos(a + swing * .04) * r)
      leaves.push(g)
    }
  }
  return mesh(mergeGeometries(leaves), toon(C.leaf))
}

/** The sea: a wide flat disc of water, and rings of foam round wherever land meets it. */
export function sea(radius: number, color: string = C.water, map?: THREE.Texture) {
  const water = mesh(new THREE.CircleGeometry(radius, 96), map ? toon('#ffffff', { map }) : toon(color), 'receive')
  water.rotation.x = -Math.PI / 2
  return plain(water)
}

export function foam(radius: number, width: number) {
  const ring = mesh(new THREE.RingGeometry(radius, radius + width, 96), light(C.foam), 'none')
  ring.rotation.x = -Math.PI / 2
  return plain(ring)
}

/** A cloud: soft balls heaped up, flat underneath. */
export function cloud(size: number, seed: number) {
  const rand = rng(seed)
  const balls: THREE.BufferGeometry[] = []
  const count = 7 + Math.floor(rand() * 5)
  const ball = (r: number, x: number, y: number, z: number) => {
    // Indexed, so that once squashed its normals can be worked out again smoothly.
    const g = new THREE.SphereGeometry(r, 28, 18)
    g.translate(x, y, z)
    balls.push(g)
  }
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1) - .5
    const r = size * (.28 + rand() * .22) * (1 - Math.abs(t) * .7)
    ball(r, t * size * 1.6, r * .5 + rand() * size * .18, (rand() - .5) * size * .4)
  }
  for (let i = 0; i < 3; i++) {
    const r = size * (.28 + rand() * .1)
    ball(r, (rand() - .5) * size * .6, size * .4 + r * .5, (rand() - .5) * size * .2)
  }
  const group = new THREE.Group()
  for (const g of balls) {
    const pos = g.getAttribute('position')
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0) pos.setY(i, pos.getY(i) * .25)
    g.computeVertexNormals()
    group.add(mesh(g, cloudMaterial(), 'none'))
  }
  return group
}

/** A small sailing boat. */
export function boat(size: number, sail: string = C.ivory) {
  const group = new THREE.Group()
  const hull = mesh(new THREE.SphereGeometry(size * .5, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon(C.ivory))
  hull.scale.set(1, .5, .38)
  const stripe = mesh(new THREE.TorusGeometry(size * .5, size * .03, 6, 32), toon(C.coral))
  stripe.rotation.x = Math.PI / 2
  stripe.scale.set(1, .38, 1)
  stripe.position.y = -size * .03
  const mast = mesh(new THREE.CylinderGeometry(size * .015, size * .015, size * 1.1, 6), toon(C.wood))
  mast.position.y = size * .55
  const shape = new THREE.Shape()
  shape.moveTo(0, size * .08)
  shape.lineTo(0, size * 1.05)
  shape.quadraticCurveTo(size * .3, size * .5, size * .55, size * .1)
  shape.closePath()
  const cloth = mesh(new THREE.ShapeGeometry(shape, 8), toon(sail, { side: THREE.DoubleSide }))
  cloth.position.x = size * .02
  group.add(hull, stripe, mast, cloth)
  return group
}

/** A person, very small: a body in a colour, a head, sometimes a sun hat. */
export function person(height: number, seed: number) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const body = mesh(new THREE.CapsuleGeometry(height * .16, height * .42, 4, 10), toon(C.cloth[Math.floor(rand() * C.cloth.length)]))
  body.position.y = height * .37
  const head = mesh(new THREE.SphereGeometry(height * .14, 12, 10), toon(C.skin))
  head.position.y = height * .86
  group.add(body, head)
  if (rand() > .5) {
    const hat = mesh(new THREE.CylinderGeometry(height * .05, height * .26, height * .08, 16), toon(C.yellow))
    hat.position.y = height * .97
    group.add(hat)
  }
  return group
}

/** A street lamp, lit. */
export function lamp(height: number) {
  const group = new THREE.Group()
  const post = mesh(new THREE.CylinderGeometry(height * .02, height * .03, height, 6), toon('#36443d'), 'cast')
  post.position.y = height / 2
  const bulb = mesh(new THREE.SphereGeometry(height * .08, 12, 10), light(C.glow), 'none')
  bulb.position.y = height * 1.02
  const cap = mesh(new THREE.ConeGeometry(height * .1, height * .07, 12), toon('#36443d'))
  cap.position.y = height * 1.1
  group.add(post, bulb, cap)
  return group
}

/** A flock: small chevrons, to circle somewhere. */
export function bird(size: number) {
  const group = new THREE.Group()
  const wing = new THREE.BoxGeometry(size, size * .06, size * .22)
  const left = mesh(wing, toon(C.ink), 'none'), right = mesh(wing, toon(C.ink), 'none')
  left.position.x = -size / 2
  right.position.x = size / 2
  left.rotation.z = .35
  right.rotation.z = -.35
  group.add(left, right)
  return { group, left, right }
}

/**
 * The sky: a dome coloured by height above the horizon, `stops` from the horizon (0) to overhead (1). It
 * ignores the fog, and its colour at the horizon should be the fog's, so the sea fades into it.
 */
export function skyDome(radius: number, stops: [number, string][]) {
  const g = new THREE.SphereGeometry(radius, 48, 24)
  const pos = g.getAttribute('position')
  const colors: number[] = []
  const color = new THREE.Color(), a = new THREE.Color(), b = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const up = Math.max(0, pos.getY(i) / radius)
    let k = 0
    while (k < stops.length - 2 && up > stops[k + 1][0]) k++
    const [u0, c0] = stops[k], [u1, c1] = stops[k + 1]
    const t = Math.min(1, Math.max(0, (up - u0) / (u1 - u0)))
    color.copy(a.set(c0)).lerp(b.set(c1), t * t * (3 - 2 * t))
    colors.push(color.r, color.g, color.b)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const dome = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }))
  dome.renderOrder = -1
  return plain(dome)
}

/**
 * A cloud's material: white on top and blue-grey underneath, split by which way each part faces up rather
 * than by the sun, the way clouds are painted in animation. It ignores the haze.
 */
export function cloudMaterial(top = '#ffffff', under = '#b9c9e6') {
  const key = `cloud|${top}|${under}`
  let material = cache.get(key)
  if (!material) {
    material = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: new THREE.Color(top) }, uUnder: { value: new THREE.Color(under) }, uSun: { value: new THREE.Vector3(-.5, .4, .3).normalize() } },
      vertexShader: /* glsl */`
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTop;
        uniform vec3 uUnder;
        uniform vec3 uSun;
        varying vec3 vNormal;
        void main() {
          vec3 n = normalize(vNormal);
          float lit = n.y * .8 + dot(n, uSun) * .45;
          vec3 color = mix(uUnder, uTop, smoothstep(.02, .08, lit));
          gl_FragColor = vec4(color, 1.);
        }`,
    })
    cache.set(key, material)
  }
  return material
}

/**
 * A cable car: a line slung between two towers, and cabins that run along it. Returns a function to move the
 * cabins on, given the time.
 */
export function cableway(from: THREE.Vector3, to: THREE.Vector3, sag: number, cabins: number, size: number) {
  const group = new THREE.Group()
  const mid = from.clone().add(to).multiplyScalar(.5).add(v(0, -sag, 0))
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to)
  group.add(plain(mesh(new THREE.TubeGeometry(curve, 64, size * .03, 5), toon('#3b4741'), 'none')))
  const list: THREE.Group[] = []
  for (let i = 0; i < cabins; i++) {
    const cabin = new THREE.Group()
    const hanger = mesh(new THREE.CylinderGeometry(size * .025, size * .025, size * .7, 5), toon('#3b4741'), 'none')
    hanger.position.y = -size * .35
    const body = mesh(new THREE.SphereGeometry(size * .42, 20, 14), toon(i % 2 ? C.coral : C.yellow))
    body.scale.set(1, .82, .9)
    body.position.y = -size * .95
    const band = mesh(new THREE.CylinderGeometry(size * .435, size * .435, size * .2, 20, 1, true), toon(C.glassDark))
    band.position.y = -size * .92
    band.scale.set(1, 1, .9)
    cabin.add(hanger, body, band)
    group.add(cabin)
    list.push(cabin)
  }
  const tangent = new THREE.Vector3()
  const move = (t: number) => {
    list.forEach((cabin, i) => {
      // Up and back, all day: half the cabins go one way, half the other.
      const phase = (t * .025 + i / list.length) % 1
      const u = phase < .5 ? phase * 2 : 2 - phase * 2
      curve.getPoint(u, cabin.position)
      curve.getTangent(u, tangent)
      cabin.rotation.y = Math.atan2(tangent.x, tangent.z)
    })
  }
  move(0)
  return { group, move }
}

/** Water falling down a wall: a ribbon of plain light blue, with white where it lands. */
export function waterfall(points: THREE.Vector3[], width: number) {
  const curve = new THREE.CatmullRomCurve3(points)
  const steps = 40
  const positions: number[] = [], uvs: number[] = [], indices: number[] = []
  const side = new THREE.Vector3(), tangent = new THREE.Vector3(), up = v(0, 1, 0)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = curve.getPoint(t)
    curve.getTangent(t, tangent)
    side.crossVectors(tangent, up)
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0)
    side.normalize().multiplyScalar(width / 2)
    positions.push(p.x - side.x, p.y, p.z - side.z, p.x + side.x, p.y, p.z + side.z)
    uvs.push(0, t, 1, t)
    if (i < steps) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(indices)
  g.computeVertexNormals()
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#8fdcea'
  ctx.fillRect(0, 0, 32, 128)
  ctx.fillStyle = '#e9fbff'
  const rand = rng(7)
  for (let i = 0; i < 18; i++) ctx.fillRect(Math.floor(rand() * 28), Math.floor(rand() * 128), 2 + Math.floor(rand() * 3), 10 + rand() * 26)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.repeat.set(1, 3)
  const fall = plain(mesh(g, new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }), 'none'))
  return { mesh: fall, flow: (t: number) => { texture.offset.y = t * .9 } }
}

/** Ripples: short pale dashes on the water, drawn on a tile that repeats. */
export function ripples(color: string, dash: string) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 256, 256)
  const rand = rng(11)
  ctx.strokeStyle = dash
  ctx.lineCap = 'round'
  for (let i = 0; i < 46; i++) {
    const x = rand() * 256, y = rand() * 256, w = 6 + rand() * 16
    ctx.lineWidth = 1.4 + rand() * 1.2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + w / 2, y - 2.5, x + w, y)
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** The usual light: a warm sun with crisp shadows, and a cool sky that is all the shadows get. */
export function sunlight(scene: THREE.Scene, o: { from: THREE.Vector3; color?: string; strength?: number; sky?: string; ground?: string; fill?: number; span?: number }) {
  const sun = new THREE.DirectionalLight(o.color ?? '#fff1d8', o.strength ?? 2.6)
  sun.position.copy(o.from)
  sun.castShadow = true
  const span = o.span ?? 10
  sun.shadow.camera.left = -span
  sun.shadow.camera.right = span
  sun.shadow.camera.top = span
  sun.shadow.camera.bottom = -span
  sun.shadow.camera.near = .5
  sun.shadow.camera.far = o.from.length() * 3
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.bias = -.0006
  sun.shadow.normalBias = .02
  const sky = new THREE.HemisphereLight(o.sky ?? '#a9c4ff', o.ground ?? '#b5c48f', o.fill ?? 1.55)
  scene.add(sun, sun.target, sky)
  return { sun, sky }
}
