import * as THREE from 'three'
import type { Role } from '../../../content'
import { walkOrder } from '../../voyage/itinerary'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { C, cypress, flowers, lamp, light, plain, pod, tier, toon, tree } from '../../toon/kit'
import type { Key, Station } from '../engine'
import { STRIDE, blend, idle, walk } from '../motion'
import { arch, bench, robot, signpost, windmill } from '../props'
import { puppet } from '../puppet'

// The garden path: the story so far, walked. A path winds the length of a long garden island, with a
// signpost for every role, oldest first. Omar walks it as you read, stopping at each post while its card is
// in front of you and walking on to the next as you scroll, past arches of vines, benches, an old windmill,
// and a giant robot asleep under the meadow.

export const DAY = {
  sky: ['#dcefee', '#c3e6ef', '#93c7ec', '#5d98e0', '#3c74cf'] as [string, string, string, string, string],
  sun: [-.45, .62, .64] as [number, number, number], sunColor: '#fffbe6', sunSize: .045,
  key: '#fff6e2', strength: 2.7, hemi: ['#b2c9f6', '#b9c48f'] as [string, string], fill: 1.6,
  water: ['#3fb0c2', '#a6e4ec'] as [string, string], cloud: ['#ffffff', '#b7c8e6'] as [string, string], fog: [80, 300] as [number, number],
}

export const ORIGIN = new THREE.Vector3(58, 0, -64)
const COLORS: Record<Role['category'], string> = { experience: '#2f60c8', volunteer: '#ec7b60', education: '#4f9a45' }
const GROUND = .6


/** The dates as a post shows them. */
const dates = (role: Role) => role.period ? role.period.replace(' (expected)', '').replace(/ · .*/, '').replace(' — ', ' → ') : 'undated'

