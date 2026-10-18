import * as THREE from 'three'
import type { Diorama } from '../gallery'
import {
  C, aerostat, bird, boat, cableway, cloud, cloudMaterial, cypress, flowers, greenhouse, hedge, ivy, lamp, light, palm, person, plain,
  pod, porthole, ripples, scatter, sea, skyDome, solarArray, sunlight, tether, tier, toon, tower, tree, turbine, waterfall,
} from '../kit'

// The cover: an island town in the morning. Terraces of white stone stepping up out of a turquoise sea,
// gardens spilling over every edge, round houses with brass portholes, a glasshouse, a tower of hanging
// gardens, a wind farm on the next island and an airborne turbine on a tether, turning high above it all.

const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)
/** A place given as the camera sees it: so far right, so high, so far away (from the island's middle). */
const seen = (right: number, y: number, away: number) => v(right * .81 - away * .58, y, -right * .58 - away * .81)

/** Foam that follows a wandering shore. */
function surf(at: (angle: number) => number, width: number, y: number) {
  const steps = 160
  const positions: number[] = [], indices: number[] = []
  for (let i = 0; i <= steps; i++) {
    const a = i / steps * Math.PI * 2
    const r = at(a)
    positions.push(Math.sin(a) * (r - width * .2), y, Math.cos(a) * (r - width * .2), Math.sin(a) * (r + width), y, Math.cos(a) * (r + width))
    if (i < steps) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return plain(new THREE.Mesh(g, light(C.foam)))
}

/** Somewhere on a tier: the angle round it and how far in from its rim. */
function on(t: { at: (a: number) => number }, angle: number, inset: number, y: number) {
  const r = t.at(angle) - inset
  return v(Math.sin(angle) * r, y, Math.cos(angle) * r)
}

/** The same island in two lights: morning for the front cover, evening for the back. */
const LIGHT = {
  morning: {
    haze: '#d3ecef', sky: [[0, '#d3ecef'], [.025, '#c2e5ef'], [.09, '#93c6ec'], [.22, '#64a0e4'], [.45, '#3f7bd2'], [1, '#2f62bd']] as [number, string][],
    sun: { from: v(-14, 18, 12), color: '#fff1d8', strength: 2.7, sky: '#a9c4ff', ground: '#b5c48f', fill: 1.6 },
    water: [C.water, '#8fdcea'], cloud: ['#ffffff', '#b9c9e6'],
  },
  evening: {
    haze: '#f4c3a6', sky: [[0, '#f4c3a6'], [.03, '#f1ad94'], [.1, '#de8f9b'], [.24, '#9f7db5'], [.5, '#5a5ea6'], [1, '#2f3c7a']] as [number, string][],
    sun: { from: v(-18, 7, 4), color: '#ffb47e', strength: 2.5, sky: '#9a86c8', ground: '#d39a6c', fill: 1.3 },
    water: ['#4f8fb8', '#f5c49a'], cloud: ['#ffe3c8', '#b58cb3'],
  },
}

/**
 * The town on its own, without sky or sea: the terraced island, its neighbours (the wind farm and the far
 * island with the cable car between), boats, birds and the airborne turbine. The front and back covers stand
 * it in a sky of their own; the voyage puts it in the world.
 */
export function town(time: keyof typeof LIGHT = 'morning') {
  const world = new THREE.Group()
  const spin: { object: THREE.Object3D; speed: number; axis: 'x' | 'y' | 'z' }[] = []
  const bob: { object: THREE.Object3D; base: number; phase: number; amount: number }[] = []

  /* ------------------------------------------------------------- the island */
  const island = new THREE.Group()
  world.add(island)

  const beach = tier(7.5, .8, 3, C.sand, '#e8cf98', .07)
  beach.mesh.position.y = 0
  island.add(beach.mesh, surf(beach.at, .32, .03))

  const t1 = tier(6.2, 1.6, 5, C.grass, C.stone, .07)
  t1.mesh.position.y = .4 + .8
  const t1y = 2
  island.add(t1.mesh)

  const t2Group = new THREE.Group()
  t2Group.position.set(-.55, 0, -.75)
  const t2 = tier(4.3, 1.5, 8, C.meadow, C.stone, .09)
  t2.mesh.position.y = t1y + .75
  const t2y = t1y + 1.5
  t2Group.add(t2.mesh)
  island.add(t2Group)

  const t3Group = new THREE.Group()
  t3Group.position.set(-1.1, 0, -1.5)
  const t3 = tier(2.5, 1.4, 13, C.grass, C.stone, .1)
  t3.mesh.position.y = t2y + .7
  const t3y = t2y + 1.4
  t3Group.add(t3.mesh)
  island.add(t3Group)

  // Gardens over every lip, ivy down every wall. Gaps where the stairs come down.
  island.add(hedge(t1.at, t1y, .34, 21, [C.leaf, C.grass2, C.leafLight], [[.42, .62]]))
  t2Group.add(hedge(t2.at, t2y, .3, 22, [C.leaf, C.leafLight, C.grass2], [[.2, .55]]))
  t3Group.add(hedge(t3.at, t3y, .26, 23, [C.leafDark, C.leaf, C.leafLight], [[.18, .48]]))
  island.add(ivy(t1.at, t1y, 1.4, [-.3, -.1, .15, .3, .9, 1.05, 1.5, 1.7, 2.1, -.8, -1.1], 31))
  t2Group.add(ivy(t2.at, t2y, 1.3, [-.2, .1, .3, 1, 1.2, 1.6, -.6], 32))
  t3Group.add(ivy(t3.at, t3y, 1.2, [0, .3, .9, 1.3, -.4], 33))

  // Round windows and arched doors let into the terrace walls: people live inside the stone.
  for (const [a, y, s, lit] of [[.05, 1.15, .2, false], [.8, 1.05, .24, true], [1.3, 1.2, .2, false], [-.55, 1.1, .22, true], [1.85, 1.05, .2, false]] as const) {
    const p = porthole(s, lit)
    const r = t1.at(a) * 1.005 + .02
    p.position.set(Math.sin(a) * r, y, Math.cos(a) * r)
    p.lookAt(p.position.clone().add(v(Math.sin(a), 0, Math.cos(a))))
    island.add(p)
  }
  for (const [a, y, s, lit] of [[.2, t1y + .75, .2, true], [.95, t1y + .8, .18, false], [-.35, t1y + .7, .2, false]] as const) {
    const p = porthole(s, lit)
    const r = t2.at(a) * 1.005 + .02
    p.position.set(Math.sin(a) * r, y, Math.cos(a) * r)
    p.lookAt(p.position.clone().add(v(Math.sin(a), 0, Math.cos(a))))
    t2Group.add(p)
  }

  // Stairs, white, from the beach up to the first terrace.
  {
    const a = .52, steps = 9
    const inner = t1.at(a) - .05, outer = t1.at(a) + 1.15, run = (outer - inner) / steps
    for (let i = 0; i < steps; i++) {
      const h = (i + 1) * (t1y - .4) / steps
      const step = new THREE.Mesh(new THREE.BoxGeometry(.72, h, run), toon(C.ivory))
      const r = outer - (i + .5) * run
      step.position.set(Math.sin(a) * r, .4 + h / 2, Math.cos(a) * r)
      step.rotation.y = a
      step.castShadow = step.receiveShadow = true
      island.add(step)
    }
  }

  // Water from a spring at the top, falling terrace to terrace into a pool.
  const falls: { flow: (t: number) => void }[] = []
  {
    const a = .32
    const r3 = t3.at(a), r2 = t2.at(a + .05)
    const top = waterfall([
      v(Math.sin(a) * (r3 - .5), t3y + .03, Math.cos(a) * (r3 - .5)),
      v(Math.sin(a) * (r3 + .06), t3y + .02, Math.cos(a) * (r3 + .06)),
      v(Math.sin(a) * (r3 + .2), t3y - .5, Math.cos(a) * (r3 + .2)),
      v(Math.sin(a) * (r3 + .3), t2y + .03, Math.cos(a) * (r3 + .3)),
    ], .4)
    t3Group.add(top.mesh)
    falls.push(top)
    // Across the second terrace (in its own coordinates) and over its edge.
    const o = t3Group.position.clone().sub(t2Group.position)
    const start = v(Math.sin(a) * (r3 + .3), t2y + .03, Math.cos(a) * (r3 + .3)).add(o)
    const lip = v(Math.sin(a + .05) * (r2 + .06), t2y + .02, Math.cos(a + .05) * (r2 + .06))
    const run = waterfall([start, start.clone().lerp(lip, .5).setY(t2y + .03), lip,
      v(Math.sin(a + .05) * (r2 + .22), t2y - .6, Math.cos(a + .05) * (r2 + .22)),
      v(Math.sin(a + .05) * (r2 + .32), t1y + .03, Math.cos(a + .05) * (r2 + .32))], .42)
    t2Group.add(run.mesh)
    falls.push(run)
    const pool = plain(new THREE.Mesh(new THREE.CircleGeometry(.62, 40), toon('#7fd3e2')))
    pool.rotation.x = -Math.PI / 2
    pool.position.set(Math.sin(a + .05) * (r2 + .55), t1y + .015, Math.cos(a + .05) * (r2 + .55))
    const rim = plain(new THREE.Mesh(new THREE.RingGeometry(.62, .74, 40), toon(C.ivory)))
    rim.rotation.x = -Math.PI / 2
    rim.position.copy(pool.position).setY(t1y + .02)
    t2Group.add(pool, rim)
  }

  /* -------------------------------------------------------------- the houses */
  const houses: [number, number, number, THREE.Object3D][] = []
  const place = (group: THREE.Object3D, parent: THREE.Object3D, t: { at: (a: number) => number }, angle: number, inset: number, y: number, face = angle) => {
    group.position.copy(on(t, angle, inset, y))
    group.rotation.y = face
    parent.add(group)
    houses.push([angle, inset, y, group])
    return group
  }

  place(pod({ R: 1.05, H: 1, n: 2.6, bands: [[0, .14, C.teal]], windows: [[0, .45, .3], [.9, .5, .18], [-.9, .5, .18]], door: .55, panels: 2, antenna: true }), island, t1, .08, 1.4, t1y)
  place(pod({ R: .85, H: .85, n: 3, color: C.ivory, bands: [[.0, .12, C.coral]], windows: [[-.2, .5, .26]], door: .5, cupola: true }), island, t1, 1.05, 1.15, t1y)
  place(pod({ R: .78, H: .75, n: 2.4, bands: [[0, .14, C.yellow]], windows: [[0, .5, .22], [.7, .45, .14]], lit: true, door: -.6, panels: 1 }), island, t1, -.62, 1.15, t1y)
  place(pod({ R: .7, H: .66, n: 2.8, color: C.shell2, bands: [[0, .12, C.sky]], windows: [[.1, .48, .2]], door: .7 }), island, t1, 1.62, 1.05, t1y)

  place(greenhouse(1.15, 4, C.ivory), t2Group, t2, 1.0, 1.55, t2y)
  place(pod({ R: .9, H: .95, n: 2.5, bands: [[0, .12, C.coral], [.62, .7, C.coral]], windows: [[0, .4, .28], [1.1, .45, .2]], door: -.8, antenna: true, panels: 2 }), t2Group, t2, -.4, 1.2, t2y)
  place(pod({ R: .66, H: .7, n: 3.2, color: C.ivory, bands: [[0, .14, C.teal]], windows: [[0, .5, .2]], lit: true, door: .6 }), t2Group, t2, 1.75, 1, t2y)

  const spire = tower({ floors: 4, R: .95, floor: .52, seed: 7 })
  spire.position.set(.1, t3y, .1)
  t3Group.add(spire)

  // A field of panels on the far side of the first terrace, and more on the roof of the second.
  const field = solarArray(2, 4, .62, .42, 1.1)
  field.position.copy(on(t1, 2.45, 1.2, t1y))
  field.rotation.y = 2.45 + Math.PI / 2 - .3
  island.add(field)

  /* -------------------------------------------------------------- the garden */
  const trees: [THREE.Object3D, THREE.Object3D, { at: (a: number) => number }, number, number, number][] = []
  const plant = (thing: THREE.Object3D, parent: THREE.Object3D, t: { at: (a: number) => number }, angle: number, inset: number, y: number) => {
    thing.position.copy(on(t, angle, inset, y))
    parent.add(thing)
    trees.push([thing, parent, t, angle, inset, y])
  }
  plant(tree(.75, 2), island, t1, .55, 2.1, t1y)
  plant(tree(.6, 5, [C.leafLight, C.grass]), island, t1, -.25, .7, t1y)
  plant(tree(.62, 9), island, t1, 1.35, 1.6, t1y)
  plant(tree(.55, 11, [C.leafDark, C.leaf]), island, t1, -1.1, 1, t1y)
  plant(tree(.7, 12), island, t1, 2.05, 1.2, t1y)
  plant(cypress(1.9, 3), island, t1, .62, .75, t1y)
  plant(cypress(1.6, 4), island, t1, -.9, 1.6, t1y)
  plant(cypress(1.7, 6), island, t1, 1.3, .65, t1y)
  plant(tree(.6, 14, [C.leafLight, C.leaf]), t2Group, t2, .05, .65, t2y)
  plant(tree(.7, 15), t2Group, t2, 1.4, 1.1, t2y)
  plant(cypress(1.5, 8), t2Group, t2, -.55, .7, t2y)
  plant(cypress(1.8, 9), t2Group, t2, .62, .55, t2y)
  plant(tree(.55, 16, [C.leafDark, C.leaf]), t3Group, t3, .75, .5, t3y)
  plant(cypress(1.5, 10), t3Group, t3, -.35, .45, t3y)
  plant(cypress(1.25, 12), t3Group, t3, 1.1, .4, t3y)
  island.add(scatter(5.7, 70, 3, t1y, [C.leaf, C.leafLight, C.grass2]))
  island.add(flowers(5.8, 220, 4, t1y))
  t2Group.add(flowers(3.9, 110, 5, t2y, [C.yellow, '#fff6e6', C.rose]))

  // Palms and people on the beach, and a jetty out into the water.
  for (const [a, h, lean, seed] of [[.25, 2.1, .3, 1], [.78, 1.8, -.25, 2], [1.25, 2.3, .35, 3], [-.45, 1.9, .2, 4], [1.9, 1.7, -.3, 5]] as const) {
    const p = palm(h, seed, lean)
    p.position.copy(on(beach, a, .55, .4))
    p.rotation.y = a + Math.PI / 2
    island.add(p)
  }
  for (const [a, seed] of [[.4, 1], [.47, 2], [1.0, 3], [-.15, 4], [1.55, 6]] as const) {
    const p = person(.34, seed)
    p.position.copy(on(beach, a, .5, .4))
    p.rotation.y = a
    island.add(p)
  }
  for (const [a] of [[.35], [.7], [-.3]] as const) {
    const l = lamp(.55)
    l.position.copy(on(t1, a, .3, t1y))
    island.add(l)
  }

  const jetty = new THREE.Group()
  const jettyAngle = .66
  const deck = new THREE.Mesh(new THREE.BoxGeometry(.7, .08, 3.4), toon(C.wood))
  deck.position.set(0, .48, 1.7)
  deck.castShadow = deck.receiveShadow = true
  jetty.add(deck)
  for (let i = 0; i < 4; i++) for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .7, 6), toon(C.bark))
    post.position.set(side * .3, .2, .4 + i * .95)
    post.castShadow = true
    jetty.add(post)
  }
  jetty.position.copy(on(beach, jettyAngle, .6, 0))
  jetty.rotation.y = jettyAngle
  island.add(jetty)
  const stand = new THREE.Object3D()
  stand.position.set(0, .52, 3.2)
  jetty.add(stand)

  /* ------------------------------------------------------------ in the sky */
  // An airborne turbine on a long tether from the top of the tower.
  const kite = aerostat(2.3)
  kite.group.position.set(-5.2, 11.5, -4)
  kite.group.rotation.y = -.5
  world.add(kite.group)
  spin.push({ object: kite.rotor, speed: 3.2, axis: 'y' })
  bob.push({ object: kite.group, base: 11.5, phase: 0, amount: .25 })
  const towerTop = v(-1.1 + .1, t3y + 2.6, -1.5 + .1)
  const line = tether(towerTop, kite.group.position.clone().add(v(.4, -.9, .2)), 1.2, .025)
  world.add(line)

  const flock: { group: THREE.Object3D; left: THREE.Object3D; right: THREE.Object3D; phase: number; r: number; h: number }[] = []
  for (let i = 0; i < 6; i++) {
    const b = bird(.32)
    world.add(b.group)
    flock.push({ ...b, phase: i * .45 + (i % 2) * .2, r: 5 + (i % 3) * .7, h: 9 + (i % 2) * .6 })
  }

  /* --------------------------------------------------------- the neighbours */
  // The wind farm, on the next island over.
  const farm = new THREE.Group()
  farm.position.set(-1, 0, -17)
  const farmLand = tier(3.6, .9, 41, C.grass2, C.stone, .12)
  farmLand.mesh.position.y = .2
  farm.add(farmLand.mesh, surf(farmLand.at, .25, .03))
  farm.add(hedge(farmLand.at, .65, .26, 42, [C.leaf, C.grass2]))
  for (const [x, z, h, phase] of [[-1.4, .6, 4.6, 0], [.9, -1, 5.4, 1.3], [1.6, 1.3, 4.1, 2.2]] as const) {
    const t = turbine(h)
    t.group.position.set(x, .65, z)
    t.group.rotation.y = -.7
    t.rotor.rotation.z = phase
    farm.add(t.group)
    spin.push({ object: t.rotor, speed: 1.1 + h * .05, axis: 'z' })
  }
  world.add(farm)

  // Another island, further off, its houses pale in the haze.
  const far = new THREE.Group()
  far.position.set(-25, 0, -14)
  const farLand = tier(5, 1.4, 51, C.grass, C.stone, .1)
  farLand.mesh.position.y = .5
  const farTop = tier(3, 1.2, 52, C.meadow, C.stone, .1)
  farTop.mesh.position.set(.6, 1.8, -.4)
  far.add(farLand.mesh, farTop.mesh, surf(farLand.at, .3, .03))
  far.add(hedge(farLand.at, 1.2, .35, 53))
  for (const [a, inset, R] of [[.4, 1.3, .8], [1.1, 1.2, .7], [-.3, 1.2, .65]] as const) {
    const p = pod({ R, H: R * .95, bands: [[0, .14, C.coral]], windows: [[0, .5, R * .3]] })
    p.position.copy(on(farLand, a, inset, 1.2))
    p.rotation.y = a
    far.add(p)
  }
  const farSpire = tower({ floors: 3, R: .8, floor: .5, seed: 9 })
  farSpire.position.set(.6, 2.4, -.4)
  far.add(farSpire)
  for (const [a, seed] of [[.8, 1], [1.5, 2], [0, 3]] as const) {
    const c = cypress(1.6, seed)
    c.position.copy(on(farLand, a, .6, 1.2))
    far.add(c)
  }
  world.add(far)

  // A cable car from the top of the island to the next one over.
  const pylon = (height: number) => {
    const g = new THREE.Group()
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.07, .13, height, 8), toon(C.ivory))
    mast.position.y = height / 2
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.7, .1, .1), toon(C.coral))
    arm.position.y = height
    mast.castShadow = arm.castShadow = true
    g.add(mast, arm)
    return g
  }
  const nearPylon = pylon(2)
  nearPylon.position.set(-1.1 - 1.5, t3y, -1.5 - .9)
  world.add(nearPylon)
  const farPylon = pylon(2.6)
  farPylon.position.set(-25 + .6, 3, -14 - .4 + 1.6)
  world.add(farPylon)
  const cable = cableway(nearPylon.position.clone().add(v(0, 2, 0)), farPylon.position.clone().add(v(0, 2.6, 0)), 1.6, 4, .55)
  world.add(cable.group)

  // Boats.
  const boats: { group: THREE.Object3D; phase: number; y: number }[] = []
  for (const [x, z, s, sail, yaw] of [[10.5, 6.5, 1.3, C.coral, -.8], [3.5, 12, 1.1, C.ivory, .4], [-10.5, 7.5, 1.2, C.yellow, 2.4], [19, -2, 1, C.ivory, -1.2], [-3, 16, 1, C.sky, 1.2]] as const) {
    const b = boat(s, sail)
    b.position.set(x, .12, z)
    b.rotation.y = yaw
    world.add(b)
    boats.push({ group: b, phase: x, y: .12 })
  }


  // In the evening every window is lit.
  if (time === 'evening') {
    const dark = toon(C.glassDark), lit = light(C.glow)
    world.traverse(node => { if (node instanceof THREE.Mesh && node.material === dark) node.material = lit })
  }

  return {
    group: world,
    stand,
    /** The top of the tower, where the tether is made fast. */
    towerTop,
    update(t: number, dt: number) {
      for (const s of spin) s.object.rotation[s.axis] += s.speed * dt
      for (const b of bob) b.object.position.y = b.base + Math.sin(t * .5 + b.phase) * b.amount
      for (const b of boats) {
        b.group.position.y = b.y + Math.sin(t * 1.3 + b.phase) * .04
        b.group.rotation.z = Math.sin(t * 1.1 + b.phase) * .05
      }
      cable.move(t)
      for (const f of falls) f.flow(t)
      flock.forEach((b, i) => {
        const a = t * .22 + b.phase
        b.group.position.set(2 + Math.cos(a) * b.r, b.h + Math.sin(t * .7 + i) * .3, -1 + Math.sin(a) * b.r * .6)
        b.group.rotation.y = -a
        const flap = Math.sin(t * 9 + i * 1.7) * .5
        b.left.rotation.z = .3 + flap
        b.right.rotation.z = -.3 - flap
      })
    },
  }
}

