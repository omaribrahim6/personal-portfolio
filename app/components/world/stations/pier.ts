import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { C, aerostat, boat, light, palm, plain, pod, rng, tether, tier, toon } from '../../toon/kit'
import type { Key, Station } from '../engine'
import { blend, idle, perch, wave } from '../motion'
import { Bundle, drone } from '../props'
import { puppet } from '../puppet'

// The pier, at sunset: the end of the line. A long wooden pier out from a little island with the post
// office on it, lanterns coming on along its rails, and at the end of it Omar sits with legs over the
// edge, watching the sun go down behind a far city of glass domes. The mail drone (brass, glass, all
// whiplash curves) circles the pier; send a letter from the card and it takes it, off into the sunset.

export const SUNSET = {
  sky: ['#ffc46e', '#f7966a', '#d66b80', '#6e5a9e', '#2e3a78'] as [string, string, string, string, string],
  sun: [-.08, .06, -1] as [number, number, number], sunColor: '#ffd27a', sunSize: .09,
  key: '#ffb47e', strength: 1.9, hemi: ['#9c8fd2', '#b97c6a'] as [string, string], fill: 1.4,
  water: ['#2f6d98', '#ffb98a'] as [string, string], cloud: ['#ffd8b2', '#a27aa8'] as [string, string], fog: [70, 280] as [number, number],
}

export const ORIGIN = new THREE.Vector3(-30, 0, -600)
const D = 1.25
const END = -22

/** A lantern on a post: a brass cage, a warm light in it. */
function lantern() {
  const group = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 1.5, 6), toon(C.ink))
  pole.position.y = .75
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), light('#ffcf6e'))
  glow.position.y = 1.62
  const cap = new THREE.Mesh(new THREE.ConeGeometry(.16, .16, 8), toon(C.brass))
  cap.position.y = 1.83
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.12, .1, .06, 8), toon(C.brass))
  base.position.y = 1.47
  group.add(pole, glow, cap, base)
  return group
}

/** The post box at the foot of the pier: coral, round-shouldered, a slot, on one curling brass leg. */
function postbox() {
  const group = new THREE.Group()
  const box = new THREE.Mesh(new RoundedBoxGeometry(.6, .7, .5, 3, .18), toon(C.coral))
  box.position.y = 1.15
  const slot = new THREE.Mesh(new THREE.BoxGeometry(.3, .04, .02), toon(C.ink))
  slot.position.set(0, 1.3, .26)
  const leg = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(.12, .3, 0), new THREE.Vector3(-.08, .6, 0), new THREE.Vector3(0, .82, 0)]), 16, .05, 6), toon(C.brass))
  group.add(box, slot, leg)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return group
}