/** A flat strip along a curve. */
function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, y: number, steps = 160) {
  const positions: number[] = [], indices: number[] = []
  const tangent = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i <= steps; i++) {
    const p = curve.getPointAt(i / steps)
    curve.getTangentAt(i / steps, tangent)
    side.crossVectors(tangent, up).normalize().multiplyScalar(width / 2)
    positions.push(p.x - side.x, y, p.z - side.z, p.x + side.x, y, p.z + side.z)
    if (i < steps) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

export default async function garden(): Promise<Station> {
  await document.fonts?.ready
  const group = new THREE.Group()
  group.position.copy(ORIGIN)
  const n = walkOrder.length

  // The land: round tiers run together along the length of the island, a beach round the whole.
  const lands = [[-15, .4, 6.4, 81], [-7.5, -.6, 7, 82], [0, .3, 7.2, 83], [7.5, -.4, 7, 84], [15, .3, 6.4, 85]] as const
  for (const [x, z, r, seed] of lands) {
    const t = tier(r, 1, seed, C.grass, C.stone, .07)
    t.mesh.position.set(x, GROUND - .5, z)
    const sand = tier(r + .7, .4, seed + 20, C.sand, '#e8cf98', .07)
    sand.mesh.position.set(x, 0, z)
    group.add(sand.mesh, t.mesh)
  }

  // The path, winding, and the posts beside it, one for each role.
  const points = Array.from({ length: n }, (_, i) => new THREE.Vector3(-17 + i * 3.4, GROUND, Math.sin(i * .85) * 2.4))
  const curve = new THREE.CatmullRomCurve3([points[0].clone().add(new THREE.Vector3(-2.5, 0, 0)), ...points, points[n - 1].clone().add(new THREE.Vector3(2.5, 0, 0))])
  const path = new THREE.Mesh(ribbon(curve, .95, GROUND + .015), toon('#ead9b4'))
  path.receiveShadow = true
  group.add(path)
  // Where on the curve each post is, as a fraction of its length.
  const total = curve.getLength()
  const lengths = curve.getLengths(400)
  const at = (p: THREE.Vector3) => {
    let best = 0, bestD = Infinity
    for (let i = 0; i <= 400; i++) { const d = curve.getPoint(i / 400).distanceToSquared(p); if (d < bestD) { bestD = d; best = i } }
    return lengths[best] / total
  }
  const stops = points.map(at)

  walkOrder.forEach((role, i) => {
    const post = signpost({ band: COLORS[role.category], title: role.label, sub: dates(role), detail: role.title.length > 34 ? role.title.slice(0, 32) + '…' : role.title })
    post.position.copy(points[i]).add(new THREE.Vector3(0, 0, -1.05))
    post.rotation.y = Math.sin(i * 1.7) * .12
    group.add(post)
    // A bed of flowers in its colour at its foot.
    const bed = flowers(.55, 26, 90 + i, GROUND, [COLORS[role.category], '#fff6e6', C.yellow])
    bed.position.copy(post.position).setY(0)
    group.add(bed)
  })

  // Arches over the path, lamps and benches beside it.
  for (const i of [2, 5, 8]) {
    const p = curve.getPointAt((stops[i] + stops[i + 1]) / 2), tangent = curve.getTangentAt((stops[i] + stops[i + 1]) / 2)
    const a = arch(1.5, 1.9, 100 + i)
    a.position.copy(p).setY(GROUND)
    a.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 2
    group.add(a)
  }
  for (let i = 0; i < n - 1; i += 2) {
    const u = (stops[i] + stops[i + 1]) / 2 + .01
    const p = curve.getPointAt(u), tangent = curve.getTangentAt(u)
    const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize().multiplyScalar(.85)
    const l = lamp(1)
    l.position.copy(p).add(side).setY(GROUND)
    group.add(l)
    if (i % 4 === 0) {
      const b = bench(.9)
      b.position.copy(p).sub(side).setY(GROUND)
      b.rotation.y = Math.atan2(-side.x, -side.z) + Math.PI
      group.add(b)
    }
  }

  // The garden: low beds in front of the path, so nothing stands between you and Omar; trees, shrubs and
  // houses behind it.
  const zp = (x: number) => Math.sin((x + 17) / 3.4 * .85) * 2.4
  const rand = (() => { let seed = 7; return () => (seed = (seed * 16807) % 2147483647) / 2147483647 })()
  const shrubs = new Map<string, THREE.BufferGeometry[]>(), dots = new Map<string, THREE.BufferGeometry[]>()
  const put = (map: Map<string, THREE.BufferGeometry[]>, color: string, g: THREE.BufferGeometry) => { if (!map.has(color)) map.set(color, []); map.get(color)!.push(g) }
  for (let k = 0; k < 900; k++) {
    const x = -20 + rand() * 40, z = -7 + rand() * 14
    const off = z - zp(x)
    if (Math.abs(off) < .75 || Math.hypot(x, z * 2.6) > 21) continue
    if (off > 0 || k % 3) {
      // A flower: a dot of colour on a short stem's worth of green.
      const g = new THREE.SphereGeometry(.05 + rand() * .03, 6, 4)
      g.translate(x, GROUND + .06, z)
      put(dots, [C.yellow, C.rose, '#fff6e6', C.coral, '#b8d4ff'][k % 5], g)
    } else {
      const r = .16 + rand() * .2
      const g = new THREE.IcosahedronGeometry(r, 1)
      g.scale(1, .8, 1)
      g.translate(x, GROUND + r * .5, z)
      put(shrubs, [C.leaf, C.leafLight, C.grass2][k % 3], g)
    }
  }
  for (const [color, list] of shrubs) { const m = new THREE.Mesh(mergeGeometries(list), toon(color)); m.castShadow = m.receiveShadow = true; group.add(m) }
  for (const [color, list] of dots) group.add(plain(new THREE.Mesh(mergeGeometries(list), light(color))))
  for (let k = 0; k < 46; k++) {
    const x = -20 + rand() * 40, z = zp(x) - 2.2 - rand() * 5
    if (Math.hypot(x, z * 2.6) > 21 || points.some(p => Math.hypot(p.x - x, p.z - z) < 1.6)) continue
    const thing = k % 3 === 0 ? cypress(1.5 + rand() * .9, k) : tree(.5 + rand() * .3, k)
    thing.position.set(x, GROUND, z)
    group.add(thing)
  }
  for (const [x, z, R, face, band] of [[-12, -5.4, 1.1, .3, C.teal], [9, -5.6, 1.2, -.2, C.yellow], [18.5, -1.5, .9, -1, C.coral]] as const) {
    const p = pod({ R, H: R * .95, bands: [[0, .14, band]], windows: [[0, .5, R * .28], [.9, .45, R * .16]], door: .55, panels: 1 })
    p.position.set(x, GROUND, z)
    p.rotation.y = face
    group.add(p)
  }
  const giant = robot(2.6, 5)
  giant.group.position.set(-1.5, GROUND - .2, -7.5)
  giant.group.rotation.y = .4
  group.add(giant.group)
  const mill = windmill(4.2)
  mill.group.position.set(15, GROUND, -4.6)
  mill.group.rotation.y = -.3
  group.add(mill.group)

  // Omar, on the path.
  const omar = await puppet()
  omar.root.scale.setScalar(.95)
  group.add(omar.root)
  const scale = .95
  const state = { u: stops[0], phase: 0, walking: 0, facing: 0 }

  // The camera: a look down the length of the island, then one key for each post.
  const world = (v: THREE.Vector3) => v.clone().add(ORIGIN)
  const keys: Key[] = [{ beat: 0, eye: world(new THREE.Vector3(-6, 16, 30)).toArray(), look: world(new THREE.Vector3(0, 0, -2)).toArray(), fov: 34, hold: .35, card: 'left' }]
  points.forEach((p, i) => {
    const eye = world(p.clone().add(new THREE.Vector3(-1.8, 2.4, 6.6)))
    const look = world(p.clone().add(new THREE.Vector3(0, .9, -.4)))
    keys.push({ beat: i + 1, eye: eye.toArray(), look: look.toArray(), fov: 30, hold: .45, card: 'left' })
  })

  const position = new THREE.Vector3(), previous = new THREE.Vector3(), tangent = new THREE.Vector3()
  let first = true
  return {
    id: 'about',
    group,
    centre: ORIGIN.clone(),
    radius: 26,
    light: DAY,
    keys,
    update(t, dt, _local, near, beat) {
      if (!near) return
      mill.sails.rotation.z += dt * .6
      giant.eye.scale.setScalar(1 + Math.sin(t * .8) * .04)
      // Where Omar should be: at a post while its card is read, on the path between them otherwise.
      const index = Math.min(n - 1, Math.max(0, beat - 1))
      const k = Math.floor(index), f = index - k
      state.u = stops[k] + ((stops[Math.min(n - 1, k + 1)] ?? stops[k]) - stops[k]) * f
      curve.getPointAt(state.u, position)
      if (first) { previous.copy(position); first = false }
      const moved = position.distanceTo(previous)
      const going = dt > 0 ? moved / dt : 0
      state.walking += ((going > .05 ? 1 : 0) - state.walking) * Math.min(1, dt * 6)
      state.phase += moved / (STRIDE * scale)
      // Facing the way along the path, or turned toward you while standing.
      curve.getTangentAt(state.u, tangent)
      const back = position.x < previous.x - 1e-4
      const along = Math.atan2(tangent.x, tangent.z) + (back ? Math.PI : 0)
      const want = state.walking > .5 ? along : .25
      let delta = want - state.facing
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      state.facing += delta * Math.min(1, dt * 7)
      previous.copy(position)
      omar.root.position.copy(position)
      omar.root.rotation.y = state.facing
      omar.root.updateMatrixWorld()
      omar.pose(blend(idle(t), walk(state.phase), state.walking))
    },
  }
}
