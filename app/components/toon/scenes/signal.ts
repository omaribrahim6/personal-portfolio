import * as THREE from 'three'
import type { Diorama } from '../gallery'
import { C, cypress, flowers, hedge, lamp, light, person, plain, pod, scatter, solarPanel, tier, toon, tree } from '../kit'
import { disposeAll, lever, pop, span, studio, v } from './common'

// Mamdani: a street of round houses with a pothole in it, and the inspector standing over it. Pull the lever
// and he files the report: a pin goes up over the hole, the neighbours' windows light up and their own pins
// rise (me too), the screen at the town hall shows it, and a crew cart drives down the street and fills it in.

/** A flat strip along a curve, `width` wide, with its length in the second texture coordinate. */
function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, y: number, steps = 80) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = []
  const tangent = new THREE.Vector3(), side = new THREE.Vector3(), up = v(0, 1, 0)
  const length = curve.getLength()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = curve.getPointAt(t)
    curve.getTangentAt(t, tangent)
    side.crossVectors(tangent, up).normalize().multiplyScalar(width / 2)
    positions.push(p.x - side.x, y, p.z - side.z, p.x + side.x, y, p.z + side.z)
    uvs.push(0, t * length, 1, t * length)
    if (i < steps) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

/** The paving: pale stone with a dashed sun-yellow line down the middle. */
function paving() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#e8dcc0'
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = 'rgba(120, 100, 70, .16)'
  for (let i = 0; i < 4; i++) ctx.fillRect(0, i * 16, 64, 1.5)
  ctx.fillStyle = '#f1bf3d'
  ctx.fillRect(29, 6, 6, 30)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, .9)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** A map pin: a ball on a point, standing on its tip. */
function pin(size: number, color: string) {
  const group = new THREE.Group()
  const head = new THREE.Mesh(new THREE.SphereGeometry(size * .42, 20, 14), toon(color))
  head.position.y = size * 1.05
  const point = new THREE.Mesh(new THREE.ConeGeometry(size * .3, size * .8, 16), toon(color))
  point.rotation.x = Math.PI
  point.position.y = size * .48
  const dot = new THREE.Mesh(new THREE.SphereGeometry(size * .15, 12, 10), toon(C.ivory))
  dot.position.set(0, size * 1.08, size * .36)
  head.castShadow = point.castShadow = true
  group.add(head, point, dot)
  return group
}

/** Mamdani himself: a small round inspector with a visor, an antenna and a clipboard. */
function inspector() {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .34, 6, 18), toon(C.ivory))
  body.position.y = .5
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(.272, .272, .1, 24), toon(C.coral))
  belt.position.y = .42
  const head = new THREE.Group()
  head.position.y = 1.02
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.27, 24, 18), toon(C.ivory))
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.275, 24, 12, -.9, 1.8, 1.15, .65), toon(C.glassDark))
  const glint = plain(new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), light('#d8f6ff')))
  glint.position.set(.1, .06, .25)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .3, 5), toon(C.ink))
  mast.position.set(.1, .36, 0)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 10), light(C.coral))
  bulb.position.set(.1, .52, 0)
  head.add(skull, visor, glint, mast, bulb)
  const legs = [-1, 1].map(side => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .14, 4, 10), toon(C.steel))
    leg.position.set(side * .12, .13, 0)
    return leg
  })
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .26, 4, 10), toon(C.ivory))
  arm.position.set(.3, .58, .08)
  arm.rotation.set(-.8, 0, .3)
  const board = new THREE.Mesh(new THREE.BoxGeometry(.24, .3, .03), toon(C.wood))
  board.position.set(.3, .62, .27)
  board.rotation.x = -.7
  const paper = new THREE.Mesh(new THREE.BoxGeometry(.19, .22, .01), toon('#ffffff'))
  paper.position.set(.3, .63, .29)
  paper.rotation.x = -.7
  const otherArm = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .26, 4, 10), toon(C.ivory))
  otherArm.position.set(-.31, .5, 0)
  otherArm.rotation.z = -.25
  group.add(body, belt, head, ...legs, arm, board, paper, otherArm)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, head, bulb }
}

