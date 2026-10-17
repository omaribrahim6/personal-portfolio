import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { Diorama } from '../gallery'
import { C, cypress, flowers, hedge, light, palm, person, plain, tier, toon, tree, waterfall } from '../kit'
import { disposeAll, lever, pop, span, studio, v } from './common'

// Clascade: a class round a teacher's desk, with the lesson on it as a deck of three slides. Pull the lever
// and the deck unfolds: each slide lifts away and grows into a terrace of its own, stepping down in a cascade
// with water running from one to the next, something three-dimensional growing on each, and the class walking
// up onto them together, two to a layer.

const LAYERS = [
  { at: v(-2.2, 3.4, -2), color: C.yellow, label: 'source' },
  { at: v(.2, 2.25, -.2), color: C.coral, label: 'shared' },
  { at: v(2.5, 1.1, 1.6), color: C.teal, label: 'dimension' },
] as const

/** A slide that can be a terrace: a rounded slab, its top in the colour of its layer. */
function slab(color: string) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.6, .34, 2, 3, .1), toon(C.ivory))
  const top = new THREE.Mesh(new RoundedBoxGeometry(2.5, .06, 1.9, 2, .03), toon(color))
  top.position.y = .17
  const lines = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(1.4 - i * .3, .02, .1), toon(C.ivory))
    line.position.set(-.35 + i * .15, .21, -.55 + i * .3)
    lines.add(line)
  }
  group.add(body, top, lines)
  group.traverse(node => { if (node instanceof THREE.Mesh) { node.castShadow = true; node.receiveShadow = true } })
  return { group, lines }
}

/** An open book on a stand: the source the lesson was made from. */
function book() {
  const group = new THREE.Group()
  for (const side of [-1, 1]) {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(.62, .05, .82), toon(C.sky))
    cover.position.set(side * .3, .1, 0)
    cover.rotation.z = side * -.22
    const pages = new THREE.Mesh(new THREE.BoxGeometry(.56, .08, .76), toon('#fffaf0'))
    pages.position.set(side * .29, .16, 0)
    pages.rotation.z = side * -.22
    group.add(cover, pages)
  }
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(.05, .02, .5), toon(C.coral))
  ribbon.position.set(0, .2, .35)
  group.add(ribbon)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return group
}

/** A globe on a stand, with a ring round it. */
function globe() {
  const group = new THREE.Group()
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(.06, .2, .3, 12), toon(C.brass))
  stand.position.y = .15
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.42, 28, 18), toon(C.water))
  ball.position.y = .72
  const land = new THREE.Mesh(new THREE.IcosahedronGeometry(.43, 1), toon(C.grass))
  land.scale.set(.6, .55, .65)
  land.position.set(.12, .8, .12)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.6, .025, 6, 48), toon(C.brass))
  ring.position.y = .72
  ring.rotation.set(1.2, 0, .4)
  group.add(stand, ball, land, ring)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, spin: ball, land }
}

/** A step pyramid with a palm beside it: the lesson, in three dimensions. */
function pyramid() {
  const group = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1 - i * .22, .18, 1 - i * .22), toon(i % 2 ? C.sand : C.stone))
    step.position.y = .09 + i * .18
    step.castShadow = step.receiveShadow = true
    group.add(step)
  }
  const top = new THREE.Mesh(new THREE.ConeGeometry(.12, .2, 4), toon(C.yellow))
  top.position.y = .82
  top.rotation.y = Math.PI / 4
  const p = palm(1.1, 4, .2)
  p.position.set(.75, 0, -.25)
  group.add(top, p)
  return group
}

