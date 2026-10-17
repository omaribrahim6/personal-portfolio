import { hex } from '../paint/core'

// What the sky looks like over each plate: one day, from sunrise over the terraces to the golden hour on the
// shore. The shader is given a blend of two neighbours while you scroll between them, so the day never cuts:
// the cumulus sails off, the sun climbs over the top and comes down again, the light warms.
// Positions: x is a fraction of the width, y a fraction of the height measured from the bottom.
// Each position has a landscape value and a portrait one.

type Pair<T> = [T, T]
type Key = {
  top: string; mid: string; low: string
  glow: string; glowAt: [number, number]
  stars: number
  orb: Pair<[number, number, number]>; orbCol: string; orbAmount: number; halo: number
  a: Pair<[number, number, number]>; aAlpha: number
  aLit: string; aShade: string; aDeep: string; aTop: string
  b: Pair<[number, number, number]>; bAlpha: number
  bLit: string; bShade: string; bDeep: string; bTop: string
}

// White cumulus on a blue day: warm where the sun is on it, the blue of the sky in its shadows.
const noonCloud = { lit: '#fffbf0', shade: '#b4c6ea', deep: '#7a93cf', top: '#ffffff' }
const day = (c: typeof noonCloud, prefix: 'a' | 'b') => ({ [`${prefix}Lit`]: c.lit, [`${prefix}Shade`]: c.shade, [`${prefix}Deep`]: c.deep, [`${prefix}Top`]: c.top }) as Record<string, string>
const A = (c: typeof noonCloud) => day(c, 'a') as Pick<Key, 'aLit' | 'aShade' | 'aDeep' | 'aTop'>
const B = (c: typeof noonCloud) => day(c, 'b') as Pick<Key, 'bLit' | 'bShade' | 'bDeep' | 'bTop'>

const sunrise = { lit: '#ffdcb6', shade: '#c4b2d8', deep: '#8f80bf', top: '#fff0e6' }
const morning = { lit: '#fff6e4', shade: '#adbde6', deep: '#7186c4', top: '#ffffff' }
const afternoon = { lit: '#fff1d4', shade: '#b8bfe3', deep: '#8189c6', top: '#fffaf0' }
const golden = { lit: '#ffc988', shade: '#c88fa6', deep: '#7c5c94', top: '#ffe2c0' }

export const keys: Key[] = [
  { // I · the terraces, sunrise: a tall cumulus catching the first light, the sun just clear of the hills
    top: '#4a5db4', mid: '#c49cc2', low: '#ffcf98',
    glow: '#ffb06a', glowAt: [.24, .85], stars: .12,
    orb: [[.52, .4, .03], [.7, .52, .032]], orbCol: '#fff3cf', orbAmount: 1, halo: .62,
    a: [[.79, .3, .37], [.66, .3, .2]], aAlpha: 1, ...A(sunrise),
    b: [[-.6, .2, .4], [-.8, .3, .2]], bAlpha: 0, ...B(morning),
  },
  { // II · the gardens, morning
    top: '#3a68cb', mid: '#89b6e8', low: '#eef0d6',
    glow: '#fff1c6', glowAt: [.2, .45], stars: 0,
    orb: [[.66, .66, .022], [.72, .7, .02]], orbCol: '#fff8e4', orbAmount: 1, halo: .42,
    a: [[1.42, .26, .4], [1.7, .3, .22]], aAlpha: 1, ...A(morning),
    b: [[-.6, .2, .4], [-.8, .3, .2]], bAlpha: 0, ...B(morning),
  },
  { // III · the glasshouse, late morning: the sky deepening, a cloud building low on the right
    top: '#2858c4', mid: '#69a2e6', low: '#d5e9f0',
    glow: '#f4f2da', glowAt: [.2, .3], stars: 0,
    orb: [[.6, .86, .02], [.7, .9, .018]], orbCol: '#fffaee', orbAmount: 1, halo: .36,
    a: [[1.9, .2, .4], [2.2, .26, .2]], aAlpha: 0, ...A(noonCloud),
    b: [[1.06, .06, .3], [1.2, .2, .2]], bAlpha: .85, ...B(morning),
  },
  { // IV · the wind farm, noon: deep ultramarine overhead, the bank of white behind the hill
    top: '#1c4ab4', mid: '#5893df', low: '#cfe4f0',
    glow: '#ffffff', glowAt: [.16, .26], stars: 0,
    orb: [[.56, .66, .021], [.78, .7, .018]], orbCol: '#fffdf4', orbAmount: 1, halo: .34,
    a: [[1.9, .2, .4], [2.2, .26, .2]], aAlpha: 0, ...A(noonCloud),
    b: [[.8, .13, .31], [.8, .3, .2]], bAlpha: 1, ...B(noonCloud),
  },
  { // V · the sunflower field, early afternoon: the haze warming
    top: '#2858bd', mid: '#76a8e4', low: '#f2e6c2',
    glow: '#ffe6a6', glowAt: [.26, .38], stars: 0,
    orb: [[.72, .84, .02], [.74, .9, .018]], orbCol: '#fff6dc', orbAmount: 1, halo: .38,
    a: [[1.9, .2, .4], [2.2, .26, .2]], aAlpha: 0, ...A(noonCloud),
    b: [[.9, .24, .27], [.92, .4, .17]], bAlpha: 1, ...B(afternoon),
  },
  { // VI · the sky islands, late afternoon: high over a sea of cloud, the sun lowering
    top: '#4772c8', mid: '#a9c4e8', low: '#fde2bd',
    glow: '#ffd596', glowAt: [.32, .52], stars: 0,
    orb: [[.8, .62, .026], [.76, .66, .024]], orbCol: '#fff2d2', orbAmount: 1, halo: .42,
    a: [[1.9, .2, .4], [2.2, .26, .2]], aAlpha: 0, ...A(noonCloud),
    b: [[1.12, .3, .22], [1.1, .46, .14]], bAlpha: .6, ...B(afternoon),
  },
  { // VII · the shore, the golden hour: the first stars at the very top
    top: '#55599f', mid: '#e3988a', low: '#ffc877',
    glow: '#ffae58', glowAt: [.5, .72], stars: .22,
    orb: [[.68, .5, .05], [.64, .6, .046]], orbCol: '#fff0c4', orbAmount: 1, halo: .56,
    a: [[1.9, .2, .4], [2.2, .26, .2]], aAlpha: 0, ...A(golden),
    b: [[1.02, .46, .2], [1.0, .58, .12]], bAlpha: 1, ...B(golden),
  },
]

