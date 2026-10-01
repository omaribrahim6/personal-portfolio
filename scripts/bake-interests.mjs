// Turns the Tripo models for the interests chapter into the ones the site ships.
//
//   node scripts/bake-interests.mjs
//
// Reads  .data/tripo/interests/<name>.glb
// Writes public/models/interests/<name>.glb
//
// Tripo hands back one mesh, one 2048px JPEG, 32-bit floats everywhere and the model facing +X, about a
// unit across. On the way through, each model is
//
//   1. turned to face +Z (toward the camera), stood on y = 0 and centred over the origin,
//   2. scaled so that he is the same size in every one of them, whatever he is standing, sitting or riding on,
//   3. made much smaller to download: positions as 16-bit integers, normals as 8-bit, UVs as 16-bit
//      (KHR_mesh_quantization), indices as 16-bit, and the texture as a 1024px WebP (EXT_texture_webp).
//      three.js reads all of it without a decoder.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const SOURCE = '.data/tripo/interests'
const TARGET = 'public/models/interests'

// How tall each model ends up. Tripo makes every model a unit tall, whatever is in it, so his face
// (brow to chin, measured side by side from the front) came out anywhere from .115 to .163. These bring
// it to about .14 everywhere. The three outdoor ones meet halfway between matching faces and matching
// bodies, because he changes from one into the next in front of you.
const MODELS = {
  hike: .92,
  bike: 1.15,
  paddle: 1.15,
  podium: 1,
  soccer: 1.17,
}

const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }
const TYPE = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }

function read(file) {
  const data = readFileSync(file)
  const jsonLength = data.readUInt32LE(12)
  const json = JSON.parse(data.subarray(20, 20 + jsonLength).toString())
  const binStart = 20 + jsonLength + 8
  const bin = new Uint8Array(data.subarray(binStart, binStart + data.readUInt32LE(20 + jsonLength))).slice()
  const accessor = index => {
    const a = json.accessors[index], view = json.bufferViews[a.bufferView]
    if (view.byteStride) throw new Error('interleaved buffers are not handled')
    return new TYPE[a.componentType](bin.buffer, (view.byteOffset ?? 0) + (a.byteOffset ?? 0), a.count * SIZE[a.type])
  }
  const view = index => { const v = json.bufferViews[index]; return bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength) }
  return { json, accessor, view }
}

/** One GLB from a JSON document and the byte blocks its buffer views point at, in order. */
function write(file, json, blocks) {
  const views = []
  let length = 0
  for (const block of blocks) {
    views.push({ buffer: 0, byteOffset: length, byteLength: block.bytes.byteLength, ...(block.stride ? { byteStride: block.stride } : {}), ...(block.target ? { target: block.target } : {}) })
    length += block.bytes.byteLength
    length += (4 - (length % 4)) % 4
  }
  const bin = new Uint8Array(length)
  blocks.forEach((block, i) => bin.set(new Uint8Array(block.bytes.buffer, block.bytes.byteOffset, block.bytes.byteLength), views[i].byteOffset))
  json.bufferViews = views
  json.buffers = [{ byteLength: length }]
  let text = Buffer.from(JSON.stringify(json))
  text = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 0x20)])
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + text.length + 8 + bin.byteLength, 8)
  const chunk = (size, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(size, 0); b.writeUInt32LE(type, 4); return b }
  writeFileSync(file, Buffer.concat([header, chunk(text.length, 0x4e4f534a), text, chunk(bin.byteLength, 0x004e4942), Buffer.from(bin)]))
}

mkdirSync(TARGET, { recursive: true })

