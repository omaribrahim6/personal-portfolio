import { awards } from '../../content'
import {
  HEDGE, OAK, blend, bump, clamp, dots, foliage, grain, hill, mix, noise1, palm, poppies, rgba, rng, smooth, tree, waves,
  type Ctx, type Fn, type Foliage, type Vec,
} from './core'

export type Scene = {
  paint: (ctx: Ctx, W: number, H: number) => void
  /** Height of the ground the figure walks on, as a fraction of H, for x as a fraction of W. */
  ground?: (t: number, W: number, H: number) => number
  /** Where the figure starts and ends while the plate scrolls past. */
  walk?: [number, number]
  /**
   * Whether the painting is dark or light at a given height (0 top, 1 bottom), so the header can stay
   * readable as it passes over. Omitted where the painting is dark all the way down.
   */
  tone?: (at: number) => 'dark' | 'light'
}

// How much narrower than a desktop this canvas is. Several compositions squeeze toward the centre on phones.
const narrow = (W: number, H: number) => clamp((2.1 - W / H) / 1.1)

/* --------------------------------------------------------------- I · the ridge */

const ridgeNoise = noise1(7)
const ridgeMid = (t: number) => .64 - .48 * bump((t - .6) / .26) + .02 * ridgeNoise(t * 5) + .16 * smooth(.72, 1, t)
const ridgeFront = (t: number) => .88 - .22 * bump((t - 1.02) / .3) - .06 * bump((t - .45) / .16) - .05 * bump((t + .04) / .24) + .02 * ridgeNoise(t * 7 + 9)

const ridge: Scene = {
  walk: [.575, .665],
  ground: t => ridgeMid(t),
  paint(ctx, W, H) {
    const s = H / 400
    const n = noise1(21)
    const glow: Vec = [.78, -.62]

    // The far valley: hills still holding the last of the light, and a river catching it.
    const far: Fn = x => H * (.56 + .05 * n(x / W * 7) - .09 * bump((x / W - .87) / .16))
    hill(ctx, W, H, far, { top: '#f07b86', bottom: '#8d3f86', depth: H * .3, light: '#ffc3b0', dark: '#6b2f7a', seed: 3, density: .7 })
    const bend = (v: number) => W * (.87 + .04 * Math.sin(v * 6.4) * (.3 + v))
    ctx.beginPath()
    for (let i = 0; i <= 40; i++) { const v = i / 40; ctx.lineTo(bend(v) - (.6 + v * v * 34) * s, H * (.6 + .36 * v)) }
    for (let i = 40; i >= 0; i--) { const v = i / 40; ctx.lineTo(bend(v) + (.6 + v * v * 34) * s, H * (.6 + .36 * v)) }
    const river = ctx.createLinearGradient(0, H * .6, 0, H * .96)
    river.addColorStop(0, '#ffd27a')
    river.addColorStop(1, '#f2913f')
    ctx.fillStyle = river
    ctx.fill()

    const range: Fn = x => H * (.62 + .05 * n(x / W * 6 + 3) - .1 * bump((x / W - .18) / .14) + .2 * smooth(.6, 1, x / W))
    hill(ctx, W, H, range, { top: '#6a4dc0', bottom: '#2b2787', depth: H * .22, rim: '#ff8fa8', rimSide: 1, rimStrength: .8, light: '#a58cf0', dark: '#1d1a6a', seed: 5 })

    // The ridge the figure stands on, directly under the thunderhead.
    const mid: Fn = x => H * ridgeMid(x / W)
    hill(ctx, W, H, mid, {
      top: '#5148d0', bottom: '#232080', depth: H * .62, rim: '#ff86ae', rimSide: 1, rimStrength: 1,
      rows: '#9a90ff', rowCount: 18, rowAlpha: .2, light: '#a79fff', dark: '#14124e', seed: 8, density: 1.3,
    })
    tree(ctx, W * .41, mid(W * .41) + 8 * s, 30 * s, OAK, glow, 32)
    tree(ctx, W * .76, mid(W * .76) + 6 * s, 22 * s, OAK, glow, 33)

    const front: Fn = x => H * ridgeFront(x / W)
    hill(ctx, W, H, front, {
      top: '#302c9c', bottom: '#15144c', depth: H * .3, rim: '#f06f9f', rimSide: 1, rimStrength: .75,
      rows: '#7a72e6', rowCount: 9, rowAlpha: .16, light: '#7f78e8', dark: '#0c0b38', seed: 13,
    })
    tree(ctx, W * .045, front(W * .045) + 10 * s, 40 * s, OAK, glow, 31)
    tree(ctx, W * .24, front(W * .24) + 8 * s, 24 * s, OAK, glow, 37)
    tree(ctx, W * .47, front(W * .47) + 8 * s, 40 * s, OAK, glow, 34)
    tree(ctx, W * .8, front(W * .8) + 6 * s, 28 * s, OAK, glow, 35)
    tree(ctx, W * .94, front(W * .94) + 12 * s, 74 * s, OAK, glow, 36)
    grain(ctx, W, H, 1)
  },
}

/* --------------------------------------------------------------- II · the dunes */

type Dune = { peak: Vec; left: Vec; right: Vec; foot: Vec; lit: [string, string]; shadow: [string, string]; crest: string }

