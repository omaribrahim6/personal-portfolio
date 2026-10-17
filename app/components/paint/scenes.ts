import { awards } from '../../content'
import {
  BLOSSOM, DAWN, GOLD, LEAF, SHADE, aerostat, birds, blend, bump, clamp, cloudShadows, cypress, dome, dots, flowers, foliage, grain, hill,
  lamp, mix, noise1, palm, panel, parasol, pod, porthole, rgba, rng, smooth, standingPanel, sunflowers, terraces, tree,
  turbine, vines, waves,
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

/** A far-off city of the future: rounded white towers with gardens on every few floors, wind turbines between. */
function skyline(ctx: Ctx, x0: number, x1: number, base: number, tall: number, seed: number, o: { lit?: string; shade?: string; green?: string; light?: 1 | -1 } = {}) {
  const rand = rng(seed)
  const lit = o.lit ?? '#f8f3e6', shade = o.shade ?? '#b8c3da', green = o.green ?? '#6d9e57'
  const towers: { x: number; w: number; h: number; kind: number }[] = []
  for (let x = x0; x < x1;) {
    const w = tall * (.12 + rand() * .14)
    const middle = 1 - Math.abs((x - x0) / (x1 - x0) - .5) * 1.4
    towers.push({ x: x + w / 2, w, h: tall * (.25 + rand() * .55) * (.55 + middle * .6), kind: Math.floor(rand() * 3) })
    x += w * (.7 + rand() * .5)
  }
  towers.sort((a, b) => a.h - b.h)
  for (const t of towers) {
    const left = t.x - t.w / 2, top = base - t.h
    const body = ctx.createLinearGradient(left, 0, left + t.w, 0)
    body.addColorStop(o.light === 1 ? 1 : 0, lit)
    body.addColorStop(o.light === 1 ? 0 : 1, shade)
    ctx.fillStyle = body
    ctx.beginPath()
    if (t.kind === 0) {
      // A tall capsule.
      ctx.roundRect(left, top, t.w, t.h + 2, [t.w / 2, t.w / 2, 0, 0])
    } else if (t.kind === 1) {
      // A tapering spire with a rounded tip.
      ctx.moveTo(left, base + 2)
      ctx.quadraticCurveTo(left + t.w * .1, top + t.h * .3, t.x - t.w * .12, top)
      ctx.quadraticCurveTo(t.x, top - t.w * .2, t.x + t.w * .12, top)
      ctx.quadraticCurveTo(left + t.w * .9, top + t.h * .3, left + t.w, base + 2)
      ctx.closePath()
    } else {
      // A stack of discs: terraces in the air.
      ctx.roundRect(left + t.w * .15, top, t.w * .7, t.h + 2, t.w * .2)
    }
    ctx.fill()
    // Gardens: a band of green every few floors, with a lip of white.
    ctx.save()
    ctx.clip()
    const floors = Math.max(2, Math.round(t.h / (t.w * .55)))
    for (let k = 1; k < floors; k++) {
      const y = top + t.h * k / floors
      ctx.fillStyle = green
      ctx.globalAlpha = .85
      ctx.fillRect(left - 2, y - t.w * .1, t.w + 4, t.w * .12)
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(20,40,60,.18)'
      ctx.fillRect(left - 2, y + t.w * .02, t.w + 4, Math.max(.8, t.w * .03))
    }
    ctx.restore()
  }
}

/** Fields in a patchwork over a far hillside: lavender, rapeseed, young wheat, stubble. Each in rows. */
function patchwork(ctx: Ctx, W: number, H: number, crest: Fn, depth: number, seed: number, colours: string[]) {
  const rand = rng(seed)
  ctx.save()
  ctx.beginPath()
  for (let x = 0; x <= W; x += 4) ctx.lineTo(x, crest(x))
  ctx.lineTo(W, H + 2)
  ctx.lineTo(0, H + 2)
  ctx.closePath()
  ctx.clip()
  for (let band = 0; band < 4; band++) {
    let x = -rand() * 80
    const d0 = depth * Math.pow(band / 4, 1.3), d1 = depth * Math.pow((band + 1) / 4, 1.3)
    while (x < W) {
      const w = (60 + rand() * 120) * (1 + band * .5) * H / 400
      const colour = colours[Math.floor(rand() * colours.length)]
      const lean = (rand() - .5) * w * .5
      ctx.fillStyle = colour
      ctx.beginPath()
      ctx.moveTo(x, crest(x) + d0)
      ctx.lineTo(x + w, crest(x + w) + d0)
      ctx.lineTo(x + w + lean, crest(x + w) + d1)
      ctx.lineTo(x + lean, crest(x) + d1)
      ctx.closePath()
      ctx.fill()
      // Rows in it, running down the slope.
      ctx.save()
      ctx.clip()
      ctx.strokeStyle = 'rgba(40,60,30,.18)'
      ctx.lineWidth = .8
      ctx.beginPath()
      for (let k = 0; k < w + Math.abs(lean); k += 3 + band * 1.6) {
        ctx.moveTo(x + k, crest(x + k) + d0)
        ctx.lineTo(x + k + lean, crest(x + k) + d1)
      }
      ctx.stroke()
      ctx.restore()
      // A hedge line between fields.
      ctx.strokeStyle = 'rgba(40,80,40,.55)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(x, crest(x) + d0)
      ctx.lineTo(x + lean, crest(x) + d1)
      ctx.stroke()
      x += w
    }
  }
  ctx.restore()
}

/** A long tunnel of glass for growing things, seen from the end: a half round with its ribs. */
function polytunnel(ctx: Ctx, x: number, ground: number, w: number, length: number, light: number) {
  const h = w * .55
  ctx.fillStyle = 'rgba(205,236,230,.85)'
  ctx.beginPath()
  ctx.moveTo(x - w / 2, ground)
  ctx.lineTo(x - w / 2 + length, ground - length * .18)
  ctx.ellipse(x + length, ground - length * .18, w / 2, h, 0, Math.PI, 0)
  ctx.lineTo(x + w / 2, ground)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.9)'
  ctx.lineWidth = .8
  for (let k = 0; k <= 6; k++) {
    const t = k / 6
    ctx.beginPath()
    ctx.ellipse(x + length * t, ground - length * .18 * t, w / 2, h, 0, Math.PI, 0)
    ctx.stroke()
  }
  const end = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0)
  end.addColorStop(light < 0 ? 0 : 1, 'rgba(240,255,250,.95)')
  end.addColorStop(light < 0 ? 1 : 0, 'rgba(140,200,195,.9)')
  ctx.fillStyle = end
  ctx.beginPath()
  ctx.ellipse(x, ground, w / 2, h, 0, Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(70,130,70,.75)'
  ctx.fillRect(x - w * .38, ground - h * .3, w * .76, h * .3)
  ctx.strokeStyle = 'rgba(22,38,31,.6)'
  ctx.lineWidth = .9
  ctx.beginPath()
  ctx.ellipse(x, ground, w / 2, h, 0, Math.PI, 0)
  ctx.stroke()
}

/** Short strokes of grass along a slope, the light ones toward the sun. */
function grass(ctx: Ctx, W: number, y: Fn, from: number, to: number, count: number, seed: number, light: string, dark: string, size: number) {
  const rand = rng(seed)
  const lit: number[][] = [], deep: number[][] = []
  for (let i = 0; i < count; i++) {
    const x = rand() * W
    const d = Math.pow(rand(), 1.2)
    const top = y(x) + mix(from, to, d)
    const h = size * (.5 + d * 1.2) * (.6 + rand() * .6)
    ;(rand() > .45 ? lit : deep).push([x, top, h, (rand() - .5) * h * .5])
  }
  for (const [list, colour] of [[deep, dark], [lit, light]] as const) {
    ctx.strokeStyle = colour
    ctx.lineWidth = Math.max(.6, size * .12)
    ctx.beginPath()
    for (const [x, top, h, lean] of list) {
      ctx.moveTo(x, top + h)
      ctx.quadraticCurveTo(x, top + h * .4, x + lean, top)
    }
    ctx.stroke()
  }
}

/* --------------------------------------------------------- I · the terraces */

const terraceNoise = noise1(7)
const terracesMid = (t: number) => .6 - .4 * bump((t - .6) / .3) + .02 * terraceNoise(t * 5) + .14 * smooth(.78, 1.05, t)
const terracesFront = (t: number) => .86 - .2 * bump((t - 1.02) / .3) - .07 * bump((t - .42) / .17) - .06 * bump((t + .04) / .24) + .02 * terraceNoise(t * 7 + 9)

