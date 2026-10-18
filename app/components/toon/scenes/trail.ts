import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Diorama } from '../gallery'
import { C, cloud, cypress, glassMaterial, light, plain, pod, ripples, rng, scatter, toon } from '../kit'
import { disposeAll, lever, pop, span, studio, v } from './common'

// Revenant: a lighthouse on a rock in a sea of fog, and all round it, bottles bobbing in the water, each with a
// conversation rolled up inside: the reasons behind decisions, adrift. Pull the lever and the lamp comes on,
// the beam swings round and finds one, a line of buoys lights the way out to it, and the bottle rises, the
// cork comes out and the reason unrolls, two years later and as clear as the day it was written.

/** A bottle with a note rolled up inside it, and a cork. */
function bottle() {
  const group = new THREE.Group()
  const body = plain(new THREE.Mesh(new THREE.CapsuleGeometry(.17, .38, 6, 18), glassMaterial('#bfeee0', .5)))
  const neck = plain(new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, .2, 12), glassMaterial('#bfeee0', .5)))
  neck.position.y = .36
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(.065, .055, .1, 10), toon(C.wood))
  cork.position.y = .49
  const note = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .34, 12), toon('#fff6e2'))
  const tie = new THREE.Mesh(new THREE.TorusGeometry(.092, .015, 6, 16), toon(C.coral))
  tie.rotation.x = Math.PI / 2
  group.add(body, neck, cork, note, tie)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, cork }
}

/** The note, unrolled: what was decided and why, in a hand written on the day. */
function scroll() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 300
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff6e2'
  ctx.fillRect(0, 0, 256, 300)
  ctx.fillStyle = '#16241d'
  ctx.font = 'bold 26px Georgia, serif'
  ctx.fillText('Why Postgres?', 22, 50)
  ctx.font = 'italic 18px Georgia, serif'
  const lines = ['The thread it was', 'argued out in, the', 'trade-offs weighed,', 'who decided,', 'and when.']
  lines.forEach((line, i) => ctx.fillText(line, 22, 92 + i * 30))
  ctx.strokeStyle = '#ec7b60'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(22, 62)
  ctx.lineTo(196, 62)
  ctx.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const group = new THREE.Group()
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.46), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }))
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1.38, 12), toon('#f3e3bf'))
  top.rotation.z = Math.PI / 2
  top.position.y = .73
  const bottom = top.clone()
  bottom.position.y = -.73
  group.add(sheet, top, bottom)
  return { group, sheet }
}

/** The lighthouse: striped, with a gallery, a glass lantern and the lamp in it. */
function lighthouse() {
  const group = new THREE.Group()
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.8, .9, .45, 32), toon(C.stone))
  base.position.y = .22
  group.add(base)
  const H = 2.7
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(.42, .6, H, 32), toon(C.ivory))
  tower.position.y = .45 + H / 2
  group.add(tower)
  for (let i = 0; i < 3; i++) {
    const y0 = .45 + H * (.12 + i * .3), y1 = y0 + H * .13
    const r0 = .6 - (.18 * (y0 - .45) / H), r1 = .6 - (.18 * (y1 - .45) / H)
    const band = new THREE.Mesh(new THREE.CylinderGeometry(r1 + .012, r0 + .012, y1 - y0, 32, 1, true), toon(C.coral))
    band.position.y = (y0 + y1) / 2
    group.add(band)
  }
  const door = new THREE.Mesh(new THREE.CircleGeometry(.16, 20, 0, Math.PI), toon(C.glassDark))
  door.position.set(0, .45, .6)
  const window1 = new THREE.Mesh(new THREE.CircleGeometry(.09, 16), toon(C.glassDark))
  window1.position.set(0, 1.9, .5)
  group.add(door, window1)
  const top = .45 + H
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(.66, .55, .12, 32), toon(C.ink))
  gallery.position.y = top + .06
  const rail = new THREE.Mesh(new THREE.TorusGeometry(.64, .025, 6, 40), toon(C.ink))
  rail.rotation.x = Math.PI / 2
  rail.position.y = top + .38
  const lantern = plain(new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .55, 24, 1, true), glassMaterial('#e6fbf6', .35)))
  lantern.position.y = top + .4
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.2, 18, 14), toon('#f5e7c4'))
  lamp.position.y = top + .4
  const roof = new THREE.Mesh(new THREE.ConeGeometry(.48, .5, 32), toon(C.coral))
  roof.position.y = top + .92
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 10), toon(C.ink))
  knob.position.y = top + 1.2
  group.add(gallery, rail, lantern, lamp, roof, knob)
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .26, 4), toon(C.ink))
    post.position.set(Math.sin(a) * .64, top + .25, Math.cos(a) * .64)
    group.add(post)
  }
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  // The beam: a long pale cone from the lamp, turning.
  const beam = new THREE.Group()
  beam.position.y = top + .4
  const cone = plain(new THREE.Mesh(new THREE.ConeGeometry(.55, 5.2, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: .45, depthWrite: false, side: THREE.DoubleSide })))
  cone.rotation.z = Math.PI / 2
  cone.position.x = 2.6
  cone.castShadow = false
  beam.add(cone)
  group.add(beam)
  return { group, lamp, beam, cone }
}

