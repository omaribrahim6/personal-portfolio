import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { C, glassMaterial, light, plain, pod, rng, tether, toon } from '../toon/kit'

// Things the stops have in common: signs with words painted on them in the site's own type, benches,
// arches of vines, an old windmill, and the giant robot asleep in the meadow under its moss.

/** The family behind one of the site's font variables, for drawing words onto canvases. */
export function family(variable: string, fallback: string) {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return value ? `${value}, ${fallback}` : fallback
}
export const FONTS = {
  get display() { return family('--font-heliotrope', 'sans-serif') },
  get round() { return family('--font-unbounded', 'sans-serif') },
  get sans() { return family('--font-instrument', 'sans-serif') },
  get serif() { return family('--font-instrument-serif', 'serif') },
  get mono() { return family('--font-martian', 'monospace') },
}

/** Words on a board: a band of colour along the top, then lines of text, centred or ranged left. */
export function board(o: {
  width: number; height: number; band?: string; ground?: string; ink?: string
  lines: { text: string; font: string; size: number; color?: string; upper?: boolean }[]
  align?: 'left' | 'center'; pad?: number
}) {
  const canvas = document.createElement('canvas')
  canvas.width = o.width
  canvas.height = o.height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = o.ground ?? '#fbf6ea'
  ctx.fillRect(0, 0, o.width, o.height)
  const band = o.band ? Math.round(o.height * .16) : 0
  if (o.band) { ctx.fillStyle = o.band; ctx.fillRect(0, 0, o.width, band) }
  const pad = o.pad ?? o.width * .07
  let y = band + pad * .9
  ctx.textBaseline = 'top'
  ctx.textAlign = o.align === 'center' ? 'center' : 'left'
  for (const line of o.lines) {
    ctx.font = `${line.size}px ${line.font}`
    ctx.fillStyle = line.color ?? o.ink ?? '#16241d'
    const text = line.upper ? line.text.toUpperCase() : line.text
    // Shrink a line that would not fit.
    let size = line.size
    while (ctx.measureText(text).width > o.width - pad * 2 && size > 10) { size -= 2; ctx.font = `${size}px ${line.font}` }
    ctx.fillText(text, o.align === 'center' ? o.width / 2 : pad, y)
    y += size * 1.22
  }
  // A frame of ink just inside the edge.
  ctx.strokeStyle = o.ink ?? '#16241d'
  ctx.lineWidth = Math.max(4, o.width * .012)
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, o.width - ctx.lineWidth, o.height - ctx.lineWidth)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return { texture, canvas, ctx }
}

/** A board with a picture on its face, on its own, `w` wide in the world. */
export function plaque(texture: THREE.Texture, w: number, h: number, depth = .06, edge: string = C.wood) {
  const face = new THREE.MeshToonMaterial({ map: texture, gradientMap: (toon(C.ivory) as THREE.MeshToonMaterial).gradientMap })
  const side = toon(edge)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), [side, side, side, side, face, side])
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}

/** A signpost: a post with a cap, and a board on it with words. */
export function signpost(o: { band: string; title: string; sub: string; detail?: string; height?: number; cap?: string }) {
  const group = new THREE.Group()
  const height = o.height ?? 1.5
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, height, 8), toon(C.wood))
  post.position.y = height / 2
  post.castShadow = true
  const cap = new THREE.Mesh(new THREE.ConeGeometry(.11, .14, 8), toon(o.cap ?? o.band))
  cap.position.y = height + .07
  const { texture } = board({
    width: 512, height: 300, band: o.band,
    lines: [
      { text: o.title, font: FONTS.round, size: 58 },
      { text: o.sub, font: FONTS.mono, size: 30, color: '#3b4a42', upper: true },
      ...(o.detail ? [{ text: o.detail, font: FONTS.serif, size: 34, color: '#3b4a42' }] : []),
    ],
  })
  const sign = plaque(texture, 1.15, .67)
  sign.position.set(0, height - .42, .07)
  group.add(post, cap, sign)
  return group
}

export function bench(width = 1) {
  const group = new THREE.Group()
  const seat = new THREE.Mesh(new RoundedBoxGeometry(width, .06, .32, 2, .02), toon(C.wood))
  seat.position.y = .32
  const back = new THREE.Mesh(new RoundedBoxGeometry(width, .22, .05, 2, .02), toon(C.wood))
  back.position.set(0, .52, -.14)
  back.rotation.x = -.15
  group.add(seat, back)
  for (const x of [-width / 2 + .08, width / 2 - .08]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.05, .32, .3), toon('#36443d'))
    leg.position.set(x, .16, 0)
    group.add(leg)
  }
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return group
}