function dune(ctx: Ctx, H: number, d: Dune, seed: number) {
  const [px, py] = d.peak, [lx, ly] = d.left, [rx, ry] = d.right, [fx, fy] = d.foot
  // Windward slope: long and slightly hollow.
  ctx.beginPath()
  ctx.moveTo(lx, ly)
  ctx.quadraticCurveTo(mix(lx, px, .6), mix(ly, py, .96), px, py)
  ctx.quadraticCurveTo(mix(px, rx, .34), mix(py, ry, .22), rx, ry)
  ctx.lineTo(rx, H + 2)
  ctx.lineTo(lx, H + 2)
  ctx.closePath()
  const lit = ctx.createLinearGradient(0, py, 0, Math.max(ly, ry, fy))
  lit.addColorStop(0, d.lit[0])
  lit.addColorStop(1, d.lit[1])
  ctx.fillStyle = lit
  ctx.fill()

  // Slip face: everything the light does not reach, split from the lit side by a spine that snakes down from the peak.
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.quadraticCurveTo(mix(px, rx, .34), mix(py, ry, .22), rx, ry)
  ctx.lineTo(rx, H + 2)
  ctx.lineTo(fx, H + 2)
  ctx.lineTo(fx, fy)
  ctx.bezierCurveTo(mix(fx, px, .1) + (px - fx) * .5, mix(fy, py, .42), mix(fx, px, .62) - (px - fx) * .42, mix(fy, py, .72), px, py)
  ctx.closePath()
  const shadow = ctx.createLinearGradient(0, py, 0, Math.max(ry, fy))
  shadow.addColorStop(0, d.shadow[0])
  shadow.addColorStop(1, d.shadow[1])
  ctx.fillStyle = shadow
  ctx.fill()
  ctx.clip()
  // Wind ripples on the dark side.
  const rand = rng(seed)
  ctx.strokeStyle = rgba(d.lit[1], .16)
  ctx.lineWidth = 1
  const height = Math.max(ry, fy) - py
  for (let k = 0; k < 22; k++) {
    const y = py + height * (k / 22) + rand() * 4
    ctx.beginPath()
    ctx.moveTo(Math.min(px, fx) - 20, y)
    for (let x = Math.min(px, fx); x <= rx + 20; x += 14) ctx.lineTo(x, y + Math.sin(x * .05 + k) * 2.4 + (x - px) * .16)
    ctx.stroke()
  }
  ctx.restore()

  ctx.strokeStyle = d.crest
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  ctx.globalAlpha = .9
  ctx.beginPath()
  ctx.moveTo(fx, fy)
  ctx.bezierCurveTo(mix(fx, px, .1) + (px - fx) * .5, mix(fy, py, .42), mix(fx, px, .62) - (px - fx) * .42, mix(fy, py, .72), px, py)
  ctx.stroke()
  ctx.globalAlpha = 1
}

const sandNoise = noise1(44)
const sand = (t: number) => .66 + .03 * sandNoise(t * 4) + .05 * bump((t - .2) / .3)
const foreDune = (t: number) => .93 - .2 * bump((t - .14) / .26) - .1 * bump((t - .98) / .2) + .02 * sandNoise(t * 6 + 5)

const dunes: Scene = {
  walk: [.43, .5],
  ground: (t, W, H) => sand(t) + .035 - .02 * narrow(W, H),
  paint(ctx, W, H) {
    const s = H / 400
    const k = narrow(W, H)
    const far = { lit: ['#e0677c', '#a8466f'] as [string, string], shadow: ['#3d2b66', '#2a1c4c'] as [string, string], crest: '#ffb39c' }
    const near = { lit: ['#f38469', '#cf4d58'] as [string, string], shadow: ['#3a2150', '#1f1538'] as [string, string], crest: '#ffc0a6' }

    dune(ctx, H, { peak: [W * .87, H * .2], left: [W * .56, H * .7], right: [W * 1.2, H * .7], foot: [W * .99, H * .72], ...far }, 1)
    dune(ctx, H, { peak: [W * .1, H * .24], left: [W * -.3, H * .7], right: [W * .44, H * .7], foot: [W * .22, H * .72], ...far }, 2)
    dune(ctx, H, { peak: [W * .5, H * .1], left: [W * .12, H * .72], right: [W * .92, H * .72], foot: [W * .63, H * .74], ...near }, 3)
    dune(ctx, H, { peak: [W * .22, H * .34], left: [W * -.16, H * .74], right: [W * .54, H * .74], foot: [W * .3, H * .76], ...near }, 4)

    // Lit sand around the water.
    const flat: Fn = x => H * sand(x / W)
    hill(ctx, W, H, flat, { top: '#ee7b66', bottom: '#c8485a', depth: H * .34, light: '#ffb49c', dark: '#9c3450', seed: 6, density: 1.2 })

    // The pool, with the big dune and the moon lying in it.
    const cx = W * mix(.7, .72, k), cy = H * .755, rx = Math.min(W * .19, H * .62), ry = H * .062
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.2832)
    const water = ctx.createLinearGradient(0, cy - ry, 0, cy + ry)
    water.addColorStop(0, '#2c6fb4')
    water.addColorStop(1, '#5fb7dc')
    ctx.fillStyle = water
    ctx.fill()
    ctx.clip()
    ctx.fillStyle = rgba('#f08a7a', .78)
    ctx.beginPath()
    ctx.moveTo(cx - rx * 1.05, cy - ry)
    ctx.lineTo(cx - rx * .3, cy - ry)
    ctx.quadraticCurveTo(cx - rx * .52, cy + ry * .1, cx - rx * .7, cy + ry * .55)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#f6e6c8'
    ctx.beginPath()
    ctx.ellipse(cx + rx * .08, cy + ry * .18, 5.5 * s, 4.4 * s, 0, 0, 6.2832)
    ctx.fill()
    ctx.strokeStyle = 'rgba(210,240,255,.3)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(cx - rx * (.2 + i * .1), cy + ry * (.35 + i * .12))
      ctx.lineTo(cx + rx * (.5 - i * .06), cy + ry * (.35 + i * .12))
      ctx.stroke()
    }
    ctx.restore()
    ctx.strokeStyle = rgba('#a0344c', .7)
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 3.1416)
    ctx.stroke()

    // Palms and the shadows they throw across the sand, away from the moon.
    const palms: [number, number, number, number][] = [[cx + rx * .62, 150 * s, -.06, 51], [cx + rx * .34, 96 * s, .1, 52], [cx + rx * .92, 88 * s, .05, 53]]
    for (const [x, h] of palms) {
      const base = cy + ry * .7
      ctx.strokeStyle = 'rgba(40,14,50,.4)'
      ctx.lineWidth = 2.2 * s
      ctx.beginPath()
      ctx.moveTo(x, base)
      ctx.lineTo(x + h * .85, base + h * .16)
      ctx.stroke()
    }
    for (const [x, h, lean, seed] of palms) palm(ctx, x, cy + ry * .7, h, lean, seed)

    // The near dune, all shadow, that the story is written on.
    const fore: Fn = x => H * foreDune(x / W)
    hill(ctx, W, H, fore, {
      top: '#2e1d4a', bottom: '#1c1433', depth: H * .26, rim: '#ff9d86', rimSide: -1, rimStrength: .95,
      rows: '#6a3f6e', rowCount: 12, rowAlpha: .28, light: '#55345f', dark: '#120c24', seed: 9,
    })
    grain(ctx, W, H, 2)
  },
}

