import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { C, toon } from '../toon/kit'
import glyphs from './glyphs.json'

// Heliotrope in three dimensions: each letter's outline from scripts/glyphs.mjs, extruded into a slab with
// rounded edges, and the hairline cut laid into its face in a second colour, the way the signs are set on
// the page.

type Glyph = { advance: number; path: (string | number)[][] }
const SOLID = glyphs.solid as Record<string, Glyph>
const LINE = glyphs.line as Record<string, Glyph>
const CAP = 700

function shapes(glyph: Glyph) {
  const path = new THREE.ShapePath()
  for (const command of glyph.path) {
    const [type, ...n] = command as [string, ...number[]]
    if (type === 'M') path.moveTo(n[0], n[1])
    else if (type === 'L') path.lineTo(n[0], n[1])
    else if (type === 'Q') path.quadraticCurveTo(n[0], n[1], n[2], n[3])
    else if (type === 'C') path.bezierCurveTo(n[0], n[1], n[2], n[3], n[4], n[5])
  }
  return path.toShapes()
}

const cache = new Map<string, { solid: THREE.BufferGeometry | null; line: THREE.BufferGeometry | null; advance: number }>()
/** One letter's slab and inlay, in font units, front face at z = 0. */
function letter(char: string, depth: number) {
  const key = `${char}|${depth}`
  let made = cache.get(key)
  if (made) return made
  const solid = SOLID[char], line = LINE[char]
  if (!solid) { made = { solid: null, line: null, advance: SOLID[' ']?.advance ?? 300 }; cache.set(key, made); return made }
  const bevel = 14
  const body = new THREE.ExtrudeGeometry(shapes(solid), { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .8, bevelSegments: 2, curveSegments: 6 })
  body.translate(0, 0, -depth + bevel)
  let inlay: THREE.BufferGeometry | null = null
  if (line?.path.length) {
    inlay = new THREE.ExtrudeGeometry(shapes(line), { depth: 6, bevelEnabled: false, curveSegments: 6 })
    inlay.translate(0, 0, bevel - 2)
  }
  made = { solid: body, line: inlay, advance: solid.advance }
  cache.set(key, made)
  return made
}

/**
 * A word (or a few) in stencil capitals, `size` tall, standing on y = 0 and centred on x = 0, facing +Z.
 * The letters are merged into one slab mesh and one inlay mesh. Returns the width too.
 */
export function word(text: string, o: { size: number; depth?: number; color?: string; line?: string; tracking?: number }) {
  const scale = o.size / CAP
  const depth = (o.depth ?? o.size * .28) / scale
  const solids: THREE.BufferGeometry[] = [], lines: THREE.BufferGeometry[] = []
  let x = 0
  for (const char of text.toUpperCase()) {
    const made = letter(char, depth)
    if (made.solid) solids.push(made.solid.clone().translate(x, 0, 0))
    if (made.line) lines.push(made.line.clone().translate(x, 0, 0))
    x += made.advance + (o.tracking ?? 40)
  }
  const width = (x - (o.tracking ?? 40)) * scale
  const group = new THREE.Group()
  const holder = new THREE.Group()
  holder.scale.setScalar(scale)
  holder.position.x = -width / 2
  group.add(holder)
  if (solids.length) {
    const slab = new THREE.Mesh(mergeGeometries(solids), toon(o.color ?? C.ivory))
    slab.castShadow = slab.receiveShadow = true
    holder.add(slab)
  }
  if (lines.length) {
    const inlay = new THREE.Mesh(mergeGeometries(lines), toon(o.line ?? C.coral))
    holder.add(inlay)
  }
  return { group, width }
}
