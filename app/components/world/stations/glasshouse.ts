import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { skillGroups } from '../../../content'
import { C, aerostat, cypress, glassMaterial, ivy, light, plain, pod, rng, tether, tier, toon } from '../../toon/kit'
import type { Engine, Key, Station } from '../engine'
import { STRIDE, blend, idle, walk, water } from '../motion'
import { Bundle, FONTS, board, plaque, robot } from '../props'
import { puppet } from '../puppet'

// The glasshouse: everything Omar works with, grown. A geodesic dome on its own island, an airborne turbine
// tethered to its crown, and inside it a bed for each kind of skill, curved round the walls. Every skill is
// a plant, and it blooms once for every place on this page where you can see it used, so the ones with the
// most receipts are the ones in flower. Omar walks from bed to bed with a watering can as you read; pick a
// skill (on the card, or the plant itself) and its plant stands up straight and its seed tag swings down.

export const GOLDEN = {
  sky: ['#f7e7c4', '#f0dcc0', '#bccfe0', '#82a2d8', '#5577c4'] as [string, string, string, string, string],
  sun: [.42, .52, .74] as [number, number, number], sunColor: '#ffe9b8', sunSize: .05,
  key: '#ffe6c2', strength: 2.65, hemi: ['#b8c4ec', '#c8bb8a'] as [string, string], fill: 1.55,
  water: ['#3c9fbd', '#b2e2e6'] as [string, string], cloud: ['#fff6e6', '#c9c2dc'] as [string, string], fog: [90, 320] as [number, number],
}

export const ORIGIN = new THREE.Vector3(-50, 0, -334)
const G = .6
const R = 10
/** Each bed's colour: what its plants bloom in, and its plaque. */
export const BEDS = ['#ec7b60', '#8a6cd8', '#2f60c8', '#2f9e8a', '#e2a92c']
const RING = 6.5, SPREAD = .72
const angleOf = (i: number) => (i - (skillGroups.length - 1) / 2) * SPREAD

type Kind = 'stalks' | 'bush' | 'fern' | 'cactus' | 'tulips'
const KINDS: Kind[] = ['stalks', 'bush', 'tulips', 'fern', 'cactus']

const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3()
const at = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  m4.compose(p4.set(x, y, z), q4.setFromEuler(e4.set(rx, ry, rz, 'YXZ')), s4.set(sx, sy, sz)).clone()

const PETAL = new THREE.SphereGeometry(.06, 8, 5)
const HEART = new THREE.IcosahedronGeometry(.045, 1)
const LEAF = new THREE.SphereGeometry(.1, 8, 5)
const BALL = new THREE.IcosahedronGeometry(1, 1)
const CUP = new THREE.LatheGeometry([[0, 0], [.05, .01], [.085, .06], [.09, .13], [.07, .17]].map(([x, y]) => new THREE.Vector2(x, y)), 10)

/** A flower: five petals round a heart, facing up and out along `dir`. */
function bloom(b: Bundle, tip: THREE.Vector3, color: string, size = 1, tilt = 0, turn = 0) {
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * Math.PI * 2
    const local = new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * .07 * size, 0, Math.sin(a) * .07 * size), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, 0)), new THREE.Vector3(1.3 * size, .35 * size, .8 * size))
    b.add(color, PETAL, at(tip.x, tip.y, tip.z, tilt, turn).multiply(local))
  }
  b.add('#fff1c4', HEART, at(tip.x, tip.y + .02 * size, tip.z, 0, 0, 0, size, size, size))
}

