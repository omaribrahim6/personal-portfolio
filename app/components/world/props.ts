import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { C, light, plain, rng, toon } from '../toon/kit'

// Things the stops have in common: signs with words painted on them in the site's own type, benches,
// arches of vines, an old windmill, and the giant robot asleep in the meadow under its moss.

/** The family behind one of the site's font variables, for drawing words onto canvases. */
export function family(variable: string, fallback: string) {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return value ? `${value}, ${fallback}` : fallback
}
export const FONTS = {
  get display() { return family('--font-heliotrope', 'sans-serif') },
  get round() { return family('--font-unbounded', 'sans-serif') },
  get sans() { return family('--font-instrument', 'sans-serif') },
  get serif() { return family('--font-instrument-serif', 'serif') },
  get mono() { return family('--font-martian', 'monospace') },
}

/** Words on a board: a band of colour along the top, then lines of text, centred or ranged left. */
export function board(o: {
  width: number; height: number; band?: string; ground?: string; ink?: string
  lines: { text: string; font: string; size: number; color?: string; upper?: boolean }[]
  align?: 'left' | 'center'; pad?: number
}) {
  const canvas = document.createElement('canvas')
  canvas.width = o.width
  canvas.height = o.height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = o.ground ?? '#fbf6ea'
  ctx.fillRect(0, 0, o.width, o.height)
  const band = o.band ? Math.round(o.height * .16) : 0
  if (o.band) { ctx.fillStyle = o.band; ctx.fillRect(0, 0, o.width, band) }
  const pad = o.pad ?? o.width * .07
  let y = band + pad * .9
  ctx.textBaseline = 'top'
  ctx.textAlign = o.align === 'center' ? 'center' : 'left'
  for (const line of o.lines) {
    ctx.font = `${line.size}px ${line.font}`
    ctx.fillStyle = line.color ?? o.ink ?? '#16241d'
    const text = line.upper ? line.text.toUpperCase() : line.text
    // Shrink a line that would not fit.
    let size = line.size
    while (ctx.measureText(text).width > o.width - pad * 2 && size > 10) { size -= 2; ctx.font = `${size}px ${line.font}` }
    ctx.fillText(text, o.align === 'center' ? o.width / 2 : pad, y)
    y += size * 1.22
  }
  // A frame of ink just inside the edge.
  ctx.strokeStyle = o.ink ?? '#16241d'
  ctx.lineWidth = Math.max(4, o.width * .012)
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, o.width - ctx.lineWidth, o.height - ctx.lineWidth)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return { texture, canvas, ctx }
}

/** A board with a picture on its face, on its own, `w` wide in the world. */
export function plaque(texture: THREE.Texture, w: number, h: number, depth = .06, edge: string = C.wood) {
  const face = new THREE.MeshToonMaterial({ map: texture, gradientMap: (toon(C.ivory) as THREE.MeshToonMaterial).gradientMap })
  const side = toon(edge)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), [side, side, side, side, face, side])
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}

/** A signpost: a post with a cap, and a board on it with words. */
export function signpost(o: { band: string; title: string; sub: string; detail?: string; height?: number; cap?: string }) {
  const group = new THREE.Group()
  const height = o.height ?? 1.5
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, height, 8), toon(C.wood))
  post.position.y = height / 2
  post.castShadow = true
  const cap = new THREE.Mesh(new THREE.ConeGeometry(.11, .14, 8), toon(o.cap ?? o.band))
  cap.position.y = height + .07
  const { texture } = board({
    width: 512, height: 300, band: o.band,
    lines: [
      { text: o.title, font: FONTS.round, size: 58 },
      { text: o.sub, font: FONTS.mono, size: 30, color: '#3b4a42', upper: true },
      ...(o.detail ? [{ text: o.detail, font: FONTS.serif, size: 34, color: '#3b4a42' }] : []),
    ],
  })
  const sign = plaque(texture, 1.15, .67)
  sign.position.set(0, height - .42, .07)
  group.add(post, cap, sign)
  return group
}

export function bench(width = 1) {
  const group = new THREE.Group()
  const seat = new THREE.Mesh(new RoundedBoxGeometry(width, .06, .32, 2, .02), toon(C.wood))
  seat.position.y = .32
  const back = new THREE.Mesh(new RoundedBoxGeometry(width, .22, .05, 2, .02), toon(C.wood))
  back.position.set(0, .52, -.14)
  back.rotation.x = -.15
  group.add(seat, back)
  for (const x of [-width / 2 + .08, width / 2 - .08]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.05, .32, .3), toon('#36443d'))
    leg.position.set(x, .16, 0)
    group.add(leg)
  }
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return group
}

/** An arch over a path, white, with vines and flowers growing over it. */
export function arch(width: number, height: number, seed: number) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-width / 2, 0, 0), new THREE.Vector3(-width / 2, height * .7, 0), new THREE.Vector3(0, height, 0),
    new THREE.Vector3(width / 2, height * .7, 0), new THREE.Vector3(width / 2, 0, 0),
  ])
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .05, 8), toon(C.ivory)))
  const leaves: THREE.BufferGeometry[] = [], blooms: THREE.BufferGeometry[] = []
  for (let i = 0; i < 46; i++) {
    const p = curve.getPoint(.08 + rand() * .84)
    const g = new THREE.IcosahedronGeometry(.07 + rand() * .06, 1)
    g.translate(p.x + (rand() - .5) * .12, p.y + (rand() - .5) * .12, (rand() - .5) * .14)
    leaves.push(g)
    if (i % 4 === 0) {
      const b = new THREE.SphereGeometry(.035, 6, 4)
      b.translate(p.x + (rand() - .5) * .16, p.y + (rand() - .5) * .16, .06 + rand() * .05)
      blooms.push(b)
    }
  }
  group.add(new THREE.Mesh(mergeGeometries(leaves), toon(C.leaf)))
  group.add(plain(new THREE.Mesh(mergeGeometries(blooms), light(C.rose))))
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return group
}