/* --------------------------------------------------------------- III · the arch */

type Column = { x: number; w: number; top: number; base: number }
type Opening = { x: number; w: number; top: number; base: number }

const inside = (o: Opening, x: number, y: number, pad = 0) => {
  const dx = Math.abs(x - o.x) / (o.w + pad)
  return dx < 1 && y > o.top - pad + (o.base - o.top) * Math.pow(dx, 2.6) * .8
}

/**
 * Clipped hedge: tall columns with domed tops. Each is built from soft clumps, but lit as one
 * rounded body, so from a distance it reads as a single enormous form and up close as leaves.
 */
function hedge(ctx: Ctx, H: number, columns: Column[], light: Vec, seed: number, opening?: Opening) {
  const rand = rng(seed)
  const s = H / 400
  const tone = (l: number) => l < .5 ? blend('#0a0c48', '#1f279f', clamp(l * 2)) : blend('#1f279f', '#5060e0', clamp((l - .5) * 2))
  for (const col of columns) {
    const clumps: { x: number; y: number; r: number; l: number }[] = []
    const step = 15 * s
    for (let y = col.top; y < col.base + step; y += step * .78) {
      for (let x = col.x - col.w; x <= col.x + col.w; x += step) {
        const jx = x + (rand() - .5) * step, jy = y + (rand() - .5) * step
        const nx = (jx - col.x) / col.w
        if (Math.abs(nx) > 1) continue
        const dome = col.top + col.w * .9 * (1 - Math.sqrt(1 - nx * nx))
        if (jy < dome) continue
        const r = (13 + rand() * 13) * s
        if (opening && inside(opening, jx, jy, r * .7)) continue
        // Round across its width, and brighter on the crown.
        const crown = clamp(1 - (jy - dome) / (col.w * 1.6))
        let l = .34 + nx * light[0] * .46 + crown * .22 * -light[1] + (rand() - .5) * .16
        // The inside of the arch is in shade.
        if (opening && inside(opening, jx, jy, opening.w * .8)) l -= .2
        clumps.push({ x: jx, y: jy, r, l: clamp(l) })
      }
    }
    clumps.sort((p, q) => p.l - q.l)
    for (const c of clumps) {
      const g = ctx.createRadialGradient(c.x + light[0] * c.r * .4, c.y + light[1] * c.r * .4, c.r * .1, c.x, c.y, c.r)
      g.addColorStop(0, tone(c.l + .1))
      g.addColorStop(1, tone(c.l - .12))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, 6.2832)
      ctx.fill()
    }
    const bright: number[] = [], soft: number[] = [], deep: number[] = []
    for (const c of clumps) {
      const count = Math.round(c.r * c.r / 5.5)
      for (let i = 0; i < count; i++) {
        const a = rand() * 6.2832, d = Math.sqrt(rand()) * c.r
        const chance = rand()
        const point = [c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, .45 + rand() * .85]
        if (chance < c.l * .5) (chance < c.l * .16 ? bright : soft).push(...point)
        else if (chance > .74 + c.l * .2) deep.push(...point)
      }
    }
    dots(ctx, '#04052a', deep, .55)
    dots(ctx, '#6a78ea', soft, .5)
    dots(ctx, '#c3caff', bright, .8)
  }
}