/** A plant for a skill: its kind sets its shape, its receipts how tall it stands and how many flowers. */
function plant(kind: Kind, blooms: number, color: string, seed: number) {
  const rand = rng(seed)
  const b = new Bundle()
  const green = [C.leaf, C.grass2, C.leafLight][seed % 3]
  const h = .5 + Math.min(8, blooms) * .1
  const tips: THREE.Vector3[] = []
  if (kind === 'stalks' || kind === 'tulips') {
    const n = Math.max(kind === 'tulips' ? 2 : 3, blooms)
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + rand() * .6, lean = kind === 'tulips' ? .08 + rand() * .1 : .15 + rand() * .2
      const top = new THREE.Vector3(Math.cos(a) * lean, h * (.75 + rand() * .3), Math.sin(a) * lean)
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(Math.cos(a) * .03, 0, Math.sin(a) * .03), new THREE.Vector3(top.x * .2, top.y * .55, top.z * .2), top)
      b.add(C.leafDark, new THREE.TubeGeometry(curve, 6, .018, 4), new THREE.Matrix4())
      // Two leaves up each stem.
      for (const u of [.3, .55]) {
        const p = curve.getPoint(u), side = u < .5 ? 1 : -1
        b.add(green, LEAF, at(p.x + Math.cos(a + side) * .07, p.y, p.z + Math.sin(a + side) * .07, .5 * side, -(a + side), 0, .55, .3, 1.5))
      }
      if (i < blooms) {
        if (kind === 'tulips') b.add(color, CUP, at(top.x, top.y - .02, top.z, 0, 0, 0, 1.1, 1.1, 1.1))
        else bloom(b, top, color, 1, Math.cos(a) * .3, a)
      } else b.add(green, LEAF, at(top.x, top.y, top.z, 0, a, 0, .5, .9, .5))
      tips.push(top)
    }
  } else if (kind === 'bush') {
    const lumps = 4
    for (let i = 0; i < lumps; i++) {
      const a = i / lumps * Math.PI * 2, r = .16 + rand() * .06
      b.add([C.leaf, C.grass2, C.leafLight][(i + seed) % 3], BALL, at(Math.cos(a) * .14, r * .9 + (i % 2) * .08, Math.sin(a) * .14, 0, 0, 0, r, r * (.85 + h * .4), r))
    }
    b.add(green, BALL, at(0, .3 + h * .25, 0, 0, 0, 0, .2, .2 + h * .12, .2))
    for (let i = 0; i < blooms; i++) {
      const a = i * 2.4 + rand() * .4, up = .35 + rand() * .5
      const top = new THREE.Vector3(Math.cos(a) * .24 * (1.1 - up * .5), .12 + up * (.3 + h * .3), Math.sin(a) * .24 * (1.1 - up * .5))
      bloom(b, top, color, .8, Math.cos(a) * .6, a)
    }
    tips.push(new THREE.Vector3(0, .45 + h * .3, 0))
  } else if (kind === 'fern') {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + rand() * .3, pitch = .55 + rand() * .3
      b.add(i % 2 ? green : C.leaf, LEAF, at(Math.cos(a) * .16, .12 + h * .2, Math.sin(a) * .16, pitch, -a + Math.PI / 2, 0, .45, .18, 3 + h * 1.6))
    }
    for (let i = 0; i < blooms; i++) {
      const a = i * 2.2, top = new THREE.Vector3(Math.cos(a) * .08, .3 + h * .45 + (i % 3) * .06, Math.sin(a) * .08)
      b.add(C.leafDark, new THREE.CylinderGeometry(.012, .012, top.y, 4), at(top.x, top.y / 2, top.z))
      bloom(b, top, color, .75, 0, a)
    }
    tips.push(new THREE.Vector3(0, .3 + h * .5, 0))
  } else {
    // A cactus: a column, an arm or two, and its flowers on the tips and round the crown.
    const col = h * 1.1
    b.add(C.grass2, new THREE.CapsuleGeometry(.12, col, 4, 10), at(0, col / 2 + .1, 0))
    for (const side of blooms > 1 ? [-1, 1] : [1]) {
      const arm = new THREE.CatmullRomCurve3([new THREE.Vector3(0, col * .45, 0), new THREE.Vector3(side * .22, col * .45, 0), new THREE.Vector3(side * .24, col * .75, 0)])
      b.add(C.grass2, new THREE.TubeGeometry(arm, 8, .07, 8), new THREE.Matrix4())
      tips.push(new THREE.Vector3(side * .24, col * .75 + .06, 0))
    }
    tips.unshift(new THREE.Vector3(0, col + .2, 0))
    for (let i = 0; i < blooms; i++) {
      const a = i * 2.4
      const top = i < tips.length ? tips[i] : new THREE.Vector3(Math.cos(a) * .11, col * (.5 + (i % 3) * .15) + .1, Math.sin(a) * .11)
      bloom(b, top, color, .7, i < tips.length ? 0 : 1.2, a)
    }
  }
  const group = b.build()
  const top = tips.reduce((best, p) => p.y > best ? p.y : best, 0)
  return { group, top }
}

