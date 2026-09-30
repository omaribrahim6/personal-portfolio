import { hex } from '../paint/core'

// What the sky looks like over each plate. The shader is given a blend of two neighbours while you scroll
// between them, so the night never cuts: the thunderhead sails off, the moon climbs, the sky pales.
// Positions: x is a fraction of the width, y a fraction of the height measured from the bottom.
// Each position has a landscape value and a portrait one.

type Pair<T> = [T, T]
type Key = {
  top: string; mid: string; low: string
  glow: string; glowAt: [number, number]
  stars: number
  orb: Pair<[number, number, number]>; orbCol: string; orbAmount: number; halo: number
  a: Pair<[number, number, number]>; aAlpha: number
  b: Pair<[number, number, number]>; bAlpha: number
  bLit: string; bShade: string; bDeep: string; bTop: string
}

const blueBank = { bLit: '#8494ea', bShade: '#3b47b6', bDeep: '#20287e', bTop: '#b3bcf3' }

export const keys: Key[] = [
  { // I · the ridge, night
    top: '#11123a', mid: '#36297a', low: '#8a4a8e',
    glow: '#f0596a', glowAt: [.3, .72], stars: 1,
    orb: [[.305, .84, .012], [.86, .905, .01]], orbCol: '#f3d3a6', orbAmount: 1, halo: .16,
    a: [[.715, .29, .385], [.6, .262, .19]], aAlpha: 1,
    b: [[-.6, .2, .4], [-.8, .3, .2]], bAlpha: 0, ...blueBank,
  },
  { // II · the dunes, deep night
    top: '#141d4d', mid: '#35357a', low: '#6d4a8c',
    glow: '#c9566c', glowAt: [.22, .3], stars: .9,
    orb: [[.66, .84, .02], [.72, .9, .017]], orbCol: '#efdcc0', orbAmount: 1, halo: .2,
    a: [[1.55, .2, .4], [1.9, .26, .2]], aAlpha: 1,
    b: [[-.6, .2, .4], [-.8, .3, .2]], bAlpha: 0, ...blueBank,
  },
  { // III · the arch, first light
    top: '#7c84c4', mid: '#b5b4d6', low: '#dcd9d0',
    glow: '#e6e0cc', glowAt: [.2, .2], stars: 0,
    orb: [[.82, .84, .016], [.8, .88, .014]], orbCol: '#f4f1e6', orbAmount: .55, halo: .08,
    a: [[1.9, .2, .4], [2.2, .26, .2]], aAlpha: 0,
    b: [[1.5, .1, .31], [1.9, .3, .2]], bAlpha: 0, ...blueBank,
  },
  { // IV · the hill, pale morning with a blue bank behind it
    top: '#c6c5bf', mid: '#d8d5c6', low: '#e4dfcc',
    glow: '#e9e3cf', glowAt: [.25, .2], stars: 0,
    orb: [[.47, .9, .014], [.78, .93, .012]], orbCol: '#f8f5ea', orbAmount: .5, halo: .06,
    a: [[1.9, .2, .4], [2.2, .26, .2]], aAlpha: 0,
    b: [[.8, .13, .31], [.8, .3, .2]], bAlpha: 1, ...blueBank,
  },
  { // V · the field
    top: '#bfc2c6', mid: '#d5d4c9', low: '#e6dfcd',
    glow: '#ecdcc6', glowAt: [.25, .3], stars: 0,
    orb: [[.44, .9, .014], [.74, .93, .012]], orbCol: '#f8f5ea', orbAmount: .4, halo: .06,
    a: [[1.9, .2, .4], [2.2, .26, .2]], aAlpha: 0,
    b: [[.9, .24, .27], [.92, .4, .17]], bAlpha: 1, bLit: '#8e9ced', bShade: '#414dbb', bDeep: '#252d86', bTop: '#bcc4f5',
  },
  { // VI · the shore, dawn
    top: '#d9cfc8', mid: '#efcdb0', low: '#f6b996',
    glow: '#ffd9b0', glowAt: [.34, .55], stars: 0,
    orb: [[.7, .6, .055], [.66, .62, .05]], orbCol: '#fff4dc', orbAmount: 1, halo: .5,
    a: [[1.9, .2, .4], [2.2, .26, .2]], aAlpha: 0,
    b: [[1.02, .46, .2], [1.0, .58, .12]], bAlpha: 1, bLit: '#f0a49a', bShade: '#8f83cb', bDeep: '#5a55a6', bTop: '#f5d2c4',
  },
]

const rgb = (color: string) => hex(color).map(v => v / 255) as [number, number, number]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerp3 = <T extends number[]>(a: T, b: T, t: number) => a.map((v, i) => lerp(v, b[i], t)) as T

export type SkyState = {
  top: number[]; mid: number[]; low: number[]; glow: number[]; glowAt: number[]
  stars: number; orb: number[]; orbCol: number[]; halo: number
  a: number[]; b: number[]; bLit: number[]; bShade: number[]; bDeep: number[]; bTop: number[]
}

/** The sky at a fractional chapter, for a viewport of the given aspect ratio. */
export function skyAt(chapter: number, aspect: number): SkyState {
  const c = Math.min(keys.length - 1, Math.max(0, chapter))
  const i = Math.min(keys.length - 2, Math.floor(c))
  const raw = c - i
  const t = raw * raw * (3 - 2 * raw)
  const from = keys[i], to = keys[i + 1]
  const portrait = Math.min(1, Math.max(0, (1.25 - aspect) / .45))
  const place = (k: Key, name: 'orb' | 'a' | 'b') => lerp3(k[name][0], k[name][1], portrait)
  const color = (name: 'top' | 'mid' | 'low' | 'glow' | 'orbCol' | 'bLit' | 'bShade' | 'bDeep' | 'bTop') => lerp3(rgb(from[name]), rgb(to[name]), t)
  return {
    top: color('top'), mid: color('mid'), low: color('low'), glow: color('glow'),
    glowAt: lerp3(from.glowAt, to.glowAt, t),
    stars: lerp(from.stars, to.stars, t),
    orb: [...lerp3(place(from, 'orb'), place(to, 'orb'), t), lerp(from.orbAmount, to.orbAmount, t)],
    orbCol: color('orbCol'), halo: lerp(from.halo, to.halo, t),
    a: [...lerp3(place(from, 'a'), place(to, 'a'), t), lerp(from.aAlpha, to.aAlpha, t)],
    b: [...lerp3(place(from, 'b'), place(to, 'b'), t), lerp(from.bAlpha, to.bAlpha, t)],
    bLit: color('bLit'), bShade: color('bShade'), bDeep: color('bDeep'), bTop: color('bTop'),
  }
}

/** A plain gradient of the same sky, shown before the shader starts and wherever WebGL is unavailable. */
export function skyGradient(chapter: number) {
  const k = keys[Math.min(keys.length - 1, Math.max(0, Math.round(chapter)))]
  return `linear-gradient(to top, ${k.low} 8%, ${k.mid} 50%, ${k.top} 100%)`
}
