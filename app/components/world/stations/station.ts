import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { awards, modes, type Mode } from '../../../content'
import { C, cypress, flowers, light, plain, pod, rng, scatter, solarPanel, tier, toon, tree, turbine } from '../../toon/kit'
import type { Key, Station } from '../engine'
import { cheer } from '../motion'
import { FONTS, drone } from '../props'
import { puppet } from '../puppet'

// The station: the record of wins as a solar tram stop. A platform under a curved roof of panels, the rails
// running out over the sea on arches, and the tram pulling in as you arrive. Hanging over the platform is
// the departures board, with every win on it, which flips letter by letter when a filter changes. At the
// end of the platform Omar stands on the top step of a podium with a trophy, and behind the station the wind
// farm grows a turbine for every win that was built and a flag for every one that was broken into, with a
// sun for the one that was given.

export const AFTERNOON = {
  sky: ['#eef0dc', '#d6ebe6', '#9ccbe8', '#5f95dc', '#3a6dc6'] as [string, string, string, string, string],
  sun: [.25, .7, .66] as [number, number, number], sunColor: '#fff6dc', sunSize: .045,
  key: '#fff1d8', strength: 2.7, hemi: ['#b4c8f2', '#c4c08c'] as [string, string], fill: 1.6,
  water: ['#3aa9c0', '#a6e4ec'] as [string, string], cloud: ['#fffdf6', '#bcc4e2'] as [string, string], fog: [90, 320] as [number, number],
}

export const ORIGIN = new THREE.Vector3(-22, 0, -262)
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const COLUMNS = [8, 22, 20, 8]

/** The departures board, drawn on a canvas: every row a run of split flaps, riffling when it changes. */
function departures() {
  const W = 1600, H = 900, rows = awards.length
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const cell = 23, gap = 2.5, top = 168, rowH = 86
  type Row = { text: string; was: string; since: number; mode?: Mode; chosen: boolean }
  const state: Row[] = Array.from({ length: rows }, () => ({ text: '', was: '', since: -10, chosen: false }))
  const line = (a: typeof awards[number] | undefined) => !a ? '' : [a.date, a.event, a.result, modes[a.mode]].map((s, i) => s.toUpperCase().padEnd(COLUMNS[i]).slice(0, COLUMNS[i])).join('')
  let now = 0, busy = true
  const draw = () => {
    ctx.fillStyle = '#101a15'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#f3c64a'
    ctx.font = `78px ${FONTS.display}`
    ctx.textBaseline = 'middle'
    ctx.fillText('ARRIVALS · WINS', 44, 74)
    ctx.font = `600 24px ${FONTS.mono}`
    ctx.fillStyle = '#8aa597'
    let x = 40
    for (const [i, head] of ['DATE', 'EVENT', 'RESULT', 'KIND'].entries()) { ctx.fillText(head, x, 140); x += COLUMNS[i] * (cell + gap) + 12 }
    busy = false
    state.forEach((row, r) => {
      const y = top + r * rowH
      if (row.chosen) {
        ctx.fillStyle = 'rgba(243, 198, 74, .3)'
        ctx.fillRect(24, y - 7, W - 48, rowH - 2)
        ctx.fillStyle = '#f3c64a'
        ctx.beginPath(); ctx.moveTo(8, y + 14); ctx.lineTo(22, y + 32); ctx.lineTo(8, y + 50); ctx.fill()
      }
      let cx = 40
      for (let col = 0, c = 0; col < COLUMNS.length; col++) {
        for (let k = 0; k < COLUMNS[col]; k++, c++) {
          // Each flap settles a little after the one before it; until then it riffles.
          const settle = row.since + .25 + c * .025
          let char = row.text[c] ?? ' '
          if (now < settle) { busy = true; char = now - row.since < .05 ? (row.was[c] ?? ' ') : GLYPHS[Math.floor((now * 30 + c * 7) % GLYPHS.length)] }
          ctx.fillStyle = '#1f2b25'
          ctx.fillRect(cx, y, cell, rowH - 14)
          ctx.fillStyle = '#24322b'
          ctx.fillRect(cx, y + (rowH - 14) / 2, cell, (rowH - 14) / 2)
          ctx.fillStyle = col === 3 ? (row.mode === 'built' ? '#f3c64a' : row.mode === 'broke' ? '#ec7b60' : '#8fd3f0') : '#f4ecd8'
          ctx.font = `600 31px ${FONTS.mono}`
          ctx.textAlign = 'center'
          if (char.trim()) ctx.fillText(char, cx + cell / 2, y + (rowH - 14) / 2 + 1)
          ctx.textAlign = 'left'
          ctx.fillStyle = '#0b120e'
          ctx.fillRect(cx, y + (rowH - 14) / 2 - 1, cell, 2)
          cx += cell + gap
        }
        cx += 12
      }
    })
    texture.needsUpdate = true
  }
  return {
    texture,
    show(list: typeof awards, chosen: number) {
      state.forEach((row, r) => {
        const text = line(list[r])
        if (text !== row.text) { row.was = row.text; row.text = text; row.since = now + r * .08 }
        row.mode = list[r]?.mode
        row.chosen = r === chosen
      })
      busy = true
    },
    tick(t: number) {
      // With reduced motion the clock stands still: the rows change at once, without the riffle.
      if (t === now) for (const row of state) row.since = -10
      now = t
      if (busy) draw()
    },
  }
}