/** The dome: a geodesic half-sphere of glass on ivory struts, with a door cut in the front. */
function dome() {
  const group = new THREE.Group()
  const ico = new THREE.IcosahedronGeometry(R, 3)
  const pos = ico.getAttribute('position')
  const glass: number[] = []
  const edges = new Map<string, [THREE.Vector3, THREE.Vector3]>()
  const door = (p: THREE.Vector3) => p.z > R * .6 && Math.abs(p.x) < 1.9 && p.y < 3.6
  for (let i = 0; i < pos.count; i += 3) {
    const tri = [0, 1, 2].map(k => new THREE.Vector3(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k)))
    if (tri.some(p => p.y < -.01)) continue
    const centre = tri[0].clone().add(tri[1]).add(tri[2]).divideScalar(3)
    if (door(centre)) continue
    for (const p of tri) glass.push(p.x, p.y, p.z)
    for (let k = 0; k < 3; k++) {
      const a = tri[k], b = tri[(k + 1) % 3]
      const key = [a, b].map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`).sort().join('|')
      edges.set(key, [a, b])
    }
  }
  const shell = new THREE.BufferGeometry()
  shell.setAttribute('position', new THREE.Float32BufferAttribute(glass, 3))
  shell.computeVertexNormals()
  group.add(plain(new THREE.Mesh(shell, glassMaterial('#bfeee6', .22))))
  const rods: THREE.BufferGeometry[] = []
  const up = new THREE.Vector3(0, 1, 0)
  for (const [a, b] of edges.values()) {
    const rod = new THREE.CylinderGeometry(.055, .055, a.distanceTo(b), 5, 1, true)
    rod.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(up, b.clone().sub(a).normalize()), new THREE.Vector3(1, 1, 1)))
    rods.push(rod)
  }
  const frame = new THREE.Mesh(mergeGeometries(rods), toon(C.ivory))
  frame.castShadow = true
  group.add(frame)
  // A brass ring round the foot, and a lantern on the crown.
  const foot = new THREE.Mesh(new THREE.TorusGeometry(R, .14, 6, 72), toon(C.brass))
  foot.rotation.x = Math.PI / 2
  foot.position.y = .1
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.6, .8, .5, 10), toon(C.brass))
  crown.position.y = R + .1
  group.add(foot, crown)
  // The door's arch.
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.75, .12, 8, 24, Math.PI), toon(C.coral))
  arch.position.set(0, 2.3, Math.sqrt(R * R - 2.3 * 2.3) - .2)
  const jambs = [-1.75, 1.75].map(x => {
    const jamb = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 2.3, 8), toon(C.coral))
    jamb.position.set(x, 1.15, arch.position.z + .05)
    return jamb
  })
  group.add(arch, ...jambs)
  return group
}

/** A watering can: a drum, a long spout with a rose on the end, a handle over the top. */
function can() {
  const group = new THREE.Group()
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.12, .13, .2, 14), toon(C.teal))
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(.018, .025, .32, 6), toon(C.teal))
  spout.position.set(0, .04, .2)
  spout.rotation.x = 1.0
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(.045, .02, .05, 8), toon(C.brass))
  rose.position.set(0, .13, .34)
  rose.rotation.x = 1.0
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.09, .015, 6, 12, Math.PI), toon(C.ink))
  handle.position.y = .1
  handle.rotation.y = Math.PI / 2
  group.add(drum, spout, rose, handle)
  const nozzle = new THREE.Object3D()
  nozzle.position.set(0, .14, .37)
  group.add(nozzle)
  return { group, nozzle }
}

/** The gardener: a little round robot on one wheel, with a porthole for a face and shears for a hand. */
function gardener() {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.SphereGeometry(.42, 20, 14), toon(C.shell))
  body.scale.set(1, 1.1, 1)
  body.position.y = .62
  const band = new THREE.Mesh(new THREE.TorusGeometry(.42, .04, 6, 24), toon(C.coral))
  band.rotation.x = Math.PI / 2
  band.position.y = .55
  const eye = new THREE.Mesh(new THREE.CircleGeometry(.14, 20), light('#9fe8ff'))
  eye.position.set(0, .74, .4)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.15, .035, 6, 20), toon(C.brass))
  rim.position.copy(eye.position)
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.16, .06, 8, 18), toon(C.ink))
  wheel.rotation.y = Math.PI / 2
  wheel.position.y = .17
  const sprout = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 5), toon(C.leafLight))
  sprout.scale.set(.6, .3, 1.4)
  sprout.position.set(0, 1.16, 0)
  sprout.rotation.x = .5
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .2, 4), toon(C.leafDark))
  stem.position.y = 1.06
  const arm = new THREE.Group()
  arm.position.set(.4, .62, 0)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .4, 6), toon(C.steel))
  rod.rotation.z = Math.PI / 2
  rod.position.x = .2
  const blades = [-1, 1].map(side => {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.18, .02, .04), toon(C.steel))
    blade.position.set(.48, 0, side * .02)
    blade.rotation.y = side * .3
    return blade
  })
  arm.add(rod, ...blades)
  group.add(body, band, eye, rim, wheel, sprout, stem, arm)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, arm, blades }
}

/** The seed tag that swings down over a picked plant: the skill's name, and how many receipts it has. */
function seedTag() {
  const W = 640, H = 300
  const { canvas, ctx, texture } = board({ width: W, height: H, lines: [] })
  const draw = (name: string, receipts: number, color: string) => {
    ctx.fillStyle = '#fbf6ea'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, W, 64)
    ctx.fillStyle = '#16241d'
    ctx.font = `600 28px ${FONTS.mono}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText('SEED Nº ' + String(name.length * 7 % 100).padStart(3, '0'), 34, 34)
    ctx.textAlign = 'right'
    ctx.fillText(receipts ? `${receipts} IN BLOOM` : 'IN LEAF', W - 34, 34)
    ctx.textAlign = 'center'
    let size = 96
    ctx.font = `${size}px ${FONTS.display}`
    while (ctx.measureText(name.toUpperCase()).width > W - 70 && size > 30) { size -= 4; ctx.font = `${size}px ${FONTS.display}` }
    ctx.fillText(name.toUpperCase(), W / 2, 170)
    ctx.font = `italic 34px ${FONTS.serif}`
    ctx.fillStyle = '#4a5a52'
    ctx.fillText(receipts ? 'see the card for where it grew' : 'no receipts on this page yet', W / 2, 252)
    ctx.strokeStyle = '#16241d'
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, W - 8, H - 8)
    // The hole for the string.
    ctx.beginPath()
    ctx.arc(W / 2, 34, 12, 0, Math.PI * 2)
    ctx.fillStyle = '#fbf6ea'
    ctx.fill()
    ctx.stroke()
    texture.needsUpdate = true
  }
  void canvas
  const face = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5 * H / W), face)
  const string = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 2.4, 4), toon(C.ink))
  string.position.y = 1.2 + .35
  const group = new THREE.Group()
  group.add(plain(tag), string)
  return { group, draw }
}

