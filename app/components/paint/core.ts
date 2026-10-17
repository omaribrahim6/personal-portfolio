// Small painting toolkit. Everything the terrain is made of is drawn with these, once, onto a 2D canvas:
// smooth forms first, then thousands of small dabs, which is where the stippled, airbrushed grain comes from.

export type Ctx = CanvasRenderingContext2D
export type Fn = (x: number) => number
export type Vec = [number, number]

/** Seeded random, so every visitor gets the same painting. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Smooth 1D noise in 0..1. */
export function noise1(seed: number): Fn {
  const rand = rng(seed)
  const values = Array.from({ length: 64 }, rand)
  return x => {
    const i = Math.floor(x)
    const t = x - i
    const a = values[((i % 64) + 64) % 64]
    const b = values[(((i + 1) % 64) + 64) % 64]
    return a + (b - a) * t * t * (3 - 2 * t)
  }
}

export const bump = (t: number) => Math.exp(-t * t)
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }

export function hex(color: string): [number, number, number] {
  const n = parseInt(color.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}
export function rgba(color: string, alpha: number) {
  const [r, g, b] = hex(color)
  return `rgba(${r},${g},${b},${alpha})`
}
export function blend(a: string, b: string, t: number) {
  const x = hex(a), y = hex(b)
  return `rgb(${Math.round(mix(x[0], y[0], t))},${Math.round(mix(x[1], y[1], t))},${Math.round(mix(x[2], y[2], t))})`
}

function trace(ctx: Ctx, W: number, y: Fn, offset = 0, from = 0, to = W) {
  ctx.moveTo(from, y(from) + offset)
  for (let x = from + 3; x < to; x += 3) ctx.lineTo(x, y(x) + offset)
  ctx.lineTo(to, y(to) + offset)
}

export function below(ctx: Ctx, W: number, H: number, y: Fn) {
  ctx.beginPath()
  trace(ctx, W, y)
  ctx.lineTo(W, H + 2)
  ctx.lineTo(0, H + 2)
  ctx.closePath()
}

/** Many small dots in one fill call. */
export function dots(ctx: Ctx, color: string, points: number[], alpha = 1) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < points.length; i += 3) {
    const r = points[i + 2]
    ctx.moveTo(points[i] + r, points[i + 1])
    ctx.arc(points[i], points[i + 1], r, 0, 6.2832)
  }
  ctx.fill()
  ctx.globalAlpha = 1
}

export type Hill = {
  top: string
  bottom: string
  /** How far down the top colour takes to become the bottom colour. */
  depth: number
  /** Colour of the light catching the crest, and which way a slope has to face to catch it (1 = facing right). */
  rim?: string
  rimSide?: 1 | -1
  rimStrength?: number
  /** Contour rows following the form, like a planted field. */
  rows?: string
  rowCount?: number
  rowAlpha?: number
  /** Stipple: light dabs near the crest, dark ones lower down. */
  light?: string
  dark?: string
  density?: number
  seed?: number
}