const terraces_: Scene = {
  walk: [.565, .645],
  ground: t => terracesMid(t),
  paint(ctx, W, H) {
    const s = H / 400
    const n = noise1(21)
    const light: Vec = [-.4, -.85]
    const k = narrow(W, H)

    // Far hills in the haze of the sunrise, and a city on them, still in shadow but for its tops.
    const back: Fn = x => H * (.5 + .05 * n(x / W * 6) - .07 * bump((x / W - .2) / .2))
    far(ctx, W, H, .55, '#e4bdc6', layer => {
      skyline(layer, W * mix(.06, -.1, k), W * mix(.34, .4, k), back(W * .2) + 6 * s, 96 * s, 3, { lit: '#fff0dc', shade: '#9a93c6', green: '#7f9c7c', light: 1 })
      for (const [x, h, a] of [[.42, 46, .4], [.47, 40, 1.4], [.52, 44, 2.6]] as const) turbine(layer, W * x, back(W * x) + 2, h * s, a, { lit: '#fff1e2', shade: '#b4a7cf', light: 1 })
      hill(layer, W, H, back, { top: '#b49ad0', bottom: '#8c7fbc', depth: H * .3, rim: '#ffd2a6', rimSide: -1, rimStrength: .7, light: '#e8cde4', dark: '#7465a8', seed: 3, density: .6 })
    })

    const range: Fn = x => H * (.56 + .05 * n(x / W * 5 + 3) - .08 * bump((x / W - .9) / .14) + .1 * smooth(.6, 0, x / W))
    hill(ctx, W, H, range, { top: '#7e8fa6', bottom: '#4f6c6e', depth: H * .24, rim: '#ffcf9a', rimSide: -1, rimStrength: .8, rows: '#c9d7c0', rowCount: 10, rowAlpha: .14, light: '#c0cfc6', dark: '#3d5a5c', seed: 5 })

    // The terraced hill the figure walks over, with the house on its shoulder.
    const mid: Fn = x => H * terracesMid(x / W)
    hill(ctx, W, H, mid, { top: '#86a862', bottom: '#2f5c3c', depth: H * .6, rim: '#ffd59a', rimSide: -1, rimStrength: 1, light: '#d5e3a0', dark: '#1d442f', seed: 8, density: 1.1 })
    terraces(ctx, W, mid, [10, 22, 36, 53, 73, 96, 122, 151, 183].map(v => v * s), { wall: '#f7e6bd', shadow: '#16341f', rows: '#2a4d2f', seed: 9, from: W * .26, to: W * 1.02 })
    cloudShadows(ctx, W, H, mid, 10, '#2a2050', .16, 3)
    // Panels along three of the terraces, row after row of them, catching the first light.
    for (const [drop, x0, x1] of [[53, .4, .55], [96, .37, .56], [151, .35, .56]] as const) {
      const size = (10 + drop * .06) * s
      for (let x = W * x0; x < W * x1; x += size * 1.9) {
        const y = mid(x) + drop * s - 2 * s, y1 = mid(x + size * 1.8) + drop * s - 2 * s
        ctx.fillStyle = 'rgba(22,52,31,.45)'
        ctx.fillRect(x + size * .2, y - 1, size * 1.5, size * .3)
        panel(ctx, [[x + size * .25, y - size * .95], [x + size * 1.85, y1 - size * .95], [x + size * 1.75, y1 - size * .15], [x + size * .1, y - size * .15]], { cols: 4, rows: 2, sky: '#d99aa6', deep: '#1a2a68', glare: .22 })
      }
    }
    const home = W * mix(.73, .76, k)
    turbine(ctx, W * .88, mid(W * .88) + 3 * s, 92 * s, 1.1, { light: -1, lit: '#fff6ea', shade: '#b7b1cf', ink: .9 * s })
    tree(ctx, W * .64, mid(W * .64) + 6 * s, 20 * s, DAWN, light, 33)
    cypress(ctx, W * .845, mid(W * .845) + 4 * s, 58 * s, DAWN, light, 34)
    pod(ctx, home, mid(home) + 7 * s, { w: 112 * s, h: 66 * s, light: -1, lit: '#fff1df', shade: '#b8a9cf', windows: [[-.26, .42, .15], [.04, .5, .1], [.26, .38, .08]], glow: true, door: .14, dome: .17, panels: true, antenna: true, vines: 5 }, 40)
    tree(ctx, W * .8, mid(W * .8) + 10 * s, 26 * s, BLOSSOM, light, 35)

    const front: Fn = x => H * terracesFront(x / W)
    hill(ctx, W, H, front, {
      top: '#3c6b44', bottom: '#173a2a', depth: H * .3, rim: '#f7c27e', rimSide: -1, rimStrength: .7,
      rows: '#5d8b55', rowCount: 9, rowAlpha: .16, light: '#7aa86a', dark: '#0f2a1d', seed: 13,
    })
    grass(ctx, W, front, 2 * s, H * .2, Math.round(W / 2.4), 14, '#8fbd6c', '#21452f', 6 * s)
    flowers(ctx, Math.round(W / 9), r => {
      const x = r() * W, d = r()
      return [x, front(x) + H * .02 + d * H * .14, (1.4 + d * 2.6) * s]
    }, 15, ['#f6efe0', '#f7c844', '#ef8fa3'])
    tree(ctx, W * .045, front(W * .045) + 10 * s, 40 * s, SHADE, light, 31)
    tree(ctx, W * .25, front(W * .25) + 8 * s, 22 * s, LEAF, light, 37)
    tree(ctx, W * .5, front(W * .5) + 8 * s, 34 * s, SHADE, light, 38)
    tree(ctx, W * .95, front(W * .95) + 12 * s, 70 * s, SHADE, light, 36)
    birds(ctx, [[W * .3, H * .12, 5 * s], [W * .33, H * .09, 4 * s], [W * .35, H * .14, 3.4 * s]], 'rgba(60,40,80,.55)')
    grain(ctx, W, H, 1)
  },
}

/* --------------------------------------------------------- II · the gardens */

const gardenNoise = noise1(44)
const gardenMid = (t: number) => .64 + .03 * gardenNoise(t * 4) - .05 * bump((t - .45) / .3)
const meadowFront = (t: number) => .9 - .1 * bump((t - .14) / .26) - .06 * bump((t - .98) / .2) + .02 * gardenNoise(t * 6 + 5)

