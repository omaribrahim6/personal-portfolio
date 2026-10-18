import * as THREE from 'three'
import { load } from './puppet'

// The statues he was modelled in for each pastime (on a bike, at a vault, cross-legged on a podium) are
// single solid sculptures, which a skeleton cannot bend: a seated or crouched body is nowhere near where the
// rigged one stands. So they are taken apart instead, like an action figure: every triangle is given to a
// part by where it sits (a head, a dial, a wheel), and each part turns on its own pivot.

export type Part = {
  name: string
  /** The point it turns about, in the statue's own space (feet on y = 0, facing +Z, about a unit tall). */
  pivot: [number, number, number]
  /** Whether a point (a triangle's centre) belongs to it. Parts are tried in order; the rest is the body. */
  has(p: THREE.Vector3): boolean
}

/** Load a statue and take it apart. Each part is a group at its pivot: turn the group to move the part. */
export async function statue(url: string, parts: Part[] = []) {
  const gltf = await load(url)
  const scene = gltf.scene
  scene.updateMatrixWorld(true)
  let found: THREE.Mesh | null = null
  scene.traverse(node => { if ((node as THREE.Mesh).isMesh && !found) found = node as THREE.Mesh })
  if (!found) throw new Error(`${url} has no mesh.`)
  const mesh = found as THREE.Mesh
  lift(mesh.material)
  const geometry = mesh.geometry
  const pos = geometry.getAttribute('position')
  const index = geometry.index
  const count = index ? index.count : pos.count
  const buckets: number[][] = [...parts.map(() => [] as number[]), []]
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  for (let i = 0; i < count; i += 3) {
    const [ia, ib, ic] = index ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)] : [i, i + 1, i + 2]
    a.fromBufferAttribute(pos, ia).applyMatrix4(mesh.matrixWorld)
    b.fromBufferAttribute(pos, ib).applyMatrix4(mesh.matrixWorld)
    c.fromBufferAttribute(pos, ic).applyMatrix4(mesh.matrixWorld)
    a.add(b).add(c).divideScalar(3)
    const k = parts.findIndex(part => part.has(a))
    buckets[k < 0 ? parts.length : k].push(ia, ib, ic)
  }
  const group = new THREE.Group()
  const pivots: Record<string, THREE.Group> = {}
  const make = (indices: number[], pivot: THREE.Vector3) => {
    const piece = new THREE.BufferGeometry()
    for (const [name, attribute] of Object.entries(geometry.attributes)) piece.setAttribute(name, attribute)
    piece.setIndex(indices)
    const part = new THREE.Mesh(piece, mesh.material)
    part.matrixAutoUpdate = false
    part.matrix.makeTranslation(-pivot.x, -pivot.y, -pivot.z).multiply(mesh.matrixWorld)
    part.castShadow = part.receiveShadow = true
    return part
  }
  group.add(make(buckets[parts.length], new THREE.Vector3()))
  parts.forEach((part, k) => {
    const pivot = new THREE.Vector3(...part.pivot)
    const holder = new THREE.Group()
    holder.position.copy(pivot)
    holder.add(make(buckets[k], pivot))
    group.add(holder)
    pivots[part.name] = holder
  })
  return { group, parts: pivots }
}

/** A part that is everything inside a ball. */
export const ball = (name: string, centre: [number, number, number], radius: number, pivot = centre): Part => {
  const at = new THREE.Vector3(...centre)
  return { name, pivot, has: p => p.distanceTo(at) < radius }
}

/**
 * The statues' paint is dark next to the flat colours of the world (and they have no sky to reflect), so
 * each is lit a little from inside by its own colours. Done once per material; the materials are shared.
 */
export function lift(material: THREE.Material | THREE.Material[], amount = .3) {
  for (const each of Array.isArray(material) ? material : [material]) {
    const m = each as THREE.MeshStandardMaterial
    if (!m.isMeshStandardMaterial || m.userData.lifted) continue
    m.userData.lifted = true
    m.emissive = new THREE.Color('#ffffff')
    m.emissiveMap = m.map
    m.emissiveIntensity = amount
    m.metalness = 0
    m.roughness = 1
    m.needsUpdate = true
  }
}