/** A landform: everything below the curve, shaded from its crest downward. */
export function hill(ctx: Ctx, W: number, H: number, y: Fn, o: Hill) {
  let crest = H
  for (let x = 0; x <= W; x += 6) crest = Math.min(crest, y(x))
  const fill = ctx.createLinearGradient(0, crest, 0, crest + o.depth)
  fill.addColorStop(0, o.top)
  fill.addColorStop(1, o.bottom)

  ctx.save()
  below(ctx, W, H, y)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.clip()

  if (o.rows) {
    const count = o.rowCount ?? 14
    ctx.strokeStyle = o.rows
    ctx.lineWidth = 1
    for (let k = 1; k <= count; k++) {
      const t = k / count
      ctx.globalAlpha = (o.rowAlpha ?? .2) * (1 - t * .8)
      ctx.beginPath()
      // Rows spread apart as they come toward the viewer, and flatten out.
      const offset = Math.pow(t, 1.7) * o.depth * 1.1
      ctx.moveTo(0, crest + (y(0) - crest) * (1 - t * .45) + offset)
      for (let x = 4; x <= W; x += 4) ctx.lineTo(x, crest + (y(x) - crest) * (1 - t * .45) + offset)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  if (o.light || o.dark) {
    const rand = rng(o.seed ?? 1)
    const count = Math.round(W * o.depth / 95 * (o.density ?? 1))
    const light: number[] = [], dark: number[] = []
    for (let i = 0; i < count; i++) {
      const x = rand() * W
      const d = Math.pow(rand(), 1.5) * o.depth * 1.2
      const size = .45 + rand() * .85
      ;(rand() > d / o.depth * .9 ? light : dark).push(x, y(x) + d + 1, size)
    }
    if (o.light) dots(ctx, o.light, light, .38)
    if (o.dark) dots(ctx, o.dark, dark, .35)
  }

  if (o.rim) {
    const side = o.rimSide ?? 1
    const strength = o.rimStrength ?? 1
    ctx.strokeStyle = o.rim
    ctx.lineCap = 'round'
    for (const [width, alpha, drop] of [[11, .1, 5], [5, .22, 2.5], [1.6, .95, .8]] as const) {
      ctx.lineWidth = width
      for (let x = 0; x < W; x += 4) {
        const y0 = y(x), y1 = y(x + 4)
        const facing = clamp((y1 - y0) / 4 * side * 2.2 + .42)
        if (facing < .04) continue
        ctx.globalAlpha = alpha * facing * strength
        ctx.beginPath()
        ctx.moveTo(x, y0 + drop)
        ctx.lineTo(x + 4, y1 + drop)
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
  }
  ctx.restore()
}

export type Foliage = { dark: string; mid: string; lit: string; dab: string; deep: string }

/** Leaves in full daylight. */
export const LEAF: Foliage = { dark: '#2b5c35', mid: '#4b8a45', lit: '#9ccb5e', dab: '#e2f29c', deep: '#173e27' }
/** Leaves in the shade, or a long way off in the morning haze. */
export const SHADE: Foliage = { dark: '#18402e', mid: '#2c5d3f', lit: '#5f9852', dab: '#a8d27b', deep: '#0d2a1d' }
/** Leaves with the sunrise on them. */
export const DAWN: Foliage = { dark: '#2b4a40', mid: '#47704f', lit: '#e0b56c', dab: '#ffe2aa', deep: '#18332a' }
/** Leaves in the golden hour. */
export const GOLD: Foliage = { dark: '#3a4a2c', mid: '#6b7d3a', lit: '#f2b55a', dab: '#ffe1a0', deep: '#24301e' }
/** A tree in blossom. */
export const BLOSSOM: Foliage = { dark: '#b5577a', mid: '#e38aa3', lit: '#ffc8d1', dab: '#fff1f3', deep: '#86395b' }

type Clump = { x: number; y: number; r: number; lit: number }

/** Rounded foliage: overlapping clumps, each shaded toward the light, then stippled. */
export function foliage(ctx: Ctx, clumps: Clump[], pal: Foliage, light: Vec, rand: () => number, dabs = 1) {
  for (const c of clumps) {
    const gx = c.x + light[0] * c.r * .42, gy = c.y + light[1] * c.r * .42
    const base = ctx.createRadialGradient(gx, gy, c.r * .08, c.x, c.y, c.r * 1.04)
    base.addColorStop(0, pal.mid)
    base.addColorStop(.62, pal.dark)
    base.addColorStop(1, pal.deep)
    ctx.fillStyle = base
    ctx.beginPath()
    ctx.arc(c.x, c.y, c.r, 0, 6.2832)
    ctx.fill()
    if (c.lit > .12) {
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, c.r * .95)
      glow.addColorStop(0, rgba(pal.lit, .9 * c.lit))
      glow.addColorStop(.5, rgba(pal.lit, .32 * c.lit))
      glow.addColorStop(1, rgba(pal.lit, 0))
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, 6.2832)
      ctx.fill()
    }
  }
  const bright: number[] = [], soft: number[] = [], deep: number[] = []
  for (const c of clumps) {
    const count = Math.round(c.r * c.r / 7 * dabs)
    for (let i = 0; i < count; i++) {
      const a = rand() * 6.2832, d = Math.sqrt(rand()) * c.r * .9
      const px = c.x + Math.cos(a) * d, py = c.y + Math.sin(a) * d
      // How much this spot faces the light, within its own clump.
      const facing = ((px - c.x) * light[0] + (py - c.y) * light[1]) / c.r
      const size = .5 + rand() * .9
      const chance = rand()
      if (facing > .05 && chance < c.lit * (.35 + facing)) (chance < .12 ? bright : soft).push(px, py, size)
      else if (chance > .82) deep.push(px, py, size)
    }
  }
  dots(ctx, pal.deep, deep, .5)
  dots(ctx, pal.lit, soft, .55)
  dots(ctx, pal.dab, bright, .8)
}

/** A round tree: a canopy of clumps on a short trunk. */
export function tree(ctx: Ctx, x: number, ground: number, R: number, pal: Foliage, light: Vec, seed: number) {
  const rand = rng(seed)
  const cy = ground - R * 1.02
  ctx.fillStyle = pal.deep
  ctx.beginPath()
  ctx.moveTo(x - R * .09, ground + 2)
  ctx.quadraticCurveTo(x - R * .05, cy + R * .4, x - R * .16, cy + R * .1)
  ctx.lineTo(x + R * .16, cy + R * .1)
  ctx.quadraticCurveTo(x + R * .05, cy + R * .4, x + R * .1, ground + 2)
  ctx.fill()

  const clumps: Clump[] = []
  const count = 15 + Math.round(R / 5)
  for (let i = 0; i < count; i++) {
    const a = rand() * 6.2832, d = Math.sqrt(rand()) * R * .7
    const px = x + Math.cos(a) * d * 1.2
    const py = Math.min(cy + Math.sin(a) * d * .78, cy + R * .3)
    const facing = ((px - x) * light[0] + (py - cy) * light[1]) / R
    clumps.push({ x: px, y: py, r: R * (.3 + rand() * .2), lit: clamp(.35 + facing * 1.5) })
  }
  clumps.sort((a, b) => a.lit - b.lit)
  foliage(ctx, clumps, pal, light, rand)
}

/** A palm. Small and far off it is one dark colour; give it a lit colour as well and the fronds catch the sun. */
export function palm(ctx: Ctx, x: number, ground: number, height: number, lean: number, seed: number, color = '#1d3b2a', lit?: string) {
  const rand = rng(seed)
  const tx = x + lean * height, ty = ground - height
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(1.4, height * .035)
  ctx.beginPath()
  ctx.moveTo(x, ground + 1)
  ctx.quadraticCurveTo(x + lean * height * .2, ground - height * .55, tx, ty)
  ctx.stroke()
  const fronds = 11
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI * (.05 + .9 * i / (fronds - 1)) + (rand() - .5) * .18
    const len = height * (.34 + rand() * .14)
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * .7 + len * .42
    const cx = tx + Math.cos(a) * len * .55, cy = ty + Math.sin(a) * len * .85 - len * .12
    ctx.lineWidth = Math.max(1, height * .016)
    ctx.strokeStyle = lit && Math.cos(a) > .1 ? lit : color
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.quadraticCurveTo(cx, cy, ex, ey)
    ctx.stroke()
    // Leaflets hanging off the rib.
    ctx.lineWidth = Math.max(.7, height * .009)
    ctx.beginPath()
    for (let k = 1; k <= 12; k++) {
      const t = k / 13, u = 1 - t
      const px = u * u * tx + 2 * u * t * cx + t * t * ex
      const py = u * u * ty + 2 * u * t * cy + t * t * ey
      const drop = len * .2 * (1 - Math.abs(t - .45))
      ctx.moveTo(px, py)
      ctx.lineTo(px - Math.cos(a) * drop * .25, py + drop)
    }
    ctx.stroke()
  }
  ctx.strokeStyle = color
}

/** Rows of scalloped wave lines, tightening toward the horizon. */
export function waves(ctx: Ctx, x0: number, x1: number, horizon: number, bottom: number, color: string, seed: number, rows = 16) {
  const rand = rng(seed)
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (let k = 0; k < rows; k++) {
    const t = Math.pow((k + 1) / rows, 1.9)
    const y = mix(horizon + 3, bottom, t)
    const span = mix(7, 46, t)
    ctx.lineWidth = mix(.6, 2.6, t)
    ctx.globalAlpha = mix(.28, .85, t)
    ctx.beginPath()
    let x = x0 - rand() * span
    while (x < x1) {
      const w = span * (.6 + rand() * .9)
      if (rand() > .22) {
        ctx.moveTo(x, y)
        ctx.quadraticCurveTo(x + w * .5, y - span * .13, x + w, y + (rand() - .5) * 1.5)
      }
      x += w + span * rand() * .5
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** Fine grain over everything already painted, so flat areas still read as pigment. */
export function grain(ctx: Ctx, W: number, H: number, seed: number, amount = 1) {
  const rand = rng(seed)
  const count = Math.round(W * H / 26 * amount)
  const light: number[] = [], dark: number[] = []
  for (let i = 0; i < count; i++) (rand() > .5 ? light : dark).push(rand() * W, rand() * H, .35 + rand() * .45)
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  dots(ctx, '#ffffff', light, .07)
  dots(ctx, '#000020', dark, .1)
  ctx.restore()
}

/* ------------------------------------------------------------- solar punk */

const INK = '#16261f'

/** Outline a path already built on the context, in ink, the way the architecture is drawn in a comic. */
function inked(ctx: Ctx, width: number, alpha = .85, color = INK) {
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** A scatter of small flowers on stems, in whatever colours the meadow has. Nearer ones are bigger. */
export function flowers(ctx: Ctx, count: number, place: (rand: () => number) => [number, number, number] | null, seed: number, colours: string[], stem = 'rgba(30,64,38,.8)') {
  const rand = rng(seed)
  const all: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    const spot = place(rand)
    if (spot) all.push(spot)
  }
  all.sort((a, b) => a[1] - b[1])
  for (const [x, y, s] of all) {
    const tilt = (rand() - .5) * .8
    ctx.strokeStyle = stem
    ctx.lineWidth = Math.max(.5, s * .14)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + tilt * s, y + s * 1.2, x + tilt * s * .4, y + s * 2.6)
    ctx.stroke()
    const colour = colours[Math.floor(rand() * colours.length)]
    ctx.fillStyle = colour
    ctx.beginPath()
    if (s > 2.4) {
      // Five petals and an eye.
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * 6.2832 + tilt
        ctx.moveTo(x + Math.cos(a) * s * .5 + s * .3, y + Math.sin(a) * s * .38)
        ctx.ellipse(x + Math.cos(a) * s * .5, y + Math.sin(a) * s * .38, s * .3, s * .24, a, 0, 6.2832)
      }
    } else ctx.arc(x, y, s * .55, 0, 6.2832)
    ctx.fill()
    if (s > 1.6) {
      ctx.fillStyle = 'rgba(255,214,90,.95)'
      ctx.beginPath()
      ctx.arc(x, y, s * .16, 0, 6.2832)
      ctx.fill()
    }
  }
}

/** A sunflower: a head of petals round a dark seed disc, on a stem with two leaves. Small ones are only a dab. */
export function sunflower(ctx: Ctx, x: number, y: number, s: number, rand: () => number, face = 0) {
  if (s < 1.6) {
    ctx.fillStyle = rand() > .5 ? '#f5c02c' : '#e9a51c'
    ctx.beginPath()
    ctx.arc(x, y, s, 0, 6.2832)
    ctx.fill()
    if (s > .9) {
      ctx.fillStyle = '#5b3416'
      ctx.beginPath()
      ctx.arc(x + face * s * .2, y, s * .42, 0, 6.2832)
      ctx.fill()
    }
    return
  }
  ctx.strokeStyle = '#3f6b2c'
  ctx.lineWidth = Math.max(.8, s * .16)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(x - face * s * .3, y + s * 2, x - face * s * .1, y + s * 4.2)
  ctx.stroke()
  ctx.fillStyle = '#4f8a35'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(x + side * s * .75, y + s * 2.3 + side * s * .3, s * .7, s * .3, side * .5, 0, 6.2832)
    ctx.fill()
  }
  // The head turns toward the sun: seen a little side-on, so it is an ellipse.
  const sx = 1 - Math.abs(face) * .35
  const petals = 14
  for (let ring = 0; ring < 2; ring++) {
    ctx.fillStyle = ring ? '#f7c838' : '#e39a1a'
    ctx.beginPath()
    for (let k = 0; k < petals; k++) {
      const a = (k + ring * .5) / petals * 6.2832
      const px = x + Math.cos(a) * s * .78 * sx, py = y + Math.sin(a) * s * .74
      ctx.moveTo(px + s * .3, py)
      ctx.ellipse(px, py, s * .36 * (ring ? .9 : 1), s * .15, a, 0, 6.2832)
    }
    ctx.fill()
  }
  const disc = ctx.createRadialGradient(x + face * s * .1 - s * .1, y - s * .12, s * .05, x, y, s * .5)
  disc.addColorStop(0, '#7a4a20')
  disc.addColorStop(1, '#3a200e')
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.ellipse(x + face * s * .12, y, s * .46 * sx, s * .44, 0, 0, 6.2832)
  ctx.fill()
}

/** A field of sunflowers, sorted so the near ones stand in front. `place` returns [x, y, size]. */
export function sunflowers(ctx: Ctx, count: number, place: (rand: () => number) => [number, number, number] | null, seed: number, face = .3) {
  const rand = rng(seed)
  const all: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    const spot = place(rand)
    if (spot) all.push(spot)
  }
  all.sort((a, b) => a[1] - b[1])
  for (const [x, y, s] of all) sunflower(ctx, x, y, s, rand, face + (rand() - .5) * .3)
}