/** An old windmill: a white tower, a cap, and four sails of lattice and cloth. Returns the sails to turn. */
export function windmill(height: number) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(height * .2, height * .3, height, 16), toon(C.ivory))
  body.position.y = height / 2
  const cap = new THREE.Mesh(new THREE.ConeGeometry(height * .26, height * .28, 16), toon(C.coral))
  cap.position.y = height + height * .12
  const door = new THREE.Mesh(new THREE.CircleGeometry(height * .08, 16, 0, Math.PI), toon(C.glassDark))
  door.position.set(0, 0, height * .29)
  const window1 = new THREE.Mesh(new THREE.CircleGeometry(height * .045, 12), toon(C.glassDark))
  window1.position.set(0, height * .6, height * .24)
  group.add(body, cap, door, window1)
  const sails = new THREE.Group()
  sails.position.set(0, height * .92, height * .26)
  const hub = new THREE.Mesh(new THREE.SphereGeometry(height * .05, 12, 8), toon(C.ink))
  sails.add(hub)
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group()
    arm.rotation.z = k * Math.PI / 2
    const spar = new THREE.Mesh(new THREE.BoxGeometry(height * .025, height * .62, height * .02), toon(C.wood))
    spar.position.y = height * .31
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(height * .14, height * .46), toon(C.ivory, { side: THREE.DoubleSide }))
    cloth.position.set(height * .08, height * .36, 0)
    arm.add(spar, cloth)
    sails.add(arm)
  }
  group.add(sails)
  group.traverse(node => { if (node instanceof THREE.Mesh) node.castShadow = true })
  return { group, sails }
}

/**
 * The giant: a robot's head and one hand, asleep in the grass so long that the meadow has grown over them.
 * Moss on the crown, a tree out of the top, flowers in the joints, its one eye still faintly lit.
 */
export function robot(size: number, seed: number) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const metal = toon('#b9b29a'), dark = toon('#7d7866')
  const head = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 20), metal)
  head.scale.set(1, .82, .95)
  head.position.y = size * .35
  head.rotation.z = .35
  const face = new THREE.Mesh(new THREE.CylinderGeometry(size * .55, size * .6, size * .2, 32), dark)
  face.rotation.set(Math.PI / 2, 0, 0)
  face.position.set(size * .15, size * .45, size * .86)
  const eye = new THREE.Mesh(new THREE.CircleGeometry(size * .2, 24), light('#9fe8ff'))
  eye.position.set(size * .15, size * .48, size * .97)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(size * .22, size * .04, 8, 24), toon(C.brass))
  ring.position.copy(eye.position).add(new THREE.Vector3(0, 0, .01))
  const ear = new THREE.Mesh(new THREE.CylinderGeometry(size * .25, size * .25, size * .3, 20), dark)
  ear.rotation.z = Math.PI / 2
  ear.position.set(-size * .95, size * .55, 0)
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(size * .03, size * .04, size * .8, 6), dark)
  antenna.position.set(-size * .4, size * 1.25, -size * .1)
  antenna.rotation.z = .6
  // The meadow over it: a cap of moss on the crown, clumps down its sides, flowers.
  const moss = new THREE.Mesh(new THREE.SphereGeometry(size * 1.02, 32, 12, 0, Math.PI * 2, 0, Math.PI * .32), toon(C.grass2))
  moss.scale.copy(head.scale)
  moss.position.copy(head.position)
  moss.rotation.copy(head.rotation)
  const clumps: THREE.BufferGeometry[] = []
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2, up = .2 + rand() * .7
    const r = size * (.18 + rand() * .2)
    const g = new THREE.IcosahedronGeometry(r, 1)
    g.translate(Math.cos(a) * size * (1 - up * .5), size * (.1 + up * .9), Math.sin(a) * size * (1 - up * .5) * .9)
    clumps.push(g)
  }
  const shrubs = new THREE.Mesh(mergeGeometries(clumps), toon(C.leaf))
  // A hand, palm up, half sunk, a few fingers curled, a little pond in its palm.
  const hand = new THREE.Group()
  const palm = new THREE.Mesh(new RoundedBoxGeometry(size * 1.1, size * .3, size * .9, 3, size * .08), metal)
  hand.add(palm)
  for (let k = 0; k < 4; k++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(size * .09, size * .45, 4, 10), dark)
    finger.position.set(-size * .4 + k * size * .27, size * .25, size * .5)
    finger.rotation.x = -.9 - k * .1
    hand.add(finger)
  }
  const pond = plain(new THREE.Mesh(new THREE.CircleGeometry(size * .32, 20), toon('#7fd3e2')))
  pond.rotation.x = -Math.PI / 2
  pond.position.y = size * .155
  hand.add(pond)
  hand.position.set(size * 2.1, 0, size * 1.1)
  hand.rotation.y = -.5
  group.add(head, face, eye, ring, ear, antenna, moss, shrubs, hand)
  group.traverse(node => { if (node instanceof THREE.Mesh && node !== eye) { node.castShadow = true; node.receiveShadow = true } })
  return { group, eye }
}
