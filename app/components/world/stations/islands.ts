import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { C, cableway, cypress, glassMaterial, ivy, light, pine, plain, person, rng, solarPanel, tier, toon } from '../../toon/kit'
import type { Engine, Key, Station } from '../engine'
import { word } from '../letters'
import { STRIDE, blend, idle, kick, skate, walk } from '../motion'
import { Bundle, FONTS } from '../props'
import { puppet, type Pose } from '../puppet'
import { ball, lift, statue } from '../statue'

// Off the clock: five islands in the golden hour, and on each of them he is doing the thing. Up a mountain
// on a switchback trail, then down the other side of it on a mountain bike, then round the lagoon at its
// foot on a paddleboard. Cross-legged on the top step of a hackathon stage with the final standings behind
// him. On a throne of toy bricks building a game, while in the game, on the hill behind, he longboards down
// a mountain road. Crouched at a vault with a stethoscope on the dial. And on a pitch, putting one in the
// top corner. The rigged model does the walking and the kicking; the statues that cannot bend are taken
// apart at the neck, the dial and the wheels.

export const GOLDEN_HOUR = {
  sky: ['#fbe2b2', '#f6cf9e', '#e2bcb2', '#9a9cc8', '#5d6db6'] as [string, string, string, string, string],
  sun: [.58, .3, .76] as [number, number, number], sunColor: '#ffd894', sunSize: .055,
  key: '#ffd9a6', strength: 2.5, hemi: ['#bdb6dc', '#cbab7c'] as [string, string], fill: 1.45,
  water: ['#3a8fb4', '#f2cfa6'] as [string, string], cloud: ['#fff1dc', '#d8b8c6'] as [string, string], fog: [100, 340] as [number, number],
}

export const ORIGIN = new THREE.Vector3(-14, 0, -432)
const G = .6
/** Where each island is, from the stop's origin. */
const AT = {
  outdoors: new THREE.Vector3(0, 0, 0),
  competing: new THREE.Vector3(36, 0, -30),
  games: new THREE.Vector3(2, 0, -58),
  security: new THREE.Vector3(36, 0, -86),
  soccer: new THREE.Vector3(2, 0, -112),
}

const FIT = { hike: 1 / .92, soccer: 1 / 1.17 * 1.04 }

/* ------------------------------------------------------------- the mountain */

const PEAK = 6.6, FOOT = 11.5
/** The mountain's height at a point: a cone with soft shoulders, a little lumpy, the land's level at its foot. */
function height(x: number, z: number) {
  const r = Math.hypot(x, z), a = Math.atan2(x, z)
  if (r >= FOOT) return G
  const k = 1 - r / FOOT
  const lump = (Math.sin(a * 3 + r * .6) * .22 + Math.sin(a * 5 - r) * .12) * k * (1 - k) * 4
  return G + PEAK * Math.pow(k, 1.25) * (1 - .12 * Math.cos(k * Math.PI * 6) * k) + lump
}

/** The mountain as a mesh: rings out from the summit, coloured by height (meadow, then grass, then rock). */
function mountain() {
  const rings = 48, around = 120
  const positions: number[] = [], colors: number[] = [], indices: number[] = []
  const color = new THREE.Color()
  const bands = [new THREE.Color(C.grass), new THREE.Color(C.meadow), new THREE.Color(C.grass2), new THREE.Color(C.rock), new THREE.Color(C.rock2)]
  for (let i = 0; i <= rings; i++) {
    const r = FOOT * 1.04 * (i / rings)
    for (let j = 0; j < around; j++) {
      const a = j / around * Math.PI * 2
      const x = Math.sin(a) * r, z = Math.cos(a) * r
      const y = height(x, z)
      positions.push(x, y, z)
      const up = (y - G) / PEAK
      const n = up + Math.sin(a * 7 + r) * .06
      color.copy(n > .78 ? bands[4] : n > .62 ? bands[3] : n > .38 ? bands[2] : n > .15 ? bands[1] : bands[0])
      colors.push(color.r, color.g, color.b)
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < around; j++) {
    const a = i * around + j, b = i * around + (j + 1) % around, c = (i + 1) * around + j, d = (i + 1) * around + (j + 1) % around
    indices.push(a, c, b, b, c, d)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const material = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: (toon(C.grass) as THREE.MeshToonMaterial).gradientMap })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}

/** A trail over the ground: a curve through points given as (distance out, angle round), and a strip along it. */
function trail(points: [number, number][], width: number, color: string) {
  const curve = new THREE.CatmullRomCurve3(points.map(([r, a]) => new THREE.Vector3(Math.sin(a) * r, 0, Math.cos(a) * r)))
  const steps = 220, positions: number[] = [], indices: number[] = []
  const p = new THREE.Vector3(), tangent = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i <= steps; i++) {
    curve.getPointAt(i / steps, p)
    curve.getTangentAt(i / steps, tangent)
    side.crossVectors(tangent, up).setY(0).normalize().multiplyScalar(width / 2)
    for (const s of [-1, 1]) {
      const x = p.x + side.x * s, z = p.z + side.z * s
      positions.push(x, height(x, z) + .07, z)
    }
    if (i < steps) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const strip = new THREE.Mesh(geometry, toon(color))
  strip.receiveShadow = true
  return { curve, strip: plain(strip) }
}

/** Where on a trail someone is at a distance along it, standing on the ground. */
function along(curve: THREE.Curve<THREE.Vector3>, u: number, out: THREE.Vector3) {
  curve.getPointAt(Math.min(1, Math.max(0, u)), out)
  out.y = height(out.x, out.z)
  return out
}

/** Back and forth along a trail, with a rest at each end: where on it (0 to 1) at time t, and which way. */
function shuttle(t: number, out: number, rest: number, back: number, rest2: number) {
  const T = out + rest + back + rest2, k = t % T
  if (k < out) return { u: k / out, dir: 1, moving: true }
  if (k < out + rest) return { u: 1, dir: 1, moving: false }
  if (k < out + rest + back) return { u: 1 - (k - out - rest) / back, dir: -1, moving: true }
  return { u: 0, dir: -1, moving: false }
}