/** A streamlined solar tram: ivory and coral, round windows, panels along its roof. */
function tram() {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.75, 5.2, 8, 24), toon(C.ivory))
  body.rotation.z = Math.PI / 2
  body.scale.set(1, 1, .82)
  body.position.y = 1.05
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(.77, .77, 5.4, 32, 1, true), toon(C.coral))
  stripe.rotation.z = Math.PI / 2
  stripe.scale.set(1, .25, .84)
  stripe.position.y = .78
  group.add(body, stripe)
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
    const pane = new THREE.Mesh(new THREE.CircleGeometry(.24, 20), light(C.glow))
    pane.position.set(-2.4 + i * .8, 1.25, side * .63)
    pane.rotation.y = side > 0 ? 0 : Math.PI
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.25, .04, 6, 20), toon(C.brass))
    rim.position.copy(pane.position)
    rim.rotation.y = pane.rotation.y
    group.add(pane, rim)
  }
  for (let i = 0; i < 4; i++) {
    const p = solarPanel(1.1, .55)
    p.position.set(-2 + i * 1.3, 1.75, 0)
    p.rotation.y = Math.PI / 2
    group.add(p)
  }
  for (const x of [-2.2, 2.2]) for (const z of [-.4, .4]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .12, 16), toon(C.ink))
    wheel.rotation.x = Math.PI / 2
    wheel.position.set(x, .22, z)
    group.add(wheel)
  }
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return group
}

/** A trophy: a cup on a stem, two handles, a block for a base. */
function trophy(size: number) {
  const group = new THREE.Group()
  const profile = [[0, 0], [.42, 0], [.42, .12], [.14, .16], [.1, .4], [.18, .5], [.46, .62], [.52, 1], [.46, 1], [0, .74]].map(([x, y]) => new THREE.Vector2(x * size, y * size))
  const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 24), toon('#f0c34a'))
  group.add(cup)
  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(size * .16, size * .035, 6, 16, Math.PI), toon('#f0c34a'))
    handle.position.set(side * size * .5, size * .78, 0)
    handle.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2
    group.add(handle)
  }
  return group
}