const arch: Scene = {
  walk: [.6, .68],
  ground: () => .87,
  tone: at => at < .5 ? 'light' : 'dark',
  paint(ctx, W, H) {
    const s = H / 400
    const horizon = H * .5
    const base = H * .87

    // The sea, from a dead-straight horizon to the beach, and the pale ground in front of it.
    const sea = ctx.createLinearGradient(0, horizon, 0, H * .82)
    sea.addColorStop(0, '#6d79da')
    sea.addColorStop(.22, '#3d49be')
    sea.addColorStop(1, '#262c96')
    ctx.fillStyle = sea
    ctx.fillRect(0, horizon, W, H - horizon)
    ctx.fillStyle = 'rgba(232,232,255,.6)'
    ctx.fillRect(0, horizon, W, 1.2)
    waves(ctx, 0, W, horizon, H * .79, '#e4e4ff', 71, 20)
    const shore: Fn = x => H * (.8 - .03 * smooth(0, W * .6, x) + .008 * Math.sin(x / W * 9))
    hill(ctx, W, H, shore, { top: '#dcdcfa', bottom: '#8a8dda', depth: H * .16, light: '#ffffff', dark: '#6d70c8', seed: 4, density: 1.4 })
    ctx.fillStyle = 'rgba(244,244,255,.85)'
    ctx.beginPath()
    for (let x = 0; x <= W; x += 6) ctx.lineTo(x, shore(x) + 1.5 + Math.sin(x * .04) * 1.5)
    for (let x = W; x >= 0; x -= 6) ctx.lineTo(x, shore(x) - 2.5 - Math.sin(x * .05) * 1.5)
    ctx.fill()

    // The hedge: tall clipped columns on the right, joined over an opening you can see the sea through.
    const light: Vec = [-.8, -.6]
    const rand = rng(90)
    const opening: Opening = { x: Math.max(W * .72, W - H * .62), w: H * .09, top: H * .34, base }
    const columns: Column[] = []
    for (let x = opening.x + opening.w + H * .1, i = 0; x < W + H * .2; x += H * (.17 + rand() * .06), i++) {
      columns.push({ x, w: H * (.11 + rand() * .05), top: H * (i % 2 ? .2 : .06) + rand() * H * .08, base: base + rand() * 8 * s })
    }
    for (let x = opening.x - opening.w - H * .1, i = 0; x > Math.max(W * .5, opening.x - H * .62); x -= H * (.17 + rand() * .05), i++) {
      columns.push({ x, w: H * (.1 + rand() * .04), top: H * (.2 + i * .13) + rand() * H * .05, base: base + rand() * 8 * s })
    }
    // Furthest first; the bridge over the opening goes on last.
    columns.sort((p, q) => q.top - p.top)
    columns.push({ x: opening.x, w: opening.w * 2.7, top: H * .1, base })
    const left = Math.min(...columns.map(c => c.x - c.w))
    const shade = ctx.createLinearGradient(0, base - 6 * s, 0, base + 26 * s)
    shade.addColorStop(0, 'rgba(20,22,100,.75)')
    shade.addColorStop(1, 'rgba(20,22,100,0)')
    ctx.fillStyle = shade
    ctx.fillRect(left - 10 * s, base - 6 * s, W, 32 * s)
    hedge(ctx, H, columns, light, 17, opening)

    // The light coming through the opening lies across the ground toward the viewer.
    ctx.fillStyle = 'rgba(236,236,255,.5)'
    ctx.beginPath()
    ctx.moveTo(opening.x - opening.w * .9, base - 2)
    ctx.lineTo(opening.x + opening.w * .9, base - 2)
    ctx.lineTo(opening.x - opening.w * .2, H * .955)
    ctx.lineTo(opening.x - opening.w * 3.4, H * .955)
    ctx.fill()

    // Poppies in the dark foreground, which is where the work is laid out.
    const dark = ctx.createLinearGradient(0, H * .9, 0, H)
    dark.addColorStop(0, 'rgba(15,16,64,0)')
    dark.addColorStop(.6, 'rgba(15,16,64,1)')
    ctx.fillStyle = dark
    ctx.fillRect(0, H * .9, W, H * .1 + 2)
    poppies(ctx, Math.round(W / 8), r => {
      const x = r() * W, d = r()
      return [x, H * (.925 + d * .06), (2 + d * 3.2) * s]
    }, 23)
    const fade = ctx.createLinearGradient(0, H * .96, 0, H)
    fade.addColorStop(0, 'rgba(15,16,64,0)')
    fade.addColorStop(1, 'rgba(15,16,64,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, H * .96, W, H * .04 + 2)
    grain(ctx, W, H, 3)
  },
}

/* --------------------------------------------------------------- IV · the hill */

const bigHill = (t: number) => .04 + .72 * Math.pow(clamp(t / .74), 2.1) + .2 * smooth(.74, 1.1, t)
const meadow = (t: number) => .8 + .025 * Math.sin(t * 4.2 + 1)

const summit: Scene = {
  walk: [.78, .85],
  ground: t => meadow(t) + .03,
  tone: at => at < .78 ? 'light' : 'dark',
  paint(ctx, W, H) {
    const s = H / 400
    const big: Fn = x => H * bigHill(x / W)
    hill(ctx, W, H, big, {
      top: '#22236e', bottom: '#0d0e30', depth: H * .7, rim: '#97a3f2', rimSide: 1, rimStrength: .55,
      light: '#4d58cc', dark: '#07081e', seed: 15, density: 1.5,
    })
    // One mark on the crest for every win in the list below: a flag for each thing broken into,
    // a cairn for each thing built, and a gold pennant for the one that was given.
    awards.forEach((award, index) => {
      const t = .07 + .46 * index / Math.max(1, awards.length - 1)
      const x = W * t, y = big(x) + 1
      const tall = (11 + (index % 3) * 2) * s
      if (award.mode === 'built') {
        ctx.fillStyle = '#0b0c2c'
        for (const [dy, r] of [[0, 4.2], [3.6, 3.2], [6.6, 2.2]]) {
          ctx.beginPath()
          ctx.ellipse(x, y - dy * s, r * s, r * .55 * s, 0, 0, 6.2832)
          ctx.fill()
        }
        return
      }
      ctx.strokeStyle = '#0b0c2c'
      ctx.lineWidth = Math.max(1, 1.1 * s)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y - tall)
      ctx.stroke()
      ctx.fillStyle = award.mode === 'named' ? '#f6b455' : '#ee5a44'
      ctx.beginPath()
      ctx.moveTo(x, y - tall)
      ctx.lineTo(x + 8 * s, y - tall + 2.6 * s)
      ctx.lineTo(x, y - tall + 5.2 * s)
      ctx.fill()
    })

    // A second fold, lower on the same hill.
    const fold: Fn = x => H * (bigHill(x / W) + .13 + .1 * (x / W))
    hill(ctx, W, H, fold, { top: '#12133f', bottom: '#0b0c2a', depth: H * .4, rim: '#5561d0', rimSide: 1, rimStrength: .3, light: '#2f389c', dark: '#05061a', seed: 16 })

    const field: Fn = x => H * meadow(x / W)
    hill(ctx, W, H, field, {
      top: '#8a93e6', bottom: '#30339a', depth: H * .16, rows: '#cfd3ff', rowCount: 8, rowAlpha: .3,
      light: '#d5d8ff', dark: '#22247c', seed: 17, density: 1.5,
    })
    const bed = ctx.createLinearGradient(0, H * .84, 0, H)
    bed.addColorStop(0, 'rgba(32,34,120,0)')
    bed.addColorStop(.5, 'rgba(24,25,88,.95)')
    bed.addColorStop(1, 'rgba(13,14,44,1)')
    ctx.fillStyle = bed
    ctx.fillRect(0, H * .84, W, H * .16 + 2)
    poppies(ctx, Math.round(W / 3.4), r => {
      const x = r() * W, d = Math.pow(r(), .8)
      if (x / W < .16 + r() * .2) return null
      return [x, H * (.85 + d * .12), (1.8 + d * 3.8) * s]
    }, 27)
    const fade = ctx.createLinearGradient(0, H * .93, 0, H)
    fade.addColorStop(0, 'rgba(13,14,44,0)')
    fade.addColorStop(1, 'rgba(13,14,44,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, H * .93, W, H * .07 + 2)
    grain(ctx, W, H, 4)
  },
}

/* --------------------------------------------------------------- V · the field */

const fieldNoise = noise1(61)
const fieldBack = (t: number) => .4 - .18 * bump((t - .8) / .34) + .06 * fieldNoise(t * 3) + .1 * smooth(.5, 0, t)
const fieldMid = (t: number) => .62 - .1 * bump((t - .2) / .3) + .04 * fieldNoise(t * 4 + 8)

const field: Scene = {
  walk: [.3, .38],
  ground: t => fieldMid(t) + .01,
  tone: at => at < .5 ? 'light' : 'dark',
  paint(ctx, W, H) {
    const s = H / 400
    const light: Vec = [-.7, -.7]
    const back: Fn = x => H * fieldBack(x / W)
    hill(ctx, W, H, back, {
      top: '#6e77de', bottom: '#33379f', depth: H * .4, rim: '#d8dcff', rimSide: -1, rimStrength: .5,
      rows: '#c6caff', rowCount: 16, rowAlpha: .24, light: '#cdd1ff', dark: '#23267c', seed: 41, density: 1.3,
    })
    tree(ctx, W * .82, back(W * .82) + 10 * s, 58 * s, HEDGE, light, 45)
    tree(ctx, W * .9, back(W * .9) + 8 * s, 30 * s, HEDGE, light, 46)

    const mid: Fn = x => H * fieldMid(x / W)
    hill(ctx, W, H, mid, {
      top: '#4a50c4', bottom: '#1f2178', depth: H * .4, rim: '#c4c9ff', rimSide: -1, rimStrength: .6,
      rows: '#9aa0f4', rowCount: 14, rowAlpha: .22, light: '#a3a9f6', dark: '#12134e', seed: 42, density: 1.3,
    })
    poppies(ctx, Math.round(W / 1.7), r => {
      const x = r() * W, d = Math.pow(r(), .75)
      const top = mid(x) + H * .07
      return [x, mix(top, H * .98, d), (1.4 + d * 4.4) * s]
    }, 43)
    const fade = ctx.createLinearGradient(0, H * .9, 0, H)
    fade.addColorStop(0, 'rgba(23,24,80,0)')
    fade.addColorStop(1, 'rgba(23,24,80,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, H * .9, W, H * .1 + 2)
    grain(ctx, W, H, 5)
  },
}

/* --------------------------------------------------------------- VI · the islands */

const CLOUD: Foliage = { dark: '#a39bd4', mid: '#cfc8ea', lit: '#fdf0e4', dab: '#fffaf4', deep: '#837bbd' }
const ROCK = ['#3a2150', '#6d3a78', '#a8466f', '#d9607a', '#f38469'] // shadow to sunlit, the same rock as the dunes

/** A floating island, cut in facets like the 3D ones below it: a meadow on top, a cone of rock hanging under it. */
function floating(ctx: Ctx, cx: number, cy: number, w: number, depth: number, seed: number, light: Vec, falls = false) {
  const rand = rng(seed)
  const lip = w * .2
  const N = 9
  const rim: Vec[] = [], mid: Vec[] = []
  for (let i = 0; i <= N; i++) {
    const a = Math.PI * i / N
    rim.push([cx - w * Math.cos(a), cy + lip * Math.sin(a)])
    mid.push([cx - w * Math.cos(a) * (.5 + rand() * .12), cy + depth * (.42 + rand() * .12) + lip * Math.sin(a) * .6])
  }
  const tip: Vec = [cx + (rand() - .5) * w * .35, cy + depth]
  // Each facet is shaded by which way it leans: toward the light on the side the sun is.
  const facet = (points: Vec[]) => {
    const x = points.reduce((s, p) => s + p[0], 0) / points.length
    const l = clamp(.42 + (x - cx) / w * .5 * Math.sign(light[0]) + (rand() - .5) * .3)
    ctx.fillStyle = ROCK[Math.min(ROCK.length - 1, Math.floor(l * ROCK.length))]
    ctx.beginPath()
    points.forEach(([px, py]) => ctx.lineTo(px, py))
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  ctx.lineJoin = 'round'
  ctx.lineWidth = .6
  for (let i = 0; i < N; i++) {
    ctx.strokeStyle = 'rgba(40,14,50,.25)'
    facet([rim[i], rim[i + 1], mid[i + 1]])
    facet([rim[i], mid[i + 1], mid[i]])
    facet([mid[i], mid[i + 1], tip])
  }
  // The meadow, and the dark band of earth under its front edge.
  ctx.fillStyle = '#4a2a5c'
  ctx.beginPath()
  ctx.ellipse(cx, cy + lip * .18, w, lip, 0, 0, Math.PI)
  ctx.fill()
  const grass = ctx.createLinearGradient(cx - w, cy - lip, cx + w, cy + lip)
  grass.addColorStop(light[0] > 0 ? 1 : 0, '#a3adf6')
  grass.addColorStop(.5, '#5f6ad8')
  grass.addColorStop(light[0] > 0 ? 0 : 1, '#2f379e')
  ctx.fillStyle = grass
  ctx.beginPath()
  ctx.ellipse(cx, cy, w, lip, 0, 0, 6.2832)
  ctx.fill()
  const specks: number[] = []
  for (let i = 0; i < w * lip / 6; i++) {
    const a = rand() * 6.2832, d = Math.sqrt(rand())
    specks.push(cx + Math.cos(a) * d * w * .95, cy + Math.sin(a) * d * lip * .9, .4 + rand() * .7)
  }
  dots(ctx, '#d6dbff', specks, .4)
  const trees = Math.max(1, Math.round(w / 40))
  for (let i = 0; i < trees; i++) {
    const x = cx + (rand() - .5) * w * 1.3
    tree(ctx, x, cy + (rand() - .3) * lip * .6, w * (.12 + rand() * .1), HEDGE, light, seed * 10 + i)
  }
  if (falls) {
    // Water running off the edge and falling until it turns to mist.
    const x = cx + w * .45, top = cy + lip * .8, fall = depth * 2.6
    const water = ctx.createLinearGradient(0, top, 0, top + fall)
    water.addColorStop(0, 'rgba(236,240,255,.95)')
    water.addColorStop(.6, 'rgba(236,240,255,.45)')
    water.addColorStop(1, 'rgba(236,240,255,0)')
    ctx.fillStyle = water
    ctx.beginPath()
    ctx.moveTo(x - w * .05, top)
    ctx.bezierCurveTo(x - w * .02, top + fall * .3, x - w * .07, top + fall * .7, x - w * .1, top + fall)
    ctx.lineTo(x + w * .1, top + fall)
    ctx.bezierCurveTo(x + w * .05, top + fall * .7, x + w * .06, top + fall * .3, x + w * .05, top)
    ctx.fill()
  }
}

/** Paint something on its own sheet and lay it down hazed toward the sky, so it sits further away. */
function far(ctx: Ctx, W: number, H: number, haze: number, color: string, paint: (layer: Ctx) => void) {
  const sheet = document.createElement('canvas')
  const ratio = ctx.getTransform().a
  sheet.width = Math.ceil(W * ratio)
  sheet.height = Math.ceil(H * ratio)
  const layer = sheet.getContext('2d')
  if (!layer) return
  layer.setTransform(ratio, 0, 0, ratio, 0, 0)
  paint(layer)
  layer.globalCompositeOperation = 'source-atop'
  layer.fillStyle = rgba(color, haze)
  layer.fillRect(0, 0, W, H)
  ctx.drawImage(sheet, 0, 0, W, H)
}

const isleNoise = noise1(91)
const isleFront = (t: number) => .82 - .05 * bump((t - .34) / .22) + .025 * isleNoise(t * 5) + .05 * smooth(.7, 1.05, t)

const islands: Scene = {
  walk: [.28, .38],
  ground: t => isleFront(t) + .012,
  tone: at => at < .8 ? 'light' : 'dark',
  paint(ctx, W, H) {
    const s = H / 400
    const k = narrow(W, H)
    const light: Vec = [.7, -.65]
    const haze = '#e7dcd2'

    // The furthest islands first, nearly the colour of the sky.
    far(ctx, W, H, .62, haze, layer => {
      floating(layer, W * mix(.42, .3, k), H * .17, 34 * s, 46 * s, 92, light)
      floating(layer, W * mix(.06, -.02, k), H * .34, 48 * s, 60 * s, 93, light)
    })
    far(ctx, W, H, .34, haze, layer => {
      floating(layer, W * mix(.9, 1, k), H * .4, 58 * s, 70 * s, 94, light)
      floating(layer, W * mix(.18, .1, k), H * .4, 40 * s, 50 * s, 95, light)
    })
    floating(ctx, W * mix(.66, .7, k), H * .22, 92 * s, 120 * s, 96, light, true)

    // The sea of cloud, row on row: small, crowded and hazed far off, bigger and lower close to.
    const rand = rng(97)
    for (let row = 0; row < 5; row++) {
      const clumps: { x: number; y: number; r: number; lit: number }[] = []
      const r = (14 + row * 10) * s
      const y = H * (.56 + row * .055)
      for (let x = -r; x < W + r; x += r * (.5 + rand() * .4)) {
        const py = y + (rand() - .5) * r * .6 - Math.max(0, Math.sin(x / W * 9 + row * 2)) * r * .5
        clumps.push({ x, y: py, r: r * (.7 + rand() * .6), lit: clamp(.85 - row * .12 + (x / W - .5) * .4) })
      }
      clumps.sort((a, b) => a.y - b.y)
      // Lit from above: a bright crown on every puff against the shaded underside of the one behind it.
      const dabs: number[] = []
      for (const c of clumps) {
        const body = ctx.createLinearGradient(0, c.y - c.r, 0, c.y + c.r * .7)
        body.addColorStop(0, blend(CLOUD.mid, CLOUD.lit, c.lit))
        body.addColorStop(.42, CLOUD.mid)
        body.addColorStop(1, CLOUD.dark)
        ctx.fillStyle = body
        ctx.beginPath()
        ctx.arc(c.x, c.y, c.r, 0, 6.2832)
        ctx.fill()
        for (let i = 0; i < c.r * c.lit * .5; i++) {
          const a = -Math.PI * (.15 + rand() * .7), d = c.r * (.55 + rand() * .4)
          dabs.push(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, .4 + rand() * .7)
        }
      }
      dots(ctx, CLOUD.dab, dabs, .5)
      const under = ctx.createLinearGradient(0, y, 0, H)
      under.addColorStop(0, CLOUD.dark)
      under.addColorStop(1, CLOUD.deep)
      ctx.fillStyle = under
      ctx.fillRect(0, y + r * .5, W, H)
      ctx.fillStyle = rgba(haze, Math.max(0, .34 - row * .08))
      ctx.fillRect(0, y - r * 2, W, H)
    }

    // The island underfoot, close enough to walk on.
    const front: Fn = x => H * isleFront(x / W)
    hill(ctx, W, H, front, {
      top: '#3a40a8', bottom: '#14153f', depth: H * .2, rim: '#ffc0a6', rimSide: 1, rimStrength: .8,
      rows: '#a3adf6', rowCount: 8, rowAlpha: .22, light: '#a3adf6', dark: '#0b0c30', seed: 98, density: 1.4,
    })
    tree(ctx, W * .06, front(W * .06) + 8 * s, 34 * s, HEDGE, light, 99)
    tree(ctx, W * mix(.88, .94, k), front(W * mix(.88, .94, k)) + 6 * s, 26 * s, HEDGE, light, 100)
    poppies(ctx, Math.round(W / 5), r => {
      const x = r() * W, d = Math.pow(r(), .8)
      return [x, mix(front(x) + H * .04, H * .97, d), (1.6 + d * 3.6) * s]
    }, 101)
    const fade = ctx.createLinearGradient(0, H * .92, 0, H)
    fade.addColorStop(0, 'rgba(20,21,63,0)')
    fade.addColorStop(1, 'rgba(20,21,63,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, H * .92, W, H * .08 + 2)
    grain(ctx, W, H, 102)
  },
}

/* --------------------------------------------------------------- VII · the shore */

const beach = (t: number) => .62 + .08 * smooth(.2, 1, t) + .012 * Math.sin(t * 8)

const shore: Scene = {
  walk: [.52, .6],
  ground: t => beach(t) + .1,
  tone: at => at > .24 && at < .66 ? 'dark' : 'light',
  paint(ctx, W, H) {
    const s = H / 400
    const horizon = H * .24
    const sea = ctx.createLinearGradient(0, horizon, 0, H * .7)
    sea.addColorStop(0, '#7f88e0')
    sea.addColorStop(.2, '#4854c6')
    sea.addColorStop(1, '#2a309b')
    ctx.fillStyle = sea
    ctx.fillRect(0, horizon, W, H - horizon)
    ctx.fillStyle = 'rgba(255,240,220,.7)'
    ctx.fillRect(0, horizon, W, 1.4)

    // The sun's path on the water.
    const rand = rng(81)
    ctx.fillStyle = '#ffe9c4'
    for (let i = 0; i < 260; i++) {
      const d = Math.pow(rand(), 1.3)
      const w = mix(3, 18, d) * s * (.4 + rand())
      ctx.globalAlpha = mix(.95, .5, d)
      ctx.fillRect(W * .7 + (rand() - .5) * mix(16, 170, d) * s - w / 2, mix(horizon + 2, H * .66, d), w, mix(.8, 2, d) * s)
    }
    ctx.globalAlpha = 1
    waves(ctx, 0, W, horizon, H * .68, '#eeeeff', 82, 18)

    const sandEdge: Fn = x => H * beach(x / W)
    hill(ctx, W, H, sandEdge, { top: '#f2f0ff', bottom: '#d6d4f2', depth: H * .22, light: '#ffffff', dark: '#a9a8dc', seed: 83, density: 1.5 })
    ctx.fillStyle = 'rgba(255,255,255,.85)'
    ctx.beginPath()
    for (let x = 0; x <= W; x += 6) ctx.lineTo(x, sandEdge(x) + 2 + Math.sin(x * .03) * 2)
    for (let x = W; x >= 0; x -= 6) ctx.lineTo(x, sandEdge(x) - 3 - Math.sin(x * .045) * 2)
    ctx.fill()

    // One last hedge, and the poppies that have followed the whole way.
    const light: Vec = [.8, -.55]
    hedge(ctx, H, [{ x: H * .24, w: H * .13, top: H * .34, base: H * .88 }, { x: -H * .02, w: H * .2, top: H * .06, base: H * .9 }], light, 84)
    poppies(ctx, Math.round(W / 6), r => {
      const x = Math.pow(r(), 2.4) * W * .66, d = Math.pow(r(), .7)
      return [x, H * (.8 + d * .19 - .06 * x / W), (1.8 + d * 4.2) * s]
    }, 85, false)
    grain(ctx, W, H, 6, .8)
  },
}

/* --------------------------------------------------------------- dissolve */

/** The ground under each plate thins out into mist before the next sky begins. */
export function dissolve(color: string): Scene['paint'] {
  return (ctx, W, H) => {
    const mist = ctx.createLinearGradient(0, 0, 0, H)
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      mist.addColorStop(t, rgba(color, Math.pow(1 - t, 2.2)))
    }
    ctx.fillStyle = mist
    ctx.fillRect(0, 0, W, H)
    // A little of the ground's pigment carried down into it.
    const rand = rng(W | 0)
    const specks: number[] = []
    const count = Math.round(W * H / 150)
    for (let i = 0; i < count; i++) specks.push(rand() * W, Math.pow(rand(), 2) * H * .7, .4 + rand() * .7)
    dots(ctx, color, specks, .3)
  }
}

/* --------------------------------------------------------------- project windows */

function night(ctx: Ctx, W: number, H: number, top: string, low: string, seed: number, stars = 140) {
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, top)
  sky.addColorStop(1, low)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)
  const rand = rng(seed)
  const points: number[] = []
  for (let i = 0; i < stars; i++) points.push(rand() * W, Math.pow(rand(), 1.4) * H * .62, .4 + rand() * .8)
  dots(ctx, '#fff1dc', points, .8)
}

function moon(ctx: Ctx, x: number, y: number, r: number, color = '#f3dfc0') {
  const halo = ctx.createRadialGradient(x, y, r, x, y, r * 6)
  halo.addColorStop(0, rgba(color, .22))
  halo.addColorStop(1, rgba(color, 0))
  ctx.fillStyle = halo
  ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 6.2832)
  ctx.fill()
}