/** An arch over a path, white, with vines and flowers growing over it. */
export function arch(width: number, height: number, seed: number) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-width / 2, 0, 0), new THREE.Vector3(-width / 2, height * .7, 0), new THREE.Vector3(0, height, 0),
    new THREE.Vector3(width / 2, height * .7, 0), new THREE.Vector3(width / 2, 0, 0),
  ])
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .05, 8), toon(C.ivory)))
  const leaves: THREE.BufferGeometry[] = [], blooms: THREE.BufferGeometry[] = []
  for (let i = 0; i < 46; i++) {
    const p = curve.getPoint(.08 + rand() * .84)
    const g = new THREE.IcosahedronGeometry(.07 + rand() * .06, 1)
    g.translate(p.x + (rand() - .5) * .12, p.y + (rand() - .5) * .12, (rand() - .5) * .14)
    leaves.push(g)
    if (i % 4 === 0) {
      const b = new THREE.SphereGeometry(.035, 6, 4)
      b.translate(p.x + (rand() - .5) * .16, p.y + (rand() - .5) * .16, .06 + rand() * .05)
      blooms.push(b)
    }
  }
  group.add(new THREE.Mesh(mergeGeometries(leaves), toon(C.leaf)))
  group.add(plain(new THREE.Mesh(mergeGeometries(blooms), light(C.rose))))
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return group
}

/** An old windmill: a white tower, a cap, and four sails of lattice and cloth. Returns the sails to turn. */
export function windmill(height: number) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(height * .2, height * .3, height, 16), toon(C.ivory))
  body.position.y = height / 2
  const cap = new THREE.Mesh(new THREE.ConeGeometry(height * .26, height * .28, 16), toon(C.coral))
  cap.position.y = height + height * .12
  const door = new THREE.Mesh(new THREE.CircleGeometry(height * .08, 16, 0, Math.PI), toon(C.glassDark))
  door.position.set(0, 0, height * .29)
  const window1 = new THREE.Mesh(new THREE.CircleGeometry(height * .045, 12), toon(C.glassDark))
  window1.position.set(0, height * .6, height * .24)
  group.add(body, cap, door, window1)
  const sails = new THREE.Group()
  sails.position.set(0, height * .92, height * .26)
  const hub = new THREE.Mesh(new THREE.SphereGeometry(height * .05, 12, 8), toon(C.ink))
  sails.add(hub)
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group()
    arm.rotation.z = k * Math.PI / 2
    const spar = new THREE.Mesh(new THREE.BoxGeometry(height * .025, height * .62, height * .02), toon(C.wood))
    spar.position.y = height * .31
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(height * .14, height * .46), toon(C.ivory, { side: THREE.DoubleSide }))
    cloth.position.set(height * .08, height * .36, 0)
    arm.add(spar, cloth)
    sails.add(arm)
  }
  group.add(sails)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, sails }
}

/**
 * The giant: a robot's head and one hand, asleep in the grass so long that the meadow has grown over them.
 * Moss on the crown, a tree out of the top, flowers in the joints, its one eye still faintly lit.
 */