const gardens: Scene = {
  walk: [.42, .5],
  ground: t => gardenMid(t) + .005,
  tone: () => 'light',
  paint(ctx, W, H) {
    const s = H / 400
    const k = narrow(W, H)
    const light: Vec = [-.65, -.7]
    const n = noise1(46)

    // The far side of the valley: a city of white towers and gardens, the patchwork of fields, turbines.
    const ridge: Fn = x => H * (.36 + .06 * n(x / W * 4) + .06 * bump((x / W - .78) / .2))
    far(ctx, W, H, .42, '#dbe8ef', layer => {
      skyline(layer, W * mix(.02, -.2, k), W * mix(.32, .36, k), ridge(W * .16) + 8 * s, 150 * s, 47)
      for (const [x, h, a] of [[.56, 52, .3], [.61, 60, 1.2], [.67, 48, 2.2], [.72, 56, .9]] as const) turbine(layer, W * x, ridge(W * x) + 2, h * s, a)
      hill(layer, W, H, ridge, { top: '#8fb57a', bottom: '#6f9a69', depth: H * .3, rim: '#f4f6dc', rimSide: -1, rimStrength: .6, seed: 48, light: '#c9dfb2', dark: '#557f58', density: .5 })
      patchwork(layer, W, H, ridge, H * .3, 49, ['#a493d4', '#f2d35b', '#8cbf66', '#d8b46c', '#79a95c', '#b9d47a'])
    })

    // The near side: tunnels of glass, a geodesic dome, an orchard, the house.
    const mid: Fn = x => H * gardenMid(x / W)
    hill(ctx, W, H, mid, { top: '#9cc77a', bottom: '#5f9555', depth: H * .3, rim: '#f8f6dc', rimSide: -1, rimStrength: .7, rows: '#4f8048', rowCount: 12, rowAlpha: .22, light: '#d6ecb0', dark: '#4b7d48', seed: 50, density: 1.1 })
    for (let i = 0; i < 3; i++) polytunnel(ctx, W * (.12 + i * .075), mid(W * (.12 + i * .075)) + 4 * s, 34 * s, 50 * s, -1)
    dome(ctx, W * .72, mid(W * .72) + 4 * s, 46 * s, 51)
    for (let i = 0; i < 7; i++) {
      const x = W * (.55 + i * .03 + (i % 2) * .01)
      tree(ctx, x, mid(x) + (8 + (i % 3) * 3) * s, (13 + (i % 3) * 3) * s, i % 3 ? LEAF : BLOSSOM, light, 52 + i)
    }
    pod(ctx, W * mix(.86, .9, k), mid(W * .88) + 8 * s, { w: 92 * s, h: 58 * s, light: -1, band: '#f2c14b', windows: [[-.22, .44, .14], [.18, .5, .09]], door: .02, panels: true, antenna: true, vines: 4 }, 60)
    cypress(ctx, W * .955, mid(W * .955) + 6 * s, 64 * s, LEAF, light, 61)

    // The meadow in front, pale with seed heads, where the story is written.
    const fore: Fn = x => H * meadowFront(x / W)
    hill(ctx, W, H, fore, { top: '#d9d79a', bottom: '#ece3c5', depth: H * .22, rim: '#fffbe6', rimSide: -1, rimStrength: .6, light: '#fff6d6', dark: '#b9b277', seed: 62, density: 1.4 })
    grass(ctx, W, fore, 1, H * .14, Math.round(W / 1.6), 63, '#c9c27c', '#8f9458', 7 * s)
    flowers(ctx, Math.round(W / 7), r => {
      const x = r() * W, d = r()
      return [x, fore(x) + H * .01 + d * H * .12, (1.4 + d * 2.8) * s]
    }, 64, ['#a493d4', '#f6f1e2', '#f2c14b', '#ef8f7e'])
    const fade = ctx.createLinearGradient(0, H * .9, 0, H)
    fade.addColorStop(0, 'rgba(236,227,197,0)')
    fade.addColorStop(1, 'rgba(236,227,197,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, H * .9, W, H * .1 + 2)
    birds(ctx, [[W * .44, H * .12, 4 * s], [W * .47, H * .1, 3 * s]], 'rgba(40,60,80,.5)')
    grain(ctx, W, H, 2, .7)
  },
}

/* ------------------------------------------------------- III · the glasshouse */

/** The great glasshouse: a nave of curved glass on white ribs, a cupola on top, palms inside, the door open. */
function glasshouse(ctx: Ctx, cx: number, base: number, w: number, h: number, seed: number, light: Vec) {
  const rand = rng(seed)
  const s = h / 240
  // The outline: low wings either side of a tall nave, the nave crowned with a cupola.
  const wing = (x: number, ww: number, hh: number) => { ctx.moveTo(x - ww / 2, base); ctx.lineTo(x - ww / 2, base - hh * .45); ctx.ellipse(x, base - hh * .45, ww / 2, hh * .55, 0, Math.PI, 0); ctx.lineTo(x + ww / 2, base); ctx.closePath() }
  const parts = [
    { x: cx - w * .34, w: w * .36, h: h * .52 },
    { x: cx + w * .34, w: w * .36, h: h * .52 },
    { x: cx, w: w * .42, h: h * .86 },
  ]
  for (const part of parts) {
    ctx.save()
    ctx.beginPath()
    wing(part.x, part.w, part.h)
    ctx.clip()
    // Inside: warm green air and the plants reaching for the glass.
    const air = ctx.createLinearGradient(0, base - part.h, 0, base)
    air.addColorStop(0, '#d8f2e6')
    air.addColorStop(1, '#6fae8e')
    ctx.fillStyle = air
    ctx.fillRect(part.x - part.w, base - part.h * 1.1, part.w * 2, part.h * 1.2)
    for (let i = 0; i < Math.round(part.w / (14 * s)); i++) {
      const px = part.x + (rand() - .5) * part.w * .9
      palm(ctx, px, base, part.h * (.45 + rand() * .45), (rand() - .5) * .3, seed + i * 3, '#2d6a45', '#7fbf6a')
    }
    const clumps = Array.from({ length: Math.round(part.w / (6 * s)) }, () => ({ x: part.x + (rand() - .5) * part.w, y: base - rand() * part.h * .3, r: (10 + rand() * 12) * s, lit: .3 + rand() * .6 })).sort((p, q) => p.y - q.y)
    foliage(ctx, clumps, LEAF, light, rand, .7)
    // The glass: sky caught in the upper panes.
    const glass = ctx.createLinearGradient(part.x - part.w / 2, base - part.h, part.x + part.w / 2, base)
    glass.addColorStop(0, 'rgba(255,255,255,.5)')
    glass.addColorStop(.4, 'rgba(190,232,236,.16)')
    glass.addColorStop(1, 'rgba(40,90,90,.18)')
    ctx.fillStyle = glass
    ctx.fillRect(part.x - part.w, base - part.h * 1.1, part.w * 2, part.h * 1.2)
    // Ribs, and the bars between them.
    ctx.strokeStyle = 'rgba(252,250,240,.92)'
    ctx.lineWidth = Math.max(.7, 1.3 * s)
    const ribs = Math.round(part.w / (11 * s))
    for (let r = 1; r < ribs; r++) {
      const x = part.x - part.w / 2 + part.w * r / ribs
      ctx.beginPath()
      ctx.moveTo(x, base)
      ctx.lineTo(x, base - part.h)
      ctx.stroke()
    }
    for (let r = 1; r <= 5; r++) {
      const y = base - part.h * .45 * r / 5
      ctx.beginPath()
      ctx.moveTo(part.x - part.w / 2, y)
      ctx.lineTo(part.x + part.w / 2, y)
      ctx.stroke()
    }
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath()
      ctx.ellipse(part.x, base - part.h * .45, part.w / 2 * (1 - r * .22), part.h * .55 * (1 - r * .22), 0, Math.PI, 0)
      ctx.stroke()
    }
    ctx.restore()
    ctx.beginPath()
    wing(part.x, part.w, part.h)
    ctx.strokeStyle = '#16261f'
    ctx.lineWidth = Math.max(.8, 1.5 * s)
    ctx.globalAlpha = .8
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  // The cupola on top, and a flag.
  dome(ctx, cx, base - h * .98, w * .085, seed + 1, { plants: LEAF })
  ctx.strokeStyle = '#16261f'
  ctx.lineWidth = Math.max(.8, 1.2 * s)
  ctx.beginPath()
  ctx.moveTo(cx, base - h * 1.06)
  ctx.lineTo(cx, base - h * 1.2)
  ctx.stroke()
  ctx.fillStyle = '#ef7f6e'
  ctx.beginPath()
  ctx.moveTo(cx, base - h * 1.2)
  ctx.lineTo(cx + 16 * s, base - h * 1.175)
  ctx.lineTo(cx, base - h * 1.15)
  ctx.fill()
  // The door, open, and the warm light inside.
  const dw = w * .07, dh = h * .3
  ctx.fillStyle = '#ffe2a2'
  ctx.beginPath()
  ctx.moveTo(cx - dw / 2, base)
  ctx.lineTo(cx - dw / 2, base - dh + dw / 2)
  ctx.arc(cx, base - dh + dw / 2, dw / 2, Math.PI, 0)
  ctx.lineTo(cx + dw / 2, base)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#16261f'
  ctx.lineWidth = Math.max(1, 2 * s)
  ctx.stroke()
  // The plinth it stands on.
  ctx.fillStyle = '#efe4c8'
  ctx.fillRect(cx - w * .54, base - 2 * s, w * 1.08, 8 * s)
  ctx.strokeStyle = 'rgba(22,38,31,.6)'
  ctx.lineWidth = Math.max(.6, s)
  ctx.strokeRect(cx - w * .54, base - 2 * s, w * 1.08, 8 * s)
}

const glasshouse_: Scene = {
  walk: [.42, .52],
  ground: () => .87,
  tone: at => at < .55 ? 'light' : 'dark',
  paint(ctx, W, H) {
    const s = H / 400
    const horizon = H * .52
    const base = H * .87
    const light: Vec = [-.5, -.8]

    // The bay: turquoise, deeper toward the shore, an island with its turbine, a sail.
    const sea = ctx.createLinearGradient(0, horizon, 0, H * .84)
    sea.addColorStop(0, '#8fd0dc')
    sea.addColorStop(.3, '#3fa3b8')
    sea.addColorStop(1, '#1f7088')
    ctx.fillStyle = sea
    ctx.fillRect(0, horizon, W, H - horizon)
    ctx.fillStyle = 'rgba(255,255,255,.7)'
    ctx.fillRect(0, horizon, W, 1.2)
    waves(ctx, 0, W, horizon, H * .8, '#e9fbff', 71, 18)
    far(ctx, W, H, .35, '#cfe6ee', layer => {
      layer.beginPath()
      layer.rect(0, 0, W, horizon + 1)
      layer.clip()
      const isle: Fn = x => horizon - 16 * s * bump((x / W - .2) / .07) - 6 * s * bump((x / W - .26) / .05) + 2
      hill(layer, W, H, isle, { top: '#5f9a6a', bottom: '#3d7a5e', depth: 20 * s, seed: 72 })
      turbine(layer, W * .2, isle(W * .2) + 1, 40 * s, .8)
      skyline(layer, W * .23, W * .29, isle(W * .26) + 2, 44 * s, 73)
    })
    // A sail out on the bay.
    ctx.fillStyle = '#fff8ea'
    ctx.beginPath()
    ctx.moveTo(W * .1, horizon + 22 * s)
    ctx.lineTo(W * .1, horizon - 4 * s)
    ctx.lineTo(W * .1 + 14 * s, horizon + 20 * s)
    ctx.fill()
    ctx.fillStyle = '#ef7f6e'
    ctx.fillRect(W * .1 - 9 * s, horizon + 22 * s, 24 * s, 3 * s)

    const shore: Fn = x => H * (.8 - .03 * smooth(0, W * .6, x) + .008 * Math.sin(x / W * 9))
    hill(ctx, W, H, shore, { top: '#f1e3bc', bottom: '#cdb98a', depth: H * .12, light: '#fffaf0', dark: '#b6a170', seed: 74, density: 1.2 })

    // The glasshouse on its lawn.
    const cx = Math.max(W * .72, W - H * .7)
    const lawn = ctx.createLinearGradient(0, base - 20 * s, 0, H)
    lawn.addColorStop(0, '#4f8f4a')
    lawn.addColorStop(1, '#10302b')
    ctx.fillStyle = lawn
    ctx.beginPath()
    ctx.moveTo(W * .3, H)
    ctx.quadraticCurveTo(W * .42, base - 10 * s, cx - H * .8, base - 6 * s)
    ctx.lineTo(W + 10, base - 8 * s)
    ctx.lineTo(W + 10, H)
    ctx.closePath()
    ctx.fill()
    glasshouse(ctx, cx, base, H * 1.15, H * .5, 80, light)
    cypress(ctx, cx - H * .66, base + 2 * s, 90 * s, LEAF, light, 81)
    cypress(ctx, cx + H * .68, base + 2 * s, 80 * s, LEAF, light, 82)
    tree(ctx, W * .4, base + 6 * s, 30 * s, BLOSSOM, light, 83)

    // The path to the door, the light of it lying along the gravel toward you.
    ctx.fillStyle = 'rgba(244,232,200,.92)'
    ctx.beginPath()
    ctx.moveTo(cx - 14 * s, base + 4 * s)
    ctx.lineTo(cx + 14 * s, base + 4 * s)
    ctx.lineTo(cx - 40 * s, H)
    ctx.lineTo(cx - 140 * s, H)
    ctx.closePath()
    ctx.fill()

    // Ferns and flower beds in the deep foreground, where the work is laid out.
    const dark = ctx.createLinearGradient(0, H * .88, 0, H)
    dark.addColorStop(0, 'rgba(16,48,43,0)')
    dark.addColorStop(.55, 'rgba(16,48,43,1)')
    ctx.fillStyle = dark
    ctx.fillRect(0, H * .88, W, H * .12 + 2)
    const rand = rng(85)
    const clumps = Array.from({ length: Math.round(W / 14) }, () => ({ x: rand() * W, y: H * (.95 + rand() * .06), r: (8 + rand() * 12) * s, lit: .2 + rand() * .5 })).sort((p, q) => p.y - q.y)
    foliage(ctx, clumps, SHADE, light, rand, .5)
    flowers(ctx, Math.round(W / 9), r => {
      const x = r() * W, d = r()
      return [x, H * (.92 + d * .06), (1.8 + d * 3) * s]
    }, 86, ['#ef7f6e', '#f7c844', '#f6efe0', '#c29be0'])
    const fade = ctx.createLinearGradient(0, H * .96, 0, H)
    fade.addColorStop(0, 'rgba(16,48,43,0)')
    fade.addColorStop(1, 'rgba(16,48,43,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, H * .96, W, H * .04 + 2)
    grain(ctx, W, H, 3)
  },
}

/* ------------------------------------------------------- IV · the wind farm */

const bigHill = (t: number) => .06 + .7 * Math.pow(clamp(t / .74), 2.1) + .2 * smooth(.74, 1.1, t)
const lakeside = (t: number) => .76 + .025 * Math.sin(t * 4.2 + 1)

const windfarm: Scene = {
  walk: [.78, .85],
  ground: t => lakeside(t) + .015,
  tone: at => at < .76 ? 'light' : 'dark',
  paint(ctx, W, H) {
    const s = H / 400
    const big: Fn = x => H * bigHill(x / W)
    hill(ctx, W, H, big, {
      top: '#6fa957', bottom: '#2c5a37', depth: H * .7, rim: '#e4f59a', rimSide: 1, rimStrength: .8,
      rows: '#4c8445', rowCount: 16, rowAlpha: .2, light: '#c3e38c', dark: '#1d4129', seed: 15, density: 1.4,
    })
    // One mark on the crest for every win in the list below: a turbine for each thing built, a flag for
    // each thing broken into, and a tower with a sun on it for the one that was given.
    cloudShadows(ctx, W, H, big, 19, '#123020', .22, 4)
    awards.forEach((award, index) => {
      const t = .32 + .4 * index / Math.max(1, awards.length - 1)
      const x = W * t, y = big(x) + 1.5
      // A turbine's blade reaches half its height again above the hub: these all clear the top of the painting.
      const tall = (44 + (index % 3) * 10) * s
      if (award.mode === 'built') { turbine(ctx, x, y, tall, index * 1.3 + .4, { light: 1, ink: .8 * s }); return }
      ctx.strokeStyle = '#16261f'
      ctx.lineWidth = Math.max(1, 1.2 * s)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y - tall * .6)
      ctx.stroke()
      if (award.mode === 'named') {
        const sun = ctx.createRadialGradient(x, y - tall * .66, 0, x, y - tall * .66, 16 * s)
        sun.addColorStop(0, 'rgba(255,214,90,.9)')
        sun.addColorStop(1, 'rgba(255,214,90,0)')
        ctx.fillStyle = sun
        ctx.fillRect(x - 16 * s, y - tall * .66 - 16 * s, 32 * s, 32 * s)
        ctx.fillStyle = '#f7b638'
        ctx.beginPath()
        ctx.arc(x, y - tall * .66, 5 * s, 0, 6.2832)
        ctx.fill()
        return
      }
      ctx.fillStyle = '#ef6f5e'
      ctx.beginPath()
      ctx.moveTo(x, y - tall * .6)
      ctx.lineTo(x + 11 * s, y - tall * .6 + 3.2 * s)
      ctx.lineTo(x, y - tall * .6 + 6.4 * s)
      ctx.fill()
    })

    // A second fold, lower on the same hill, with an orchard and a row of panels.
    const fold: Fn = x => H * (bigHill(x / W) + .14 + .1 * (x / W))
    hill(ctx, W, H, fold, { top: '#558f48', bottom: '#2a5636', depth: H * .4, rim: '#c9e68a', rimSide: 1, rimStrength: .5, rows: '#7fb35f', rowCount: 10, rowAlpha: .16, light: '#8fc271', dark: '#1a3d27', seed: 16 })
    cloudShadows(ctx, W, H, fold, 20, '#123020', .18, 3)
    for (let i = 0; i < 6; i++) {
      const x = W * (.66 + i * .045)
      standingPanel(ctx, x, Math.min(fold(x) + 26 * s, H * .74), 30 * s, { lean: 4 * s, legs: 5 * s })
    }
    const rand0 = rng(18)
    for (let i = 0; i < 9; i++) {
      const x = W * (.12 + rand0() * .34)
      tree(ctx, x, Math.min(fold(x) + (14 + rand0() * 30) * s, H * .76), (11 + rand0() * 6) * s, i % 4 ? LEAF : BLOSSOM, [.6, -.8], 17 + i)
    }

    // The meadow along the water.
    const field: Fn = x => H * lakeside(x / W)
    hill(ctx, W, H, field, { top: '#a6cf72', bottom: '#5e9a4f', depth: H * .1, rows: '#f2f8d8', rowCount: 5, rowAlpha: .25, light: '#e6f3b6', dark: '#3e7a3f', seed: 23, density: 1.5 })
    flowers(ctx, Math.round(W / 4), r => {
      const x = r() * W, d = r()
      return [x, field(x) + d * H * .05 + 2, (1.2 + d * 2) * s]
    }, 24, ['#f6f1e2', '#f7c844', '#ef8f7e', '#b49ae0'])

    // The lake: the sky in it, the hill upside down, and glints.
    const lakeTop = H * .86
    const water = ctx.createLinearGradient(0, lakeTop, 0, H)
    water.addColorStop(0, '#7fb2ea')
    water.addColorStop(.35, '#3c6ccc')
    water.addColorStop(1, '#1f4296')
    ctx.fillStyle = water
    ctx.beginPath()
    ctx.moveTo(0, lakeTop + 4 * s)
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, lakeTop + 3 * s * Math.sin(x * .02))
    ctx.lineTo(W, H + 2)
    ctx.lineTo(0, H + 2)
    ctx.closePath()
    ctx.fill()
    const rand = rng(25)
    ctx.fillStyle = 'rgba(255,255,255,.75)'
    for (let i = 0; i < 70; i++) {
      const d = rand()
      ctx.globalAlpha = .3 + (1 - d) * .5
      ctx.fillRect(rand() * W, lakeTop + 6 * s + d * H * .1, (6 + rand() * 20) * s, .9 * s)
    }
    ctx.globalAlpha = 1
    // Reeds at the edge.
    ctx.strokeStyle = 'rgba(40,80,40,.8)'
    ctx.lineWidth = Math.max(.6, .9 * s)
    ctx.beginPath()
    for (let i = 0; i < W / 6; i++) {
      const x = rand() * W, h = (4 + rand() * 9) * s
      ctx.moveTo(x, lakeTop + 3 * s)
      ctx.quadraticCurveTo(x + 1, lakeTop - h * .5, x + (rand() - .5) * 4, lakeTop - h)
    }
    ctx.stroke()
    const fade = ctx.createLinearGradient(0, H * .93, 0, H)
    fade.addColorStop(0, 'rgba(31,66,150,0)')
    fade.addColorStop(1, 'rgba(31,66,150,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, H * .93, W, H * .07 + 2)
    grain(ctx, W, H, 4)
  },
}

/* ------------------------------------------------------- V · the sunflowers */

const fieldNoise = noise1(61)
const fieldBack = (t: number) => .38 - .16 * bump((t - .8) / .34) + .06 * fieldNoise(t * 3) + .1 * smooth(.5, 0, t)
const fieldMid = (t: number) => .6 - .08 * bump((t - .2) / .3) + .04 * fieldNoise(t * 4 + 8)

const sunflowers_: Scene = {
  walk: [.3, .38],
  ground: t => fieldMid(t) + .01,
  tone: at => at < .55 ? 'light' : 'dark',
  paint(ctx, W, H) {
    const s = H / 400
    const light: Vec = [.7, -.7]
    const back: Fn = x => H * fieldBack(x / W)
    hill(ctx, W, H, back, {
      top: '#9cc46f', bottom: '#5f9452', depth: H * .4, rim: '#fff3c4', rimSide: 1, rimStrength: .6,
      rows: '#e7f2b5', rowCount: 14, rowAlpha: .22, light: '#d8eda4', dark: '#3e7240', seed: 41, density: 1.2,
    })
    // Agrivoltaics: rows of panels standing over the crops, in perspective up the far slope.
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 9; i++) {
        const x = W * (.42 + i * .055 + row * .02)
        if (x > W * .95) continue
        const y = back(x) + (12 + row * 16) * s
        standingPanel(ctx, x, y, (16 + row * 5) * s, { lean: (2 + row) * s, legs: (3 + row * 1.5) * s, glare: .3 })
      }
    }
    pod(ctx, W * .2, back(W * .2) + 8 * s, { w: 70 * s, h: 50 * s, light: 1, lit: '#ffe17a', shade: '#d49a2c', windows: [[-.05, .5, .22]], door: .25, antenna: true, vines: 3 }, 44)
    turbine(ctx, W * .12, back(W * .12) + 3 * s, 70 * s, 2.1, { light: 1, ink: .8 * s })
    cypress(ctx, W * .3, back(W * .3) + 4 * s, 46 * s, LEAF, light, 45)
    cypress(ctx, W * .33, back(W * .33) + 4 * s, 38 * s, LEAF, light, 46)
    tree(ctx, W * .9, back(W * .9) + 8 * s, 28 * s, LEAF, light, 47)

    const mid: Fn = x => H * fieldMid(x / W)
    hill(ctx, W, H, mid, {
      top: '#5d8f3e', bottom: '#1c3a1f', depth: H * .4, rim: '#fff0a6', rimSide: 1, rimStrength: .6,
      light: '#97c25c', dark: '#122a16', seed: 42, density: 1.3,
    })
    // The path through the field the figure walks along.
    ctx.fillStyle = 'rgba(214,180,120,.85)'
    ctx.beginPath()
    for (let x = 0; x <= W * .55; x += 6) ctx.lineTo(x, mid(x) + 2 * s - (x / W) * 2 * s)
    for (let x = W * .55; x >= 0; x -= 6) ctx.lineTo(x, mid(x) + (8 - x / W * 10) * s)
    ctx.fill()
    sunflowers(ctx, Math.round(W / 1.25), r => {
      const x = r() * W, d = Math.pow(r(), .8)
      const top = mid(x) + H * .02
      if (d < .08 && x < W * .55) return null
      return [x, mix(top, H * 1.02, d), (.9 + d * 7.5) * s]
    }, 43, .35)
    const fade = ctx.createLinearGradient(0, H * .9, 0, H)
    fade.addColorStop(0, 'rgba(28,58,31,0)')
    fade.addColorStop(1, 'rgba(28,58,31,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, H * .9, W, H * .1 + 2)
    grain(ctx, W, H, 5)
  },
}