const CORAL = { dark: '#a2475e', mid: '#d9607a', lit: '#f6886c', dab: '#ffd0b8', deep: '#6d3a78' }

function cumulus(ctx: Ctx, x: number, y: number, R: number, seed: number) {
  const rand = rng(seed)
  const light: Vec = [.55, .5]
  const clumps = Array.from({ length: 26 }, () => {
    const a = rand() * Math.PI, d = Math.sqrt(rand()) * R
    const px = x + Math.cos(a) * d * 1.5, py = y - Math.sin(a) * d * .9
    return { x: px, y: py, r: R * (.26 + rand() * .2), lit: clamp(.5 + (px - x) / R * .4 + (py - y) / R * .5) }
  })
  clumps.sort((a, b) => a.y - b.y)
  foliage(ctx, clumps, CORAL, light, rand, .6)
}

const signal: Scene = {
  paint(ctx, W, H) {
    night(ctx, W, H, '#0f1136', '#5b3b8c', 141, 150)
    moon(ctx, W * .77, H * .15, W * .024)
    const dusk = ctx.createLinearGradient(0, H * .3, 0, H * .54)
    dusk.addColorStop(0, 'rgba(240,89,106,0)')
    dusk.addColorStop(1, 'rgba(240,89,106,.5)')
    ctx.fillStyle = dusk
    ctx.fillRect(0, H * .3, W, H * .24)
    const n = noise1(142)
    hill(ctx, W, H, x => H * (.5 + .04 * n(x / W * 4) + .05 * bump((x / W - .2) / .25)), { top: '#6a4dc0', bottom: '#2b2787', depth: H * .3, rim: '#ff8fa8', rimSide: 1, rimStrength: .6, light: '#a58cf0', dark: '#1d1a6a', seed: 143 })
    // The street: a rise in the middle, where the first light is.
    hill(ctx, W, H, x => H * (.66 + .03 * n(x / W * 3 + 6) - .06 * bump((x / W - .5) / .32)), { top: '#3f3bb8', bottom: '#15144f', depth: H * .42, rows: '#8f87f5', rowCount: 12, rowAlpha: .16, light: '#8c86f2', dark: '#0e0d3c', seed: 144, density: 1.1 })
    tree(ctx, W * .12, H * .73, W * .085, OAK, [.7, -.6], 145)
    tree(ctx, W * .9, H * .79, W * .1, OAK, [.7, -.6], 146)
    grain(ctx, W, H, 147)
  },
}