/** A small electric cart for the road crew, with a lamp on the roof and a load of fill in the back. */
function cart() {
  const group = new THREE.Group()
  const base = new THREE.Mesh(new THREE.BoxGeometry(.62, .2, 1.05), toon(C.yellow))
  base.position.y = .26
  const cab = new THREE.Mesh(new THREE.BoxGeometry(.6, .42, .42), toon(C.yellow))
  cab.position.set(0, .56, .26)
  const glass = new THREE.Mesh(new THREE.BoxGeometry(.5, .26, .02), toon(C.glassDark))
  glass.position.set(0, .6, .475)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(.66, .05, .5), toon(C.ivory))
  roof.position.set(0, .8, .26)
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), light('#ff9a3c'))
  beacon.position.set(0, .82, .26)
  const load = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#6d6a63'))
  load.scale.set(1, .6, 1.3)
  load.position.set(0, .36, -.22)
  const wheels = [[-1, .34], [1, .34], [-1, -.34], [1, -.34]].map(([side, z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .08, 16), toon(C.ink))
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(side * .32, .13, z)
    return wheel
  })
  group.add(base, cab, glass, roof, beacon, load, ...wheels)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, beacon, load }
}

/** The town hall: a drum and dome, with the screen the city watches the reports come in on. */
function townHall() {
  const group = new THREE.Group()
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.15, .9, 40), toon(C.ivory))
  drum.position.y = .45
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.08, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), toon(C.teal))
  dome.position.y = .9
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .3, 16), toon(C.ivory))
  lantern.position.y = 2.05
  const flag = new THREE.Mesh(new THREE.ConeGeometry(.1, .3, 12), toon(C.coral))
  flag.position.y = 2.35
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.16, 1.16, .12, 40, 1, true), toon(C.coral))
  band.position.y = .82
  group.add(drum, dome, lantern, flag, band)
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2 + .2
    const column = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .7, 8), toon(C.stone))
    column.position.set(Math.sin(a) * 1.22, .35, Math.cos(a) * 1.22)
    group.add(column)
  }
  // The screen, on a frame in front of the hall.
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, .1), toon(C.ink))
  frame.position.set(0, 1.25, 1.55)
  const legs = [-.6, .6].map(x => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .9, 6), toon(C.ink))
    leg.position.set(x, .45, 1.55)
    return leg
  })
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 160
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.36, .86), new THREE.MeshBasicMaterial({ map: texture }))
  screen.position.set(0, 1.25, 1.61)
  group.add(frame, ...legs, plain(screen))
  group.traverse(node => { if (node instanceof THREE.Mesh) { node.castShadow = true; node.receiveShadow = true } })
  /** Draw the dashboard: a map of the street, with the report on it once it is in. */
  const draw = (reported: number, fixed: number) => {
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#163028'
    ctx.fillRect(0, 0, 256, 160)
    ctx.strokeStyle = 'rgba(160, 230, 200, .18)'
    ctx.lineWidth = 1
    for (let x = 0; x < 256; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 160); ctx.stroke() }
    for (let y = 0; y < 160; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke() }
    ctx.strokeStyle = '#e8dcc0'
    ctx.lineWidth = 9
    ctx.beginPath()
    ctx.moveTo(-10, 120)
    ctx.bezierCurveTo(70, 130, 110, 40, 266, 52)
    ctx.stroke()
    ctx.fillStyle = '#a6d46a'
    ctx.font = 'bold 15px monospace'
    ctx.fillText('WORK ORDERS', 10, 22)
    if (reported > 0) {
      ctx.globalAlpha = reported
      ctx.fillStyle = fixed > .5 ? '#7fd36a' : '#ff7a5c'
      ctx.beginPath()
      ctx.arc(118, 86, 9 + (1 - reported) * 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillText(fixed > .5 ? '#1 FIXED' : '#1 +5', 140, 100)
      ctx.globalAlpha = 1
    }
    texture.needsUpdate = true
  }
  draw(0, 0)
  return { group, draw }
}