/* ------------------------------------------------------- VI · the sky islands */

const CLOUD: Foliage = { dark: '#b9b8d8', mid: '#e3ddea', lit: '#fff4e2', dab: '#fffaf2', deep: '#a3a6cc' }
const ROCK = ['#7c5a5a', '#a06a58', '#c98a62', '#e3b17e', '#f4d1a0'] // shadow to sunlit sandstone

/** A floating island, cut in facets like the 3D ones below it: a meadow on top, a cone of rock hanging under it. */
function floating(ctx: Ctx, cx: number, cy: number, w: number, depth: number, seed: number, light: Vec, o: { falls?: boolean; trees?: Foliage; home?: boolean } = {}) {
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
  const facet = (points: Vec[]) => {
    const x = points.reduce((sum, p) => sum + p[0], 0) / points.length
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
    ctx.strokeStyle = 'rgba(70,40,40,.25)'
    facet([rim[i], rim[i + 1], mid[i + 1]])
    facet([rim[i], mid[i + 1], mid[i]])
    facet([mid[i], mid[i + 1], tip])
  }
  // Roots hanging out of the rock.
  vines(ctx, Array.from({ length: Math.round(w / 18) + 2 }, () => [cx + (rand() - .5) * w * 1.6, cy + lip * .5] as Vec), depth * .5, seed + 5, { ...LEAF, lit: '#7fb35c' })
  ctx.fillStyle = '#6b4a3c'
  ctx.beginPath()
  ctx.ellipse(cx, cy + lip * .18, w, lip, 0, 0, Math.PI)
  ctx.fill()
  const meadow = ctx.createLinearGradient(cx - w, cy - lip, cx + w, cy + lip)
  meadow.addColorStop(light[0] > 0 ? 1 : 0, '#c9e98c')
  meadow.addColorStop(.5, '#7fb85c')
  meadow.addColorStop(light[0] > 0 ? 0 : 1, '#3f7a45')
  ctx.fillStyle = meadow
  ctx.beginPath()
  ctx.ellipse(cx, cy, w, lip, 0, 0, 6.2832)
  ctx.fill()
  const specks: number[] = []
  for (let i = 0; i < w * lip / 6; i++) {
    const a = rand() * 6.2832, d = Math.sqrt(rand())
    specks.push(cx + Math.cos(a) * d * w * .95, cy + Math.sin(a) * d * lip * .9, .4 + rand() * .7)
  }
  dots(ctx, '#effad0', specks, .45)
  if (o.home) pod(ctx, cx + w * .2, cy + lip * .2, { w: w * .5, h: w * .3, light: light[0] > 0 ? 1 : -1, windows: [[-.1, .45, .2]], glow: true, door: .25, panels: true, vines: 3 }, seed + 9)
  const trees = Math.max(1, Math.round(w / 40))
  for (let i = 0; i < trees; i++) {
    const x = cx + (rand() - .65) * w * 1.2
    tree(ctx, x, cy + (rand() - .3) * lip * .6, w * (.12 + rand() * .1), o.trees ?? LEAF, light, seed * 10 + i)
  }
  if (o.falls) {
    // Water running off the edge and falling until it turns to mist.
    const x = cx - w * .45, top = cy + lip * .8, fall = depth * 2.6
    const water = ctx.createLinearGradient(0, top, 0, top + fall)
    water.addColorStop(0, 'rgba(236,250,255,.95)')
    water.addColorStop(.6, 'rgba(236,250,255,.45)')
    water.addColorStop(1, 'rgba(236,250,255,0)')
    ctx.fillStyle = water
    ctx.beginPath()
    ctx.moveTo(x - w * .05, top)
    ctx.bezierCurveTo(x - w * .02, top + fall * .3, x - w * .07, top + fall * .7, x - w * .1, top + fall)
    ctx.lineTo(x + w * .1, top + fall)
    ctx.bezierCurveTo(x + w * .05, top + fall * .7, x + w * .06, top + fall * .3, x + w * .05, top)
    ctx.fill()
  }
}