const cascade: Scene = {
  paint(ctx, W, H) {
    night(ctx, W, H, '#12143c', '#4a3486', 101)
    moon(ctx, W * .24, H * .17, W * .022)
    cumulus(ctx, W * .78, H * .44, W * .2, 102)
    const n = noise1(103)
    hill(ctx, W, H, x => H * (.52 + .05 * n(x / W * 4)), { top: '#5148d0', bottom: '#1d1b6c', depth: H * .4, rim: '#ff86ae', rimSide: 1, rimStrength: .7, light: '#a79fff', dark: '#14124e', seed: 104 })
    hill(ctx, W, H, x => H * (.86 + .03 * n(x / W * 3 + 4)), { top: '#1d1b6c', bottom: '#100f3c', depth: H * .14, light: '#5c55c8', dark: '#0a0930', seed: 105 })
    grain(ctx, W, H, 106)
  },
}

const trail: Scene = {
  paint(ctx, W, H) {
    night(ctx, W, H, '#0e1034', '#3a2c7a', 111, 260)
    const near = { lit: ['#f38469', '#cf4d58'] as [string, string], shadow: ['#3a2150', '#1f1538'] as [string, string], crest: '#ffc0a6' }
    const far = { lit: ['#d6607c', '#a0436f'] as [string, string], shadow: ['#382a62', '#271b49'] as [string, string], crest: '#ffb39c' }
    dune(ctx, H, { peak: [W * .8, H * .68], left: [W * .3, H * .9], right: [W * 1.5, H * .9], foot: [W * .98, H * 1.04], ...far }, 112)
    dune(ctx, H, { peak: [W * .28, H * .74], left: [W * -.3, H * .98], right: [W * 1.1, H * 1.06], foot: [W * .46, H * 1.04], ...near }, 113)
    grain(ctx, W, H, 114)
  },
}