const rgb = (color: string) => hex(color).map(v => v / 255) as [number, number, number]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerp3 = <T extends number[]>(a: T, b: T, t: number) => a.map((v, i) => lerp(v, b[i], t)) as T

export type SkyState = {
  top: number[]; mid: number[]; low: number[]; glow: number[]; glowAt: number[]
  stars: number; orb: number[]; orbCol: number[]; halo: number
  a: number[]; aLit: number[]; aShade: number[]; aDeep: number[]; aTop: number[]
  b: number[]; bLit: number[]; bShade: number[]; bDeep: number[]; bTop: number[]
}

type Colour = 'top' | 'mid' | 'low' | 'glow' | 'orbCol' | 'aLit' | 'aShade' | 'aDeep' | 'aTop' | 'bLit' | 'bShade' | 'bDeep' | 'bTop'

/** The sky at a fractional chapter, for a viewport of the given aspect ratio. */
export function skyAt(chapter: number, aspect: number): SkyState {
  const c = Math.min(keys.length - 1, Math.max(0, chapter))
  const i = Math.min(keys.length - 2, Math.floor(c))
  const raw = c - i
  const t = raw * raw * (3 - 2 * raw)
  const from = keys[i], to = keys[i + 1]
  const portrait = Math.min(1, Math.max(0, (1.25 - aspect) / .45))
  const place = (k: Key, name: 'orb' | 'a' | 'b') => lerp3(k[name][0], k[name][1], portrait)
  const color = (name: Colour) => lerp3(rgb(from[name]), rgb(to[name]), t)
  return {
    top: color('top'), mid: color('mid'), low: color('low'), glow: color('glow'),
    glowAt: lerp3(from.glowAt, to.glowAt, t),
    stars: lerp(from.stars, to.stars, t),
    orb: [...lerp3(place(from, 'orb'), place(to, 'orb'), t), lerp(from.orbAmount, to.orbAmount, t)],
    orbCol: color('orbCol'), halo: lerp(from.halo, to.halo, t),
    a: [...lerp3(place(from, 'a'), place(to, 'a'), t), lerp(from.aAlpha, to.aAlpha, t)],
    aLit: color('aLit'), aShade: color('aShade'), aDeep: color('aDeep'), aTop: color('aTop'),
    b: [...lerp3(place(from, 'b'), place(to, 'b'), t), lerp(from.bAlpha, to.bAlpha, t)],
    bLit: color('bLit'), bShade: color('bShade'), bDeep: color('bDeep'), bTop: color('bTop'),
  }
}

/** A plain gradient of the same sky, shown before the shader starts and wherever WebGL is unavailable. */
export function skyGradient(chapter: number) {
  const k = keys[Math.min(keys.length - 1, Math.max(0, Math.round(chapter)))]
  return `linear-gradient(to top, ${k.low} 8%, ${k.mid} 50%, ${k.top} 100%)`
}