for (const [name, height] of Object.entries(MODELS)) {
  const { json, accessor, view } = read(`${SOURCE}/${name}.glb`)
  const primitive = json.meshes[0].primitives[0]
  const source = { position: accessor(primitive.attributes.POSITION), normal: accessor(primitive.attributes.NORMAL), uv: accessor(primitive.attributes.TEXCOORD_0), index: accessor(primitive.indices) }
  const count = source.position.length / 3

  // 1 and 2: face +Z (x' = -z, z' = x), feet on the ground, centred, at the agreed height.
  const position = new Float32Array(count * 3), normal = new Float32Array(count * 3)
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < count; i++) {
    const x = source.position[i * 3], y = source.position[i * 3 + 1], z = source.position[i * 3 + 2]
    position.set([-z, y, x], i * 3)
    normal.set([-source.normal[i * 3 + 2], source.normal[i * 3 + 1], source.normal[i * 3]], i * 3)
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], position[i * 3 + k]); max[k] = Math.max(max[k], position[i * 3 + k]) }
  }
  const scale = height / (max[1] - min[1])
  const shift = [-(min[0] + max[0]) / 2, -min[1], -(min[2] + max[2]) / 2]
  for (let i = 0; i < count; i++) for (let k = 0; k < 3; k++) position[i * 3 + k] = (position[i * 3 + k] + shift[k]) * scale
  const lo = min.map((v, k) => (v + shift[k]) * scale), hi = max.map((v, k) => (v + shift[k]) * scale)

  // 3: positions as normalised 16-bit integers around the centre of the box, undone by the node's transform.
  const centre = lo.map((v, k) => (v + hi[k]) / 2)
  const half = Math.max(...hi.map((v, k) => (v - lo[k]) / 2))
  const qPosition = new Int16Array(count * 4)
  const qMin = [32767, 32767, 32767], qMax = [-32767, -32767, -32767]
  for (let i = 0; i < count; i++) for (let k = 0; k < 3; k++) {
    const q = Math.round((position[i * 3 + k] - centre[k]) / half * 32767)
    qPosition[i * 4 + k] = q
    qMin[k] = Math.min(qMin[k], q); qMax[k] = Math.max(qMax[k], q)
  }
  const qNormal = new Int8Array(count * 4)
  for (let i = 0; i < count; i++) {
    const n = normal.subarray(i * 3, i * 3 + 3), length = Math.hypot(...n) || 1
    for (let k = 0; k < 3; k++) qNormal[i * 4 + k] = Math.round(n[k] / length * 127)
  }
  const qUv = new Uint16Array(count * 2)
  for (let i = 0; i < count * 2; i++) qUv[i] = Math.round(Math.min(1, Math.max(0, source.uv[i])) * 65535)
  if (count > 65535) throw new Error(`${name}: too many vertices for 16-bit indices`)
  const qIndex = Uint16Array.from(source.index)

  const imageBytes = view(json.images[0].bufferView)
  const webp = await sharp(Buffer.from(imageBytes)).resize(1024, 1024).webp({ quality: 82, effort: 6 }).toBuffer()

  const material = json.materials[0]
  const out = {
    asset: { version: '2.0', generator: 'bake-interests' },
    extensionsUsed: ['KHR_mesh_quantization', 'EXT_texture_webp'],
    extensionsRequired: ['KHR_mesh_quantization', 'EXT_texture_webp'],
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name, mesh: 0, translation: centre, scale: [half, half, half] }],
    meshes: [{ name, primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    materials: [{ name, pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: material.pbrMetallicRoughness?.roughnessFactor ?? .9 } }],
    textures: [{ sampler: 0, extensions: { EXT_texture_webp: { source: 0 } } }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    images: [{ mimeType: 'image/webp', bufferView: 4 }],
    accessors: [
      { bufferView: 0, componentType: 5122, normalized: true, count, type: 'VEC3', min: qMin, max: qMax },
      { bufferView: 1, componentType: 5120, normalized: true, count, type: 'VEC3' },
      { bufferView: 2, componentType: 5123, normalized: true, count, type: 'VEC2' },
      { bufferView: 3, componentType: 5123, count: qIndex.length, type: 'SCALAR' },
    ],
  }
  const file = `${TARGET}/${name}.glb`
  write(file, out, [
    { bytes: qPosition, stride: 8, target: 34962 },
    { bytes: qNormal, stride: 4, target: 34962 },
    { bytes: qUv, target: 34962 },
    { bytes: qIndex, target: 34963 },
    { bytes: webp },
  ])
  const size = readFileSync(file).length
  console.log(`${name}: ${count} vertices, ${qIndex.length / 3} triangles, ${(hi[0] - lo[0]).toFixed(3)} × ${(hi[1] - lo[1]).toFixed(3)} × ${(hi[2] - lo[2]).toFixed(3)}, ${(size / 1024).toFixed(0)} KB`)
}
