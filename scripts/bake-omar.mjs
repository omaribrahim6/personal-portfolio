// Turns Tripo's rigged model into the one the site ships.
//
//   node scripts/bake-omar.mjs
//
// Reads  .data/tripo/omar-rigged.glb
// Writes public/models/omar-rigged.glb
//
// Two things are fixed on the way, both to do with his arms and his clothes.
//
// His robe, his cape and he himself are one fused surface. The auto-rigger bound any cloth that hangs
// near an arm to that arm's bones, and where a forearm or hand rests against the robe the two are
// literally welded together. So lifting a hand dragged the hem of the cape up with it.
//
//   1. The weld is cut. The forearms and hands are found (close to the bone, facing away from it, the
//      right colour, and joined to each other), and the triangles that bridge them to the robe are removed.
//   2. The cloth is given back to the body. Around the upper arm the sleeve still follows the arm, with
//      "near" measured along the surface rather than through the air; everything further out goes to the spine.
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const SOURCE = '.data/tripo/omar-rigged.glb'
const TARGET = 'public/models/omar-rigged.glb'

// All distances are in model units; he is 1 tall.
const SLEEVE = { limb: .055, keep: .035, let: .1 } // the upper arm, and how far along the cloth its pull reaches
const ELBOW = .3 // the first part of the forearm stays joined to the sleeve it comes out of

const file = readFileSync(SOURCE)
const jsonLength = file.readUInt32LE(12)
const json = JSON.parse(file.subarray(20, 20 + jsonLength).toString())
const binStart = 20 + jsonLength + 8
// A private copy of the binary chunk, aligned, so typed arrays can sit on top of it.
const bin = new Uint8Array(file.subarray(binStart, binStart + file.readUInt32LE(20 + jsonLength))).slice()

const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }
const TYPE = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }
function accessor(index) {
  const a = json.accessors[index], view = json.bufferViews[a.bufferView]
  if (view.byteStride) throw new Error('interleaved buffers are not handled')
  return new TYPE[a.componentType](bin.buffer, (view.byteOffset ?? 0) + (a.byteOffset ?? 0), a.count * SIZE[a.type])
}

const primitive = json.meshes[0].primitives[0]
const position = accessor(primitive.attributes.POSITION)
const normal = accessor(primitive.attributes.NORMAL)
const joints = accessor(primitive.attributes.JOINTS_0)
const weights = accessor(primitive.attributes.WEIGHTS_0)
const index = accessor(primitive.indices)
const uv = accessor(primitive.attributes.TEXCOORD_0)
const count = position.length / 3