/**
 * A solar panel, as a four-cornered sheet of glass: [top left, top right, bottom right, bottom left].
 * Cells in a grid, a frame round them, the sky caught in the glass and a band of glare across it.
 */
export function panel(ctx: Ctx, quad: [Vec, Vec, Vec, Vec], o: { cols?: number; rows?: number; sky?: string; deep?: string; frame?: string; glare?: number } = {}) {
  const [a, b, c, d] = quad
  const cols = o.cols ?? 6, rows = o.rows ?? 4
  const at = (u: number, v: number): Vec => {
    const top: Vec = [mix(a[0], b[0], u), mix(a[1], b[1], u)], low: Vec = [mix(d[0], c[0], u), mix(d[1], c[1], u)]
    return [mix(top[0], low[0], v), mix(top[1], low[1], v)]
  }
  const shape = () => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath() }
  const glass = ctx.createLinearGradient(a[0], a[1], d[0], d[1])
  glass.addColorStop(0, o.sky ?? '#6f9fe8')
  glass.addColorStop(.45, '#2f58b8')
  glass.addColorStop(1, o.deep ?? '#182f78')
  shape()
  ctx.fillStyle = glass
  ctx.fill()
  ctx.save()
  ctx.clip()
  ctx.strokeStyle = 'rgba(190,214,255,.45)'
  ctx.lineWidth = .7
  ctx.beginPath()
  for (let i = 1; i < cols; i++) { ctx.moveTo(...at(i / cols, 0)); ctx.lineTo(...at(i / cols, 1)) }
  for (let j = 1; j < rows; j++) { ctx.moveTo(...at(0, j / rows)); ctx.lineTo(...at(1, j / rows)) }
  ctx.stroke()
  const glare = o.glare ?? .35
  if (glare > 0) {
    ctx.fillStyle = `rgba(255,255,255,${glare})`
    ctx.beginPath()
    ctx.moveTo(...at(.18, 0)); ctx.lineTo(...at(.42, 0)); ctx.lineTo(...at(.2, 1)); ctx.lineTo(...at(-.04, 1))
    ctx.fill()
  }
  ctx.restore()
  shape()
  ctx.strokeStyle = o.frame ?? '#e7ecf2'
  ctx.lineWidth = Math.max(.8, len2(a, b) / 70)
  ctx.stroke()
}