/** The model on its own, for the voyage to stand in its world; `alone` is false there. */
export function model(camera: THREE.Camera, alone = true) {
  const scene = new THREE.Group()
  const rand = rng(5)

  // The sea, as a round slab of water.
  const waves = ripples(C.water, '#8fdcea')
  waves.repeat.set(3, 3)
  const sea = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 1, 96, 1), [toon(C.waterDeep), toon('#ffffff', { map: waves }), toon(C.waterDeep)] as unknown as THREE.Material)
  sea.position.y = -.5
  sea.receiveShadow = true
  // In the voyage it stands in the world's own sea.
  if (alone) scene.add(sea)

  // The rock, and the green on top of it.
  const rocks: THREE.BufferGeometry[] = [], darker: THREE.BufferGeometry[] = []
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 1.6
    const size = .45 + rand() * .55
    const g = new THREE.IcosahedronGeometry(size, 0)
    g.rotateY(rand() * 3)
    g.scale(1, .7 + rand() * .4, 1)
    g.translate(Math.sin(a) * d, size * .25 - .1 + (1.6 - d) * .25, Math.cos(a) * d)
    ;(i % 3 ? rocks : darker).push(g)
  }
  scene.add(new THREE.Mesh(mergeGeometries(rocks), toon(C.rock)), new THREE.Mesh(mergeGeometries(darker), toon(C.rock2)))
  scene.children.slice(-2).forEach(node => { node.castShadow = true; node.receiveShadow = true })
  const mound = new THREE.Mesh(new THREE.SphereGeometry(1.35, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(C.grass))
  mound.scale.set(1, .32, 1)
  mound.position.y = .55
  mound.receiveShadow = true
  scene.add(mound, scatter(1.2, 14, 6, .6))
  const house = lighthouse()
  house.group.position.set(-.1, .6, -.1)
  scene.add(house.group)
  const keeper = pod({ R: .55, H: .5, n: 2.6, bands: [[0, .16, C.teal]], windows: [[0, .5, .14]], door: .7 })
  keeper.position.set(.9, .62, .55)
  keeper.rotation.y = .9
  scene.add(keeper)
  const tree = cypress(1, 3)
  tree.position.set(-.95, .6, .6)
  scene.add(tree)

  // The bottles, adrift.
  const drift: { group: THREE.Group; cork: THREE.Mesh; at: THREE.Vector3; phase: number }[] = []
  const spots = [v(3.2, 0, 1.6), v(-2.6, 0, 2.6), v(-3.6, 0, -1.2), v(1.4, 0, -3.4), v(3.6, 0, -1.6), v(.8, 0, 3.6)]
  spots.forEach((at, i) => {
    const b = bottle()
    b.group.position.copy(at)
    b.group.rotation.set(Math.PI / 2 - .2, rand() * 3, .3)
    scene.add(b.group)
    drift.push({ ...b, at, phase: i * 1.3 })
  })
  const chosen = drift[0]

  // Mist over the water.
  const mist: { cloud: THREE.Object3D; at: THREE.Vector3; phase: number }[] = []
  for (const [x, z, size, seed] of [[2.2, 2.6, 1.1, 1], [-1.4, 3.4, .9, 2], [3.9, .2, .8, 3], [-3.4, .6, 1, 4], [-1.8, -3.2, 1.1, 5], [2.4, -2.8, .9, 6], [.3, 2.4, .7, 7]] as const) {
    const c = cloud(size, seed)
    c.position.set(x, .12, z)
    c.rotation.y = rand() * 3
    scene.add(c)
    mist.push({ cloud: c, at: c.position.clone(), phase: seed })
  }

  // The buoys that light the way out to it.
  const buoys: THREE.Object3D[] = []
  for (let i = 0; i < 5; i++) {
    const t = (i + 1) / 6
    const at = v(.9, 0, .5).lerp(chosen.at, t)
    const buoy = new THREE.Group()
    const float = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 10), toon(i % 2 ? C.coral : C.ivory))
    float.scale.y = .8
    const glow = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), light(C.glow))
    glow.position.y = .14
    buoy.add(float, glow)
    buoy.position.copy(at)
    scene.add(buoy)
    buoys.push(buoy)
  }

  const note = scroll()
  scene.add(note.group)

  const anchors = { conversation: new THREE.Object3D(), decision: new THREE.Object3D(), reason: new THREE.Object3D() }
  anchors.decision.position.set(-.1, 4.6, -.1)
  drift[2].group.add(anchors.conversation)
  anchors.conversation.position.set(0, 0, -.6)
  note.group.add(anchors.reason)
  anchors.reason.position.set(0, .95, 0)
  scene.add(anchors.decision)

  const state = lever(4)
  const lampOff = toon('#f5e7c4'), lampOn = light(C.glow)
  const toward = Math.atan2(-(chosen.at.z - .1), chosen.at.x + .1)
  return {
    group: scene,
    anchors,
    set(next: string) { state.set(next === 'open') },
    update(t: number, dt: number) {
      const p = state.step(dt)
      house.lamp.material = p > .02 ? lampOn : lampOff
      // The beam sweeps round twice, then comes to rest on the bottle.
      const sweep = span(p, .02, .38)
      house.beam.visible = p > .02
      house.beam.rotation.y = t * 1.4 * (1 - sweep) + toward * sweep
      // Level while it searches, then down onto the water where the bottle is.
      house.beam.rotation.z = -.62 * sweep
      ;(house.cone.material as THREE.MeshBasicMaterial).opacity = .45 * span(p, .02, .1)
      drift.forEach(b => {
        if (b === chosen) return
        b.group.position.y = .02 + Math.sin(t * 1.2 + b.phase) * .05
        b.group.rotation.z = .3 + Math.sin(t * .9 + b.phase) * .15
      })
      // The chosen one rises, stands up, and lets go of its cork.
      const rise = span(p, .55, .78)
      chosen.group.position.set(chosen.at.x, .02 + Math.sin(t * 1.2) * .05 * (1 - rise) + rise * .9, chosen.at.z)
      chosen.group.rotation.set((Math.PI / 2 - .2) * (1 - rise), chosen.group.rotation.y, .3 * (1 - rise) + Math.sin(t * .9) * .15 * (1 - rise))
      const out = span(p, .76, .86)
      chosen.cork.position.set(0, .49 + out * .9, out * .3)
      chosen.cork.rotation.x = out * 4
      chosen.cork.visible = out < .99
      const unroll = span(p, .82, 1)
      note.group.visible = unroll > .01
      note.group.position.set(chosen.at.x - .1, 1.2 + unroll * 1.25 + Math.sin(t * 1.3) * .04 * unroll, chosen.at.z)
      note.group.scale.set(Math.max(.001, unroll), Math.max(.001, pop(unroll)), 1)
      note.group.lookAt(camera.position.x, note.group.position.y, camera.position.z)
      buoys.forEach((buoy, i) => {
        const k = pop(span(p, .35 + i * .04, .5 + i * .04))
        buoy.scale.setScalar(Math.max(.001, k))
        buoy.position.y = Math.sin(t * 1.6 + i) * .04
      })
      // The mist draws back from the way out.
      mist.forEach(m => {
        const clear = span(p, .3, .6)
        m.cloud.position.set(m.at.x * (1 + clear * .25) + Math.sin(t * .2 + m.phase) * .3, .12, m.at.z * (1 + clear * .25))
        m.cloud.scale.setScalar(1 - clear * .35)
      })
    },
  }
}

export default function trail(): Diorama {
  const s = studio({ target: v(0, 1.2, 0), distance: 22, yaw: .5, pitch: .44, fov: 27, span: 7 })
  const m = model(s.camera)
  s.scene.add(m.group)
  return {
    scene: s.scene,
    camera: s.camera,
    anchors: m.anchors,
    ink: { line: 1.4, boil: 4 },
    resize: s.resize,
    pointer: s.pointer,
    set: m.set,
    update(t, dt) { s.follow(dt); m.update(t, dt) },
    dispose() { disposeAll(s.scene) },
  }
}