/* ---------------------------------------------------------------- the props */

/** A brick of the toy kind: a block with studs on top. */
function brick(w: number, d: number, h: number, color: string) {
  const b = new Bundle()
  b.add(color, new RoundedBoxGeometry(w, h, d, 2, .04), new THREE.Matrix4().makeTranslation(0, h / 2, 0))
  const stud = new THREE.CylinderGeometry(.13, .13, .1, 14)
  for (let i = 0; i < Math.round(w / .5); i++) for (let k = 0; k < Math.round(d / .5); k++) {
    b.add(color, stud, new THREE.Matrix4().makeTranslation(-w / 2 + .25 + i * .5, h + .05, -d / 2 + .25 + k * .5))
  }
  return b.build()
}

/** A canvas screen: what's drawn on it is up to `paint`, called whenever it should change. */
function screen(w: number, h: number, paint: (ctx: CanvasRenderingContext2D, W: number, H: number, t: number) => void) {
  const W = 1024, H = Math.round(1024 * h / w)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const mesh = plain(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture })))
  return { mesh, draw(t: number) { paint(ctx, W, H, t); texture.needsUpdate = true } }
}

/** The final standings, the way a CTF shows them: lines of points climbing, ours on top. */
function standings(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  ctx.fillStyle = '#101a2a'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#f3c64a'
  ctx.font = `64px ${FONTS.display}`
  ctx.textBaseline = 'top'
  ctx.fillText('FINAL STANDINGS', 40, 34)
  ctx.font = `600 26px ${FONTS.mono}`
  ctx.fillStyle = '#8fa3c0'
  ctx.fillText(`T+${String(Math.floor(36 + (t % 24))).padStart(2, '0')}:00  ·  FLAGS 64/67`, 40, 112)
  const left = 60, right = W - 300, top = 170, bottom = H - 60
  ctx.strokeStyle = '#2a3a52'
  ctx.lineWidth = 2
  for (let k = 0; k <= 4; k++) { const y = top + (bottom - top) * k / 4; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke() }
  const teams = [['ASTRALIS', '#f3c64a', 1], ['0XDEADBEEF', '#6ccabd', .78], ['ROOT_ROOT', '#ec7b60', .66], ['NULLBYTES', '#8fd3f0', .52]] as const
  const grow = Math.min(1, (t % 12) / 7)
  teams.forEach(([name, color, end], k) => {
    ctx.strokeStyle = color
    ctx.lineWidth = k === 0 ? 7 : 4
    ctx.beginPath()
    for (let i = 0; i <= 40 * grow; i++) {
      const x = left + (right - left) * i / 40
      const stepped = Math.floor(i / (3 + k)) * (3 + k) / 40
      const y = bottom - (bottom - top) * end * Math.pow(stepped, .8 + k * .15)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = color
    ctx.font = `${k === 0 ? 700 : 500} 26px ${FONTS.mono}`
    ctx.fillText(`${k + 1}. ${name}`, right + 30, top + k * 54)
  })
}

/** A terminal: green code scrolling up, a cursor at the bottom. */
function terminal(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const lines = ['$ nmap -sV 10.0.0.7', 'PORT   STATE SERVICE', '22/tcp open  ssh', '80/tcp open  http', '$ curl -s /api/admin', '403 forbidden', '$ ffuf -w words.txt', '/backup.zip  [200]', '$ unzip backup.zip', 'creds.txt', '$ ssh vault@10.0.0.7', 'welcome, vault', '$ cat flag.txt', 'CTF{y0u_f0und_m3}']
  ctx.fillStyle = 'rgba(8, 22, 16, .92)'
  ctx.fillRect(0, 0, W, H)
  ctx.font = `600 34px ${FONTS.mono}`
  ctx.textBaseline = 'top'
  const shown = Math.floor(t * 1.6) % (lines.length + 4)
  const from = Math.max(0, shown - 9)
  for (let i = from; i < Math.min(shown, lines.length); i++) {
    ctx.fillStyle = lines[i].startsWith('$') ? '#c6e26c' : lines[i].startsWith('CTF') ? '#f3c64a' : '#7fd6a8'
    ctx.fillText(lines[i], 36, 30 + (i - from) * 50)
  }
  if (Math.floor(t * 2) % 2) { ctx.fillStyle = '#c6e26c'; ctx.fillRect(36, 30 + Math.min(9, shown - from) * 50, 20, 36) }
  ctx.strokeStyle = '#c6e26c'
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, W - 6, H - 6)
}

/** A football: white, with dark patches. */
function football(radius: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fbf6ea'
  ctx.fillRect(0, 0, 256, 128)
  ctx.fillStyle = '#16241d'
  for (let i = 0; i < 12; i++) {
    const x = (i % 6) * 44 + (i > 5 ? 22 : 0), y = i > 5 ? 92 : 36
    ctx.beginPath()
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12) }
    ctx.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), new THREE.MeshToonMaterial({ map: texture, gradientMap: (toon(C.ivory) as THREE.MeshToonMaterial).gradientMap }))
  mesh.castShadow = true
  return mesh
}

/** A goal: posts and a bar, and a net behind that bellies when the ball goes in. */
function goal(width: number, high: number, deep: number) {
  const group = new THREE.Group()
  const white = toon(C.ivory)
  for (const z of [-width / 2, width / 2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, high, 10), white)
    post.position.set(0, high / 2, z)
    post.castShadow = true
    group.add(post)
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, width, 10), white)
  bar.rotation.x = Math.PI / 2
  bar.position.y = high
  group.add(bar)
  // The net: a mesh of string, drawn on a canvas, stretched over the back, top and sides.
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.strokeStyle = '#fbf6ea'
  ctx.lineWidth = 3
  for (let i = 0; i <= 256; i += 21) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke() }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  const netMaterial = (u: number, v: number) => {
    const map = texture.clone()
    map.repeat.set(u, v)
    map.needsUpdate = true
    return new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: .3, side: THREE.DoubleSide })
  }
  const net = new THREE.Group()
  const back = new THREE.Mesh(new THREE.PlaneGeometry(width, high, 8, 4), netMaterial(width * 2, high * 2))
  back.rotation.y = Math.PI / 2
  back.position.set(deep, high / 2, 0)
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(deep, width), netMaterial(deep * 2, width * 2))
  roof.rotation.x = -Math.PI / 2
  roof.position.set(deep / 2, high, 0)
  net.add(back, roof)
  for (const z of [-width / 2, width / 2]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(deep, high), netMaterial(deep * 2, high * 2))
    side.position.set(deep / 2, high / 2, z)
    net.add(side)
  }
  group.add(plain(net))
  return { group, net, back }
}