const len2 = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** A panel on two legs, tipped back toward the sky. */
export function standingPanel(ctx: Ctx, x: number, ground: number, w: number, o: { lean?: number; legs?: number; sky?: string; glare?: number } = {}) {
  const h = w * .42, legs = o.legs ?? w * .16, lean = o.lean ?? w * .1
  ctx.strokeStyle = '#3d4a46'
  ctx.lineWidth = Math.max(.8, w / 60)
  ctx.beginPath()
  ctx.moveTo(x - w * .32, ground); ctx.lineTo(x - w * .32 + lean * .3, ground - legs - h * .4)
  ctx.moveTo(x + w * .32, ground); ctx.lineTo(x + w * .32 + lean * .3, ground - legs - h * .4)
  ctx.stroke()
  panel(ctx, [[x - w / 2 + lean, ground - legs - h], [x + w / 2 + lean, ground - legs - h], [x + w / 2, ground - legs], [x - w / 2, ground - legs]], { cols: 6, rows: 3, sky: o.sky, glare: o.glare })
}

/** A wind turbine: a tapered white tower, the nacelle and three long blades at `angle`. */
export function turbine(ctx: Ctx, x: number, ground: number, H: number, angle: number, o: { lit?: string; shade?: string; light?: 1 | -1; ink?: number } = {}) {
  const lit = o.lit ?? '#fbf8ef', shade = o.shade ?? '#b8c1d6', side = o.light ?? -1
  const top = ground - H
  const base = H * .028, neck = H * .012
  const tower = ctx.createLinearGradient(x - base, 0, x + base, 0)
  tower.addColorStop(side < 0 ? 0 : 1, lit)
  tower.addColorStop(side < 0 ? 1 : 0, shade)
  ctx.fillStyle = tower
  ctx.beginPath()
  ctx.moveTo(x - base, ground + 1); ctx.lineTo(x - neck, top); ctx.lineTo(x + neck, top); ctx.lineTo(x + base, ground + 1)
  ctx.closePath()
  ctx.fill()
  if (o.ink) inked(ctx, o.ink, .5)
  const L = H * .5
  for (let k = 0; k < 3; k++) {
    const a = angle + k * 2.0944
    const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx
    const root = H * .022
    ctx.fillStyle = k === 0 ? lit : blend(lit, shade, .35 * k)
    ctx.beginPath()
    ctx.moveTo(x + nx * root, top + ny * root)
    ctx.quadraticCurveTo(x + dx * L * .3 + nx * root * 1.6, top + dy * L * .3 + ny * root * 1.6, x + dx * L, top + dy * L)
    ctx.quadraticCurveTo(x + dx * L * .5 - nx * root * .4, top + dy * L * .5 - ny * root * .4, x - nx * root * .6, top - ny * root * .6)
    ctx.closePath()
    ctx.fill()
    if (o.ink) inked(ctx, o.ink * .7, .4)
  }
  ctx.fillStyle = lit
  ctx.beginPath()
  ctx.ellipse(x + side * -H * .012, top, H * .034, H * .018, 0, 0, 6.2832)
  ctx.fill()
  if (o.ink) inked(ctx, o.ink * .7, .5)
  ctx.fillStyle = shade
  ctx.beginPath()
  ctx.arc(x, top, H * .014, 0, 6.2832)
  ctx.fill()
}

/**
 * An airborne wind turbine: a puffy white ring held up on a tether, the rotor turning inside it, fins at the
 * back. `s` is its height; it faces left. The tether runs down to `anchor`.
 */
