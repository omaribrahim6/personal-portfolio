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

export const OAK: Foliage = { dark: '#0c1d24', mid: '#1b3a3a', lit: '#4d7a5c', dab: '#9cb877', deep: '#07131a' }
export const HEDGE: Foliage = { dark: '#0a0c4a', mid: '#2128a0', lit: '#4c59d8', dab: '#a3adf6', deep: '#05062e' }

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

/** A palm, seen small and dark against the light. */
export function palm(ctx: Ctx, x: number, ground: number, height: number, lean: number, seed: number, color = '#08151b') {
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
}

/** A scatter of poppies. Nearer ones are bigger and brighter. */
export function poppies(ctx: Ctx, count: number, place: (rand: () => number) => [number, number, number] | null, seed: number, night = true) {
  const rand = rng(seed)
  const flowers: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    const spot = place(rand)
    if (spot) flowers.push(spot)
  }
  flowers.sort((a, b) => a[1] - b[1])
  for (const [x, y, s] of flowers) {
    const tilt = (rand() - .5) * .8
    ctx.strokeStyle = night ? 'rgba(10,18,34,.75)' : 'rgba(24,44,44,.8)'
    ctx.lineWidth = Math.max(.6, s * .16)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + tilt * s, y + s * 1.2, x + tilt * s * .4, y + s * 2.6)
    ctx.stroke()
    const hot = rand()
    ctx.fillStyle = hot > .6 ? '#f2663a' : hot > .2 ? '#e3432c' : '#c4312b'
    ctx.beginPath()
    ctx.ellipse(x - s * .28, y, s * .56, s * .46, -.4, 0, 6.2832)
    ctx.ellipse(x + s * .3, y - s * .04, s * .54, s * .44, .45, 0, 6.2832)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,170,120,.55)'
    ctx.beginPath()
    ctx.ellipse(x + s * .1, y - s * .2, s * .32, s * .14, .2, 0, 6.2832)
    ctx.fill()
    if (s > 3.2) {
      ctx.fillStyle = 'rgba(40,10,24,.7)'
      ctx.beginPath()
      ctx.arc(x, y + s * .06, s * .14, 0, 6.2832)
      ctx.fill()
    }
  }
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