export default function cover(time: keyof typeof LIGHT = 'morning'): Diorama {
  const light_ = LIGHT[time]
  const scene = new THREE.Scene()
  const HAZE = light_.haze
  // The sky goes wherever the camera does, so it is never nearer or further.
  const dome = skyDome(240, light_.sky)
  scene.add(dome)
  scene.fog = new THREE.Fog(HAZE, 40, 175)
  const camera = new THREE.PerspectiveCamera(24, 1.6, .5, 400)
  sunlight(scene, { ...light_.sun, span: 13 })

  const bob: { object: THREE.Object3D; base: number; phase: number; amount: number }[] = []

  /* ---------------------------------------------------------------- the sea */
  const waves = ripples(light_.water[0], light_.water[1])
  waves.repeat.set(70, 70)
  const water = sea(180, C.water, waves)
  scene.add(water)

  const place = town(time)
  scene.add(place.group)

  for (const [right, y, away, s, seed] of [[-34, 15, 70, 10, 1], [8, 24, 95, 14, 2], [38, 13, 60, 8, 3], [-64, 10, 85, 9, 4], [60, 20, 110, 13, 5], [18, 10, 34, 3.6, 6], [-14, 8, 40, 3, 7]] as const) {
    const c = cloud(s, seed)
    c.position.copy(seen(right, y, away))
    c.lookAt(camera.position.clone().setY(y))
    scene.add(c)
    bob.push({ object: c, base: y, phase: seed, amount: .3 })
  }

  // Islands on the horizon, pale with distance.
  for (const [right, away, scale, seed] of [[-40, 70, 1.3, 61], [28, 95, 1.7, 62], [-8, 130, 2.2, 63], [58, 70, 1.1, 64], [-80, 110, 1.8, 65]] as const) {
    const { x, z } = seen(right, 0, away)
    const isle = new THREE.Group()
    const low = tier(5, 1.2, seed, C.grass2, C.stone, .14)
    low.mesh.position.y = .3
    const high = tier(3, 1.4, seed + 1, C.grass, C.stone, .14)
    high.mesh.position.set(.8, 1.5, -.5)
    isle.add(low.mesh, high.mesh, hedge(low.at, .9, .5, seed + 2, [C.leaf, C.grass2]))
    for (let k = 0; k < 3; k++) {
      const c = cypress(2 + k * .3, seed + k)
      c.position.set(.8 + Math.cos(k * 2.2 + seed) * 1.8, 2.2, -.5 + Math.sin(k * 2.2 + seed) * 1.8)
      isle.add(c)
    }
    const p = pod({ R: 1, H: .9, bands: [[0, .14, C.coral]] })
    p.position.set(-2.4, .9, 1.4)
    isle.add(p)
    isle.scale.setScalar(scale)
    isle.position.set(x, 0, z)
    scene.add(isle)
  }

  // In the evening the clouds go pink and the sun sits on the horizon.
  if (time === 'evening') {
    const pink = cloudMaterial(light_.cloud[0], light_.cloud[1])
    scene.traverse(node => { if (node instanceof THREE.Mesh && node.material === cloudMaterial()) node.material = pink })
    const sun = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshBasicMaterial({ color: '#ffe0a8', fog: false }))
    const halo = new THREE.Mesh(new THREE.RingGeometry(10.5, 13, 48), new THREE.MeshBasicMaterial({ color: '#ffd2a0', fog: false, transparent: true, opacity: .45 }))
    const glow = new THREE.Group()
    glow.add(plain(sun), plain(halo))
    glow.position.copy(seen(-62, 4, 200))
    glow.lookAt(seen(0, 4, 0))
    scene.add(glow)
  }

  /* ------------------------------------------------------------ the camera */
  const target = v(-1, 3.4, -1)
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  let width = 16, height = 10
  function aim() {
    // Wide, the island sits right of centre and low, under an open sky for the masthead. Tall, it stands
    // further off, the whole of it across the lower half.
    const aspect = width / height
    const distance = aspect >= 1 ? 54 : 54 / Math.max(.45, aspect) * .66
    const yaw = .62 + pointer.x * .06
    const pitch = .2 + pointer.y * .02
    camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * distance, target.y + Math.sin(pitch) * distance, target.z + Math.cos(yaw) * Math.cos(pitch) * distance)
    camera.lookAt(target)
    dome.position.copy(camera.position).setY(0)
    const shiftX = aspect >= 1 ? -.12 * width : 0, shiftY = aspect >= 1 ? -.24 * height : -.3 * height
    camera.setViewOffset(width, height, shiftX, shiftY, width, height)
  }
  aim()

  return {
    scene,
    camera,
    anchors: { stand: place.stand },
    ink: { line: 1.5, boil: 4, depthEdge: .05 },
    resize(w, h) { width = w; height = h; aim() },
    pointer(x, y) { pointer.tx = x; pointer.ty = y },
    update(t, dt) {
      const k = 1 - Math.exp(-dt * 3)
      pointer.x += (pointer.tx - pointer.x) * k
      pointer.y += (pointer.ty - pointer.y) * k
      aim()
      for (const b of bob) b.object.position.y = b.base + Math.sin(t * .5 + b.phase) * b.amount
      place.update(t, dt)
    },
    dispose() {
      scene.traverse(node => {
        if (node instanceof THREE.Mesh) node.geometry.dispose()
      })
    },
  }
}