export function aerostat(ctx: Ctx, x: number, y: number, s: number, o: { anchor?: Vec; lit?: string; shade?: string; deep?: string; tether?: string; angle?: number } = {}) {
  const lit = o.lit ?? '#fffaf0', shade = o.shade ?? '#d6cfc2', deep = o.deep ?? '#9a948e'
  if (o.anchor) {
    ctx.strokeStyle = o.tether ?? 'rgba(80,100,90,.55)'
    ctx.lineWidth = Math.max(.6, s * .012)
    ctx.beginPath()
    ctx.moveTo(x + s * .1, y + s * .5)
    ctx.quadraticCurveTo(mix(x, o.anchor[0], .55) + s * .4, mix(y, o.anchor[1], .5), o.anchor[0], o.anchor[1])
    ctx.stroke()
  }
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(o.angle ?? -.08)
  const w = s * 1.45, r = s * .5
  // Fins at the back, top and bottom.
  ctx.fillStyle = shade
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(w * .62, side * r * .55)
    ctx.quadraticCurveTo(w * .78, side * r * 1.05, w * .98, side * r * 1.18)
    ctx.quadraticCurveTo(w * .9, side * r * .7, w * .86, side * r * .3)
    ctx.closePath()
    ctx.fill()
    inked(ctx, Math.max(.5, s * .012), .4)
  }
  // The body: puffed lobes running round the ring, lit from the top left.
  const lobes = 6
  for (let k = lobes - 1; k >= 0; k--) {
    const u = k / (lobes - 1)
    const cx = mix(-w * .18, w * .66, u)
    const ry = r * (1 - .18 * Math.pow(u, 2) + .05 * Math.sin(u * 3))
    const g = ctx.createLinearGradient(cx, -ry, cx, ry)
    g.addColorStop(0, lit)
    g.addColorStop(.55, blend(lit, shade, .45))
    g.addColorStop(1, deep)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(cx, 0, w * .13, ry, 0, 0, 6.2832)
    ctx.fill()
    inked(ctx, Math.max(.5, s * .011), .28)
  }
  // The opening at the front: a darker ring, the rotor, the hub.
  ctx.fillStyle = blend(shade, deep, .5)
  ctx.beginPath()
  ctx.ellipse(-w * .22, 0, r * .42, r * .96, 0, 0, 6.2832)
  ctx.fill()
  ctx.fillStyle = 'rgba(40,52,48,.55)'
  ctx.beginPath()
  ctx.ellipse(-w * .22, 0, r * .3, r * .74, 0, 0, 6.2832)
  ctx.fill()
  ctx.strokeStyle = lit
  ctx.lineWidth = Math.max(.7, s * .03)
  ctx.beginPath()
  ctx.moveTo(-w * .22 - r * .16, -r * .66); ctx.lineTo(-w * .22 + r * .16, r * .66)
  ctx.moveTo(-w * .22 + r * .2, -r * .5); ctx.lineTo(-w * .22 - r * .2, r * .5)
  ctx.stroke()
  ctx.fillStyle = lit
  ctx.beginPath()
  ctx.arc(-w * .22, 0, r * .1, 0, 6.2832)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-w * .22, 0, r * .42, r * .96, 0, 0, 6.2832)
  inked(ctx, Math.max(.6, s * .016), .55)
  ctx.restore()
}

export type PodOptions = {
  w: number
  h: number
  /** Which side the sun is on: -1 left, 1 right. */
  light?: 1 | -1
  lit?: string
  shade?: string
  /** A band of colour round its middle, like the painted stripe on a capsule. */
  band?: string
  /** Round windows: [across, up, radius], across from -.5 to .5, up and radius as fractions of the height. */
  windows?: [number, number, number][]
  /** Light inside: the windows glow warm. */
  glow?: boolean
  door?: number
  dome?: number
  panels?: boolean
  antenna?: boolean
  vines?: number
  /** Squareness of the shell: 2 is an ellipse, higher is boxier. */
  squash?: number
  ink?: number
}

/** The silhouette of a pod: a squared-off dome sitting on the ground. */
function shell(ctx: Ctx, x: number, ground: number, w: number, h: number, n: number) {
  ctx.beginPath()
  const steps = 48
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI * i / steps
    const c = Math.cos(t), s = Math.sin(t)
    const px = x + w / 2 * Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * (1 + .04 * Math.sin(t * 2))
    const py = ground - h * Math.pow(s, 2 / n)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.quadraticCurveTo(x, ground + h * .05, x + w / 2, ground)
  ctx.closePath()
}

/** A round window with a brass rim: dark glass with the sky in it, or warm with the light on inside. */
export function porthole(ctx: Ctx, cx: number, cy: number, r: number, glow = false) {
  const rim = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  rim.addColorStop(0, '#f0cd84')
  rim.addColorStop(.5, '#c39345')
  rim.addColorStop(1, '#7d5a26')
  ctx.fillStyle = rim
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.2, 0, 6.2832)
  ctx.fill()
  const glass = ctx.createRadialGradient(cx - r * .3, cy - r * .35, r * .1, cx, cy, r)
  if (glow) { glass.addColorStop(0, '#fff3c4'); glass.addColorStop(.6, '#ffc561'); glass.addColorStop(1, '#e98a32') }
  else { glass.addColorStop(0, '#9fe0e0'); glass.addColorStop(.5, '#3f8fa8'); glass.addColorStop(1, '#1b3f5a') }
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, 6.2832)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.65)'
  ctx.lineWidth = Math.max(.6, r * .14)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, r * .68, Math.PI * 1.08, Math.PI * 1.42)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.2, 0, 6.2832)
  inked(ctx, Math.max(.6, r * .1), .7)
  if (r > 7) {
    ctx.fillStyle = '#6e4e20'
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * 6.2832 + .2
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 1.1, r * .045 + .3, 0, 6.2832)
      ctx.fill()
    }
  }
}