export default async function glasshouse(engine: Engine): Promise<Station> {
  await document.fonts?.ready
  const group = new THREE.Group()
  group.position.copy(ORIGIN)
  const rand = rng(51)

  // The island, a beach, and a stone floor inside the dome.
  const land = tier(14, 1.2, 501, C.grass, C.stone, .05)
  land.mesh.position.y = G - .6
  const sand = tier(15, .5, 502, C.sand, '#e8cf98', .05)
  sand.mesh.position.y = G - .55
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R - .2, 64), toon(C.stone))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = G + .02
  floor.receiveShadow = true
  const path = new THREE.Mesh(new THREE.RingGeometry(RING - 2.6, RING - 1.4, 64), toon(C.stone2))
  path.rotation.x = -Math.PI / 2
  path.position.y = G + .03
  path.receiveShadow = true
  const walkway = new THREE.Mesh(new THREE.PlaneGeometry(3, 6), toon(C.stone2))
  walkway.rotation.x = -Math.PI / 2
  walkway.position.set(0, G + .025, R + 1.6)
  walkway.receiveShadow = true
  group.add(sand.mesh, land.mesh, plain(floor), plain(path), plain(walkway))
  const house = dome()
  house.position.y = G
  group.add(house)

  // The beds: one for each kind of skill, curved round the back wall, each plant in it a skill.
  const plants: { name: string; group: THREE.Group; bed: number; top: number; base: THREE.Vector3; size: number }[] = []
  const pickable: THREE.Object3D[] = []
  skillGroups.forEach((set, i) => {
    const a = angleOf(i)
    const bed = new THREE.Group()
    bed.position.set(Math.sin(a) * RING, G, -Math.cos(a) * RING)
    bed.rotation.y = -a
    const box = new THREE.Mesh(new RoundedBoxGeometry(4, .62, 1.6, 2, .08), toon(C.wood))
    box.position.y = .31
    box.castShadow = box.receiveShadow = true
    const soil = new THREE.Mesh(new THREE.BoxGeometry(3.75, .04, 1.36), toon('#6b4a33'))
    soil.position.y = .6
    soil.receiveShadow = true
    const lip = new THREE.Mesh(new THREE.BoxGeometry(4.04, .06, .1), toon(BEDS[i]))
    lip.position.set(0, .63, .78)
    const sign = board({ width: 720, height: 180, band: BEDS[i], align: 'center', lines: [{ text: set.title, font: FONTS.display, size: 64, upper: true }] })
    const label = plaque(sign.texture, 1.9, .48, .04, C.brass)
    label.position.set(0, .34, .82)
    bed.add(box, soil, lip, label)
    // Taller plants (more receipts) at the back, the rest in front, staggered.
    const order = set.skills.map((skill, k) => ({ skill, k })).sort((p, q) => (q.skill.receipts?.length ?? 0) - (p.skill.receipts?.length ?? 0))
    order.forEach(({ skill, k }, rank) => {
      const blooms = skill.receipts?.length ?? 0
      const back = rank < Math.ceil(order.length / 2)
      const slot = back ? rank : rank - Math.ceil(order.length / 2)
      const across = back ? Math.ceil(order.length / 2) : order.length - Math.ceil(order.length / 2)
      const x = (slot - (across - 1) / 2) * (3.4 / Math.max(1, across)) + (back ? 0 : .25)
      const made = plant(KINDS[(k + i * 2) % KINDS.length], blooms, BEDS[i], 600 + i * 20 + k)
      made.group.position.set(x, .62, back ? -.32 : .3)
      made.group.rotation.y = rand() * Math.PI * 2
      made.group.name = `skill:${skill.name}`
      bed.add(made.group)
      pickable.push(made.group)
      plants.push({ name: skill.name, group: made.group, bed: i, top: made.top, base: made.group.position.clone(), size: 1 })
    })
    group.add(bed)
  })

  // Hanging baskets from the struts, trailing ivy, and a chandelier of grow lamps under the crown.
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + .3, r = 3.8 + (k % 2) * 1.6, y = G + 6.2 + (k % 3) * .5
    const pot = new THREE.Mesh(new THREE.SphereGeometry(.38, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon(C.coral))
    pot.position.set(Math.sin(a) * r, y, -Math.cos(a) * r)
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(.36, 1), toon(C.leaf))
    leaves.position.copy(pot.position).add(new THREE.Vector3(0, .05, 0))
    leaves.scale.set(1, .55, 1)
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, R * Math.cos(Math.asin(r / R)) - y + G, 4), toon(C.ink))
    cord.position.set(pot.position.x, (y + G + R * Math.cos(Math.asin(r / R))) / 2, pot.position.z)
    const trail = ivy(() => .3, 0, 1.1, [0, 1.6, 3.4, 4.9], 700 + k)
    trail.position.copy(pot.position)
    trail.scale.setScalar(.8)
    group.add(pot, leaves, cord, trail)
  }
  const chandelier = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, .06, 6, 40), toon(C.brass))
  ring.rotation.x = Math.PI / 2
  chandelier.add(ring)
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), light('#ffd27a'))
    bulb.position.set(Math.cos(a) * 1.6, -.18, Math.sin(a) * 1.6)
    chandelier.add(bulb)
  }
  chandelier.position.y = G + 8.2
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, R - 8.2, 4), toon(C.ink))
  chain.position.y = G + 8.2 + (R - 8.2) / 2
  group.add(chandelier, chain)

  // Outside: pods round the dome, cypresses, a meadow, and an airborne turbine on a tether from the crown.
  for (const [a, r, s] of [[2.2, 12.4, 1], [-2.4, 12, .85], [3.4, 11.8, .7]] as const) {
    const home = pod({ R: 1.5 * s, H: 2.6 * s, bands: [[.06, .14, C.teal]], windows: [[0, .5, .34 * s], [.9, .55, .3 * s]], lit: true, door: .45, panels: 2, antenna: s > .8 })
    home.position.set(Math.sin(a) * r, G, -Math.cos(a) * r)
    home.rotation.y = -a + Math.PI
    group.add(home)
  }
  for (let k = 0; k < 10; k++) {
    const a = rand() * Math.PI * 2, r = 11 + rand() * 2.4
    if (Math.abs(Math.sin(a)) < .25 && Math.cos(a) < 0) continue
    const tree = cypress(1.6 + rand(), 520 + k)
    tree.position.set(Math.sin(a) * r, G, Math.cos(a) * r)
    group.add(tree)
  }
  // The meadow round the outside (none of it indoors, and none on the path to the door).
  const meadow = new Bundle()
  for (let k = 0; k < 260; k++) {
    const a = rand() * Math.PI * 2, r = R + .7 + rand() * 3.2
    const x = Math.sin(a) * r, z = Math.cos(a) * r
    if (Math.abs(x) < 2.2 && z > 0) continue
    if (k < 70) {
      const size = .25 + rand() * .3
      meadow.add([C.leaf, C.grass2, C.leafLight][k % 3], BALL, at(x, G + size * .6, z, 0, 0, 0, size, size * .8, size))
    } else {
      const size = .05 + rand() * .04
      meadow.add(['#fff6e6', C.yellow, C.rose, C.coral][k % 4], BALL, at(x, G + .08, z, 0, 0, 0, size, size * .6, size))
    }
  }
  group.add(meadow.build())
  const kite = aerostat(4.2)
  kite.group.position.set(-9, G + 24, -14)
  kite.group.rotation.y = .6
  group.add(kite.group, tether(new THREE.Vector3(0, G + R + .3, 0), new THREE.Vector3(-9, G + 22.5, -14), 2.2, .03))

  // Offshore, an old giant robot, sunk to the chin, a garden grown over its head.
  const giant = robot(3.2, 54)
  giant.group.position.set(17, -1.4, -9)
  giant.group.rotation.y = -1.9
  group.add(giant.group)

  // The gardener robot, trimming the far bed.
  const bot = gardener()
  bot.group.position.set(Math.sin(1.9) * 4.8, G, -Math.cos(1.9) * 4.8)
  bot.group.rotation.y = -1.9 + Math.PI
  group.add(bot.group)

  // Butterflies, two wings each, wandering between the beds.
  const butterflies = Array.from({ length: 9 }, (_, k) => {
    const fly = new THREE.Group()
    const color = BEDS[k % BEDS.length]
    const wings = [-1, 1].map(side => {
      const wing = new THREE.Mesh(new THREE.CircleGeometry(.11, 10), toon(color, { side: THREE.DoubleSide }))
      wing.geometry.translate(side * .1, 0, 0)
      wing.rotation.x = -Math.PI / 2
      const hinge = new THREE.Group()
      hinge.add(wing)
      fly.add(hinge)
      return { hinge, side }
    })
    group.add(plain(fly))
    return { fly, wings, home: angleOf(k % skillGroups.length), seed: k * 1.7 }
  })

  // Omar, and the watering can.
  const omar = await puppet()
  const SIZE = 1.4
  omar.root.scale.setScalar(SIZE)
  group.add(omar.root)
  const pot = can()
  group.add(pot.group)
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(.025, 6, 4), light('#9fdcf2'), 36)
  group.add(plain(drops))
  const tag = seedTag()
  tag.group.visible = false
  group.add(tag.group)

  // The camera: the dome from the path outside, then in through the door to each bed in turn.
  const w = (v: THREE.Vector3) => v.clone().add(ORIGIN).toArray() as [number, number, number]
  const keys: Key[] = [{ beat: 0, eye: w(new THREE.Vector3(-13, 9.5, 31)), look: w(new THREE.Vector3(0, 4.2, 0)), fov: 36, hold: .35, card: 'left' }]
  const side = (i: number) => i % 2 ? -1 : 1
  skillGroups.forEach((_, i) => {
    const a = angleOf(i)
    const out = new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), across = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
    const bed = out.clone().multiplyScalar(RING).setY(G)
    const eye = out.clone().multiplyScalar(-.6).addScaledVector(across, .7 * side(i)).setY(G + 3.3)
    keys.push({ beat: i + 1, eye: w(eye), look: w(bed.clone().addScaledVector(across, .5 * side(i)).setY(G + .9)), fov: 36, hold: .45, card: side(i) > 0 ? 'left' : 'right' })
  })

  let chosen = ''
  const state = { u: 0, phase: 0, walking: 0, facing: 0 }
  const position = new THREE.Vector3(), last = new THREE.Vector3(), hand = new THREE.Vector3(), nozzle = new THREE.Vector3()
  const seeds = Array.from({ length: 36 }, () => ({ delay: rand() * .7, spread: (rand() - .5) * .12, spread2: (rand() - .5) * .12 }))
  const mat = new THREE.Matrix4(), hidden = new THREE.Matrix4().makeTranslation(0, -50, 0)
  const tagAt = new THREE.Vector3()
  let tagSwing = 0

  return {
    id: 'skills',
    group,
    centre: ORIGIN.clone().add(new THREE.Vector3(0, 4, 0)),
    radius: 32,
    light: GOLDEN,
    keys,
    pickable,
    pick(object) {
      if (object.name.startsWith('skill:')) return { name: 'skill', value: object.name.slice(6) }
    },
    set(name, value) {
      if (name !== 'skill' || value === chosen) return
      chosen = value
      const found = plants.find(p => p.name === value)
      tag.group.visible = !!found
      if (!found) return
      const set = skillGroups[found.bed]
      tag.draw(value, set.skills.find(s => s.name === value)?.receipts?.length ?? 0, BEDS[found.bed])
      tagSwing = 1
    },
    update(t, dt, _local, near, beat) {
      if (!near) return
      // Round the beds with the cards: at a bed while its card is up, between them as you scroll.
      const u = Math.min(skillGroups.length - 1, Math.max(0, beat - 1))
      const k = Math.floor(u), f = u - k
      const go = THREE.MathUtils.smoothstep(f, .3, .7)
      const from = angleOf(k) + .3 * side(k), to = angleOf(Math.min(skillGroups.length - 1, k + 1)) + .3 * side(k + 1)
      const phi = from + (to - from) * go
      const r = RING - 1.45 - Math.sin(go * Math.PI) * .8
      position.set(Math.sin(phi) * r, G, -Math.cos(phi) * r)
      const moved = position.distanceTo(last)
      const travelling = moved > dt * .25 && moved < 2
      state.walking += ((travelling ? 1 : 0) - state.walking) * Math.min(1, dt * 6)
      if (moved < 2) state.phase += moved / (STRIDE * SIZE)
      // Facing: along the way when walking, at the bed's plants when not.
      const bedAngle = angleOf(Math.round(u))
      const bed = new THREE.Vector3(Math.sin(bedAngle) * RING, G, -Math.cos(bedAngle) * RING)
      const want = state.walking > .5 && moved > 0
        ? Math.atan2(position.x - last.x, position.z - last.z)
        : Math.atan2(bed.x - position.x, bed.z - position.z)
      let delta = want - state.facing
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      state.facing += delta * Math.min(1, dt * 6)
      last.copy(position)
      omar.root.position.copy(position)
      omar.root.rotation.y = state.facing
      omar.root.updateMatrixWorld()
      omar.pose(blend(water(t), walk(state.phase, .5), state.walking))
      // The can rides in the right hand, tipped while watering.
      omar.where('handR', hand)
      pot.group.position.copy(group.worldToLocal(hand)).add(new THREE.Vector3(0, -.12, 0))
      pot.group.rotation.set(.75 * (1 - state.walking), state.facing, 0, 'YXZ')
      pot.group.updateMatrixWorld()
      pot.nozzle.getWorldPosition(nozzle)
      group.worldToLocal(nozzle)
      const dir = new THREE.Vector3(Math.sin(state.facing), 0, Math.cos(state.facing))
      seeds.forEach((s, i) => {
        if (state.walking > .3) { drops.setMatrixAt(i, hidden); return }
        const age = (t + s.delay) % .7
        mat.makeTranslation(nozzle.x + dir.x * age * .5 + s.spread, nozzle.y - 4.9 * age * age, nozzle.z + dir.z * age * .5 + s.spread2)
        drops.setMatrixAt(i, mat)
      })
      drops.instanceMatrix.needsUpdate = true
      // The picked plant stands up a little taller; the others settle back.
      for (const p of plants) {
        const want = p.name === chosen ? 1.3 : 1
        p.size += (want - p.size) * Math.min(1, dt * 6)
        p.group.scale.setScalar(p.size)
      }
      const picked = plants.find(p => p.name === chosen)
      if (picked) {
        tagSwing *= Math.exp(-dt * 1.4)
        picked.group.getWorldPosition(tagAt)
        group.worldToLocal(tagAt)
        tag.group.position.set(tagAt.x, tagAt.y + picked.top * picked.size + .7 + (1 - Math.min(1, tagSwing * 3)) * 0, tagAt.z)
        tag.group.quaternion.copy(engine.camera.quaternion)
        tag.group.rotateZ(Math.sin(t * 3.2) * .25 * tagSwing)
      }
      // The robot snips; the butterflies wander.
      bot.blades.forEach((blade, i) => { blade.rotation.y = (i ? 1 : -1) * (.15 + Math.abs(Math.sin(t * 5)) * .3) })
      bot.arm.rotation.z = Math.sin(t * .8) * .2
      for (const b of butterflies) {
        const a = b.home + Math.sin(t * .23 + b.seed) * .3
        const rr = RING + Math.sin(t * .31 + b.seed * 2) * .8
        b.fly.position.set(Math.sin(a) * rr, G + 1.4 + Math.sin(t * .9 + b.seed) * .5, -Math.cos(a) * rr)
        b.fly.rotation.y = t * .4 + b.seed
        const flap = Math.sin(t * 18 + b.seed) * .9
        for (const wing of b.wings) wing.hinge.rotation.z = wing.side * flap
      }
      kite.rotor.rotation.z += dt * 1.6
      kite.group.position.y = G + 24 + Math.sin(t * .4) * .4
    },
  }
}
