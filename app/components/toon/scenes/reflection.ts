import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { Diorama } from '../gallery'
import { C, cloud, cypress, flowers, glassMaterial, hedge, plain, pod, solarPanel, tier, toon, tree } from '../kit'
import { disposeAll, lever, pop, span, studio, v } from './common'

// QueryForge: a small solar forge in a walled yard, a llama at the controls. A question waits in the hopper as
// a heap of letter blocks. Pull the lever and a glass dome comes down over the whole yard (nothing leaves this
// machine), the letters ride the belt into the forge, the chimney puffs, and out the other side come database
// barrels, which stack themselves into a table.

const QUESTION = 'HOW MANY IDEAS SHIPPED?'.replace(/ /g, '')

const letters = new Map<string, THREE.Texture>()
/** A letter printed on a block, for the question. */
function letter(char: string) {
  let texture = letters.get(char)
  if (texture) return texture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fbf6ea'
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = '#16241d'
  ctx.font = 'bold 44px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, 32, 35)
  texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  letters.set(char, texture)
  return texture
}

/** A belt: a long low box with a dark band on top that moves. */
function belt(length: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#2b3631'
  ctx.fillRect(0, 0, 16, 64)
  ctx.fillStyle = '#4c5b54'
  for (let y = 0; y < 64; y += 16) ctx.fillRect(0, y, 16, 5)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, length * 2.5)
  texture.colorSpace = THREE.SRGBColorSpace
  const group = new THREE.Group()
  const frame = new THREE.Mesh(new THREE.BoxGeometry(.7, .3, length), toon(C.steel))
  frame.position.y = .35
  const top = new THREE.Mesh(new THREE.PlaneGeometry(.56, length), toon('#ffffff', { map: texture }))
  top.rotation.x = -Math.PI / 2
  top.position.y = .505
  for (const z of [-length / 2 + .2, length / 2 - .2]) for (const x of [-.28, .28]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .3, 6), toon(C.ink))
    leg.position.set(x, .1, z)
    group.add(leg)
  }
  group.add(frame, top)
  group.traverse(node => { if (node instanceof THREE.Mesh) { node.castShadow = true; node.receiveShadow = true } })
  return { group, texture }
}

/** A database barrel: three discs stacked, the way a database is drawn on a whiteboard. */
function barrel() {
  const group = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .1, 24), toon(i === 1 ? C.teal : C.sky))
    disc.position.y = .05 + i * .115
    disc.castShadow = true
    group.add(disc)
  }
  return group
}

/** A llama, the one who runs the forge. */
function llama() {
  const group = new THREE.Group()
  const wool = toon('#f6efe0')
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .42, 6, 16), wool)
  body.rotation.x = Math.PI / 2
  body.position.y = .62
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .38, 4, 12), wool)
  neck.position.set(0, .95, .3)
  neck.rotation.x = .2
  const head = new THREE.Group()
  head.position.set(0, 1.22, .38)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), wool)
  const snout = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 10), toon('#eadcc2'))
  snout.position.set(0, -.04, .11)
  const ears = [-1, 1].map(side => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.035, .14, 8), wool)
    ear.position.set(side * .07, .14, -.02)
    ear.rotation.z = -side * .2
    return ear
  })
  const eyes = [-1, 1].map(side => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), toon(C.ink))
    eye.position.set(side * .065, .03, .1)
    return eye
  })
  head.add(skull, snout, ...ears, ...eyes)
  const blanket = new THREE.Mesh(new THREE.CylinderGeometry(.235, .235, .3, 20, 1, true, -Math.PI / 2 - .9, 1.8), toon(C.coral, { side: THREE.DoubleSide }))
  blanket.rotation.x = Math.PI / 2
  blanket.position.y = .64
  const legs = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .34, 4, 8), wool)
    leg.position.set(x * .12, .22, z * .2)
    return leg
  })
  group.add(body, neck, head, blanket, ...legs)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, head }
}