/** Hanging vines with leaves, from `from` downward, swaying a little. */
export function vines(ctx: Ctx, starts: Vec[], length: number, seed: number, pal: Foliage = LEAF) {
  const rand = rng(seed)
  for (const [x0, y0] of starts) {
    const L = length * (.5 + rand() * .7)
    const sway = (rand() - .5) * L * .3
    ctx.strokeStyle = pal.dark
    ctx.lineWidth = Math.max(.6, length / 90)
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.quadraticCurveTo(x0 + sway, y0 + L * .5, x0 + sway * .4, y0 + L)
    ctx.stroke()
    const leaves = Math.max(3, Math.round(L / 5))
    for (let k = 0; k < leaves; k++) {
      const t = k / leaves, u = 1 - t
      const px = u * u * x0 + 2 * u * t * (x0 + sway) + t * t * (x0 + sway * .4)
      const py = u * u * y0 + 2 * u * t * (y0 + L * .5) + t * t * (y0 + L)
      const side = k % 2 ? 1 : -1
      ctx.fillStyle = rand() > .55 ? pal.lit : pal.mid
      ctx.beginPath()
      ctx.ellipse(px + side * length * .025, py, length * .03 + .6, length * .016 + .4, side * .7, 0, 6.2832)
      ctx.fill()
    }
  }
}

/** A glass dome in a frame of struts, with green inside it. */
export function dome(ctx: Ctx, x: number, ground: number, r: number, seed: number, o: { frame?: string; glass?: string; plants?: Foliage; light?: Vec } = {}) {
  const rand = rng(seed)
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(x, ground, r, r * .92, 0, Math.PI, 0)
  ctx.closePath()
  ctx.clip()
  // What grows inside, seen through the glass.
  const inside = ctx.createLinearGradient(0, ground - r, 0, ground)
  inside.addColorStop(0, '#bfe9e2')
  inside.addColorStop(1, '#5aa39a')
  ctx.fillStyle = inside
  ctx.fillRect(x - r, ground - r, r * 2, r)
  const clumps = Array.from({ length: 16 }, () => {
    const a = rand() * Math.PI, d = Math.sqrt(rand()) * r * .8
    return { x: x + Math.cos(a) * d, y: ground - Math.sin(a) * d * .7 + r * .05, r: r * (.16 + rand() * .14), lit: .4 + rand() * .5 }
  }).sort((p, q) => p.y - q.y)
  foliage(ctx, clumps, o.plants ?? LEAF, o.light ?? [-.6, -.6], rand, .6)
  // The glass: pale, catching the sky toward the top.
  const glass = ctx.createLinearGradient(x - r, ground - r, x + r * .4, ground)
  glass.addColorStop(0, 'rgba(235,255,250,.55)')
  glass.addColorStop(.5, 'rgba(160,220,215,.18)')
  glass.addColorStop(1, 'rgba(60,120,130,.25)')
  ctx.fillStyle = o.glass ?? glass
  ctx.fillRect(x - r, ground - r, r * 2, r)
  // Struts: rings of latitude, and meridians bowing out toward the sides.
  ctx.strokeStyle = o.frame ?? 'rgba(250,246,232,.85)'
  ctx.lineWidth = Math.max(.6, r / 55)
  for (let k = 1; k <= 4; k++) {
    const h = r * .92 * Math.sin(k / 5 * Math.PI / 2)
    const rx = r * Math.cos(Math.asin(h / (r * .92)))
    ctx.beginPath()
    ctx.ellipse(x, ground - h, rx, rx * .16, 0, 0, Math.PI)
    ctx.stroke()
  }
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath()
    ctx.ellipse(x, ground, Math.abs(k) / 3.6 * r + .01, r * .92, 0, Math.PI, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
  ctx.beginPath()
  ctx.ellipse(x, ground, r, r * .92, 0, Math.PI, 0)
  inked(ctx, Math.max(.7, r / 40), .7)
  ctx.strokeStyle = 'rgba(255,255,255,.7)'
  ctx.lineWidth = Math.max(.8, r / 22)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.ellipse(x, ground, r * .8, r * .74, 0, Math.PI * 1.18, Math.PI * 1.38)
  ctx.stroke()
}

/**
 * A pod: the round white building of the future, as the seventies drew it. A squared-off dome with round
 * windows in brass rims, a door, maybe a glass cupola, panels on the roof, an antenna and vines.
 */
export function pod(ctx: Ctx, x: number, ground: number, o: PodOptions, seed: number) {
  const { w, h } = o
  const n = o.squash ?? 2.6
  const light = o.light ?? -1
  const lit = o.lit ?? '#fbf5e6', shade = o.shade ?? '#b9c0d6'
  const rand = rng(seed)
  const ink = o.ink ?? Math.max(.8, h / 90)

  // Contact shadow.
  const foot = ctx.createRadialGradient(x - light * w * .1, ground, w * .1, x - light * w * .1, ground, w * .7)
  foot.addColorStop(0, 'rgba(20,40,30,.35)')
  foot.addColorStop(1, 'rgba(20,40,30,0)')
  ctx.fillStyle = foot
  ctx.beginPath()
  ctx.ellipse(x - light * w * .12, ground + 1, w * .7, h * .09, 0, 0, 6.2832)
  ctx.fill()

  shell(ctx, x, ground, w, h, n)
  const body = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0)
  body.addColorStop(light < 0 ? 0 : 1, lit)
  body.addColorStop(.5, blend(lit, shade, .25))
  body.addColorStop(light < 0 ? 1 : 0, shade)
  ctx.fillStyle = body
  ctx.fill()
  ctx.save()
  ctx.clip()
  // Light from the sky on the crown, and a darker skirt where it meets the ground.
  const crown = ctx.createRadialGradient(x + light * w * .18, ground - h * .95, h * .05, x + light * w * .18, ground - h * .95, h * .9)
  crown.addColorStop(0, 'rgba(255,255,250,.75)')
  crown.addColorStop(1, 'rgba(255,255,250,0)')
  ctx.fillStyle = crown
  ctx.fillRect(x - w, ground - h * 1.1, w * 2, h * 1.2)
  const skirt = ctx.createLinearGradient(0, ground - h * .3, 0, ground)
  skirt.addColorStop(0, 'rgba(30,50,70,0)')
  skirt.addColorStop(1, 'rgba(30,50,70,.22)')
  ctx.fillStyle = skirt
  ctx.fillRect(x - w, ground - h * .3, w * 2, h * .32)
  if (o.band) {
    ctx.fillStyle = o.band
    ctx.fillRect(x - w, ground - h * .5, w * 2, h * .12)
    ctx.fillStyle = 'rgba(0,0,0,.12)'
    ctx.fillRect(x - w, ground - h * .385, w * 2, h * .012)
  }
  // Seams in the shell, following its curve.
  ctx.strokeStyle = 'rgba(30,45,60,.22)'
  ctx.lineWidth = Math.max(.5, ink * .6)
  for (const k of [.28, .62]) {
    ctx.beginPath()
    ctx.ellipse(x, ground - h * k, w * .55, h * .08, 0, 0, Math.PI)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(x + light * w * .12, ground - h)
  ctx.quadraticCurveTo(x + light * w * .3, ground - h * .5, x + light * w * .2, ground)
  ctx.stroke()
  ctx.restore()
  shell(ctx, x, ground, w, h, n)
  inked(ctx, ink, .8)

  if (o.door !== undefined) {
    const dx = x + o.door * w, dw = w * .11, dh = h * .36
    ctx.fillStyle = o.glow ? '#f2a54a' : '#2c3d3a'
    ctx.beginPath()
    ctx.moveTo(dx - dw / 2, ground)
    ctx.lineTo(dx - dw / 2, ground - dh + dw / 2)
    ctx.arc(dx, ground - dh + dw / 2, dw / 2, Math.PI, 0)
    ctx.lineTo(dx + dw / 2, ground)
    ctx.closePath()
    ctx.fill()
    inked(ctx, ink, .7)
  }
  for (const [u, v, r] of o.windows ?? []) porthole(ctx, x + u * w, ground - v * h, r * h, o.glow)

  if (o.dome) dome(ctx, x + light * w * .08, ground - h * .96, w * o.dome, seed + 3)
  if (o.panels) {
    // Two panels on the shoulder away from the cupola, tilted to the sun.
    for (const k of [0, 1]) {
      const px = x - light * w * (.18 + k * .17), py = ground - h * (.93 - k * .1)
      const pw = w * .16
      panel(ctx, [[px - pw / 2, py - pw * .32], [px + pw / 2, py - pw * .42], [px + pw / 2 + pw * .08, py], [px - pw / 2 + pw * .08, py + pw * .1]], { cols: 4, rows: 2, glare: .28 })
    }
  }
  if (o.antenna) {
    const ax = x + light * w * -.3, ay = ground - h * .86
    ctx.strokeStyle = INK
    ctx.lineWidth = Math.max(.6, ink * .8)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(ax - light * w * .03, ay - h * .3)
    ctx.stroke()
    ctx.fillStyle = '#ef7f6e'
    ctx.beginPath()
    ctx.arc(ax - light * w * .03, ay - h * .3, Math.max(1.2, h * .025), 0, 6.2832)
    ctx.fill()
  }
  if (o.vines) {
    const starts: Vec[] = []
    for (let i = 0; i < o.vines; i++) {
      const t = (i / Math.max(1, o.vines - 1) - .5) * 1.7 * (rand() * .2 + .9)
      const c = Math.cos(Math.PI / 2 - t * .9), s = Math.sin(Math.PI / 2 - t * .9)
      starts.push([x + w / 2 * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), ground - h * Math.pow(Math.abs(s), 2 / n) + 2])
    }
    vines(ctx, starts, h * .5, seed + 7)
  }
}