// His texture, so a vertex can be asked what colour it is.
const picture = json.bufferViews[json.images[json.textures[json.materials[0].pbrMetallicRoughness.baseColorTexture.index].source].bufferView]
const { data: texels, info: size } = await sharp(bin.subarray(picture.byteOffset ?? 0, (picture.byteOffset ?? 0) + picture.byteLength)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
function colourOf(v) {
  const x = Math.min(size.width - 1, Math.max(0, Math.round(uv[v * 2] * (size.width - 1))))
  const y = Math.min(size.height - 1, Math.max(0, Math.round(uv[v * 2 + 1] * (size.height - 1))))
  return [texels[(y * size.width + x) * 3], texels[(y * size.width + x) * 3 + 1], texels[(y * size.width + x) * 3 + 2]]
}

const skin = json.skins[0]
const names = skin.joints.map(node => json.nodes[node].name.replace(/^mixamorig:?/, ''))
const inverseBind = accessor(skin.inverseBindMatrices)

/** Where a bone sits in the bind pose: the translation of the inverse of its inverse bind matrix. */
function boneAt(name) {
  const m = inverseBind.subarray(names.indexOf(name) * 16, names.indexOf(name) * 16 + 16)
  // For a rotation R and translation t the inverse bind is [Rᵀ | -Rᵀt], so t = -R · (its translation).
  const [x, y, z] = [m[12], m[13], m[14]]
  return [-(m[0] * x + m[1] * y + m[2] * z), -(m[4] * x + m[5] * y + m[6] * z), -(m[8] * x + m[9] * y + m[10] * z)]
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const mixed = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
/** The nearest point to p on a line of joined segments: how far away, how far along, and the point itself. */
function nearest(p, line) {
  let best = { far: Infinity, along: 0, point: line[0] }, walked = 0
  for (let i = 0; i < line.length - 1; i++) {
    const ab = sub(line[i + 1], line[i]), length = Math.hypot(...ab)
    const t = Math.min(1, Math.max(0, dot(sub(p, line[i]), ab) / (length * length)))
    const point = mixed(line[i], line[i + 1], t)
    const far = Math.hypot(...sub(p, point))
    if (far < best.far) best = { far, along: walked + t * length, point }
    walked += length
  }
  return best
}

// ── the mesh as a graph ──
// Tripo splits vertices along texture seams, so first join the ones that share a place.
const welded = new Int32Array(count)
const places = new Map()
for (let v = 0; v < count; v++) {
  const key = `${Math.round(position[v * 3] * 1e4)},${Math.round(position[v * 3 + 1] * 1e4)},${Math.round(position[v * 3 + 2] * 1e4)}`
  if (!places.has(key)) places.set(key, places.size)
  welded[v] = places.get(key)
}
const total = places.size
const at = Array.from({ length: total })
const facing = Array.from({ length: total }, () => [0, 0, 0])
const colour = Array.from({ length: total }, () => [0, 0, 0])
/** How much of each welded point the rigger gave to each bone, averaged over the vertices that share it. */
const given = Array.from({ length: total }, () => new Map())
const shared = new Uint16Array(total)
for (let v = 0; v < count; v++) {
  const w = welded[v]
  at[w] ??= [position[v * 3], position[v * 3 + 1], position[v * 3 + 2]]
  for (let k = 0; k < 3; k++) facing[w][k] += normal[v * 3 + k]
  colourOf(v).forEach((c, k) => { colour[w][k] += c })
  for (let k = 0; k < 4; k++) if (weights[v * 4 + k] > 0) given[w].set(joints[v * 4 + k], (given[w].get(joints[v * 4 + k]) ?? 0) + weights[v * 4 + k])
  shared[w]++
}
for (let w = 0; w < total; w++) {
  for (const [bone, sum] of given[w]) given[w].set(bone, sum / shared[w])
  colour[w] = colour[w].map(c => c / shared[w])
}
// Skin and the orange bands of his wrist wraps; and the purples and pinks that only cloth has.
const isSkin = ([r, g, b]) => r > 150 && g > 85 && g < 195 && b < 135 && r - b > 65
const isCloth = ([r, g, b]) => { const max = Math.max(r, g, b); return max > 100 && b >= r - 12 && b > g + 12 }

const edges = Array.from({ length: total }, () => [])
for (let i = 0; i < index.length; i += 3) {
  for (const [a, b] of [[index[i], index[i + 1]], [index[i + 1], index[i + 2]], [index[i + 2], index[i]]]) {
    const u = welded[a], w = welded[b]
    if (u === w) continue
    const length = Math.hypot(...sub(at[u], at[w]))
    edges[u].push([w, length])
    edges[w].push([u, length])
  }
}

/** Distance from a set of starting points to every point, walking along the edges of the mesh. */
function alongSurface(starts, limit) {
  const far = new Float32Array(total).fill(Infinity)
  const heap = []
  const push = (d, v) => {
    heap.push([d, v])
    for (let i = heap.length - 1; i > 0;) { const up = (i - 1) >> 1; if (heap[up][0] <= heap[i][0]) break; [heap[up], heap[i]] = [heap[i], heap[up]]; i = up }
  }
  const pop = () => {
    const first = heap[0], last = heap.pop()
    if (heap.length) {
      heap[0] = last
      for (let i = 0; ;) {
        const l = i * 2 + 1, r = l + 1
        let small = i
        if (l < heap.length && heap[l][0] < heap[small][0]) small = l
        if (r < heap.length && heap[r][0] < heap[small][0]) small = r
        if (small === i) break
        ;[heap[small], heap[i]] = [heap[i], heap[small]]
        i = small
      }
    }
    return first
  }
  for (const v of starts) { far[v] = 0; push(0, v) }
  while (heap.length) {
    const [d, v] = pop()
    if (d > far[v] || d > limit) continue
    for (const [next, length] of edges[v]) if (d + length < far[next]) { far[next] = d + length; push(d + length, next) }
  }
  return far
}

// ── the arms ──
const arms = ['Left', 'Right'].map(side => {
  const shoulder = boneAt(`${side}Arm`), elbow = boneAt(`${side}ForeArm`), wrist = boneAt(`${side}Hand`)
  const forearm = Math.hypot(...sub(wrist, elbow))
  const fingers = mixed(elbow, wrist, 1 + .1 / forearm)
  const [upper, lower, hand] = ['Arm', 'ForeArm', 'Hand'].map(part => names.indexOf(side + part))
  const bone = [elbow, wrist, fingers]
  const length = forearm + .1

  // Points that are certainly forearm or hand: given almost wholly to those bones, and close to them.
  const sure = []
  for (let w = 0; w < total; w++) {
    if ((given[w].get(lower) ?? 0) + (given[w].get(hand) ?? 0) < .85) continue
    if (nearest(at[w], bone).far < .045) sure.push(w)
  }
  // The rigger's bone is only roughly inside the limb. A better centre line: the middle of those points, band by band.
  const BANDS = 8
  const bands = Array.from({ length: BANDS }, () => [])
  for (const w of sure) bands[Math.min(BANDS - 1, Math.floor(nearest(at[w], bone).along / length * BANDS))].push(w)
  const centre = [], radius = []
  bands.forEach(band => {
    if (band.length < 6) return
    const middle = [0, 1, 2].map(k => band.reduce((sum, w) => sum + at[w][k], 0) / band.length)
    const spread = band.map(w => Math.hypot(...sub(at[w], middle))).sort((a, b) => a - b)
    centre.push(middle)
    radius.push(Math.min(.062, Math.max(.03, spread[Math.floor(spread.length * .9)] + .008)))
  })

  // The limb: within reach of that centre line and facing away from it, and not cloth-coloured. A hand is
  // wider than a wrist, so anything skin-coloured a little further out, from the wrist down, counts too.
  // Then only what is joined to the sure points is kept.
  const reach = nearest(centre[centre.length - 1], centre).along
  const maybe = new Uint8Array(total)
  for (let w = 0; w < total; w++) {
    const n = nearest(at[w], centre)
    if (n.far > .09) continue
    const from = nearest(at[w], bone).along
    // Not above the elbow: that is sleeve.
    if (from <= 0 && Math.hypot(...sub(at[w], elbow)) > .03) continue
    const close = n.far <= radius[Math.round(n.along / reach * (radius.length - 1))] && dot(facing[w], sub(at[w], n.point)) >= -.15 * Math.hypot(...facing[w]) * n.far
    const below = from > forearm * ELBOW
    if (close && !(below && isCloth(colour[w]))) maybe[w] = 1
    else if (from > forearm * .6 && isSkin(colour[w])) maybe[w] = 1
  }
  const limb = new Uint8Array(total)
  const queue = sure.filter(w => maybe[w])
  for (const w of queue) limb[w] = 1
  while (queue.length) for (const [next] of edges[queue.pop()]) if (maybe[next] && !limb[next]) { limb[next] = 1; queue.push(next) }

  // The sleeve: cloth around the upper arm, which should still go where the arm goes.
  const sleeve = []
  for (let w = 0; w < total; w++) if ((given[w].get(upper) ?? 0) >= .6 && nearest(at[w], [shoulder, elbow]).far < SLEEVE.limb) sleeve.push(w)
  return { upper, lower, hand, elbow, bone, forearm, limb, size: limb.reduce((a, b) => a + b, 0), fromSleeve: alongSurface(sleeve, SLEEVE.let * 1.5) }
})

// ── 1. cut the weld ──
// A triangle with one foot on the limb and one on the cloth is the weld. Collapse it to nothing (three
// equal indices draw no pixels), except at the top of the forearm, where the limb really does join the sleeve.
let cut = 0
for (let i = 0; i < index.length; i += 3) {
  const corners = [welded[index[i]], welded[index[i + 1]], welded[index[i + 2]]]
  for (const arm of arms) {
    const on = corners.filter(w => arm.limb[w]).length
    if (on === 0 || on === 3) continue
    const middle = [0, 1, 2].map(k => (at[corners[0]][k] + at[corners[1]][k] + at[corners[2]][k]) / 3)
    if (nearest(middle, arm.bone).along < arm.forearm * ELBOW) continue
    index[i + 1] = index[i + 2] = index[i]
    cut++
    break
  }
}

// ── 2. give each side its own bones ──
const spine = ['Hips', 'Spine', 'Spine1', 'Spine2'].map(name => ({ index: names.indexOf(name), y: boneAt(name)[1] }))
/** The spine bones that should carry cloth at this height, and how much each. */
function body(y) {
  if (y <= spine[0].y) return [[spine[0].index, 1]]
  for (let i = 0; i < spine.length - 1; i++) {
    if (y <= spine[i + 1].y) { const t = (y - spine[i].y) / (spine[i + 1].y - spine[i].y); return [[spine[i].index, 1 - t], [spine[i + 1].index, t]] }
  }
  return [[spine[spine.length - 1].index, 1]]
}

let freed = 0
for (let v = 0; v < count; v++) {
  const w = welded[v]
  const bound = new Map()
  for (let k = 0; k < 4; k++) if (weights[v * 4 + k] > 0) bound.set(joints[v * 4 + k], (bound.get(joints[v * 4 + k]) ?? 0) + weights[v * 4 + k])
  const before = JSON.stringify([...bound])

  const owner = arms.find(arm => arm.limb[w])
  if (owner) {
    // Forearm and hand answer to the arm alone: nothing in the hips or the spine may hold them back.
    const along = nearest(at[w], owner.bone).along
    const chain = [owner.upper, owner.lower, owner.hand]
    const own = chain.map(bone => bound.get(bone) ?? 0)
    // Below the top of the forearm the upper arm has no say either.
    if (along > owner.forearm * ELBOW) own[0] = 0
    if (own[0] + own[1] + own[2] < .05) { own[1] = along < owner.forearm ? 1 : 0; own[2] = 1 - own[1] }
    bound.clear()
    chain.forEach((bone, k) => { if (own[k] > 0) bound.set(bone, own[k]) })
  } else {
    let released = 0
    for (const arm of arms) {
      // Cloth follows the upper arm if it is sleeve, and the forearm only right at the elbow it hangs from.
      const sleeve = 1 - smooth(SLEEVE.keep, SLEEVE.let, arm.fromSleeve[w])
      const rim = 1 - smooth(.035, .075, Math.hypot(...sub(at[w], arm.elbow)))
      for (const [bone, hold] of [[arm.upper, sleeve], [arm.lower, rim * sleeve], [arm.hand, 0]]) {
        const weight = bound.get(bone)
        if (!weight) continue
        bound.set(bone, weight * hold)
        released += weight * (1 - hold)
      }
    }
    if (released > 1e-4) for (const [bone, share] of body(position[v * 3 + 1])) bound.set(bone, (bound.get(bone) ?? 0) + released * share)
  }

  // glTF allows four influences per vertex: keep the strongest and make them sum to one again.
  const top = [...bound].filter(([, weight]) => weight > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4)
  if (JSON.stringify(top) === before) continue
  const sum = top.reduce((all, [, weight]) => all + weight, 0)
  for (let k = 0; k < 4; k++) {
    joints[v * 4 + k] = top[k]?.[0] ?? 0
    weights[v * 4 + k] = top[k] ? top[k][1] / sum : 0
  }
  freed++
}

// Same JSON, same layout: only indices and weights have changed.
const out = Buffer.from(file)
out.set(bin, binStart)
writeFileSync(TARGET, out)
console.log(`forearms and hands: ${arms.map(arm => arm.size).join(' and ')} points`)
console.log(`${cut} triangles cut where a limb was welded to the robe; ${freed} of ${count} vertices re-bound`)
console.log(`wrote ${TARGET} (${(out.length / 1e6).toFixed(2)} MB)`)