const isleNoise = noise1(91)
// The island underfoot: a meadow from the left edge to about two thirds across, then the drop.
const isleTop = (t: number) => .56 - .04 * bump((t - .3) / .2) + .02 * isleNoise(t * 5)

const islands: Scene = {
  walk: [.22, .34],
  ground: t => isleTop(t) + .005,
  tone: () => 'light',
  paint(ctx, W, H) {
    const s = H / 400
    const k = narrow(W, H)
    const light: Vec = [.7, -.65]
    const haze = '#efe2d4'

    far(ctx, W, H, .6, haze, layer => {
      floating(layer, W * mix(.44, .4, k), H * .16, 34 * s, 46 * s, 92, light)
      floating(layer, W * mix(.96, 1.04, k), H * .3, 48 * s, 60 * s, 93, light)
    })
    far(ctx, W, H, .32, haze, layer => {
      floating(layer, W * mix(.58, .62, k), H * .38, 40 * s, 50 * s, 95, light)
      aerostat(layer, W * mix(.52, .56, k), H * .1, 30 * s, { anchor: [W * mix(.58, .62, k), H * .38] })
    })
    floating(ctx, W * mix(.8, .82, k), H * .2, 96 * s, 124 * s, 96, light, { falls: true, home: true })
    aerostat(ctx, W * mix(.66, .6, k), H * .07, 40 * s, { anchor: [W * mix(.8, .82, k) - 30 * s, H * .2 - 4 * s] })

    // The sea of cloud, row on row: small, crowded and hazed far off, bigger and lower close to.
    const rand = rng(97)
    const ground = '#dfe9ec'
    for (let row = 0; row < 5; row++) {
      const clumps: { x: number; y: number; r: number; lit: number }[] = []
      const r = (14 + row * 11) * s
      const y = H * (.56 + row * .07)
      for (let x = -r; x < W + r; x += r * (.5 + rand() * .4)) {
        const py = y + (rand() - .5) * r * .6 - Math.max(0, Math.sin(x / W * 9 + row * 2)) * r * .5
        clumps.push({ x, y: py, r: r * (.7 + rand() * .6), lit: clamp(.85 - row * .1 + (x / W - .5) * .4) })
      }
      clumps.sort((a, b) => a.y - b.y)
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
      dots(ctx, CLOUD.dab, dabs, .55)
      const under = ctx.createLinearGradient(0, y, 0, H)
      under.addColorStop(0, CLOUD.dark)
      under.addColorStop(1, ground)
      ctx.fillStyle = under
      ctx.fillRect(0, y + r * .5, W, H)
      ctx.fillStyle = rgba(haze, Math.max(0, .3 - row * .07))
      ctx.fillRect(0, y - r * 2, W, H)
      // The island underfoot sits in the cloud between the second and third rows.
      if (row === 1) {
        const top: Fn = x => H * isleTop(x / W)
        const edge = W * mix(.52, .6, k)
        // The rock under it, hanging into the cloud.
        const rock = ctx.createLinearGradient(0, H * .5, 0, H * .95)
        rock.addColorStop(0, '#c98a62')
        rock.addColorStop(1, '#7c5a5a')
        ctx.fillStyle = rock
        ctx.beginPath()
        ctx.moveTo(-10, top(0) + 6 * s)
        for (let x = 0; x <= edge; x += 8) ctx.lineTo(x, top(x) + 6 * s)
        ctx.lineTo(edge * .9, H * .74)
        ctx.lineTo(edge * .62, H * .92)
        ctx.lineTo(edge * .3, H * .8)
        ctx.lineTo(-10, H * .86)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = 'rgba(70,40,40,.3)'
        ctx.lineWidth = .8
        ctx.beginPath()
        ctx.moveTo(edge * .62, H * .92); ctx.lineTo(edge * .55, top(edge * .55) + 6 * s)
        ctx.moveTo(edge * .3, H * .8); ctx.lineTo(edge * .2, top(edge * .2) + 6 * s)
        ctx.stroke()
        vines(ctx, Array.from({ length: 10 }, (_, i) => [edge * (i / 10) + 8 * s, top(edge * i / 10) + 8 * s] as Vec), 40 * s, 99)
        hill(ctx, edge, H, top, { top: '#a8d672', bottom: '#4f8a45', depth: 18 * s, rim: '#fff3c4', rimSide: 1, rimStrength: .8, light: '#e4f6b0', dark: '#3d7240', seed: 98, density: 1.4 })
        ctx.fillStyle = '#6b4a3c'
        ctx.fillRect(edge - 2, top(edge) - 2 * s, 3, 22 * s)
        flowers(ctx, Math.round(edge / 7), r => {
          const x = r() * edge * .97
          return [x, top(x) + r() * 10 * s + 2 * s, (1.2 + r() * 2) * s]
        }, 101, ['#f6f1e2', '#f7c844', '#ef8fa3', '#b49ae0'])
        tree(ctx, W * .06, top(W * .06) + 6 * s, 30 * s, LEAF, light, 100)
        lamp(ctx, edge * .78, top(edge * .78) + 3 * s, 34 * s, false)
      }
    }
    const fade = ctx.createLinearGradient(0, H * .9, 0, H)
    fade.addColorStop(0, rgba(ground, 0))
    fade.addColorStop(1, ground)
    ctx.fillStyle = fade
    ctx.fillRect(0, H * .9, W, H * .1 + 2)
    birds(ctx, [[W * .36, H * .3, 4 * s], [W * .39, H * .27, 3 * s], [W * .41, H * .32, 3.4 * s]], 'rgba(80,70,90,.5)')
    grain(ctx, W, H, 102, .7)
  },
}