export default async function station(): Promise<Station> {
  await document.fonts?.ready
  const group = new THREE.Group()
  group.position.copy(ORIGIN)
  const rand = rng(31)

  // The island, a grassy hill behind for the farm, and the platform along the front.
  const land = tier(12, 1.2, 201, C.grass, C.stone, .06)
  land.mesh.scale.set(1.4, 1, .85)
  land.mesh.position.y = .1
  const sand = tier(12.8, .4, 202, C.sand, '#e8cf98', .06)
  sand.mesh.scale.set(1.42, 1, .88)
  const hill = tier(6.5, 2.2, 203, C.meadow, C.stone, .12)
  hill.mesh.position.set(-2, 1.6, -6)
  group.add(sand.mesh, land.mesh, hill.mesh)
  const G = .7, P = G + .6
  // The platform: the camera stands in front of it, the rails run behind it.
  const platform = new THREE.Mesh(new RoundedBoxGeometry(19, .6, 3.8, 2, .08), toon(C.stone))
  platform.position.set(0, G + .3, 3.4)
  platform.receiveShadow = platform.castShadow = true
  const edge = new THREE.Mesh(new THREE.BoxGeometry(19, .02, .2), toon(C.yellow))
  edge.position.set(0, P + .01, 1.72)
  const stair = new THREE.Mesh(new RoundedBoxGeometry(3, .3, 1.2, 2, .05), toon(C.stone2))
  stair.position.set(-2.2, G + .15, 5.8)
  group.add(platform, edge, stair)

  // The rails, behind the platform, running the length of the island and out over the sea on piers.
  const railY = G + .05, RZ = .3
  for (const z of [RZ - .4, RZ + .4]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(90, .08, .08), toon('#5b6762'))
    rail.position.set(0, railY + .35, z)
    group.add(rail)
  }
  const bed = new THREE.Mesh(new THREE.BoxGeometry(90, .3, 1.8), toon(C.stone2))
  bed.position.set(0, railY + .15, RZ)
  bed.receiveShadow = true
  group.add(bed)
  for (let i = -7; i <= 7; i++) {
    if (Math.abs(i) < 3) continue
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, railY + 1.2, 10), toon(C.ivory))
    pier.position.set(i * 6, (railY - 1.2) / 2 + .3, RZ)
    pier.castShadow = true
    group.add(pier)
  }

  // Solar trees along the back of the platform, for shade: a stem, a brass collar, a hexagon of panels.
  for (const [x, z, h, r] of [[-7.6, 2.6, 3.6, 1.7], [-4.4, 2.2, 4.3, 1.9], [5.4, 2.2, 4.4, 1.7], [8.4, 2.8, 3.5, 1.4]]) {
    const shade = new THREE.Group()
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.09, .16, h, 10), toon(C.ivory))
    stem.position.y = h / 2
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(.2, .14, .26, 10), toon(C.brass))
    collar.position.y = h - .05
    const crown = new THREE.Group()
    crown.position.y = h + .1
    crown.rotation.x = .28
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .96, .1, 6), [toon(C.steel), toon(C.panel), toon(C.steel)])
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * .99, .045, 6, 6), toon(C.ivory))
    rim.rotation.x = Math.PI / 2
    rim.position.y = .05
    crown.add(top, rim)
    for (let k = 0; k < 6; k++) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, r * .9, 5), toon(C.ivory))
      strut.position.set(Math.cos(k * Math.PI / 3) * r * .42, -.18, Math.sin(k * Math.PI / 3) * r * .42)
      strut.rotation.set(0, -k * Math.PI / 3, Math.PI / 2 - .35)
      crown.add(strut)
    }
    // Cells on the face: a grid of lines, drawn as thin dark bars.
    for (let k = -2; k <= 2; k++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.03, .02, r * 1.6 * Math.cos(k * .3)), toon('#1d3a7a'))
      bar.position.set(k * r * .33, .06, 0)
      crown.add(bar)
    }
    shade.add(stem, collar, crown)
    shade.position.set(x, P, z)
    shade.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
    group.add(shade)
  }

  // The board, standing in the middle of the platform on two posts, under its own strip of panels.
  const board = departures()
  const face = new THREE.MeshBasicMaterial({ map: board.texture })
  const frame = toon(C.brass)
  const BW = 6.2, BH = 3.5, BY = P + 1.75 + BH / 2
  const sign = new THREE.Mesh(new RoundedBoxGeometry(BW + .3, BH + .3, .32, 2, .07), [frame, frame, frame, frame, frame, frame])
  sign.position.set(.4, BY, 3.1)
  sign.castShadow = true
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), face)
  screen.position.set(.4, BY, 3.27)
  group.add(sign, plain(screen))
  for (const x of [-2.6, 3.4]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.11, .14, BY + BH / 2 - P + .2, 10), toon(C.ivory))
    post.position.set(x, P + (BY + BH / 2 - P + .2) / 2, 2.9)
    post.castShadow = true
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 8), toon(C.brass))
    cap.position.set(x, BY + BH / 2 + .32, 2.9)
    group.add(post, cap)
  }
  const awning = solarPanel(BW + .9, 1.1)
  awning.rotation.y = Math.PI
  awning.position.set(.4, BY + BH / 2 + .12, 3)
  group.add(awning)
  // A clock on a bracket at the end of the board, as stations have.
  const clock = new THREE.Group()
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .14, 28), toon(C.ivory))
  dial.rotation.x = Math.PI / 2
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(.43, .06, 8, 28), toon(C.coral))
  const hands = [.28, .36].map(len => {
    const hand = new THREE.Mesh(new THREE.BoxGeometry(.035, len, .02), toon(C.ink))
    hand.geometry.translate(0, len / 2, 0)
    hand.position.z = .09
    clock.add(hand)
    return hand
  })
  clock.add(dial, bezel)
  clock.position.set(-3.25, BY + BH / 2 - .3, 3.1)
  group.add(clock)

  // A ticket kiosk at the far end: a little pod with a porthole and a roof of panels.
  const kiosk = pod({ R: 1.15, H: 2, color: C.shell, bands: [[.06, .16, C.coral]], windows: [[.25, .5, .3]], lit: true, door: -.35, panels: 2, antenna: true })
  kiosk.position.set(-8, P, 4)
  group.add(kiosk)

  // Benches and planters along the platform.
  for (const x of [-5.6, -1.2, 4.4]) {
    const planter = new THREE.Mesh(new RoundedBoxGeometry(1, .5, .6, 2, .05), toon(C.coral))
    planter.position.set(x, P + .25, 4.7)
    const shrub = tree(.45, Math.round(x * 3) + 50)
    shrub.position.set(x, P + .4, 4.7)
    group.add(planter, shrub)
  }

  // The podium at the far end, and Omar on top of it.
  const steps = [[-1.05, .55, C.ivory, '2'], [0, .85, C.yellow, '1'], [1.05, .4, C.ivory, '3']] as const
  const podium = new THREE.Group()
  for (const [x, h, color] of steps) {
    const step = new THREE.Mesh(new RoundedBoxGeometry(1, h, .9, 2, .05), toon(color))
    step.position.set(x, h / 2, 0)
    step.castShadow = step.receiveShadow = true
    podium.add(step)
  }
  podium.position.set(7, P, 3.7)
  podium.rotation.y = -.3
  podium.scale.setScalar(1.25)
  group.add(podium)
  const omar = await puppet()
  omar.root.scale.setScalar(1.2)
  omar.root.position.set(7, P + .85 * 1.25, 3.7)
  omar.root.rotation.y = -.3
  group.add(omar.root)
  const cup = trophy(.4)
  group.add(cup)

  // Confetti, thrown up over the podium every few seconds.
  const count = 160
  const bits = new THREE.InstancedMesh(new THREE.PlaneGeometry(.07, .12), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), count)
  const colors = [C.coral, C.yellow, C.teal, '#ffffff', C.sky].map(c => new THREE.Color(c))
  const seeds = Array.from({ length: count }, (_, i) => ({ vx: (rand() - .5) * 2.4, vy: 2.5 + rand() * 2.5, vz: (rand() - .5) * 2.4, spin: rand() * 6, delay: rand() * .3 }))
  seeds.forEach((_, i) => bits.setColorAt(i, colors[i % colors.length]))
  group.add(plain(bits))
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1)

  // The farm behind: a turbine for each thing built, a flag for each thing broken into, a sun for the one given.
  const marks: { object: THREE.Object3D; mode: Mode; rotor?: THREE.Object3D }[] = []
  awards.forEach((award, i) => {
    const a = -1.1 + i * .3, r = 5.2
    const x = -2 + Math.sin(a) * r * 1.4, z = -6 - Math.cos(a) * r * .6
    if (award.mode === 'built') {
      const t = turbine(4.2 + (i % 2) * .8)
      t.group.position.set(x, 2.7, z)
      t.group.rotation.y = .3
      group.add(t.group)
      marks.push({ object: t.group, mode: award.mode, rotor: t.rotor })
    } else if (award.mode === 'broke') {
      const flag = new THREE.Group()
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 2.6, 6), toon(C.ivory))
      pole.position.y = 1.3
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55, 6, 1), toon(C.coral, { side: THREE.DoubleSide }))
      cloth.position.set(.45, 2.25, 0)
      flag.add(pole, cloth)
      flag.position.set(x, 2.7, z)
      group.add(flag)
      marks.push({ object: cloth, mode: award.mode })
    } else {
      const sun = new THREE.Group()
      const disc = new THREE.Mesh(new THREE.CircleGeometry(.7, 32), toon(C.yellow, { side: THREE.DoubleSide }))
      disc.position.y = 2.6
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 2, 6), toon(C.ivory))
      stem.position.y = 1
      sun.add(disc, stem)
      for (let k = 0; k < 12; k++) {
        const ray = new THREE.Mesh(new THREE.BoxGeometry(.06, .3, .04), toon(C.yellow))
        ray.position.set(Math.cos(k / 12 * Math.PI * 2) * .95, 2.6 + Math.sin(k / 12 * Math.PI * 2) * .95, 0)
        ray.rotation.z = k / 12 * Math.PI * 2 - Math.PI / 2
        sun.add(ray)
      }
      sun.position.set(x, 2.7, z)
      group.add(sun)
      marks.push({ object: sun, mode: award.mode })
    }
  })
  for (let k = 0; k < 8; k++) {
    const c = cypress(1.6 + rand() * .8, 300 + k)
    c.position.set(-13 + rand() * 26, .7, -2.5 - rand() * 4)
    if (Math.hypot(c.position.x + 2, c.position.z + 6) < 6.6) continue
    group.add(c)
  }
  group.add(scatter(8, 60, 210, .7), flowers(9, 300, 211, .7))

  const train = tram()
  group.add(train)
  // Mail drones, about their rounds over the station.
  const fliers = [0, 1].map(() => { const d = drone(); d.group.scale.setScalar(.9); group.add(d.group); return d })

  let filter: Mode | 'all' = 'all', chosen = 0
  const list = () => awards.filter(a => filter === 'all' || a.mode === filter)
  board.show(list(), 0)

  const w = (x: number, y: number, z: number) => [ORIGIN.x + x, ORIGIN.y + y, ORIGIN.z + z] as [number, number, number]
  const keys: Key[] = [
    { beat: 0, eye: w(-7, 8, 21), look: w(1, 2.8, 0), fov: 36, hold: .45, card: 'left' },
    { beat: 1, eye: w(9.5, 5, 16.5), look: w(4, 3.4, 3), fov: 34, hold: .9, card: 'left' },
  ]

  let burst = 0
  return {
    id: 'awards',
    group,
    centre: ORIGIN.clone(),
    radius: 30,
    light: AFTERNOON,
    keys,
    set(name, value) {
      if (name === 'filter') filter = value as Mode | 'all'
      if (name === 'chosen') chosen = Number(value)
      const shown = list()
      board.show(shown, Math.max(0, shown.findIndex(a => awards.indexOf(a) === chosen)))
      burst = 0
    },
    update(t, dt, local, near) {
      if (!near) return
      board.tick(t)
      // The tram comes in from the left as you arrive, waits, and goes on to the right as you leave.
      const arrive = Math.min(1, local / .35), leave = Math.max(0, (local - .75) / .25)
      const x = -34 * Math.pow(1 - arrive, 2) + 40 * Math.pow(leave, 2)
      train.position.set(x - 1.5, railY + .3, RZ)
      // The station clock keeps the visitor's time.
      const day = new Date(), minutes = day.getHours() * 60 + day.getMinutes() + day.getSeconds() / 60
      hands[0].rotation.z = -minutes / 720 * Math.PI * 2
      hands[1].rotation.z = -minutes / 60 * Math.PI * 2
      fliers.forEach((d, i) => {
        const s = t * .22 + i * Math.PI
        d.group.position.set(Math.sin(s) * 11, 7.5 + i * 1.2 + Math.sin(t * .8 + i) * .3, -1 + Math.cos(s) * 6)
        d.group.rotation.set(Math.sin(t + i) * .06, s + Math.PI / 2, 0)
        d.rotors.forEach(r => { r.rotation.y += dt * 24 })
      })
      for (const mark of marks) {
        const lit = filter === 'all' || filter === mark.mode
        if (mark.rotor) mark.rotor.rotation.z += dt * (lit ? 2.2 : .3)
        if (mark.mode === 'broke') mark.object.rotation.y = Math.sin(t * 3 + mark.object.id) * .25 * (lit ? 1 : .2)
        if (mark.mode === 'named') mark.object.rotation.y = lit ? t * .6 : 0
      }
      omar.root.updateMatrixWorld()
      omar.pose(cheer(t))
      // The trophy rides in the right hand.
      omar.where('handR', pos)
      cup.position.copy(group.worldToLocal(pos)).add(new THREE.Vector3(0, .02, 0))
      cup.rotation.y = t * .5
      // Confetti, every four seconds.
      burst += dt
      const age = (burst % 4)
      seeds.forEach((s, i) => {
        const a = Math.max(0, age - s.delay)
        pos.set(7 + s.vx * a, P + 2.6 + s.vy * a - 3.2 * a * a, 3.7 + s.vz * a)
        if (pos.y < P) pos.y = -50
        m.compose(pos, q.setFromEuler(e.set(s.spin + a * 6, s.spin * 2 + a * 4, a * 3)), one)
        bits.setMatrixAt(i, m)
      })
      bits.instanceMatrix.needsUpdate = true
    },
  }
}
