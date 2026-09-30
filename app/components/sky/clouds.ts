import { rng } from '../paint/core'

// A cloud is a union of spheres. The big ones set the silhouette, smaller ones grow on their rims the
// way cauliflower does, and smaller ones again on those. The list is written straight into the shader
// source as constants.
type Lobe = { x: number; y: number; r: number; z: number; delay: number }

function grow(parents: [number, number, number][], seed: number): Lobe[] {
  const rand = rng(seed)
  const top = Math.max(...parents.map(([, y, r]) => y + r))
  const lobes: Lobe[] = []
  // Buds on the rim of a lobe. Mostly the upper half and the sides: clouds are flat underneath.
  // Each sits a little nearer or further than its parent, which is what makes them overlap instead of tile.
  const bud = (p: Lobe, size: [number, number], depth: number): Lobe => {
    const a = (-.28 + rand() * 1.56) * Math.PI
    const reach = p.r * (.6 + rand() * .36)
    return {
      x: p.x + Math.cos(a) * reach, y: p.y + Math.sin(a) * reach * .94,
      r: p.r * (size[0] + rand() * (size[1] - size[0])), z: p.z + (rand() - .25) * depth, delay: p.delay + .08 + rand() * .16,
    }
  }
  for (const [x, y, r] of parents) {
    const parent = { x, y, r, z: rand() * .3, delay: (y / top) * .4 }
    lobes.push(parent)
    for (let i = 0; i < 3; i++) {
      const child = bud(parent, [.4, .62], .34)
      lobes.push(child, bud(child, [.46, .68], .24))
    }
  }
  return lobes.filter(lobe => lobe.y > -.05)
}

const f = (n: number) => n.toFixed(3)

function cloud(parents: [number, number, number][], seed: number) {
  const lobes = grow(parents, seed)
  const pad = .1
  const x0 = Math.min(...lobes.map(l => l.x - l.r)) - pad, x1 = Math.max(...lobes.map(l => l.x + l.r)) + pad
  const y0 = Math.min(...lobes.map(l => l.y - l.r)) - pad, y1 = Math.max(...lobes.map(l => l.y + l.r)) + pad
  return {
    source: lobes.map(l => `L(${f(l.x)},${f(l.y)},${f(l.r)},${f(l.z)},${f(l.delay)})`).join('\n'),
    /** The part of cloud space the lobes occupy: x, y, width, height. */
    box: [x0, y0, x1 - x0, y1 - y0] as [number, number, number, number],
  }
}

// The thunderhead over the ridge: a tall dome right of centre, shoulders stepping down either side.
export const thunderhead = cloud([
  [.22, 1.12, .4], [-.2, .88, .36], [.64, .8, .34], [.1, .62, .44],
  [-.58, .58, .3], [.96, .47, .28], [-.92, .37, .24], [-.34, .33, .34],
  [.5, .3, .36], [1.28, .26, .2], [0, .08, .34],
  [-.7, .08, .26], [.92, .08, .26],
], 11)

// The bank behind the hill and the field: wider than it is tall.
export const bank = cloud([
  [-1.34, .52, .42], [-.76, .88, .46], [-.14, .62, .5], [.46, .98, .5],
  [1.06, .72, .46], [1.62, .46, .4], [.2, .2, .5], [-.62, .2, .45],
  [1.02, .15, .45], [-1.52, .1, .4], [1.84, .1, .35],
], 29)