export default function cascade(): Diorama {
  const s = studio({ target: v(.1, 1.2, 0), distance: 22, yaw: .62, pitch: .42, fov: 27, span: 7.5 })
  const { scene, camera } = s

  const ground = tier(5.2, 1, 21, C.grass, C.stone, .07)
  ground.mesh.position.y = -.5
  scene.add(ground.mesh, hedge(ground.at, 0, .3, 22, [C.leaf, C.grass2, C.leafLight], [[.55, .9]]))
  // A paved floor for the class, with a step round it.
  const floor = tier(2.6, .12, 23, C.stone, C.ivory, .02)
  floor.mesh.position.set(.6, .06, 1)
  scene.add(floor.mesh)

  // The teacher's desk, and the teacher.
  const desk = new THREE.Group()
  const top = new THREE.Mesh(new RoundedBoxGeometry(1.5, .12, .8, 2, .04), toon(C.wood))
  top.position.y = .7
  const legs = [[-.6, -.3], [.6, -.3], [-.6, .3], [.6, .3]].map(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .66, 6), toon(C.bark))
    leg.position.set(x, .33, z)
    return leg
  })
  desk.add(top, ...legs)
  desk.position.set(.4, .12, .6)
  desk.rotation.y = .6
  desk.traverse(node => { if (node instanceof THREE.Mesh) { node.castShadow = true; node.receiveShadow = true } })
  scene.add(desk)
  const teacher = person(.62, 9)
  teacher.position.set(-.45, .12, .1)
  teacher.lookAt(1.5, .12, 1.6)
  scene.add(teacher)

  // The class, on stools in an arc in front of the desk; each will walk up to a layer.
  const seats: THREE.Vector3[] = []
  const students: THREE.Object3D[] = []
  for (let i = 0; i < 6; i++) {
    const a = -.2 + i * .34
    const seat = v(.6 + Math.sin(a + .6) * 2, .12, 1 + Math.cos(a + .6) * 2)
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .22, 12), toon(LAYERS[i % 3].color))
    stool.position.copy(seat).setY(.23)
    stool.castShadow = true
    scene.add(stool)
    const kid = person(.42, i + 20)
    kid.position.copy(seat).setY(.34)
    kid.lookAt(desk.position.x, .34, desk.position.z)
    scene.add(kid)
    seats.push(seat.clone().setY(.34))
    students.push(kid)
  }

  // The slides, stacked on the desk; and the terraces they become.
  const deskTop = desk.position.clone().setY(.86)
  const slides = LAYERS.map((layer, i) => {
    const made = slab(layer.color)
    scene.add(made.group)
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, 1, 12), toon(C.ivory))
    pillar.castShadow = true
    scene.add(pillar)
    return { ...made, layer, pillar, i }
  })
  const things = [book(), globe(), pyramid()]
  const globeParts = things[1] as ReturnType<typeof globe>
  const objects = [things[0] as THREE.Group, globeParts.group, things[2] as THREE.Group]
  objects.forEach((object, i) => {
    object.position.copy(LAYERS[i].at).add(v(-.35, .2, -.2))
    scene.add(object)
  })

  // Water spilling from each terrace to the next, and from the last into a pool.
  const falls = [0, 1].map(i => {
    const a = LAYERS[i].at, b = LAYERS[i + 1].at
    const lip = a.clone().add(v(1.1, .18, .85))
    const fall = waterfall([lip, lip.clone().add(v(.3, -.25, .25)), b.clone().add(v(-1.05, .22, -.7))], .42)
    scene.add(fall.mesh)
    return fall
  })
  const pool = plain(new THREE.Mesh(new THREE.CircleGeometry(.75, 32), toon('#7fd3e2')))
  pool.rotation.x = -Math.PI / 2
  pool.position.set(3.7, .02, 2.8)
  const poolRim = new THREE.Mesh(new THREE.TorusGeometry(.78, .07, 8, 40), toon(C.ivory))
  poolRim.rotation.x = -Math.PI / 2
  poolRim.position.set(3.7, .05, 2.8)
  scene.add(pool, poolRim)
  const lastFall = waterfall([LAYERS[2].at.clone().add(v(1.15, .18, .8)), LAYERS[2].at.clone().add(v(1.35, -.4, 1)), v(3.6, .04, 2.7)], .42)
  scene.add(lastFall.mesh)

  // A board behind the desk, where the lesson is put up.
  const board = new THREE.Group()
  const face = new THREE.Mesh(new THREE.BoxGeometry(2, 1.1, .08), toon('#24463a'))
  face.position.y = 1.5
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.14, 1.24, .05), toon(C.wood))
  frame.position.set(0, 1.5, -.04)
  const easel = [-.8, .8].map(x => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 2, 6), toon(C.bark))
    leg.position.set(x, 1, -.12)
    return leg
  })
  const chalk = [0, 1, 2].map(i => {
    const line = plain(new THREE.Mesh(new THREE.PlaneGeometry(1.2 - i * .25, .05), light('#e9f2e4')))
    line.position.set(-.2 + i * .1, 1.75 - i * .2, .045)
    return line
  })
  board.add(face, frame, ...easel, ...chalk)
  board.position.set(-1.4, 0, -.6)
  board.rotation.y = .7
  board.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  scene.add(board)

  for (const [x, z, size, seed] of [[-3.6, 1.6, .7, 3], [-2.8, 3.2, .6, 5], [3.6, -1.6, .65, 7], [1.2, -3.6, .7, 9]] as const) {
    const t = tree(size, seed)
    t.position.set(x, 0, z)
    scene.add(t)
  }
  for (const [x, z, h, seed] of [[-4, -1, 1.5, 2], [-1, -3.9, 1.6, 4], [4.3, .6, 1.3, 6]] as const) {
    const c = cypress(h, seed)
    c.position.set(x, 0, z)
    scene.add(c)
  }
  scene.add(flowers(5, 130, 24, 0))

  const anchors = Object.fromEntries(LAYERS.map((layer, i) => {
    const a = new THREE.Object3D()
    a.position.copy(layer.at).add(v(0, 1.5, 0))
    scene.add(a)
    return [['source', 'shared', 'dimension'][i], a]
  }))

  const state = lever(3.4)
  const from = new THREE.Vector3(), to = new THREE.Vector3()
  return {
    scene,
    camera,
    anchors,
    ink: { line: 1.4, boil: 4 },
    resize: s.resize,
    pointer: s.pointer,
    set(next) { state.set(next === 'open') },
    update(t, dt) {
      s.follow(dt)
      const p = state.step(dt)
      slides.forEach(({ group, lines, layer, pillar, i }) => {
        // Each slide lifts off the deck in turn, turns, grows, and settles into its place in the cascade.
        const k = span(p, i * .1, .45 + i * .1)
        from.copy(deskTop).add(v(0, (2 - i) * .07, 0))
        to.copy(layer.at)
        group.position.lerpVectors(from, to, k)
        group.position.y += Math.sin(k * Math.PI) * 1.2
        group.scale.setScalar(.36 + .64 * k)
        group.rotation.y = .6 * (1 - k) + Math.sin(t * .8 + i) * .02 * k
        group.position.y += Math.sin(t * 1.1 + i * 1.7) * .04 * k
        lines.visible = k < .6
        // The pillar under it grows up from the ground as it arrives.
        const g = span(p, .35 + i * .1, .6 + i * .1)
        pillar.visible = g > .01
        pillar.scale.set(1, Math.max(.001, layer.at.y - .17) * g, 1)
        pillar.position.set(layer.at.x, (layer.at.y - .17) * g / 2, layer.at.z)
      })
      objects.forEach((object, i) => {
        const k = pop(span(p, .55 + i * .1, .75 + i * .1))
        object.scale.setScalar(Math.max(.001, k))
        object.position.y = LAYERS[i].at.y + .2 + Math.sin(t * 1.1 + i * 1.7) * .04
      })
      globeParts.spin.rotation.y = t * .6
      globeParts.land.rotation.y = t * .6
      ;[...falls, lastFall].forEach((fall, i) => {
        fall.mesh.visible = p > .7 + i * .05
        fall.flow(t)
      })
      // The class walks up, two to a layer, once the layers are there.
      students.forEach((kid, i) => {
        const layer = LAYERS[Math.floor(i / 2)]
        const k = span(p, .6 + i * .05, .9 + i * .03)
        const spot = layer.at.clone().add(v(i % 2 ? .75 : .35, .19, i % 2 ? .35 : .7))
        kid.position.lerpVectors(seats[i], spot, k)
        kid.position.y += Math.sin(k * Math.PI) * 1.3 + Math.abs(Math.sin(t * 6 + i)) * .03 * (k > 0 && k < 1 ? 1 : 0)
        if (k > .99) kid.lookAt(objects[Math.floor(i / 2)].position.x, kid.position.y, objects[Math.floor(i / 2)].position.z)
        else if (k < .01) kid.lookAt(desk.position.x, kid.position.y, desk.position.z)
      })
      teacher.rotation.y += (Math.atan2(LAYERS[0].at.x - teacher.position.x, LAYERS[0].at.z - teacher.position.z) * span(p, .1, .3) + .9 * (1 - span(p, .1, .3)) - teacher.rotation.y) * .1
    },
    dispose() { disposeAll(scene) },
  }
}