/** A street lamp on a curved post. Lit, it throws a pool of warm light. */
export function lamp(ctx: Ctx, x: number, ground: number, h: number, lit = true) {
  if (lit) {
    const halo = ctx.createRadialGradient(x + h * .18, ground - h, 0, x + h * .18, ground - h, h * .9)
    halo.addColorStop(0, 'rgba(255,214,140,.55)')
    halo.addColorStop(1, 'rgba(255,214,140,0)')
    ctx.fillStyle = halo
    ctx.fillRect(x - h, ground - h * 2, h * 2.4, h * 2)
    const pool = ctx.createRadialGradient(x + h * .18, ground, 0, x + h * .18, ground, h * .7)
    pool.addColorStop(0, 'rgba(255,214,140,.4)')
    pool.addColorStop(1, 'rgba(255,214,140,0)')
    ctx.fillStyle = pool
    ctx.beginPath()
    ctx.ellipse(x + h * .18, ground, h * .7, h * .14, 0, 0, 6.2832)
    ctx.fill()
  }
  ctx.strokeStyle = '#2a3a33'
  ctx.lineWidth = Math.max(.8, h * .035)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, ground)
  ctx.lineTo(x, ground - h * .82)
  ctx.quadraticCurveTo(x, ground - h * 1.06, x + h * .18, ground - h * 1.04)
  ctx.stroke()
  ctx.fillStyle = lit ? '#fff1c4' : '#e8e2d0'
  ctx.beginPath()
  ctx.arc(x + h * .18, ground - h * .96, h * .075, 0, 6.2832)
  ctx.fill()
}