export function robot(size: number, seed: number) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const metal = toon('#b9b29a'), dark = toon('#7d7866')
  const head = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 20), metal)
  head.scale.set(1, .82, .95)
  head.position.y = size * .35
  head.rotation.z = .35
  const face = new THREE.Mesh(new THREE.CylinderGeometry(size * .55, size * .6, size * .2, 32), dark)
  face.rotation.set(Math.PI / 2, 0, 0)
  face.position.set(size * .15, size * .45, size * .86)
  const eye = new THREE.Mesh(new THREE.CircleGeometry(size * .2, 24), light('#9fe8ff'))
  eye.position.set(size * .15, size * .48, size * .97)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(size * .22, size * .04, 8, 24), toon(C.brass))
  ring.position.copy(eye.position).add(new THREE.Vector3(0, 0, .01))
  const ear = new THREE.Mesh(new THREE.CylinderGeometry(size * .25, size * .25, size * .3, 20), dark)
  ear.rotation.z = Math.PI / 2
  ear.position.set(-size * .95, size * .55, 0)
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(size * .03, size * .04, size * .8, 6), dark)
  antenna.position.set(-size * .4, size * 1.25, -size * .1)
  antenna.rotation.z = .6
  // The meadow over it: a cap of moss on the crown, clumps down its sides, flowers.
  const moss = new THREE.Mesh(new THREE.SphereGeometry(size * 1.02, 32, 12, 0, Math.PI * 2, 0, Math.PI * .32), toon(C.grass2))
  moss.scale.copy(head.scale)
  moss.position.copy(head.position)
  moss.rotation.copy(head.rotation)
  const clumps: THREE.BufferGeometry[] = []
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2, up = .2 + rand() * .7
    const r = size * (.18 + rand() * .2)
    const g = new THREE.IcosahedronGeometry(r, 1)
    g.translate(Math.cos(a) * size * (1 - up * .5), size * (.1 + up * .9), Math.sin(a) * size * (1 - up * .5) * .9)
    clumps.push(g)
  }
  const shrubs = new THREE.Mesh(mergeGeometries(clumps), toon(C.leaf))
  // A hand, palm up, half sunk, a few fingers curled, a little pond in its palm.
  const hand = new THREE.Group()
  const palm = new THREE.Mesh(new RoundedBoxGeometry(size * 1.1, size * .3, size * .9, 3, size * .08), metal)
  hand.add(palm)
  for (let k = 0; k < 4; k++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(size * .09, size * .45, 4, 10), dark)
    finger.position.set(-size * .4 + k * size * .27, size * .25, size * .5)
    finger.rotation.x = -.9 - k * .1
    hand.add(finger)
  }
  const pond = plain(new THREE.Mesh(new THREE.CircleGeometry(size * .32, 20), toon('#7fd3e2')))
  pond.rotation.x = -Math.PI / 2
  pond.position.y = size * .155
  hand.add(pond)
  hand.position.set(size * 2.1, 0, size * 1.1)
  hand.rotation.y = -.5
  group.add(head, face, eye, ring, ear, antenna, moss, shrubs, hand)
  group.traverse(node => { if (node instanceof THREE.Mesh && node !== eye) { node.castShadow = true; node.receiveShadow = true } })
  return { group, eye }
}

/**
 * Parts gathered by colour and merged into one mesh per colour, so a plant of thirty leaves and petals is
 * three draw calls, not thirty.
 */
export class Bundle {
  private parts = new Map<string, THREE.BufferGeometry[]>()
  add(color: string, geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
    const g = (geometry.index ? geometry.toNonIndexed() : geometry.clone()).applyMatrix4(matrix)
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name)
    const list = this.parts.get(color) ?? []
    list.push(g)
    this.parts.set(color, list)
  }
  build(shadows = true) {
    const group = new THREE.Group()
    for (const [color, list] of this.parts) {
      const merged = new THREE.Mesh(mergeGeometries(list), toon(color))
      merged.castShadow = merged.receiveShadow = shadows
      group.add(merged)
      list.forEach(g => g.dispose())
    }
    this.parts.clear()
    return group
  }
}

/** The mail drone: a glass globe with a lamp in it, brass arms in whiplash curves out to four rotors. */
export function drone() {
  const group = new THREE.Group()
  const globe = plain(new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 16), glassMaterial('#bfeee6', .35)))
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.18, 14, 10), light('#ffd27a'))
  const belt = new THREE.Mesh(new THREE.TorusGeometry(.43, .045, 8, 32), toon(C.brass))
  belt.rotation.x = Math.PI / 2
  const crown = new THREE.Mesh(new THREE.ConeGeometry(.16, .3, 12), toon(C.brass))
  crown.position.y = .5
  const finial = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), toon(C.coral))
  finial.position.y = .68
  group.add(globe, lamp, belt, crown, finial)
  const rotors: THREE.Object3D[] = []
  for (let k = 0; k < 4; k++) {
    const a = k / 4 * Math.PI * 2 + Math.PI / 4
    const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
    // The arm: out from the belt, curling up and over, the way a stem does in an old poster.
    const arm = new THREE.CatmullRomCurve3([
      out.clone().multiplyScalar(.42),
      out.clone().multiplyScalar(.75).setY(-.12),
      out.clone().multiplyScalar(1.05).setY(.08),
      out.clone().multiplyScalar(1.12).setY(.3),
    ])
    group.add(new THREE.Mesh(new THREE.TubeGeometry(arm, 20, .035, 6), toon(C.brass)))
    // A leaf on each arm.
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 6), toon(C.leaf))
    leaf.scale.set(.5, .2, 1.6)
    leaf.position.copy(out.clone().multiplyScalar(.7)).setY(-.16)
    leaf.rotation.y = -a + Math.PI / 2
    group.add(leaf)
    const hub = new THREE.Group()
    hub.position.copy(out.clone().multiplyScalar(1.12)).setY(.34)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.32, .03, 6, 24), toon(C.brass))
    ring.rotation.x = Math.PI / 2
    const blades = new THREE.Group()
    for (const turn of [0, Math.PI / 2]) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(.56, .01, .07), toon(C.ivory))
      blade.rotation.y = turn
      blades.add(blade)
    }
    hub.add(ring, blades)
    group.add(hub)
    rotors.push(blades)
  }
  // The letter, hanging under it on a cord.
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .5, 4), toon(C.ink))
  cord.position.y = -.65
  const letter = new THREE.Group()
  const paper = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .03), toon(C.ivory))
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .02, 12), toon(C.coral))
  seal.rotation.x = Math.PI / 2
  seal.position.z = .025
  letter.add(paper, seal)
  letter.position.y = -1.02
  group.add(cord, letter)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, rotors, letter }
}