/* --------------------------------------------------------- VII · the shore */

const beach = (t: number) => .64 + .07 * smooth(.2, 1, t) + .012 * Math.sin(t * 8)

/** The big white building on the beach: a long organic body on legs of shadow, windows lit for the evening. */
function whale(ctx: Ctx, x: number, ground: number, w: number, h: number, seed: number) {
  pod(ctx, x + w * .22, ground, { w: w * .46, h: h * .62, light: -1, lit: '#fff1dc', shade: '#d4a9a0', windows: [[-.2, .5, .1], [.1, .56, .07], [.28, .38, .05]], glow: true, door: -.04, vines: 3 }, seed + 1)
  pod(ctx, x - w * .18, ground, { w: w * .62, h, light: -1, lit: '#fff4e2', shade: '#d3a7a2', band: '#7fd6c6', windows: [[-.3, .46, .085], [-.1, .6, .065], [.1, .56, .08], [.3, .42, .05]], glow: true, door: .2, dome: .12, panels: true, antenna: true, vines: 6, squash: 2.3 }, seed)
}

const shore_: Scene = {
  walk: [.52, .6],
  ground: t => beach(t) + .1,
  tone: at => at > .3 && at < .64 ? 'dark' : 'light',
  paint(ctx, W, H) {
    const s = H / 400
    const k = narrow(W, H)
    const horizon = H * .3
    const sea = ctx.createLinearGradient(0, horizon, 0, H * .72)
    sea.addColorStop(0, '#e6a98e')
    sea.addColorStop(.18, '#5aa7b2')
    sea.addColorStop(1, '#1f6f88')
    ctx.fillStyle = sea
    ctx.fillRect(0, horizon, W, H - horizon)
    ctx.fillStyle = 'rgba(255,236,200,.75)'
    ctx.fillRect(0, horizon, W, 1.4)

    // Far off: an island town, and turbines out on the water.
    far(ctx, W, H, .45, '#f0b99a', layer => {
      layer.beginPath()
      layer.rect(0, 0, W, horizon + 1)
      layer.clip()
      const isle: Fn = x => horizon - 14 * s * bump((x / W - .14) / .1) + 2
      hill(layer, W, H, isle, { top: '#7f8f6e', bottom: '#5a6f5a', depth: 14 * s, seed: 79 })
      skyline(layer, W * .07, W * .22, isle(W * .14) + 1, 40 * s, 78, { light: 1 })
    })
    for (const [x, h, a] of [[.32, 36, .4], [.36, 30, 1.6], [.4, 34, 2.8]] as const) turbine(ctx, W * x, horizon + 2 * s, h * s, a, { light: 1, lit: '#fff0de', shade: '#d8a99c' })
    aerostat(ctx, W * mix(.36, .22, k), H * .08, 34 * s, { anchor: [W * mix(.42, .3, k), horizon + 8 * s], lit: '#fff1dc', shade: '#e3b9a3', deep: '#b88a8a' })

    // The sun's path on the water.
    const rand = rng(81)
    ctx.fillStyle = '#ffe2a8'
    for (let i = 0; i < 280; i++) {
      const d = Math.pow(rand(), 1.3)
      const w = mix(3, 18, d) * s * (.4 + rand())
      ctx.globalAlpha = mix(.95, .45, d)
      ctx.fillRect(W * .68 + (rand() - .5) * mix(16, 170, d) * s - w / 2, mix(horizon + 2, H * .66, d), w, mix(.8, 2, d) * s)
    }
    ctx.globalAlpha = 1
    waves(ctx, 0, W, horizon, H * .68, '#f2fbff', 82, 18)
    // Two sails heading home.
    for (const [x, y, z] of [[.5, .4, 1], [.58, .36, .7]] as const) {
      ctx.fillStyle = '#fff4e0'
      ctx.beginPath()
      ctx.moveTo(W * x, H * y)
      ctx.lineTo(W * x, H * y - 24 * s * z)
      ctx.lineTo(W * x + 14 * s * z, H * y - 2 * s)
      ctx.fill()
    }

    const sandEdge: Fn = x => H * beach(x / W)
    hill(ctx, W, H, sandEdge, { top: '#f7e2b4', bottom: '#efd6a4', depth: H * .22, light: '#fff8e6', dark: '#d5b47a', seed: 83, density: 1.5 })
    ctx.fillStyle = 'rgba(255,255,255,.85)'
    ctx.beginPath()
    for (let x = 0; x <= W; x += 6) ctx.lineTo(x, sandEdge(x) + 2 + Math.sin(x * .03) * 2)
    for (let x = W; x >= 0; x -= 6) ctx.lineTo(x, sandEdge(x) - 3 - Math.sin(x * .045) * 2)
    ctx.fill()

    // The building on the beach, the palms round it, the lamps coming on.
    const wx = W * mix(.86, .9, k)
    for (const [x, h, lean, seed] of [[.97, 150, -.08, 51], [.7, 120, .1, 52], [.74, 96, -.05, 53]] as const) palm(ctx, W * x, sandEdge(W * x) + 10 * s, h * s, lean, seed, '#2f4a35', '#6e9a4a')
    whale(ctx, wx, sandEdge(wx) + 16 * s, 260 * s, 120 * s, 54)
    for (const x of [.44, .63, .78]) lamp(ctx, W * x, sandEdge(W * x) + 20 * s, 42 * s, true)
    parasol(ctx, W * .3, sandEdge(W * .3) + 26 * s, 34 * s, ['#ef7f6e', '#fff4e0'], -.1)
    parasol(ctx, W * .38, sandEdge(W * .38) + 30 * s, 28 * s, ['#7fd6c6', '#fff4e0'], .1)

    // One last cypress hedge on the left, and the flowers that have followed the whole way.
    for (const [x, h, seed] of [[.02, 150, 84], [.08, 110, 85], [.14, 80, 86]] as const) cypress(ctx, W * x, H * .9, h * s, GOLD, [.8, -.55], seed)
    flowers(ctx, Math.round(W / 6), r => {
      const x = Math.pow(r(), 2.4) * W * .5, d = Math.pow(r(), .7)
      return [x, H * (.82 + d * .17 - .06 * x / W), (1.8 + d * 4) * s]
    }, 85, ['#ef7f6e', '#f7c844', '#fff4e0'])
    grain(ctx, W, H, 6, .8)
  },
}

