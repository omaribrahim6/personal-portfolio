import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { C, toon } from '../../toon/kit'
import { model as cascade } from '../../toon/scenes/cascade'
import { model as reflection } from '../../toon/scenes/reflection'
import { model as signal } from '../../toon/scenes/signal'
import { model as trail } from '../../toon/scenes/trail'
import type { Engine, Key, Station } from '../engine'
import { blend, idle, point } from '../motion'
import { puppet, type Pose } from '../puppet'

// The workshops: four small islands in a channel, one for each project, each with its working model on it.
// Omar waits on a jetty at the front of each, beside a brass lever; pull it (on the card, or the lever
// itself) and he throws it, and the model runs: the street files its report, the lesson unfolds, the
// lighthouse finds the bottle, the forge turns words into a query.

export const NOON = {
  sky: ['#e3f2ee', '#c8e8f0', '#8fc4ec', '#5592df', '#356cc9'] as [string, string, string, string, string],
  sun: [-.3, .82, .48] as [number, number, number], sunColor: '#fffdf0', sunSize: .04,
  key: '#fffaf0', strength: 2.8, hemi: ['#b6cdf8', '#bcc895'] as [string, string], fill: 1.65,
  water: ['#38aac0', '#a6e4ec'] as [string, string], cloud: ['#ffffff', '#b4c6e6'] as [string, string], fog: [90, 320] as [number, number],
}

type Model = { group: THREE.Group; anchors: Record<string, THREE.Object3D>; set(next: string): void; update(t: number, dt: number): void }
const ISLES: { centre: THREE.Vector3; build: (camera: THREE.Camera, alone: boolean) => Model; side: number }[] = [
  { centre: new THREE.Vector3(40, .3, -128), build: signal, side: 1 },
  { centre: new THREE.Vector3(14, .3, -156), build: cascade, side: -1 },
  { centre: new THREE.Vector3(40, 0, -184), build: trail, side: 1 },
  { centre: new THREE.Vector3(14, .3, -212), build: reflection, side: -1 },
]

/** A lever on a stand: a brass box with a slot, and a handle that throws from back to front. */
function leverPost() {
  const group = new THREE.Group()
  const stand = new THREE.Mesh(new RoundedBoxGeometry(.34, .62, .3, 2, .04), toon(C.brass))
  stand.position.y = .31
  const face = new THREE.Mesh(new THREE.BoxGeometry(.06, .02, .2), toon(C.ink))
  face.position.y = .63
  const handle = new THREE.Group()
  handle.position.y = .62
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .42, 8), toon(C.ink))
  rod.position.y = .21
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.07, 14, 10), toon(C.coral))
  knob.position.y = .44
  handle.add(rod, knob)
  handle.rotation.x = -.6
  group.add(stand, face, handle)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, handle }
}

/** A jetty out of the front of an island, on posts. */
function jetty() {
  const group = new THREE.Group()
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.8, .1, 1.4), toon(C.wood))
  deck.position.y = .05
  deck.castShadow = deck.receiveShadow = true
  group.add(deck)
  for (const x of [-1.2, 1.2]) for (const z of [-.55, .55]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .9, 6), toon(C.bark))
    post.position.set(x, -.35, z)
    group.add(post)
  }
  return group
}

export default async function workshops(engine: Engine): Promise<Station> {
  const group = new THREE.Group()
  const anchors: Record<string, THREE.Object3D> = {}
  const pickable: THREE.Object3D[] = []
  const rigged = await puppet()
  const isles = await Promise.all(ISLES.map(async (isle, i) => {
    const made = isle.build(engine.camera, false)
    made.group.position.copy(isle.centre)
    group.add(made.group)
    for (const [name, anchor] of Object.entries(made.anchors)) anchors[`${i}:${name}`] = anchor
    // The jetty at the front, and on it the lever and him.
    const dock = jetty()
    dock.position.copy(isle.centre).add(new THREE.Vector3(0, .12, 6.1))
    group.add(dock)
    const lever = leverPost()
    lever.group.position.copy(isle.centre).add(new THREE.Vector3(.75 * isle.side, .22, 6.05))
    lever.group.name = `lever-${i}`
    group.add(lever.group)
    pickable.push(lever.group)
    const omar = i === 0 ? rigged : await puppet()
    omar.root.scale.setScalar(.95)
    omar.root.position.copy(isle.centre).add(new THREE.Vector3(-.35 * isle.side, .22, 6.2))
    omar.root.rotation.y = .5 * isle.side
    group.add(omar.root)
    return { ...isle, made, lever, omar, open: false, pull: 0 }
  }))

  // The camera: the channel from above, then each island in turn, the card on the side away from it.
  const keys: Key[] = [{ beat: 0, eye: [52, 17, -104], look: [27, 0, -158], fov: 36, hold: .35, card: 'left' }]
  isles.forEach((isle, i) => {
    const c = isle.centre
    keys.push({ beat: i + 1, eye: [c.x + 9 * isle.side, c.y + 10.5, c.z + 19], look: [c.x + 1.2 * isle.side, c.y + .6, c.z + 1.6], fov: 32, hold: .5, card: isle.side > 0 ? 'left' : 'right' })
  })

  return {
    id: 'projects',
    group,
    centre: new THREE.Vector3(27, 0, -170),
    radius: 60,
    light: NOON,
    keys,
    anchors,
    pickable,
    pick(object) {
      const i = Number(object.name.replace('lever-', ''))
      if (Number.isNaN(i)) return
      return { name: `project-${i}`, value: isles[i].open ? 'closed' : 'open' }
    },
    set(name, value) {
      const i = Number(name.replace('project-', ''))
      const isle = isles[i]
      if (!isle) return
      isle.open = value === 'open'
      isle.made.set(value)
    },
    update(t, dt, _local, near, beat) {
      if (!near) return
      isles.forEach((isle, i) => {
        // Only the island in view (and its neighbours) moves.
        if (Math.abs(beat - (i + 1)) > 1.5) return
        isle.made.update(t, dt)
        isle.pull += ((isle.open ? 1 : 0) - isle.pull) * Math.min(1, dt * 5)
        isle.lever.handle.rotation.x = -.6 + 1.2 * isle.pull
        // He throws the lever with his near hand, then points at what it set going.
        const reach: Pose = isle.side > 0
          ? { ...idle(t), armR: [-1.1 + .5 * isle.pull, 0, -.15], foreR: [-.3, 0, 0], spine: [.12, 0, 0] }
          : { ...idle(t), armL: [-1.1 + .5 * isle.pull, 0, .15], foreL: [-.3, 0, 0], spine: [.12, 0, 0] }
        const shown = point(t, -.5 * isle.side)
        const k = isle.pull
        isle.omar.root.updateMatrixWorld()
        isle.omar.pose(k < .5 ? blend(idle(t), reach, k * 2) : blend(reach, shown, (k - .5) * 2))
      })
    },
  }
}