const reflection: Scene = {
  paint(ctx, W, H) {
    night(ctx, W, H * .56, '#121a4a', '#4a3f88', 121, 90)
    moon(ctx, W * .7, H * .14, W * .03)
    const near = { lit: ['#f38469', '#cf4d58'] as [string, string], shadow: ['#3a2150', '#241840'] as [string, string], crest: '#ffc0a6' }
    dune(ctx, H * .56, { peak: [W * .3, H * .36], left: [W * -.3, H * .56], right: [W * .7, H * .56], foot: [W * .42, H * .6], ...near }, 122)
    dune(ctx, H * .56, { peak: [W * .92, H * .42], left: [W * .5, H * .56], right: [W * 1.4, H * .56], foot: [W * 1.02, H * .6], ...near }, 123)
    // Still water: the same sky, upside down and a little bluer.
    const water = ctx.createLinearGradient(0, H * .55, 0, H)
    water.addColorStop(0, '#5a5aa6')
    water.addColorStop(.12, '#2f62ac')
    water.addColorStop(1, '#16386f')
    ctx.fillStyle = water
    ctx.fillRect(0, H * .55, W, H * .45)
    ctx.fillStyle = rgba('#e0606a', .38)
    ctx.beginPath()
    ctx.moveTo(0, H * .55)
    ctx.lineTo(W * .7, H * .55)
    ctx.quadraticCurveTo(W * .38, H * .62, W * .3, H * .74)
    ctx.quadraticCurveTo(W * .16, H * .62, 0, H * .6)
    ctx.fill()
    ctx.fillStyle = rgba('#f3dfc0', .85)
    ctx.beginPath()
    ctx.ellipse(W * .7, H * .93, W * .03, W * .02, 0, 0, 6.2832)
    ctx.fill()
    ctx.strokeStyle = 'rgba(200,230,255,.16)'
    ctx.lineWidth = 1
    const rand = rng(124)
    for (let i = 0; i < 46; i++) {
      const y = H * (.57 + Math.pow(rand(), .8) * .42), x = rand() * W, w = 14 + rand() * 60
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255,190,160,.7)'
    ctx.fillRect(0, H * .55 - .5, W, 1.2)
    grain(ctx, W, H, 125)
  },
}

export const scenes = { ridge, dunes, arch, summit, field, islands, shore, signal, cascade, trail, reflection }
export type SceneName = keyof typeof scenes

/** Ground colour under each plate. The painting ends in it and the page carries on in it. */
export const GROUND = {
  ridge: '#15144c',
  dunes: '#1c1433',
  arch: '#0f1040',
  summit: '#0d0e2c',
  field: '#171850',
  islands: '#14153f',
  shore: '#d6d4f2',
} as const

