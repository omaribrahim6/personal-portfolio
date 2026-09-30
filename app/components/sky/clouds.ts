import { rng } from '../paint/core'

// A cloud is a union of spheres. The big ones set the silhouette, smaller ones grow on their rims the
// way cauliflower does, and smaller ones again on those.
// `from` is the lobe it buds out of (-1 for the ones that rise from the base), which is where it starts when it grows.
type Lobe = { x: number; y: number; r: number; z: number; delay: number; from: number }
export type Cloud = { lobes: Lobe[]; /** The part of cloud space the lobes occupy: x, y, width, height. */ box: [number, number, number, number] }
export type Shape = { data: Uint8Array; width: number; height: number }

function grow(parents: [number, number, number][], seed: number): Cloud {
  const rand = rng(seed)
  const top = Math.max(...parents.map(([, y, r]) => y + r))
  const all: Lobe[] = []
  // Buds on the rim of a lobe. Mostly the upper half and the sides: clouds are flat underneath.
  // Each sits a little nearer or further than its parent, which is what makes them overlap instead of tile.
  const bud = (from: number, size: [number, number], depth: number) => {
    const p = all[from]
    const a = (-.28 + rand() * 1.56) * Math.PI
    const reach = p.r * (.6 + rand() * .36)
    return all.push({
      x: p.x + Math.cos(a) * reach, y: p.y + Math.sin(a) * reach * .94,
      r: p.r * (size[0] + rand() * (size[1] - size[0])), z: p.z + (rand() - .25) * depth, delay: p.delay + .08 + rand() * .16, from,
    }) - 1
  }
  for (const [x, y, r] of parents) {
    const parent = all.push({ x, y, r, z: rand() * .3, delay: (y / top) * .4, from: -1 }) - 1
    for (let i = 0; i < 3; i++) bud(bud(parent, [.4, .62], .34), [.46, .68], .24)
  }
  // Anything that would hang below the base is kept in the list, so the others can still bud from it, but never drawn.
  const lobes = all.map(lobe => lobe.y > -.05 ? lobe : { ...lobe, r: 0 })
  const pad = .1
  const x0 = Math.min(...lobes.map(l => l.x - l.r)) - pad, x1 = Math.max(...lobes.map(l => l.x + l.r)) + pad
  const y0 = Math.min(...lobes.map(l => l.y - l.r)) - pad, y1 = Math.max(...lobes.map(l => l.y + l.r)) + pad
  return { lobes, box: [x0, y0, x1 - x0, y1 - y0] }
}

// The thunderhead over the ridge: a tall dome right of centre, shoulders stepping down either side.
export const thunderhead = grow([
  [.22, 1.12, .4], [-.2, .88, .36], [.64, .8, .34], [.1, .62, .44],
  [-.58, .58, .3], [.96, .47, .28], [-.92, .37, .24], [-.34, .33, .34],
  [.5, .3, .36], [1.28, .26, .2], [0, .08, .34],
  [-.7, .08, .26], [.92, .08, .26],
], 11)

// The bank behind the hill and the field: wider than it is tall.
export const bank = grow([
  [-1.34, .52, .42], [-.76, .88, .46], [-.14, .62, .5], [.46, .98, .5],
  [1.06, .72, .46], [1.62, .46, .4], [.2, .2, .5], [-.62, .2, .45],
  [1.02, .15, .45], [-1.52, .1, .4], [1.84, .1, .35],
], 29)

const ramp = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t) }

// Working buffers, kept between calls so the opening does not allocate every frame.
let scratch: { size: number; height: Float32Array; shade: Float32Array; edge: Float32Array; nx: Float32Array; ny: Float32Array } | null = null

/**
 * Draw a cloud's shape into a small image: for every texel, the surface normal of whichever lobe is
 * nearest the viewer, how much a neighbouring lobe overhangs it, and whether there is any cloud there at all.
 * The sky shader only ever reads this image, so the cost of all those spheres is paid here, once, and each
 * lobe is only tested against the texels it can reach. `bloom` below 1 gives the cloud part-grown.
 */
export function shapeOf(cloud: Cloud, width: number, bloom = 1): Shape {
  const [x0, y0, bw, bh] = cloud.box
  const height = Math.round(width * bh / bw)
  const size = width * height
  if (!scratch || scratch.size !== size) {
    scratch = { size, height: new Float32Array(size), shade: new Float32Array(size), edge: new Float32Array(size), nx: new Float32Array(size), ny: new Float32Array(size) }
  }
  const { height: near, shade, edge, nx, ny } = scratch
  near.fill(-9); shade.fill(-9); edge.fill(0); nx.fill(0); ny.fill(0)
  const step = bw / width
  // Where each lobe is right now. Fully grown, that is simply where it belongs. While growing, the first
  // lobes rise out of the base and every bud swells out of the lobe it sits on, so nothing ever floats free.
  const cx: number[] = [], cy: number[] = []

  cloud.lobes.forEach((lobe, index) => {
    const grown = ramp(lobe.delay, lobe.delay + .45, bloom)
    const fromX = lobe.from < 0 ? lobe.x * .55 : cx[lobe.from], fromY = lobe.from < 0 ? lobe.y * .3 : cy[lobe.from]
    const lx = cx[index] = fromX + (lobe.x - fromX) * grown, ly = cy[index] = fromY + (lobe.y - fromY) * grown
    const r = lobe.r * grown
    if (r < step) return
    const rr = r * r, reach = r * 1.415
    const i0 = Math.max(0, Math.floor((lx - reach - x0) / step)), i1 = Math.min(width - 1, Math.ceil((lx + reach - x0) / step))
    const j0 = Math.max(0, Math.floor((ly - reach - y0) / step)), j1 = Math.min(height - 1, Math.ceil((ly + reach - y0) / step))
    for (let j = j0; j <= j1; j++) {
      const dy = y0 + (j + .5) * step - ly
      for (let i = i0; i <= i1; i++) {
        const dx = x0 + (i + .5) * step - lx
        const d2 = dx * dx + dy * dy
        if (d2 >= rr * 2) continue
        const k = j * width + i
        if (d2 < rr) {
          const rise = Math.sqrt(rr - d2)
          const inset = r - Math.sqrt(d2)
          if (inset > edge[k]) edge[k] = inset
          if (rise + lobe.z > near[k]) { near[k] = rise + lobe.z; nx[k] = dx / r; ny[k] = dy / r }
        } else {
          // Just outside this lobe: if it stands nearer than whatever is visible here, it shades it.
          const over = (1 - (Math.sqrt(d2) - r) / (.42 * r)) * (lobe.z + r * .6)
          if (over > shade[k]) shade[k] = over
        }
      }
    }
  })

  const data = new Uint8Array(size * 4)
  for (let k = 0; k < size; k++) {
    data[k * 4] = (nx[k] * .5 + .5) * 255
    data[k * 4 + 1] = (ny[k] * .5 + .5) * 255
    data[k * 4 + 2] = ramp(-.04, .22, shade[k] - near[k]) * 255
    data[k * 4 + 3] = ramp(0, 2.5 * step, edge[k]) * 255
  }
  return { data, width, height }
}