export default async function pier(): Promise<Station> {
  const group = new THREE.Group()
  group.position.copy(ORIGIN)
  const rand = rng(91)

  // The island at the shore end, with the post office pod, palms and the post box.
  const land = tier(7, 1.2, 901, C.grass, C.stone, .06)
  land.mesh.position.set(0, .6 - .6, 14)
  const sand = tier(8, .5, 902, C.sand, '#e8cf98', .06)
  sand.mesh.position.set(0, .6 - .55, 14)
  group.add(sand.mesh, land.mesh)
  const office = pod({ R: 2.2, H: 3.4, bands: [[.06, .14, C.coral]], windows: [[.9, .55, .45], [-.7, .5, .4], [0, .62, .38]], lit: true, door: .3, panels: 3, antenna: true, cupola: true })
  office.position.set(-2.6, .6, 15.5)
  office.rotation.y = .5
  group.add(office)
  for (const [x, z, h] of [[3.4, 13, 3.4], [4.6, 15.5, 2.8], [-5.4, 12.2, 3]] as const) {
    const tree = palm(h, 910 + x)
    tree.position.set(x, .6, z)
    group.add(tree)
  }
  const box = postbox()
  box.position.set(1.8, .6, 9.6)
  box.rotation.y = -.4
  group.add(box)

  // The pier: planks out over the water on posts, rope along both sides, lanterns at every other post.
  const deck = new Bundle()
  const plank = new THREE.BoxGeometry(2.4, .08, .26)
  for (let z = 8.5, i = 0; z > END + 2.4; z -= .3, i++) deck.add(i % 3 ? C.wood : '#a87650', plank, new THREE.Matrix4().makeTranslation(0, D, z))
  // The round platform at the end.
  const floor = new THREE.CylinderGeometry(3, 3, .1, 40)
  deck.add('#a87650', floor, new THREE.Matrix4().makeTranslation(0, D - .01, END))
  const ring = new THREE.TorusGeometry(3, .07, 6, 48)
  deck.add(C.brass, ring, new THREE.Matrix4().compose(new THREE.Vector3(0, D + .05, END), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 1, 1)))
  const post = new THREE.CylinderGeometry(.09, .1, D + 1.6, 8)
  const posts: THREE.Vector3[] = []
  for (let z = 8, i = 0; z > END + 3; z -= 2.6, i++) for (const x of [-1.25, 1.25]) {
    deck.add(C.bark, post, new THREE.Matrix4().makeTranslation(x, (D + 1.6) / 2 - .8, z))
    posts.push(new THREE.Vector3(x, D + .78, z))
  }
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2
    deck.add(C.bark, post, new THREE.Matrix4().makeTranslation(Math.cos(a) * 2.9, (D + 1.6) / 2 - .8, END + Math.sin(a) * 2.9))
  }
  group.add(deck.build())
  // Rope between posts along each side.
  for (const side of [-1.25, 1.25]) {
    const row = posts.filter(p => p.x === side)
    for (let i = 0; i < row.length - 1; i++) group.add(tether(row[i], row[i + 1], .18, .025))
  }
  // Lanterns, and a string of little lights swung between them.
  const lamps: THREE.Vector3[] = []
  posts.forEach((p, i) => {
    if (Math.floor(i / 2) % 2) return
    const l = lantern()
    l.position.set(p.x * 1.02, D, p.z)
    group.add(l)
    lamps.push(new THREE.Vector3(p.x * 1.02, D + 1.62, p.z))
  })
  const bulbs = new Bundle()
  const bulb = new THREE.SphereGeometry(.05, 8, 6)
  const left = lamps.filter(p => p.x < 0), right = lamps.filter(p => p.x > 0)
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const a = left[i], b = right[i]
    for (let k = 1; k < 10; k++) {
      const f = k / 10
      bulbs.add(k % 2 ? '#ffd27a' : '#ffa47a', bulb, new THREE.Matrix4().makeTranslation(a.x + (b.x - a.x) * f, a.y - Math.sin(f * Math.PI) * .45, a.z))
    }
  }
  const glows = bulbs.build(false)
  glows.traverse(node => { if (node instanceof THREE.Mesh) node.material = light('#ffd27a') })
  group.add(plain(glows))
  // A bench at the end, and Omar on the edge of the platform past it, legs over the water.
  const bench = new THREE.Group()
  const seat = new THREE.Mesh(new RoundedBoxGeometry(1.8, .1, .5, 2, .03), toon(C.wood))
  seat.position.y = .45
  bench.add(seat)
  for (const x of [-.75, .75]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.08, .45, .4), toon(C.ink))
    leg.position.set(x, .22, 0)
    bench.add(leg)
  }
  bench.position.set(-1.6, D, END + 1.4)
  bench.rotation.y = .4
  group.add(bench)
  const omar = await puppet()
  const S = 1.45
  omar.root.scale.setScalar(S)
  omar.root.position.set(.4, D + .02, END - 2.55)
  omar.root.rotation.y = Math.PI
  group.add(omar.root)

  // Boats at their moorings, a few rocks, fireflies over the island.
  const boats = [[-6, 2, 1.1, C.coral], [5.5, -6, 1.3, C.ivory], [-5, -14, .9, C.yellow]].map(([x, z, size, sail]) => {
    const b = boat(size as number, sail as string)
    b.position.set(x as number, .02, z as number)
    b.rotation.y = rand() * Math.PI * 2
    group.add(b)
    return b
  })
  const flies = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 6, 4), light('#e8ff8a'), 40)
  const flySeeds = Array.from({ length: 40 }, () => ({ x: (rand() - .5) * 12, z: 9 + rand() * 9, y: 1.2 + rand() * 2, s: rand() * 6 }))
  group.add(plain(flies))

  // On the horizon, under the sun: a city of glass domes and towers, kites on tethers over it.
  const skyline = new Bundle(), windows = new Bundle()
  const far = '#7a5f96', farther = '#8d6f9e', pane = new THREE.SphereGeometry(.3, 6, 4)
  for (let k = 0; k < 16; k++) {
    const x = -80 + k * 11 + (rand() - .5) * 5, z = -110 - rand() * 30, r = 4 + rand() * 7
    skyline.add(k % 2 ? far : farther, new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.Matrix4().makeTranslation(x, 0, z))
    // Its lit windows, on the side facing the pier.
    for (let w = 0; w < 6; w++) {
      const a = (rand() - .5) * 1.8, up = .15 + rand() * .6
      windows.add('#ffd27a', pane, new THREE.Matrix4().makeTranslation(x + Math.sin(a) * Math.cos(up) * r, Math.sin(up) * r, z + Math.cos(a) * Math.cos(up) * r))
    }
    if (k % 3 === 0) {
      const h = 12 + rand() * 14
      skyline.add(far, new THREE.CylinderGeometry(1, 1.5, h, 10), new THREE.Matrix4().makeTranslation(x + r * .8, h / 2, z - 2))
      skyline.add(farther, new THREE.SphereGeometry(1.9, 12, 8), new THREE.Matrix4().makeTranslation(x + r * .8, h, z - 2))
      windows.add('#ffd27a', pane, new THREE.Matrix4().makeTranslation(x + r * .8, h, z - .1))
    }
  }
  group.add(skyline.build(false))
  const lit = windows.build(false)
  lit.traverse(node => { if (node instanceof THREE.Mesh) node.material = light('#ffd27a') })
  group.add(plain(lit))
  const kites = [[-34, 34, -125], [26, 30, -130], [60, 38, -140]].map(([x, y, z], k) => {
    const kite = aerostat(4 + k)
    kite.group.position.set(x, y, z)
    kite.group.rotation.y = .5 + k
    group.add(kite.group, tether(new THREE.Vector3(x - 4, 2, z + 6), new THREE.Vector3(x, y - 2, z), 3, .08))
    return kite
  })

  const mail = drone()
  mail.group.scale.setScalar(1.2)
  group.add(mail.group)

  const w = (x: number, y: number, z: number) => [ORIGIN.x + x, ORIGIN.y + y, ORIGIN.z + z] as [number, number, number]
  const keys: Key[] = [
    { beat: 0, eye: w(7, 4.2, 22), look: w(0, 2, -4), fov: 38, hold: .45, card: 'left' },
    { beat: 1, eye: w(-4.5, 3.4, END + 9), look: w(.4, 2.2, END - 2.5), fov: 36, hold: .55, card: 'right' },
    { beat: 2, eye: w(1, 6, END + 4), look: w(0, 7, END - 60), fov: 42, hold: .8, card: 'left' },
  ]

  let sent = -100, clock = 0
  const at = new THREE.Vector3(), ahead = new THREE.Vector3(), m = new THREE.Matrix4()
  return {
    id: 'contact',
    group,
    centre: ORIGIN.clone().add(new THREE.Vector3(0, 0, -6)),
    radius: 45,
    light: SUNSET,
    keys,
    set(name, value) {
      if (name === 'send' && value !== '0') sent = clock
    },
    update(t, dt, _local, near, beat) {
      clock = t
      if (!near) return
      // Watching the sun go down; on the last card, up, turned round, and waving you off.
      const up = THREE.MathUtils.smoothstep(beat, .9, 1.5)
      omar.root.rotation.y = Math.PI * (1 - up)
      omar.root.position.z = END - 2.55 + up * .9
      omar.root.updateMatrixWorld()
      omar.pose(up < .5 ? blend(perch(t, .46), idle(t), up * 2) : blend(idle(t), wave(t), (up - .5) * 2))
      // The drone circles the pier; sent, it flies off into the sunset with the letter and comes back without it.
      const away = t - sent
      const loop = (s: number, out: THREE.Vector3) => out.set(Math.sin(s) * 4.2, D + 3.2 + Math.sin(s * 2) * .5, END + 4 + Math.cos(s) * 5.5)
      loop(t * .35, at)
      loop(t * .35 + .05, ahead)
      if (away < 9) {
        const f = THREE.MathUtils.smoothstep(away, 0, 4) - THREE.MathUtils.smoothstep(away, 5, 9)
        at.lerp(new THREE.Vector3(-6, 22, END - 70), f)
        ahead.lerp(new THREE.Vector3(-6, 22, END - 80), f)
        mail.letter.visible = away < 4.5
      } else mail.letter.visible = true
      mail.group.position.copy(at)
      mail.group.rotation.set(Math.sin(t * 1.3) * .08, Math.atan2(ahead.x - at.x, ahead.z - at.z), Math.sin(t * .9) * .1)
      mail.rotors.forEach((r, i) => { r.rotation.y += dt * (24 + i) })
      mail.letter.rotation.z = Math.sin(t * 2) * .15
      for (const [i, b] of boats.entries()) { b.position.y = .02 + Math.sin(t * 1.1 + i) * .05; b.rotation.z = Math.sin(t * .9 + i * 2) * .05 }
      for (const [i, kite] of kites.entries()) kite.rotor.rotation.z += dt * (1.2 + i * .2)
      flySeeds.forEach((s, i) => {
        m.makeTranslation(s.x + Math.sin(t * .4 + s.s) * 1.2, s.y + Math.sin(t * .9 + s.s * 2) * .4, s.z + Math.cos(t * .3 + s.s) * 1.2)
        flies.setMatrixAt(i, m)
      })
      flies.instanceMatrix.needsUpdate = true
    },
  }
}