/* --------------------------------------------------------------- dissolve */

/** The ground under each plate thins out into haze before the next sky begins. */
export function dissolve(color: string): Scene['paint'] {
  return (ctx, W, H) => {
    const mist = ctx.createLinearGradient(0, 0, 0, H)
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      mist.addColorStop(t, rgba(color, Math.pow(1 - t, 2.2)))
    }
    ctx.fillStyle = mist
    ctx.fillRect(0, 0, W, H)
    // A little of the ground's pigment carried up into it.
    const rand = rng(W | 0)
    const specks: number[] = []
    const count = Math.round(W * H / 150)
    for (let i = 0; i < count; i++) specks.push(rand() * W, Math.pow(rand(), 2) * H * .7, .4 + rand() * .7)
    dots(ctx, color, specks, .3)
  }
}

/* --------------------------------------------------------------- project windows */

function sky(ctx: Ctx, W: number, H: number, stops: [number, string][], stars = 0, seed = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  for (const [at, colour] of stops) g.addColorStop(at, colour)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  if (!stars) return
  const rand = rng(seed)
  const points: number[] = []
  for (let i = 0; i < stars; i++) points.push(rand() * W, Math.pow(rand(), 1.4) * H * .62, .4 + rand() * .8)
  dots(ctx, '#fff6dc', points, .8)
}

function sun(ctx: Ctx, x: number, y: number, r: number, color = '#fff2c8') {
  const halo = ctx.createRadialGradient(x, y, r, x, y, r * 7)
  halo.addColorStop(0, rgba(color, .45))
  halo.addColorStop(1, rgba(color, 0))
  ctx.fillStyle = halo
  ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 6.2832)
  ctx.fill()
}

// Mamdani: a street in the blue hour, windows lit, before the city is up.
const signal: Scene = {
  paint(ctx, W, H) {
    const s = H / 500
    sky(ctx, W, H, [[0, '#1d2f6e'], [.4, '#5b5fa8'], [.56, '#f2a07c']], 60, 141)
    sun(ctx, W * .3, H * .52, W * .035, '#ffe0a8')
    const n = noise1(142)
    far(ctx, W, H, .35, '#a77fa8', layer => skyline(layer, W * .45, W * 1.05, H * .56, 150 * s, 140, { lit: '#ffd9c0', shade: '#6c6aa8', green: '#4e7a62', light: -1 }))
    hill(ctx, W, H, x => H * (.56 + .03 * n(x / W * 4)), { top: '#3c5a6a', bottom: '#22344a', depth: H * .2, seed: 143 })
    // The street: pods either side, lit from inside, under the trees.
    for (const [x, w, h, glow, seed] of [[.12, 120, 76, true, 144], [.88, 140, 88, true, 145], [.72, 70, 44, false, 146], [.26, 60, 38, true, 147]] as const) {
      pod(ctx, W * x, H * (.62 + w / 2400), { w: w * s, h: h * s, light: 1, lit: '#c8c6e6', shade: '#58608e', windows: [[-.15, .5, .17], [.2, .4, .1]], glow, panels: w > 100, vines: 3 }, seed)
    }
    hill(ctx, W, H, x => H * (.66 + .02 * n(x / W * 3 + 6) - .03 * bump((x / W - .5) / .32)), { top: '#2f4658', bottom: '#14223a', depth: H * .4, rows: '#5b7590', rowCount: 12, rowAlpha: .16, light: '#5a7690', dark: '#0f1a2e', seed: 148, density: 1.1 })
    tree(ctx, W * .04, H * .74, W * .1, SHADE, [.7, -.6], 149)
    tree(ctx, W * .96, H * .8, W * .11, SHADE, [.7, -.6], 150)
    for (const x of [.34, .66]) lamp(ctx, W * x, H * .74, 54 * s, true)
    grain(ctx, W, H, 151)
  },
}