/** A longboard: a deck, two trucks, four wheels. */
function longboard() {
  const group = new THREE.Group()
  const deck = new THREE.Mesh(new RoundedBoxGeometry(.24, .04, .9, 2, .02), toon(C.coral))
  deck.position.y = .1
  group.add(deck)
  for (const z of [-.3, .3]) for (const x of [-.1, .1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .04, 10), toon(C.yellow))
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(x, .04, z)
    group.add(wheel)
  }
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return group
}

/** A flat island: a disc of land with a beach round it. */
function island(radius: number, seed: number, top: string = C.grass) {
  const group = new THREE.Group()
  // (A tier is centred on its position: the land's top is at G, the beach's a little under it.)
  const land = tier(radius, 1.2, seed, top, C.stone, .06)
  land.mesh.position.y = G - .6
  const sand = tier(radius + .9, .5, seed + 1, C.sand, '#e8cf98', .06)
  sand.mesh.position.y = G - .55
  group.add(sand.mesh, land.mesh)
  return group
}

export default async function islands(engine: Engine): Promise<Station> {
  await document.fonts?.ready
  const group = new THREE.Group()
  group.position.copy(ORIGIN)
  const rand = rng(71)
  const place = (where: THREE.Vector3, object: THREE.Object3D) => { object.position.add(where); group.add(object); return object }

  /* ----------------------------------------------- the outdoors: one mountain */

  const O = AT.outdoors
  place(O, island(FOOT + 1, 711, C.grass))
  place(O, mountain())
  const hike = trail([[11.6, -.9], [9.6, .55], [7.6, -.5], [5.6, .5], [3.6, -.3], [1.9, .25], [.5, 0]], .7, C.sand)
  const ride = trail([[1.6, 1.3], [3.8, 2.1], [5.8, 1.45], [7.8, 2.35], [9.8, 1.7], [11.9, 2.4]], .8, '#c99a6a')
  place(O, hike.strip)
  place(O, ride.strip)
  // Pines up the slopes (off the trails), a cairn and a flag on top.
  const trees = new THREE.Group()
  for (let k = 0; k < 46; k++) {
    const a = rand() * Math.PI * 2, r = 2.5 + rand() * 8.5
    const x = Math.sin(a) * r, z = Math.cos(a) * r
    const p = new THREE.Vector3()
    let clear = true
    for (const path of [hike.curve, ride.curve]) for (let u = 0; u <= 1; u += .02) { path.getPointAt(u, p); if (Math.hypot(p.x - x, p.z - z) < 1.1) clear = false }
    if (!clear) continue
    const tree = pine(.9 + rand() * .9, 720 + k)
    tree.position.set(x, height(x, z) - .05, z)
    trees.add(tree)
  }
  place(O, trees)
  const summit = height(0, 0)
  const flag = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 2.2, 6), toon(C.ivory))
  pole.position.y = 1.1
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55, 8, 1), toon(C.coral, { side: THREE.DoubleSide }))
  cloth.position.set(.46, 1.9, 0)
  flag.add(pole, cloth)
  flag.position.set(-.5, summit - .1, -.6)
  place(O, flag)
  for (let k = 0; k < 4; k++) {
    const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(.32 - k * .06, 0), toon('#8d8577'))
    stone.scale.set(1, .55, 1)
    stone.position.set(.7, summit - .05 + k * .26 - k * k * .02, -.4)
    stone.rotation.set(k, k * 2, 0)
    stone.castShadow = true
    place(O, stone)
  }
  const hiker = await puppet({ url: '/models/interests/hike.glb', scale: FIT.hike })
  const H = 1.7
  hiker.root.scale.setScalar(H)
  lift(hiker.mesh.material)
  place(O, hiker.root)
  const hikerAt = new THREE.Vector3(), hikerLast = new THREE.Vector3()
  const hikeState = { phase: 0, facing: 0, walking: 0 }

  // The bike, taken apart at the wheels so they can turn.
  const bikeFront = { c: [0, .206, .4] as [number, number, number], r: .245 }, bikeBack = { c: [0, .23, -.366] as [number, number, number], r: .25 }
  const rim = (name: string, w: typeof bikeFront, skip: [number, number]) => ({
    name, pivot: w.c,
    has: (p: THREE.Vector3) => {
      if (Math.abs(p.x) > .075) return false
      const dy = p.y - w.c[1], dz = p.z - w.c[2], d = Math.hypot(dy, dz)
      if (d < .1 || d > w.r) return false
      const a = Math.atan2(dy, dz)
      return !(a > skip[0] && a < skip[1])
    },
  })
  const bike = await statue('/models/interests/bike.glb', [rim('front', bikeFront, [1.55, 2.25]), rim('back', bikeBack, [-.3, .85])])
  const B = 1.7
  bike.group.scale.setScalar(B)
  const rider = new THREE.Group()
  rider.add(bike.group)
  place(O, rider)
  const rideAt = new THREE.Vector3(), rideNext = new THREE.Vector3()

  // The paddleboard, all one piece, gliding round the lagoon at the mountain's foot.
  const board = await statue('/models/interests/paddle.glb')
  const P = 1.7
  board.group.scale.setScalar(P)
  const paddler = new THREE.Group()
  paddler.add(board.group)
  place(O, paddler)
  const lagoon = new THREE.Vector3(-16, 0, 10)
  const wake = Array.from({ length: 10 }, (_, k) => {
    const ring = plain(new THREE.Mesh(new THREE.RingGeometry(.35, .5, 20), new THREE.MeshBasicMaterial({ color: C.foam, transparent: true, opacity: .7 - k * .06, depthWrite: false })))
    ring.rotation.x = -Math.PI / 2
    group.add(ring)
    return ring
  })
  for (let k = 0; k < 4; k++) {
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(.6 + rand() * .5, 0), toon(C.rock))
    rock.position.set(lagoon.x + Math.sin(k * 1.7) * 8.5, .1, lagoon.z + Math.cos(k * 1.7) * 6)
    rock.rotation.set(k, k * 2, 0)
    rock.castShadow = true
    place(O, rock)
  }

  /* ------------------------------------------- competing: the hackathon stage */

  const Cp = AT.competing
  place(Cp, island(11, 731, C.meadow))
  const stage = new THREE.Mesh(new RoundedBoxGeometry(10, .6, 5, 2, .08), toon('#3b4a5a'))
  stage.position.set(0, G + .3, -1.2)
  stage.castShadow = stage.receiveShadow = true
  const apron = new THREE.Mesh(new THREE.BoxGeometry(10.02, .1, .2), toon(C.yellow))
  apron.position.set(0, G + .55, 1.3)
  place(Cp, stage)
  place(Cp, apron)
  const scoreboard = screen(8, 4.2, standings)
  scoreboard.mesh.position.set(0, G + .6 + 2.9, -3.4)
  place(Cp, scoreboard.mesh)
  const frame = new THREE.Mesh(new RoundedBoxGeometry(8.4, 4.6, .25, 2, .06), toon('#24303d'))
  frame.position.set(0, G + .6 + 2.9, -3.55)
  place(Cp, frame)
  // A truss over the stage with spotlights on it, sweeping.
  const truss = new THREE.Group()
  const steel = toon('#59636e')
  for (const x of [-5.4, 5.4]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(.3, 6.4, .3), steel)
    tower.position.set(x, 3.2, 0)
    truss.add(tower)
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(11.1, .3, .3), steel)
  beam.position.y = 6.4
  truss.add(beam)
  truss.position.set(0, G + .6, .6)
  place(Cp, truss)
  const spots = [-3.6, -1.2, 1.2, 3.6].map((x, k) => {
    const head = new THREE.Group()
    const can = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, .5, 12), toon('#2b3036'))
    can.rotation.x = Math.PI / 2
    const lens = new THREE.Mesh(new THREE.CircleGeometry(.22, 16), light('#fff3c4'))
    lens.position.z = .26
    const beamCone = plain(new THREE.Mesh(new THREE.ConeGeometry(1.1, 6, 20, 1, true), glassMaterial(k % 2 ? '#fff1b8' : '#ffd0e0', .09)))
    beamCone.rotation.x = -Math.PI / 2
    beamCone.position.z = 3.2
    head.add(can, lens, beamCone)
    head.position.set(x, G + .6 + 6.1, .6)
    place(Cp, head)
    return head
  })
  // Balloons in an arch over the front of the stage.
  const balloons = new Bundle()
  for (let k = 0; k <= 30; k++) {
    const a = k / 30 * Math.PI
    balloons.add([C.coral, C.yellow, C.teal, C.ivory][k % 4], new THREE.SphereGeometry(.3, 12, 10), new THREE.Matrix4().makeTranslation(Math.cos(a) * -4.7, G + 1.4 + Math.sin(a) * 4.7, -3.1))
  }
  place(Cp, balloons.build())
  const podium = await statue('/models/interests/podium.glb', [ball('head', [0, .88, -.11], .17, [0, .74, -.1])])
  const S = 3
  podium.group.scale.setScalar(S)
  podium.group.position.set(0, G + .6, -.4)
  place(Cp, podium.group)
  // The room: teams at their tables, laptops open.
  for (let k = 0; k < 4; k++) {
    const table = new THREE.Group()
    const top = new THREE.Mesh(new RoundedBoxGeometry(1.8, .08, .8, 2, .03), toon(C.ivory))
    top.position.y = .75
    table.add(top)
    for (const x of [-.8, .8]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .75, 6), toon('#59636e'))
      leg.position.set(x, .37, 0)
      table.add(leg)
    }
    for (const x of [-.5, .5]) {
      const lid = new THREE.Mesh(new THREE.BoxGeometry(.4, .28, .02), toon('#2b3036'))
      lid.position.set(x, .93, .1)
      lid.rotation.x = .25
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(.36, .24), light(k % 2 ? '#8fd3f0' : '#c6e26c'))
      glow.position.set(x, .93, .088)
      glow.rotation.set(.25, Math.PI, 0)
      table.add(lid, glow)
      const who = person(1.15, 740 + k * 2 + (x > 0 ? 1 : 0))
      who.position.set(x, 0, .55)
      table.add(who)
    }
    table.position.set((k % 2 ? 3.6 : -3.6), G, 3.8 + Math.floor(k / 2) * 2.4)
    table.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
    place(Cp, table)
  }
  const cheerCount = 140
  const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(.1, .16), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), cheerCount)
  const paper = [C.coral, C.yellow, C.teal, '#ffffff', C.sky].map(c => new THREE.Color(c))
  const bits = Array.from({ length: cheerCount }, (_, i) => {
    confetti.setColorAt(i, paper[i % paper.length])
    return { x: (rand() - .5) * 10, z: (rand() - .5) * 5, drift: rand() * 6, fall: .8 + rand() * .7, spin: rand() * 6 }
  })
  place(Cp, plain(confetti))

  /* --------------------------------------------------- games: bricks and a road */

  const Gm = AT.games
  place(Gm, island(11.5, 751, C.grass))
  // A throne of bricks for the statue, and bricks about the island.
  const builder = await statue('/models/interests/games.glb', [ball('head', [-.05, .88, .03], .16, [-.05, .74, 0])])
  const Bd = 2.4
  builder.group.scale.setScalar(Bd)
  builder.group.position.set(-4.2, G, 3.4)
  builder.group.rotation.y = .35
  place(Gm, builder.group)
  for (const [x, z, w, d, h, color, turn] of [[-7.4, .5, 2, 1, .6, C.coral, .2], [-6.8, .4, 1, 1, .6, C.yellow, .4], [-1.2, 5.6, 1.5, 1, .55, C.sky, -.3], [5.8, 5.4, 2, 1, .6, C.yellow, .5], [6.6, 4.6, 1, 1, .6, C.teal, 0]] as const) {
    const made = brick(w, d, h, color)
    made.position.set(x, G, z)
    made.rotation.y = turn
    place(Gm, made)
  }
  // The game: a hill with a mountain road wound round it, and him on a longboard, down and round again.
  const HILL = 5.6, hillR = 7.2
  const hill = new THREE.Mesh(new THREE.ConeGeometry(hillR, HILL, 48, 6), toon(C.grass2))
  hill.position.set(3, G + HILL / 2, -3)
  hill.castShadow = hill.receiveShadow = true
  place(Gm, hill)
  const turns = 1.6, roadPoints: THREE.Vector3[] = []
  for (let i = 0; i <= 120; i++) {
    const s = i / 120
    const r = hillR * (.18 + .8 * s), a = Math.PI * .8 + s * Math.PI * 2 * turns
    const y = HILL * (1 - (.18 + .8 * s)) + .06
    roadPoints.push(new THREE.Vector3(3 + Math.sin(a) * r * 1.02, G + y, -3 + Math.cos(a) * r * 1.02))
  }
  const road = new THREE.CatmullRomCurve3(roadPoints)
  // The road, laid as short flat slabs along the curve, a dash down the middle of every fourth.
  const pave = new Bundle(), dash = new THREE.BoxGeometry(.06, .02, .3), slab = new THREE.BoxGeometry(1, .1, .36)
  const tp = new THREE.Vector3(), tt = new THREE.Vector3()
  for (let i = 0; i <= 260; i++) {
    road.getPointAt(i / 260, tp)
    road.getTangentAt(i / 260, tt)
    const turn = Math.atan2(tt.x, tt.z), pitch = -Math.asin(tt.y)
    pave.add('#4a4e57', slab, new THREE.Matrix4().compose(tp.clone().add(new THREE.Vector3(0, -.03, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, turn, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)))
    if (i % 4 === 0) pave.add(C.yellow, dash, new THREE.Matrix4().compose(tp.clone().add(new THREE.Vector3(0, .03, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, turn, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)))
  }
  place(Gm, pave.build())
  for (let k = 0; k < 18; k++) {
    const a = rand() * Math.PI * 2, r = 1.5 + rand() * 5
    const y = HILL * (1 - r / hillR)
    const tree = pine(.7 + rand() * .5, 760 + k)
    const x = 3 + Math.sin(a) * r, z = -3 + Math.cos(a) * r
    let clear = true
    for (let u = 0; u <= 1; u += .01) { road.getPointAt(u, tp); if (Math.hypot(tp.x - x, tp.z - z) < .9) clear = false }
    if (!clear) continue
    tree.position.set(x, G + y - .2, z)
    place(Gm, tree)
  }
  const title = word('Downhill', { size: 1.1, depth: .3, color: C.ivory, line: C.coral, tracking: 60 })
  title.group.position.set(3, G + HILL + 1.2, -3)
  title.group.rotation.y = .5
  place(Gm, title.group)
  const skater = await puppet()
  const K = 1.6
  skater.root.scale.setScalar(K)
  const deck = longboard()
  deck.scale.setScalar(K * 1.1)
  place(Gm, skater.root)
  place(Gm, deck)
  const sparks = new THREE.InstancedMesh(new THREE.BoxGeometry(.04, .04, .14), light('#ffcf5a'), 24)
  place(Gm, plain(sparks))

  /* ---------------------------------------------------- security: the vault */

  const Sc = AT.security
  place(Sc, island(10, 771, C.grass2))
  // A cliff behind, in stepped rock, ivy over its lip.
  for (const [r, h, y, x, z, seed] of [[4.4, 3.4, G - .1, 0, -8.4, 772], [3.2, 2.8, G + 3.3, -.4, -8.8, 773], [2.1, 2, G + 6.1, .3, -9, 774]] as const) {
    const rock = tier(r, h, seed, C.grass2, C.rock2, .14)
    rock.mesh.position.set(x, y + h / 2, z)
    rock.mesh.scale.set(1.5, 1, .7)
    place(Sc, rock.mesh)
  }
  for (const [x, y, z] of [[-4.6, G + 3.3, -6.6], [-1.5, G + 3.3, -5.4], [3.6, G + 3.3, -6.3], [.8, G + 6.1, -7.6]] as const) {
    const creeper = ivy(() => .2, 0, 1.8, [0, 1.2, 2.4, 3.6, 4.8], 775 + x)
    creeper.position.set(x, y, z)
    place(Sc, creeper)
  }
  const vault = await statue('/models/interests/security.glb', [
    ball('head', [-.13, .58, .15], .155, [-.13, .45, .13]),
    ball('dial', [.144, .564, .135], .055),
  ])
  const V = 2.6
  vault.group.scale.setScalar(V)
  vault.group.position.set(0, G, -3.6)
  place(Sc, vault.group)
  // The light from inside, through the gap in the door: more of it when it gives.
  const gleam = plain(new THREE.Mesh(new THREE.PlaneGeometry(.12 * V, .62 * V), light('#ffc94a')))
  gleam.position.set(.31 * V, G + .53 * V, -3.6 + .04 * V)
  place(Sc, gleam)
  const rays = plain(new THREE.Mesh(new THREE.ConeGeometry(.9, 4, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })))
  rays.rotation.z = -Math.PI / 2 + .1
  rays.position.set(.31 * V + 2, G + .53 * V, -3.6 + .5)
  place(Sc, rays)
  const coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(.11, .11, .03, 14), toon('#f0c34a'), 40)
  coins.castShadow = true
  place(Sc, coins)
  const term = screen(2.4, 1.6, terminal)
  term.mesh.position.set(-3.3, G + 2.1, -2.2)
  term.mesh.rotation.y = .45
  place(Sc, term.mesh)
  const flagpole = new THREE.Group()
  const fpole = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 2.6, 6), toon(C.ivory))
  fpole.position.y = 1.3
  const fcloth = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .7, 8, 1), toon(C.ink, { side: THREE.DoubleSide }))
  fcloth.position.set(.6, 2.2, 0)
  flagpole.add(fpole, fcloth)
  flagpole.position.set(.8, G + 8.1, -9)
  place(Sc, flagpole)
  const ctf = word('CTF', { size: .36, depth: .04, color: C.ivory, line: C.yellow, tracking: 40 })
  ctf.group.position.set(1.4, G + 10.15, -8.96)
  place(Sc, ctf.group)

  /* ------------------------------------------------------------- soccer: a pitch */

  const Sp = AT.soccer
  place(Sp, island(12, 781, C.grass))
  const pitch = new Bundle()
  for (let k = 0; k < 8; k++) pitch.add(k % 2 ? '#5fae4a' : '#6dbb54', new THREE.BoxGeometry(2, .04, 11), new THREE.Matrix4().makeTranslation(-7 + k * 2, G + .02, 0))
  const lineGeo = new THREE.BoxGeometry(1, .02, 1)
  const chalk = (x: number, z: number, w: number, d: number) => pitch.add('#fbf6ea', lineGeo, new THREE.Matrix4().compose(new THREE.Vector3(x, G + .05, z), new THREE.Quaternion(), new THREE.Vector3(w, 1, d)))
  chalk(0, -5.5, 16, .08); chalk(0, 5.5, 16, .08); chalk(-8, 0, .08, 11); chalk(8, 0, .08, 11); chalk(0, 0, .08, 11)
  chalk(5, -2.6, .08, 5.2); chalk(6.5, -2.6, 3, .08); chalk(6.5, 2.6, 3, .08)
  place(Sp, pitch.build())
  const centre = plain(new THREE.Mesh(new THREE.RingGeometry(1.6, 1.68, 40), toon('#fbf6ea')))
  centre.rotation.x = -Math.PI / 2
  centre.position.y = G + .06
  place(Sp, centre)
  const net = goal(3.4, 1.7, 1.1)
  net.group.position.set(8, G, 0)
  place(Sp, net.group)
  // A little stand along the far side, red seats, and floodlights with panels on top.
  for (let row = 0; row < 3; row++) {
    const seats = new THREE.Mesh(new THREE.BoxGeometry(12, .45, .7), toon(row % 2 ? '#c8322e' : '#a8262a'))
    seats.position.set(0, G + .22 + row * .45, -7 - row * .7)
    seats.castShadow = seats.receiveShadow = true
    place(Sp, seats)
  }
  const banner = screen(5, .8, (ctx, W, Hh) => {
    ctx.fillStyle = '#c8322e'
    ctx.fillRect(0, 0, W, Hh)
    ctx.fillStyle = '#fbf6ea'
    ctx.font = `120px ${FONTS.display}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('YOU’LL NEVER WALK ALONE', W / 2, Hh / 2 + 6)
  })
  banner.draw(0)
  banner.mesh.position.set(0, G + 1.9, -8.6)
  place(Sp, banner.mesh)
  for (const x of [-7, 7]) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 6, 8), toon(C.ivory))
    mast.position.set(x, G + 3, -8.2)
    const lamps = new THREE.Mesh(new THREE.BoxGeometry(1.4, .6, .2), light('#fff3c4'))
    lamps.position.set(x, G + 6, -8)
    const panel = solarPanel(1.6, 1)
    panel.position.set(x, G + 6.35, -8.2)
    place(Sp, mast)
    place(Sp, lamps)
    place(Sp, panel)
  }
  const player = await puppet({ url: '/models/interests/soccer.glb', scale: FIT.soccer })
  const F = 1.6
  player.root.scale.setScalar(F)
  lift(player.mesh.material)
  place(Sp, player.root)
  const footy = football(.12 * F)
  place(Sp, footy)
  const SPOT = new THREE.Vector3(1.5, G + .12 * F, .4), MOUTH = new THREE.Vector3(8.6, G + 1.15, -.9)

  // Cable cars between the islands, the way the towns do it, and cypresses on the shores.
  const lines: { move(t: number): void }[] = []
  for (const [a, b] of [[AT.outdoors, AT.competing], [AT.competing, AT.games], [AT.games, AT.security], [AT.security, AT.soccer]]) {
    const from = a.clone().add(new THREE.Vector3(Math.sign(b.x - a.x) * 9, 9, -6)), to = b.clone().add(new THREE.Vector3(Math.sign(a.x - b.x) * 8, 8, 6))
    const line = cableway(from, to, 2.5, 2, 1.1)
    group.add(line.group)
    lines.push(line)
    for (const end of [from, to]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(.14, .22, end.y - G, 8), toon(C.ivory))
      tower.position.set(end.x, (end.y + G) / 2, end.z)
      group.add(tower)
    }
  }
  for (const where of Object.values(AT)) for (let k = 0; k < 5; k++) {
    const a = rand() * Math.PI * 2, r = 9.6 + rand() * 1.4
    const c = cypress(1.3 + rand() * .8, 790 + k)
    c.position.set(where.x + Math.sin(a) * r, G, where.z + Math.cos(a) * r)
    if (Math.cos(a) > .3) continue
    group.add(c)
  }

  /* ------------------------------------------------------------------ the camera */

  const w = (base: THREE.Vector3, x: number, y: number, z: number) => [ORIGIN.x + base.x + x, ORIGIN.y + base.y + y, ORIGIN.z + base.z + z] as [number, number, number]
  const keys: Key[] = [
    { beat: 0, eye: w(O, -26, 27, 30), look: w(O, 17, 0, -50), fov: 40, hold: .35, card: 'left' },
    { beat: 1, eye: w(O, -8, 9.5, 24), look: w(O, -.5, 3.6, 3), fov: 36, hold: .5, card: 'right' },
    { beat: 2, eye: w(O, 22, 9, 10), look: w(O, 5.5, 3, 2), fov: 36, hold: .5, card: 'left' },
    { beat: 3, eye: w(O, -26, 5.5, 26), look: w(lagoon, -.5, .6, 0), fov: 34, hold: .5, card: 'right' },
    { beat: 4, eye: w(Cp, 5, 6.5, 19), look: w(Cp, 1.2, 3.2, -.5), fov: 36, hold: .5, card: 'left' },
    { beat: 5, eye: w(Gm, -12, 8, 17), look: w(Gm, -.8, 3, 0), fov: 38, hold: .5, card: 'right' },
    { beat: 6, eye: w(Sc, 5.5, 4.4, 8.5), look: w(Sc, .6, 2.1, -3.4), fov: 36, hold: .5, card: 'left' },
    { beat: 7, eye: w(Sp, -4, 5.5, 13), look: w(Sp, 3.2, 1, 0), fov: 36, hold: .5, card: 'right' },
  ]

  /* ------------------------------------------------------------------ the motion */

  let cracked = 0, crack = false
  const v = new THREE.Vector3(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1)
  const coinSeeds = Array.from({ length: 40 }, () => ({ vx: 1 + rand() * 2.2, vy: 1.5 + rand() * 2, vz: (rand() - .5) * 2.4, spin: rand() * 6, delay: rand() * 1.2 }))
  const sparkSeeds = Array.from({ length: 24 }, () => ({ vx: (rand() - .5) * 2, vy: .5 + rand() * 1.5, vz: (rand() - .5) * 2, life: .3 + rand() * .3 }))
  let draws = 0

  const face = (from: THREE.Vector3, to: THREE.Vector3) => Math.atan2(to.x - from.x, to.z - from.z)
  const ease = (current: number, want: number, k: number) => {
    let d = want - current
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    return current + d * k
  }

  return {
    id: 'interests',
    group,
    centre: ORIGIN.clone().add(new THREE.Vector3(18, 0, -56)),
    radius: 75,
    light: GOLDEN_HOUR,
    keys,
    set(name, value) {
      if (name === 'vault') crack = value === 'open'
    },
    update(t, dt, _local, near, beat) {
      if (!near) return
      const close = (b: number) => Math.abs(beat - b) < 1.6
      const k = Math.min(1, dt * 6)

      // Up the mountain and back down, with a rest at the top to look at the view.
      if (close(1) || close(0)) {
        const trip = shuttle(t, 26, 4, 22, 3)
        along(hike.curve, trip.u, hikerAt)
        const moved = hikerAt.distanceTo(hikerLast)
        if (moved < 1) hikeState.phase += moved / (STRIDE * H)
        hikeState.walking += ((trip.moving ? 1 : 0) - hikeState.walking) * k
        const ahead = along(hike.curve, trip.u + .01 * trip.dir, v.clone())
        const want = trip.moving ? face(hikerAt, ahead) : trip.u > .5 ? .2 : face(hikerAt, ahead) + Math.PI
        hikeState.facing = ease(hikeState.facing, want, k)
        hikerLast.copy(hikerAt)
        hiker.root.position.copy(hikerAt).add(O)
        hiker.root.rotation.y = hikeState.facing
        hiker.root.updateMatrixWorld()
        const look: Pose = { ...idle(t), head: [-.1, Math.sin(t * .5) * .6, 0], neck: [-.05, 0, 0] }
        hiker.pose(blend(look, walk(hikeState.phase, .8), hikeState.walking))
        cloth.rotation.y = Math.sin(t * 3) * .25
      }

      // Down the trail on the bike, quick; back up it slowly; a breath at each end.
      if (close(2)) {
        const trip = shuttle(t, 9, 1.5, 16, 1.5)
        const u = 1 - trip.u
        along(ride.curve, u, rideAt)
        const dir = trip.dir > 0 ? 1 : -1
        along(ride.curve, u + .01 * dir, rideNext)
        const run = Math.hypot(rideNext.x - rideAt.x, rideNext.z - rideAt.z) || 1e-4
        rider.position.copy(rideAt).add(O)
        rider.rotation.set(Math.atan2(-(rideNext.y - rideAt.y), run) * .8, Math.atan2(rideNext.x - rideAt.x, rideNext.z - rideAt.z), Math.sin(t * 2.2) * .05 * (trip.moving ? 1 : 0), 'YXZ')
        rider.position.y += Math.abs(Math.sin(t * 9)) * .03 * (trip.moving ? 1 : 0)
        const speed = trip.moving ? (dir > 0 ? 1 / 9 : 1 / 16) * ride.curve.getLength() : 0
        bike.parts.front.rotation.x += speed * dt / (bikeFront.r * .8 * B)
        bike.parts.back.rotation.x += speed * dt / (bikeBack.r * .8 * B)
      }

      // Round the lagoon on the board, rocking a little with every stroke.
      if (close(3)) {
        const a = t * .16
        const at = (s: number) => v.set(lagoon.x + Math.sin(s) * 6.2, 0, lagoon.z + Math.cos(s) * 3.8)
        const here = at(a).clone(), next = at(a + .02).clone()
        paddler.position.copy(here).add(O)
        paddler.position.y = -.1 + Math.sin(t * 1.3) * .03
        paddler.rotation.set(Math.sin(t * 1.1) * .03, face(here, next) + Math.sin(t * 2.4) * .06, Math.sin(t * 1.3 + 1) * .035, 'YXZ')
        wake.forEach((ring, i) => {
          at(a - .05 - i * .06)
          ring.position.copy(v).add(O).setY(.02)
          ring.scale.setScalar(1 + i * .22)
        })
      }

      // The stage: the board's lines climb, the lights sweep, he looks up from the laptop now and then.
      if (close(4)) {
        if (++draws % 3 === 0) scoreboard.draw(t)
        spots.forEach((spot, i) => { spot.rotation.set(.75 + Math.sin(t * .7 + i) * .2, Math.sin(t * .5 + i * 1.3) * .5, 0) })
        podium.parts.head.rotation.set(.08 + Math.sin(t * 2.6) * .04, Math.sin(t * .6) * .45, 0)
        bits.forEach((b, i) => {
          const fall = (t * b.fall + b.drift) % 7
          v.set(b.x + Math.sin(t + i) * .3, 7.4 - fall, b.z + 1)
          if (v.y < G) v.y = -50
          m.compose(v, q.setFromEuler(e.set(t * 2 + b.spin, b.spin, t * 3)), one)
          confetti.setMatrixAt(i, m)
        })
        confetti.instanceMatrix.needsUpdate = true
      }

      // The game: he longboards down the road round the hill, and then he's at the top again.
      if (close(5)) {
        const u = (t * .045) % 1
        road.getPointAt(u, tp)
        road.getTangentAt(u, tt)
        const turn = Math.atan2(tt.x, tt.z)
        deck.position.copy(tp).add(Gm)
        deck.rotation.set(-Math.asin(tt.y), turn, Math.sin(t * 1.8) * .08, 'YXZ')
        skater.root.position.copy(tp).add(Gm).add(new THREE.Vector3(0, .14 * K, 0))
        skater.root.rotation.y = turn - Math.PI / 2
        skater.root.updateMatrixWorld()
        skater.pose(skate(t))
        builder.parts.head.rotation.set(.12 + Math.sin(t * 3.1) * .03, -.25 + Math.sin(t * .4) * .25, 0)
        sparkSeeds.forEach((s, i) => {
          const age = (t + i * .05) % s.life
          v.copy(tp).add(Gm).add(new THREE.Vector3(s.vx * age - tt.x * age, .1 + s.vy * age - 3 * age * age, s.vz * age - tt.z * age))
          m.compose(v, q.setFromEuler(e.set(i, i * 2, 0)), one)
          sparks.setMatrixAt(i, m)
        })
        sparks.instanceMatrix.needsUpdate = true
      }

      // The vault: the dial turns as he listens; asked to, it gives, and the gold comes out.
      if (close(6)) {
        cracked += ((crack ? 1 : 0) - cracked) * Math.min(1, dt * 1.5)
        vault.parts.dial.rotation.z = crack ? t * 6 : Math.sin(t * .9) * 1.2 + Math.sin(t * 2.3) * .3
        vault.parts.head.rotation.set(.05 + Math.sin(t * .8) * .04, -.15 * cracked, Math.sin(t * .6) * .06 + .1 * cracked)
        gleam.scale.set(1 + cracked * 2.5, 1, 1)
        ;(rays.material as THREE.MeshBasicMaterial).opacity = cracked * .28
        coinSeeds.forEach((s, i) => {
          const age = cracked > .5 ? (t + s.delay) % 1.8 : 0
          if (age <= 0) { coins.setMatrixAt(i, m.makeTranslation(0, -50, 0)); return }
          v.set(.33 * V + s.vx * age, G + .45 * V + s.vy * age - 4.9 * age * age, -3.6 + .2 + s.vz * age)
          if (v.y < G + .05) v.y = G + .05
          m.compose(v, q.setFromEuler(e.set(s.spin + age * 8, s.spin, age * 5)), one)
          coins.setMatrixAt(i, m)
        })
        coins.instanceMatrix.needsUpdate = true
        if (draws++ % 4 === 0) term.draw(t)
        fcloth.rotation.y = Math.sin(t * 2.6) * .3
      }

      // The pitch: a run up, the kick, the ball in the top corner, the net bellying, and again.
      if (close(7)) {
        const T = 6.5, c = t % T
        const start = SPOT.clone().add(new THREE.Vector3(-2.6, -SPOT.y + G, .6)), strike = SPOT.clone().add(new THREE.Vector3(-.42, -SPOT.y + G, .12))
        let pose: Pose = idle(t), at = strike.clone(), facing = face(strike, SPOT)
        if (c < 1.3) {
          at = start.clone().lerp(strike, c / 1.3)
          pose = walk(c * 9, 1)
        } else if (c < 2.1) {
          pose = kick((c - 1.3) / .8)
        } else if (c < 4.1) {
          pose = { ...idle(t), armL: [-.3, 0, .9], armR: [-.3, 0, -.9], head: [-.2, 0, 0] }
        } else {
          const back = (c - 4.1) / 2.4
          at = strike.clone().lerp(start, back)
          facing = face(strike, start)
          pose = walk(c * 7, .8)
        }
        player.root.position.copy(at).add(Sp)
        player.root.rotation.y = ease(player.root.rotation.y, facing, Math.min(1, dt * 8))
        player.root.updateMatrixWorld()
        player.pose(pose)
        // The ball: still, then off his foot at the strike, into the net, then rolled back out to the spot.
        const hit = 1.3 + .8 * .62
        if (c < hit) footy.position.copy(SPOT)
        else if (c < hit + .85) {
          const f = (c - hit) / .85
          footy.position.copy(SPOT).lerp(MOUTH, f)
          footy.position.y = SPOT.y + (MOUTH.y - SPOT.y) * f + Math.sin(f * Math.PI) * .9
          footy.rotation.z -= dt * 14
        } else if (c < 4.3) {
          const f = Math.min(1, (c - hit - .85) / .5)
          footy.position.set(MOUTH.x + .4 * f, Math.max(G + .12 * F, MOUTH.y - 2.4 * f * f), MOUTH.z)
        } else {
          const f = Math.min(1, (c - 4.3) / 2)
          footy.position.set(MOUTH.x + .4 - (MOUTH.x + .4 - SPOT.x) * f, SPOT.y, MOUTH.z + (SPOT.z - MOUTH.z) * f)
          footy.rotation.z += dt * 6
        }
        footy.position.add(Sp)
        const bulge = c > hit + .8 && c < hit + 1.6 ? Math.sin((c - hit - .8) / .8 * Math.PI) : 0
        net.back.position.x = 1.1 + bulge * .35
      }

      for (const line of lines) line.move(t)
    },
  }
}