/** A beach parasol in two colours: a low cone of panels with a scalloped hem. */
export function parasol(ctx: Ctx, x: number, ground: number, s: number, colours: [string, string], tilt = 0) {
  const apex: Vec = [x + tilt * s, ground - s]
  ctx.strokeStyle = '#3b3a34'
  ctx.lineWidth = Math.max(.7, s * .035)
  ctx.beginPath()
  ctx.moveTo(x, ground)
  ctx.lineTo(...apex)
  ctx.stroke()
  const r = s * .6, segs = 6
  const hem = (u: number): Vec => [apex[0] - r + 2 * r * u, apex[1] + s * .26 - Math.sin(u * Math.PI) * s * .05]
  for (let k = 0; k < segs; k++) {
    const a = hem(k / segs), b = hem((k + 1) / segs)
    ctx.fillStyle = colours[k % 2]
    ctx.beginPath()
    ctx.moveTo(apex[0], apex[1] - s * .04)
    ctx.lineTo(...a)
    ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + s * .07, ...b)
    ctx.closePath()
    ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(apex[0], apex[1] - s * .04)
  ctx.lineTo(...hem(0))
  for (let k = 0; k < segs; k++) {
    const a = hem(k / segs), b = hem((k + 1) / segs)
    ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + s * .07, ...b)
  }
  ctx.closePath()
  inked(ctx, Math.max(.6, s * .025), .6)
}

/** Birds far off: two strokes each. */
export function birds(ctx: Ctx, flock: [number, number, number][], color = 'rgba(30,40,50,.7)') {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (const [x, y, s] of flock) {
    ctx.lineWidth = Math.max(.6, s * .14)
    ctx.beginPath()
    ctx.moveTo(x - s, y - s * .25)
    ctx.quadraticCurveTo(x - s * .45, y - s * .55, x, y)
    ctx.quadraticCurveTo(x + s * .45, y - s * .55, x + s, y - s * .25)
    ctx.stroke()
  }
}

/** A cypress: a tall flame of dark green, lit down one side. */
export function cypress(ctx: Ctx, x: number, ground: number, h: number, pal: Foliage, light: Vec, seed: number) {
  const rand = rng(seed)
  const w = h * .15
  // The flame itself, so no sky shows between the clumps.
  ctx.fillStyle = pal.dark
  ctx.beginPath()
  ctx.moveTo(x - w * .5, ground - h * .04)
  ctx.bezierCurveTo(x - w * .62, ground - h * .45, x - w * .2, ground - h * .85, x, ground - h)
  ctx.bezierCurveTo(x + w * .2, ground - h * .85, x + w * .62, ground - h * .45, x + w * .5, ground - h * .04)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = pal.deep
  ctx.fillRect(x - w * .06, ground - h * .06, w * .12, h * .06 + 1)
  const clumps = []
  for (let i = 0; i < 34; i++) {
    const t = rand()
    const y = ground - h * (.06 + t * .88)
    const half = w * .5 * Math.sin(Math.PI * Math.pow(1 - t, .65) * .5 + .25)
    const px = x + (rand() - .5) * half * 1.5
    clumps.push({ x: px, y, r: w * (.2 + rand() * .14) * (1 - t * .55), lit: clamp(.3 + (px - x) / w * light[0] * 1.6) })
  }
  clumps.sort((a, b) => a.lit - b.lit)
  foliage(ctx, clumps, pal, light, rand, .7)
}

/**
 * Terraces cut into a hillside: lips of pale stone following its contour, a shadow under each, and rows of
 * planting between them. `steps` are the drops below the crest, in pixels, near the top first. They fade in
 * and out at `from` and `to`, so the hill does not end in a seam.
 */
export function terraces(ctx: Ctx, W: number, crest: Fn, steps: number[], o: { wall: string; shadow: string; rows: string; from?: number; to?: number; seed?: number }) {
  const from = o.from ?? 0, to = o.to ?? W
  const rand = rng(o.seed ?? 3)
  const fade = (colour: string, alpha: number) => {
    const g = ctx.createLinearGradient(from, 0, to, 0)
    g.addColorStop(0, rgba(colour, 0))
    g.addColorStop(.14, rgba(colour, alpha))
    g.addColorStop(.88, rgba(colour, alpha))
    g.addColorStop(1, rgba(colour, 0))
    return g
  }
  const line = (drop: number) => {
    ctx.beginPath()
    for (let x = from; x <= to; x += 4) {
      // The steps tighten toward the crest and spread out down the slope.
      const y = crest(x) + drop
      if (x === from) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }
  ctx.lineCap = 'round'
  steps.forEach((drop, k) => {
    const next = steps[k + 1] ?? drop + (drop - (steps[k - 1] ?? 0))
    // Every other band a shade lighter, as the light falls differently on each.
    if (k % 2 === 0) {
      ctx.beginPath()
      for (let x = from; x <= to; x += 4) ctx.lineTo(x, crest(x) + drop)
      for (let x = to; x >= from; x -= 4) ctx.lineTo(x, crest(x) + next)
      ctx.closePath()
      ctx.fillStyle = fade('#fff6d0', .07)
      ctx.fill()
    }
    ctx.strokeStyle = fade(o.rows, .5)
    ctx.lineWidth = 1.1
    for (let r = 1; r <= 2; r++) {
      ctx.setLineDash([1.5 + rand() * 2, 2.5 + rand() * 2])
      line(drop + (next - drop) * r / 3)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.strokeStyle = fade(o.shadow, .38)
    ctx.lineWidth = 4
    line(drop + 3)
    ctx.stroke()
    ctx.strokeStyle = fade(o.wall, .95)
    ctx.lineWidth = 1.8
    line(drop)
    ctx.stroke()
  })
}

/** The shadows of passing clouds lying across a slope: big soft patches, darker in the middle. */
export function cloudShadows(ctx: Ctx, W: number, H: number, top: Fn, seed: number, colour = '#10301e', strength = .2, count = 4) {
  const rand = rng(seed)
  ctx.save()
  below(ctx, W, H, top)
  ctx.clip()
  for (let i = 0; i < count; i++) {
    const x = rand() * W, y = top(x) + H * (.06 + rand() * .3)
    const r = W * (.08 + rand() * .1)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(1, .32)
    const g = ctx.createRadialGradient(0, 0, r * .2, 0, 0, r)
    g.addColorStop(0, rgba(colour, strength))
    g.addColorStop(1, rgba(colour, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, 6.2832)
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}