// Clascade: a valley terraced down to a waterfall, each level falling into the next.
const cascade: Scene = {
  paint(ctx, W, H) {
    const s = H / 500
    sky(ctx, W, H, [[0, '#2a64c4'], [.5, '#8fc3ea'], [.62, '#e9f2e0']])
    sun(ctx, W * .78, H * .14, W * .03)
    const n = noise1(103)
    far(ctx, W, H, .4, '#cfe3ea', layer => {
      hill(layer, W, H, x => H * (.42 + .05 * n(x / W * 4)), { top: '#79a874', bottom: '#4f8458', depth: H * .3, seed: 104 })
      turbine(layer, W * .2, H * .42, 60 * s, 1, { light: 1 })
      turbine(layer, W * .3, H * .43, 50 * s, 2.2, { light: 1 })
    })
    const slope: Fn = x => H * (.5 + .1 * Math.pow(x / W, 1.4))
    hill(ctx, W, H, slope, { top: '#76ad5c', bottom: '#20492f', depth: H * .5, seed: 105 })
    terraces(ctx, W, slope, [24, 52, 84, 120, 160, 204].map(v => v * s), { wall: '#f5e3bb', shadow: '#10301e', rows: '#24462e', seed: 106 })
    // The fall, from level to level.
    const water = ctx.createLinearGradient(0, H * .5, 0, H)
    water.addColorStop(0, 'rgba(230,250,255,.95)')
    water.addColorStop(1, 'rgba(160,220,240,.6)')
    ctx.fillStyle = water
    ctx.beginPath()
    ctx.moveTo(W * .82, H * .52)
    ctx.bezierCurveTo(W * .84, H * .7, W * .8, H * .85, W * .86, H)
    ctx.lineTo(W * .96, H)
    ctx.bezierCurveTo(W * .9, H * .85, W * .92, H * .7, W * .88, H * .52)
    ctx.fill()
    tree(ctx, W * .1, H * .82, W * .1, LEAF, [-.6, -.7], 107)
    grain(ctx, W, H, 108)
  },
}

// Revenant: the treetop city at night, the stars over it, every window a thread back to something.
const trail: Scene = {
  paint(ctx, W, H) {
    const s = H / 500
    sky(ctx, W, H, [[0, '#0d1638'], [.55, '#253a6e'], [.8, '#3f5f7a']], 260, 111)
    const rand = rng(112)
    // Great trees with pods in their crowns and walkways strung between them.
    const trunks = [[.16, .55], [.52, .42], [.88, .5]]
    ctx.strokeStyle = 'rgba(255,214,140,.55)'
    ctx.lineWidth = 1.4 * s
    ctx.beginPath()
    ctx.moveTo(W * .16, H * .66); ctx.quadraticCurveTo(W * .34, H * .7, W * .52, H * .6)
    ctx.moveTo(W * .52, H * .66); ctx.quadraticCurveTo(W * .7, H * .72, W * .88, H * .64)
    ctx.stroke()
    for (const [x, top] of trunks) {
      ctx.fillStyle = '#1a2a2a'
      ctx.fillRect(W * x - 7 * s, H * top, 14 * s, H)
      const clumps = Array.from({ length: 16 }, () => ({ x: W * x + (rand() - .5) * 110 * s, y: H * top - rand() * 70 * s + 20 * s, r: (18 + rand() * 18) * s, lit: .1 + rand() * .3 }))
      foliage(ctx, clumps, { dark: '#132a26', mid: '#1f3f38', lit: '#3f6a5a', dab: '#7fb39a', deep: '#0a1a18' }, [.5, -.6], rand, .5)
      porthole(ctx, W * x - 18 * s, H * top + 28 * s, 9 * s, true)
      porthole(ctx, W * x + 20 * s, H * top + 44 * s, 6 * s, true)
    }
    const floor = ctx.createLinearGradient(0, H * .82, 0, H)
    floor.addColorStop(0, 'rgba(10,22,24,0)')
    floor.addColorStop(.4, '#0d1c1e')
    ctx.fillStyle = floor
    ctx.fillRect(0, H * .82, W, H * .18 + 2)
    // Fireflies.
    const flies: number[] = []
    for (let i = 0; i < 40; i++) flies.push(rand() * W, H * (.6 + rand() * .38), .6 + rand() * 1.2)
    dots(ctx, '#e8ff9a', flies, .8)
    grain(ctx, W, H, 114)
  },
}

// QueryForge: still water with panels floating on it, the evening in the water.
const reflection: Scene = {
  paint(ctx, W, H) {
    const s = H / 500
    sky(ctx, W, H * .56, [[0, '#24346e'], [.7, '#7c6aa8'], [1, '#f0a48a']], 70, 121)
    sun(ctx, W * .7, H * .4, W * .04, '#ffe2b0')
    far(ctx, W, H, .3, '#b98aa0', layer => {
      hill(layer, W, H, x => H * (.5 - .08 * bump((x / W - .3) / .2) - .05 * bump((x / W - .85) / .15)), { top: '#5a6a7a', bottom: '#40506a', depth: H * .1, seed: 122 })
      skyline(layer, W * .2, W * .4, H * .44, 70 * s, 123, { lit: '#ffd4c0', shade: '#6a6aa0', light: 1 })
    })
    // Still water: the same sky, upside down and a little bluer.
    const water = ctx.createLinearGradient(0, H * .55, 0, H)
    water.addColorStop(0, '#8a7aa8')
    water.addColorStop(.12, '#3f5f9e')
    water.addColorStop(1, '#16305e')
    ctx.fillStyle = water
    ctx.fillRect(0, H * .55, W, H * .45)
    ctx.fillStyle = rgba('#ffe2b0', .6)
    ctx.beginPath()
    ctx.ellipse(W * .7, H * .7, W * .04, W * .015, 0, 0, 6.2832)
    ctx.fill()
    // Floating panels, in rows, getting bigger toward you.
    for (let row = 0; row < 4; row++) {
      const y = H * (.6 + row * .055 + row * row * .012), size = (14 + row * 9) * s
      for (let i = -1; i < 6; i++) {
        const x = W * (.05 + i * .2 + (row % 2) * .1)
        if (x > W * .52 && x < W * .88 && row > 0) continue
        panel(ctx, [[x, y], [x + size * 1.6, y], [x + size * 1.9, y + size * .5], [x + size * .3, y + size * .5]], { cols: 4, rows: 2, sky: '#9a86c0', deep: '#1c2f6a', glare: .2 })
      }
    }
    ctx.strokeStyle = 'rgba(220,235,255,.18)'
    ctx.lineWidth = 1
    const rand = rng(124)
    for (let i = 0; i < 46; i++) {
      const y = H * (.57 + Math.pow(rand(), .8) * .42), x = rand() * W, w = 14 + rand() * 60
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255,214,170,.7)'
    ctx.fillRect(0, H * .55 - .5, W, 1.2)
    grain(ctx, W, H, 125)
  },
}

export const scenes = { terraces: terraces_, gardens, glasshouse: glasshouse_, windfarm, sunflowers: sunflowers_, islands, shore: shore_, signal, cascade, trail, reflection }
export type SceneName = keyof typeof scenes

/** Ground colour under each plate. The painting ends in it and the page carries on in it. */
export const GROUND = {
  terraces: '#173a2a',
  gardens: '#ece3c5',
  glasshouse: '#10302b',
  windfarm: '#1f4296',
  sunflowers: '#1c3a1f',
  islands: '#dfe9ec',
  shore: '#efd6a4',
} as const