/** The model on its own, for the voyage to stand in its world. */
export function model() {
  const scene = new THREE.Group()

  const ground = tier(5.4, 1, 3, C.grass, C.stone, .06)
  ground.mesh.position.y = -.5
  scene.add(ground.mesh, hedge(ground.at, 0, .3, 4, [C.leaf, C.grass2, C.leafLight], [[1.1, 1.6], [4.3, 4.75]]))

  // The street, winding across the block, with a kerb either side.
  const road = new THREE.CatmullRomCurve3([v(-5.15, 0, 1.9), v(-2.4, 0, 1.6), v(0, 0, .3), v(2.4, 0, -1.2), v(5.2, 0, -1.3)])
  const surface = new THREE.Mesh(ribbon(road, 1.25, .025), toon('#ffffff', { map: paving() }))
  surface.receiveShadow = true
  scene.add(surface)
  for (const offset of [-.68, .68]) {
    const points = Array.from({ length: 60 }, (_, i) => {
      const t = i / 59
      const p = road.getPointAt(t), tangent = road.getTangentAt(t)
      const side = new THREE.Vector3().crossVectors(tangent, v(0, 1, 0)).normalize().multiplyScalar(offset)
      return p.add(side).setY(.04)
    })
    const kerb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 80, .055, 5), toon(C.ivory))
    kerb.receiveShadow = true
    scene.add(kerb)
  }

  // The pothole, and the patch that takes its place.
  const holeAt = road.getPointAt(.47)
  const hole = new THREE.Group()
  const pit = new THREE.Mesh(new THREE.CircleGeometry(.34, 28), toon('#2c3430'))
  pit.rotation.x = -Math.PI / 2
  pit.scale.set(1, .7, 1)
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.34, .035, 6, 28), toon('#8d8574'))
  lip.rotation.x = -Math.PI / 2
  lip.scale.set(1, .7, 1)
  hole.add(pit, lip)
  hole.position.copy(holeAt).setY(.04)
  hole.rotation.y = .5
  const patch = new THREE.Mesh(new THREE.CircleGeometry(.36, 28), toon('#b9b3a3'))
  patch.rotation.x = -Math.PI / 2
  patch.position.copy(holeAt).setY(.035)
  patch.scale.setScalar(.001)
  scene.add(hole, patch)
  const cone = new THREE.Group()
  const coneBody = new THREE.Mesh(new THREE.ConeGeometry(.12, .34, 16), toon('#f08a3c'))
  coneBody.position.y = .19
  const coneBand = new THREE.Mesh(new THREE.CylinderGeometry(.075, .095, .06, 16), toon('#ffffff'))
  coneBand.position.y = .2
  const coneFoot = new THREE.Mesh(new THREE.BoxGeometry(.28, .03, .28), toon('#f08a3c'))
  coneFoot.position.y = .015
  cone.add(coneBody, coneBand, coneFoot)
  cone.position.copy(holeAt).add(v(-.5, .02, -.35))
  cone.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  scene.add(cone)

  const mamdani = inspector()
  mamdani.group.position.copy(holeAt).add(v(.55, 0, .55))
  mamdani.group.rotation.y = -2.4
  scene.add(mamdani.group)
  const report = pin(.55, C.coral)
  report.position.copy(holeAt).setY(.9)
  report.scale.setScalar(.001)
  scene.add(report)
  const wave = plain(new THREE.Mesh(new THREE.TorusGeometry(.3, .025, 6, 40), light(C.coral)))
  wave.rotation.x = -Math.PI / 2
  wave.position.copy(holeAt).setY(.06)
  scene.add(wave)

  // The neighbours: five houses either side of the street, each with a window to light and a pin to raise.
  const glass = toon(C.glassDark), lit = light(C.glow)
  const neighbours: { windows: THREE.Mesh[]; pin: THREE.Object3D; delay: number }[] = []
  const homes: [number, number, number, number, string][] = [
    [-3.3, -1.1, 1, .8, C.teal], [-1.4, -1.7, .85, 1.1, C.coral], [3.2, -3, .9, -.2, C.yellow], [2.2, 1.6, .95, -.9, C.sky], [-3.6, 3.4, .8, 2.9, C.coral],
  ]
  homes.forEach(([x, z, R, face, band], index) => {
    const house = pod({ R, H: R * .95, n: 2.7, bands: [[0, .14, band]], windows: [[0, .5, R * .28], [.8, .45, R * .17], [-.8, .45, R * .17]], door: .55, panels: index % 2 ? 1 : 0, antenna: index === 1 })
    house.position.set(x, 0, z)
    house.rotation.y = face
    scene.add(house)
    const windows: THREE.Mesh[] = []
    house.traverse(node => { if (node instanceof THREE.Mesh && node.material === glass) windows.push(node) })
    const flag = pin(.34, C.yellow)
    flag.position.set(x, R * .95 + .25, z)
    flag.scale.setScalar(.001)
    scene.add(flag)
    neighbours.push({ windows, pin: flag, delay: index * .045 })
  })

  const hall = townHall()
  hall.group.position.set(1.3, 0, -3.4)
  hall.group.rotation.y = .25
  scene.add(hall.group)

  const crew = cart()
  scene.add(crew.group)
  const driveFrom = .02, driveTo = .4

  // Gardens, lamps and people.
  for (const [x, z, size, seed] of [[-2.6, 2.6, .7, 3], [3.4, 2.6, .6, 5], [4.4, .6, .7, 7], [-4.6, .6, .55, 8], [3.7, -1.8, .5, 9], [-.6, -3.9, .6, 10]] as const) {
    const t = tree(size, seed)
    t.position.set(x, 0, z)
    scene.add(t)
  }
  for (const [x, z, h, seed] of [[-.4, -2.9, 1.5, 2], [-2.4, .1, 1.3, 3], [4.5, -.3, 1.4, 4], [-1.7, 3.6, 1.2, 5]] as const) {
    const c = cypress(h, seed)
    c.position.set(x, 0, z)
    scene.add(c)
  }
  for (const t of [.2, .62, .85]) {
    const l = lamp(.75)
    const p = road.getPointAt(t)
    const side = new THREE.Vector3().crossVectors(road.getTangentAt(t), v(0, 1, 0)).normalize().multiplyScalar(t > .5 ? .9 : -.9)
    l.position.copy(p).add(side)
    scene.add(l)
  }
  for (const [x, z, seed] of [[1.4, .6, 1], [-.9, 1.6, 2], [2.8, -.2, 4]] as const) {
    const p = person(.42, seed)
    p.position.set(x, 0, z)
    p.lookAt(holeAt.x, 0, holeAt.z)
    scene.add(p)
  }
  const roofPanel = solarPanel(.9, .55, .25)
  roofPanel.position.set(-4.2, 0, -2.2)
  roofPanel.rotation.y = .8
  scene.add(roofPanel)
  scene.add(scatter(4.8, 26, 11, 0), flowers(5, 160, 12, 0))

  const state = lever(3.6)
  const anchors = {
    report: new THREE.Object3D(),
    neighbours: new THREE.Object3D(),
    crew: new THREE.Object3D(),
  }
  anchors.report.position.copy(holeAt).setY(1.75)
  anchors.neighbours.position.set(homes[1][0], homes[1][2] * .95 + 1.2, homes[1][1])
  scene.add(anchors.report, anchors.neighbours)
  crew.group.add(anchors.crew)
  anchors.crew.position.set(0, 1.1, 0)

  let shown = -1
  return {
    group: scene,
    anchors,
    set(next: string) { state.set(next === 'open') },
    update(t: number, dt: number) {
      const p = state.step(dt)
      // He looks about, and bobs on his feet.
      mamdani.head.rotation.y = Math.sin(t * .7) * .35 + (p > 0 ? .3 : 0)
      mamdani.group.position.y = Math.abs(Math.sin(t * 2.2)) * .03
      mamdani.bulb.scale.setScalar(1 + (p > 0 && p < .3 ? Math.abs(Math.sin(t * 12)) * .8 : 0))

      // The report goes in, and the ring of it spreads down the street.
      report.scale.setScalar(Math.max(.001, pop(span(p, 0, .14))))
      report.position.y = .95 + Math.sin(t * 2) * .06
      report.rotation.y = t * .8
      const ring = (t * .5) % 1
      wave.visible = p > .02 && p < .99
      wave.scale.setScalar(1 + ring * 9 * span(p, 0, .1))
      ;(wave.material as THREE.MeshBasicMaterial).color.set(C.coral)
      wave.position.y = .06

      neighbours.forEach((n, i) => {
        const k = span(p, .12 + n.delay, .24 + n.delay)
        for (const w of n.windows) w.material = k > .5 ? lit : glass
        n.pin.scale.setScalar(Math.max(.001, pop(k)))
        n.pin.rotation.y = t * .9 + i
      })

      // The crew comes down the street, stops at the hole and fills it.
      const drive = span(p, .38, .72)
      const along = driveFrom + (driveTo - driveFrom) * drive
      const at = road.getPointAt(along), tangent = road.getTangentAt(along)
      crew.group.position.copy(at).add(new THREE.Vector3().crossVectors(tangent, v(0, 1, 0)).normalize().multiplyScalar(-.18))
      crew.group.rotation.y = Math.atan2(tangent.x, tangent.z)
      crew.group.visible = p > .3
      crew.beacon.scale.setScalar(1 + Math.abs(Math.sin(t * 8)) * .4)
      const fill = span(p, .74, .92)
      hole.scale.setScalar(Math.max(.001, 1 - fill))
      patch.scale.setScalar(Math.max(.001, fill))
      crew.load.scale.set(1, .6 * (1 - fill * .8), 1.3)
      cone.visible = p > .1 && fill < 1

      const screen = Math.round((span(p, .15, .3) * 10)) / 10 + (fill > .5 ? 10 : 0)
      if (screen !== shown) { shown = screen; hall.draw(span(p, .15, .3), fill) }
    },
  }
}

export default function signal(): Diorama {
  const s = studio({ target: v(0, .1, -.2), distance: 22.5, yaw: .42, pitch: .6, fov: 27, span: 7 })
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