/** The model on its own, for the voyage to stand in its world. */
export function model() {
  const scene = new THREE.Group()

  const ground = tier(5.2, 1, 31, C.grass, C.stone, .06)
  ground.mesh.position.y = -.5
  scene.add(ground.mesh, hedge(ground.at, 0, .3, 32, [C.leaf, C.grass2, C.leafLight]))
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, .06, 64), toon(C.stone))
  yard.position.y = .03
  yard.receiveShadow = true
  scene.add(yard)

  // The forge: a big round pod, panels on its roof, a chimney, a hatch either side.
  const forge = new THREE.Group()
  const shell = pod({ R: 1.5, H: 1.45, n: 2.8, bands: [[0, .12, C.coral], [.55, .62, C.coral]], windows: [[0, .55, .3]], lit: true })
  forge.add(shell)
  for (const a of [2.4, 3, 3.6]) {
    const panel = solarPanel(.8, .5)
    panel.position.set(Math.sin(a) * .9, 1.32, Math.cos(a) * .9)
    panel.rotation.y = a + Math.PI
    forge.add(panel)
  }
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .9, 16), toon(C.ivory))
  chimney.position.set(-.55, 1.6, -.4)
  const chimneyCap = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .1, 16), toon(C.ink))
  chimneyCap.position.set(-.55, 2.07, -.4)
  forge.add(chimney, chimneyCap)
  for (const side of [-1, 1]) {
    const hatch = new THREE.Mesh(new THREE.CircleGeometry(.36, 24, 0, Math.PI), toon('#1f2a26'))
    hatch.position.set(side * 1.36, .3, .45)
    hatch.rotation.y = side * Math.PI / 2 * .85
    const frame = new THREE.Mesh(new THREE.TorusGeometry(.36, .05, 8, 24, Math.PI), toon(C.brass))
    frame.position.copy(hatch.position)
    frame.rotation.copy(hatch.rotation)
    forge.add(hatch, frame)
  }
  forge.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  forge.position.set(0, .06, -.4)
  scene.add(forge)

  // The belts: words in on the left, the query out on the right.
  const inBelt = belt(2.6)
  inBelt.group.position.set(-2.6, .06, .6)
  inBelt.group.rotation.y = Math.PI / 2 - .25
  const outBelt = belt(2.2)
  outBelt.group.position.set(2.5, .06, .55)
  outBelt.group.rotation.y = Math.PI / 2 + .25
  scene.add(inBelt.group, outBelt.group)
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(.75, .35, .8, 20, 1, true), toon(C.yellow, { side: THREE.DoubleSide }))
  hopper.position.set(-3.85, .95, .95)
  hopper.castShadow = true
  const hopperRim = new THREE.Mesh(new THREE.TorusGeometry(.75, .05, 8, 28), toon(C.ink))
  hopperRim.rotation.x = Math.PI / 2
  hopperRim.position.set(-3.85, 1.35, .95)
  scene.add(hopper, hopperRim)

  // The question, as blocks: heaped in the hopper, then one after another along the belt.
  const inPath = new THREE.CatmullRomCurve3([v(-3.85, 1.2, .95), v(-3.55, .64, .85), v(-2.6, .64, .6), v(-1.6, .64, .32), v(-1.25, .5, .15)])
  const blocks = [...QUESTION].map((char, i) => {
    const block = new THREE.Mesh(new RoundedBoxGeometry(.26, .26, .26, 2, .03), toon('#ffffff', { map: letter(char) }))
    block.castShadow = true
    scene.add(block)
    const rest = v(-3.85 + Math.cos(i * 2.4) * .3 * (i % 3) / 2, 1.05 + Math.floor(i / 6) * .12, .95 + Math.sin(i * 2.4) * .3 * (i % 3) / 2)
    return { block, rest, spin: (i * 1.7) % 3 }
  })

  // What comes out: barrels, which stack into a table of three by four.
  const outPath = new THREE.CatmullRomCurve3([v(1.25, .5, .15), v(1.7, .55, .32), v(2.5, .55, .55), v(3.3, .55, .8), v(3.55, .3, .95)])
  const barrels = Array.from({ length: 12 }, (_, i) => {
    const b = barrel()
    scene.add(b)
    const row = Math.floor(i / 4), col = i % 4
    return { b, slot: v(2.7 + col * .46 - row * .1, .06, 2 + row * .48 + col * .05) }
  })

  // The llama, at the controls.
  const keeper = llama()
  keeper.group.position.set(-.9, .06, 1.75)
  keeper.group.rotation.y = .9
  scene.add(keeper.group)
  const panel = new THREE.Mesh(new RoundedBoxGeometry(.5, .6, .3, 2, .05), toon(C.ivory))
  panel.position.set(-.35, .36, 2.05)
  panel.rotation.y = -.5
  const lamps = [C.leaf, C.yellow, C.coral].map((color, i) => {
    const lampMesh = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), toon(color))
    lampMesh.position.set(-.48 + i * .12, .55, 2.2 - i * .06)
    return lampMesh
  })
  const leverArm = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .4, 6), toon(C.ink))
  leverArm.position.set(-.22, .8, 2.05)
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), toon(C.coral))
  scene.add(panel, ...lamps, leverArm, knob)

  // Steam from the chimney.
  const puffs = [0, 1, 2].map(i => {
    const c = cloud(.32 + i * .06, 40 + i)
    c.position.set(-.55, 2.2, -.8)
    scene.add(c)
    return c
  })

  // The dome that comes down over it all: nothing in here leaves the machine.
  const dome = plain(new THREE.Mesh(new THREE.SphereGeometry(4.3, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), glassMaterial('#cfeeff', .1)))
  const ribs = new THREE.Group()
  for (let k = 0; k < 4; k++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(4.3, .035, 6, 48, Math.PI), toon(C.ivory))
    rib.rotation.y = k / 4 * Math.PI + .3
    ribs.add(rib)
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.3, .06, 6, 64), toon(C.brass))
  ring.rotation.x = Math.PI / 2
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.18, 14, 10), toon(C.brass))
  cap.position.y = 4.3
  const lid = new THREE.Group()
  lid.add(dome, plain(ribs), ring, cap)
  scene.add(lid)

  for (const [x, z, size, seed] of [[-2.8, -2.6, .7, 3], [3.4, -2, .65, 5]] as const) {
    const t = tree(size, seed)
    t.position.set(x, 0, z)
    scene.add(t)
  }
  for (const [x, z, h, seed] of [[-4.4, -.4, 1.4, 2], [1.6, -3.6, 1.6, 4], [4.4, .3, 1.3, 6]] as const) {
    const c = cypress(h, seed)
    c.position.set(x, 0, z)
    scene.add(c)
  }
  scene.add(flowers(5, 90, 33, 0))

  const anchors = { question: new THREE.Object3D(), query: new THREE.Object3D(), local: new THREE.Object3D() }
  anchors.question.position.set(-3.85, 1.9, .95)
  anchors.query.position.set(3.3, 1.4, 2.2)
  anchors.local.position.set(0, 4.6, 0)
  scene.add(anchors.question, anchors.query, anchors.local)

  const lampOn = toon('#c6e26c'), lampOff = toon(C.leafDark)
  const state = lever(4.4)
  const at = new THREE.Vector3()
  return {
    group: scene,
    anchors,
    set(next: string) { state.set(next === 'open') },
    update(t: number, dt: number) {
      const p = state.step(dt)
      const running = p > .05 && p < .99
      inBelt.texture.offset.y -= running ? dt * 1.2 : 0
      outBelt.texture.offset.y -= running ? dt * 1.2 : 0
      // The dome comes down first.
      const close = span(p, 0, .18)
      lid.position.y = (1 - close) * 6
      lid.visible = close > .01
      lid.scale.setScalar(.9 + close * .1)
      leverArm.rotation.z = p > 0 ? -.6 : .6
      knob.position.set(-.22 + Math.sin(leverArm.rotation.z) * -.2, .8 + Math.cos(leverArm.rotation.z) * .2, 2.05)
      lamps[0].material = p > .05 ? lampOn : lampOff
      // The words go in, one after another.
      blocks.forEach(({ block, rest, spin }, i) => {
        const k = span(p, .12 + i * .02, .32 + i * .02)
        if (k <= 0) {
          block.position.copy(rest)
          block.rotation.set(spin, spin * 1.3, spin * .7)
          block.visible = true
        } else {
          inPath.getPointAt(Math.min(1, k), at)
          block.position.copy(at).add(v(0, .13, 0))
          block.rotation.set(spin * (1 - k), (spin * 1.3) * (1 - k) - .25 * k, spin * .7 * (1 - k))
          block.visible = k < .98
        }
      })
      // The forge works, and puffs.
      const working = span(p, .2, .4) * (1 - span(p, .85, .95))
      forge.position.x = Math.sin(t * 40) * .015 * working
      forge.scale.y = 1 + Math.sin(t * 9) * .012 * working
      puffs.forEach((puff, i) => {
        const cycle = (t * .45 + i / 3) % 1
        puff.position.set(-.55 + cycle * .4, 2.2 + cycle * 1.4, -.8 - cycle * .2)
        puff.scale.setScalar(Math.max(.001, (.4 + cycle) * working))
      })
      // And the query comes out, a barrel at a time, and stacks.
      barrels.forEach(({ b, slot }, i) => {
        const k = span(p, .42 + i * .035, .58 + i * .035)
        if (k <= 0) { b.visible = false; return }
        b.visible = true
        if (k < .7) {
          outPath.getPointAt(k / .7, at)
          b.position.copy(at).add(v(0, .02, 0))
        } else {
          const j = (k - .7) / .3
          outPath.getPointAt(1, at)
          b.position.lerpVectors(at, slot, j)
          b.position.y += Math.sin(j * Math.PI) * .5
        }
        b.scale.setScalar(Math.max(.001, pop(Math.min(1, k * 4))))
      })
      keeper.head.rotation.y = Math.sin(t * .8) * .4
      keeper.head.rotation.x = Math.sin(t * 1.3) * .08
    },
  }
}

export default function reflection(): Diorama {
  const s = studio({ target: v(0, .9, 0), distance: 21, yaw: .55, pitch: .5, fov: 27, span: 7 })
  const m = model()
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
