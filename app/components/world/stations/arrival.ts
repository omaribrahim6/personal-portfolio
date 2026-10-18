import * as THREE from 'three'
import { C, bird, flowers, hedge, ivy, scatter, solarPanel, tier, toon } from '../../toon/kit'
import { town } from '../../toon/scenes/cover'
import type { Station } from '../engine'
import { word } from '../letters'
import { idle, wave } from '../motion'
import { puppet } from '../puppet'

// The first stop: the island town at sunrise, and in front of it, on a long green ridge out of the sea, the
// name in letters three times Omar's height, the way a town spells its name on a hill. Omar stands at the
// end of it, waving you in. Scrolling lifts the camera up over the letters and the town, toward the gardens.

export const MORNING = {
  sky: ['#f6dcc6', '#f3c9b4', '#b9cfe6', '#78a8e2', '#4a80d4'] as [string, string, string, string, string],
  sun: [-.62, .36, .7] as [number, number, number], sunColor: '#fff0c8', sunSize: .06,
  key: '#ffe6c8', strength: 2.5, hemi: ['#b9c6f2', '#c7b58f'] as [string, string], fill: 1.55,
  water: ['#45b2c4', '#a6e4ec'] as [string, string], cloud: ['#fff6ee', '#c4b9db'] as [string, string], fog: [70, 280] as [number, number],
}

export default async function arrival(): Promise<Station> {
  const group = new THREE.Group()
  const place = town('morning')
  group.add(place.group)

  // The ridge the letters stand on, long and low, a hedge along its back and flowers along its front.
  const ridge = new THREE.Group()
  ridge.position.set(0, 0, 17)
  const land = tier(5, 1.1, 71, C.grass, C.stone, .05)
  land.mesh.scale.set(3.4, 1, 1)
  land.mesh.position.y = .3
  ridge.add(land.mesh)
  const back = hedge(land.at, .85, .45, 72, [C.leaf, C.grass2, C.leafLight])
  back.scale.set(3.4, 1, 1)
  ridge.add(back)
  const meadow = flowers(4.5, 260, 73, .85)
  meadow.scale.set(3.4, 1, 1)
  const shrubs = scatter(4.5, 40, 74, .85)
  shrubs.scale.set(3.4, 1, 1)
  ridge.add(meadow, shrubs)
  const beach = tier(5.4, .5, 75, C.sand, '#e8cf98', .05)
  beach.mesh.scale.set(3.5, 1, 1.12)
  beach.mesh.position.y = 0
  ridge.add(beach.mesh)

  // The name.
  const name = word('Omar Ibrahim', { size: 2.3, depth: .55, color: C.ivory, line: C.coral, tracking: 70 })
  name.group.position.set(0, .85, .4)
  ridge.add(name.group)
  // Ivy climbing the first and last letters, panels along the tops, a bird or two sitting on them.
  for (const [x, drop] of [[-name.width / 2 + .5, 1.6], [-name.width / 2 + 1.2, 1.1], [name.width / 2 - .4, 1.9], [name.width / 2 - 1.3, 1.2], [-1.6, .9]] as const) {
    const vine = ivy(() => .01, .85 + 2.3, drop, [0], Math.round(x * 10))
    vine.position.set(x, 0, .4 + .02)
    ridge.add(vine)
  }
  for (const x of [-7.4, -2.7, 3.1, 7.9]) {
    const panel = solarPanel(.9, .5, .12)
    panel.position.set(x, .85 + 2.3 + .02, .1)
    panel.rotation.y = Math.PI
    ridge.add(panel)
  }
  const perched: THREE.Group[] = []
  for (const x of [-4.6, 5.6]) {
    const b = bird(.22)
    b.group.position.set(x, .85 + 2.32, .15)
    b.left.rotation.z = 1.2
    b.right.rotation.z = -1.2
    ridge.add(b.group)
    perched.push(b.group)
  }
  // A path of stepping stones from the beach up onto the ridge, where Omar stands.
  for (let i = 0; i < 6; i++) {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(.32, .36, .12, 12), toon(C.stone))
    stone.position.set(name.width / 2 + 1.2 + i * .15, .82 - i * .1, 1.6 + i * .55)
    stone.receiveShadow = true
    ridge.add(stone)
  }
  group.add(ridge)

  // Omar, at the end of the name, waving.
  const omar = await puppet()
  omar.root.scale.setScalar(.95)
  omar.root.position.set(4.6, .85, 20.2)
  omar.root.rotation.y = .15
  group.add(omar.root)

  const anchors = { omar: new THREE.Object3D() }
  anchors.omar.position.set(4.6, 2.1, 20.2)
  group.add(anchors.omar)

  return {
    id: 'home',
    group,
    centre: new THREE.Vector3(0, 0, 6),
    radius: 40,
    light: MORNING,
    anchors,
    keys: [
      { at: 0, eye: [1.5, 2.4, 50], look: [1, 1.1, 14], fov: 34, hold: .5, card: 'none' },
      { beat: 1, eye: [22, 17, 34], look: [4, 3, 0], fov: 36, hold: .6, card: 'right' },
    ],
    update(t, dt, local, near) {
      if (!near) return
      place.update(t, dt)
      // Waving while you arrive, then standing and watching you go.
      omar.root.updateMatrixWorld()
      omar.pose(local < .35 ? wave(t) : idle(t))
      perched.forEach((b, i) => { b.rotation.y = Math.sin(t * .7 + i * 2) * .5 })
    },
  }
}