/**
 * A village in the treetops: giant trees with decks round their trunks, pods on the decks, rope bridges
 * from tree to tree, and lanterns. About 14 tall.
 */
export function treetops(seed: number) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const trunks = [[0, 0, 13], [-7, 3, 11], [6.5, 4, 10.5]] as const
  const decks: THREE.Vector3[] = []
  const leaves = new Bundle(), wood = new Bundle()
  const ball = new THREE.IcosahedronGeometry(1, 1)
  for (const [x, z, h] of trunks) {
    wood.add(C.bark, new THREE.CylinderGeometry(.55, 1.1, h, 12), new THREE.Matrix4().makeTranslation(x, h / 2, z))
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2 + rand()
      wood.add(C.bark, new THREE.ConeGeometry(.45, 2.2, 6), new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(a) * 1.1, .6, z + Math.sin(a) * 1.1), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(a) * .6, 0, -Math.cos(a) * .6)), new THREE.Vector3(1, 1, 1)))
    }
    for (let k = 0; k < 9; k++) {
      const a = rand() * Math.PI * 2, d = rand() * 3, r = 1.8 + rand() * 1.6
      leaves.add([C.leaf, C.grass2, C.leafLight, C.leafDark][k % 4], ball, new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(a) * d, h + rand() * 1.5 - .5, z + Math.sin(a) * d), new THREE.Quaternion(), new THREE.Vector3(r, r * .8, r)))
    }
    const y = h * .55
    wood.add(C.wood, new THREE.CylinderGeometry(2.4, 2.4, .2, 24), new THREE.Matrix4().makeTranslation(x, y, z))
    wood.add(C.brass, new THREE.TorusGeometry(2.4, .06, 6, 32), new THREE.Matrix4().compose(new THREE.Vector3(x, y + .35, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 1, 1)))
    decks.push(new THREE.Vector3(x, y, z))
  }
  group.add(wood.build(), leaves.build())
  decks.forEach((deck, i) => {
    const home = pod({ R: .85, H: 1.4, bands: [[.06, .16, [C.coral, C.teal, C.yellow][i]]], windows: [[0, .5, .22], [1.2, .5, .2]], lit: true, door: .6, antenna: i === 0 })
    home.position.copy(deck).add(new THREE.Vector3(1.3, .1, 1))
    home.rotation.y = rand() * Math.PI * 2
    group.add(home)
  })
  // Rope bridges between the decks.
  for (const [a, b] of [[0, 1], [0, 2]]) {
    const from = decks[a].clone().add(new THREE.Vector3(0, .15, 0)), to = decks[b].clone().add(new THREE.Vector3(0, .15, 0))
    const dir = to.clone().sub(from).setY(0).normalize()
    from.addScaledVector(dir, 2.3)
    to.addScaledVector(dir, -2.3)
    const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(.4)
    group.add(tether(from.clone().add(side), to.clone().add(side), .6, .04), tether(from.clone().sub(side), to.clone().sub(side), .6, .04))
    group.add(tether(from.clone().add(side).setY(from.y + .7), to.clone().add(side).setY(to.y + .7), .4, .03), tether(from.clone().sub(side).setY(from.y + .7), to.clone().sub(side).setY(to.y + .7), .4, .03))
    for (let k = 1; k < 12; k++) {
      const f = k / 12
      const p = from.clone().lerp(to, f)
      p.y -= Math.sin(f * Math.PI) * .6
      const plank = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .25), toon(C.wood))
      plank.position.copy(p)
      plank.rotation.y = Math.atan2(dir.x, dir.z)
      group.add(plank)
    }
  }
  for (const deck of decks) for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2
    const glow = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), light('#ffd27a'))
    glow.position.copy(deck).add(new THREE.Vector3(Math.cos(a) * 2.3, .55, Math.sin(a) * 2.3))
    group.add(glow)
  }
  group.traverse(node => { if (node instanceof THREE.Mesh && !node.castShadow) node.castShadow = true })
  return group
}
