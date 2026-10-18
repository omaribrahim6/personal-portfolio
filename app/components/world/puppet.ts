import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js'

// Omar, as a puppet. The one rigged model (a Mixamo skeleton in a Tripo mesh) gives the bones. The outfit
// models (hiking, biking, paddling, the football kit...) came out of Tripo as single statues with no
// skeleton, so each is given this one: every vertex of the statue takes the skin weights of the nearest
// points on the rigged model, stood in the same place and at the same size. After that the statue bends
// at the same joints. Poses are given as angles in his own space (he faces +Z, up is +Y), whatever axes
// the rigger gave each bone.

export type Joint =
  | 'hips' | 'spine' | 'chest' | 'neck' | 'head'
  | 'shoulderL' | 'armL' | 'foreL' | 'handL' | 'shoulderR' | 'armR' | 'foreR' | 'handR'
  | 'thighL' | 'shinL' | 'footL' | 'thighR' | 'shinR' | 'footR'
export type Angles = [number, number, number]
export type Pose = Partial<Record<Joint, Angles>> & { lift?: number; shift?: [number, number, number] }

const BONES: Record<string, Joint> = {
  Hips: 'hips', Spine: 'spine', Spine2: 'chest', Neck: 'neck', Head: 'head',
  LeftShoulder: 'shoulderL', LeftArm: 'armL', LeftForeArm: 'foreL', LeftHand: 'handL',
  RightShoulder: 'shoulderR', RightArm: 'armR', RightForeArm: 'foreR', RightHand: 'handR',
  LeftUpLeg: 'thighL', LeftLeg: 'shinL', LeftFoot: 'footL', RightUpLeg: 'thighR', RightLeg: 'shinR', RightFoot: 'footR',
}

const RIGGED = '/models/omar-rigged.glb'
/** Where his face is across the rigged model; it is moved so his face is over the origin. */
const CENTRE = .0745

const loader = new GLTFLoader()
const cache = new Map<string, Promise<GLTF>>()
export function load(url: string) {
  let pending = cache.get(url)
  if (!pending) { pending = loader.loadAsync(url); cache.set(url, pending) }
  return pending
}

type Rest = { bone: THREE.Bone; rest: THREE.Quaternion; world: THREE.Quaternion; worldInv: THREE.Quaternion }

/** A uniform grid over a cloud of points, for finding the nearest few quickly. */
function grid(points: Float32Array, cell: number) {
  const cells = new Map<string, number[]>()
  const key = (x: number, y: number, z: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`
  for (let i = 0; i < points.length / 3; i++) {
    const k = key(points[i * 3], points[i * 3 + 1], points[i * 3 + 2])
    let list = cells.get(k)
    if (!list) cells.set(k, list = [])
    list.push(i)
  }
  /** The `count` nearest points to (x, y, z), with their squared distances. */
  return (x: number, y: number, z: number, count: number) => {
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell)
    const found: [number, number][] = []
    for (let r = 0; r < 6 && found.length < count; r++) {
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) {
        if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) !== r) continue
        for (const p of cells.get(`${cx + i},${cy + j},${cz + k}`) ?? []) {
          const dx = points[p * 3] - x, dy = points[p * 3 + 1] - y, dz = points[p * 3 + 2] - z
          found.push([p, dx * dx + dy * dy + dz * dz])
        }
      }
      // One more ring than needed, so a nearer point just over a cell boundary is not missed.
      if (found.length >= count && r > 0) break
    }
    return found.sort((a, b) => a[1] - b[1]).slice(0, count)
  }
}

export class Puppet {
  /** Add this to the scene. He faces +Z with his feet on y = 0. */
  readonly root = new THREE.Group()
  readonly mesh: THREE.SkinnedMesh
  private joints: Partial<Record<Joint, Rest>> = {}
  private hipsRest = new THREE.Vector3()
  private q = new THREE.Quaternion()
  private e = new THREE.Euler()

  /**
   * `rigged` is the rigged model. `outfit`, if given, is a statue to dress him in: `fit` says how to stand
   * it on the rigged model before the weights are taken (a scale, and an offset after scaling).
   */
  constructor(rigged: GLTF, outfit?: { gltf: GLTF; scale?: number; offset?: [number, number, number] }) {
    const body = cloneSkinned(rigged.scene)
    body.rotation.y = -Math.PI / 2
    body.position.x = CENTRE
    this.root.add(body)
    this.root.updateMatrixWorld(true)
    let skinned: THREE.SkinnedMesh | null = null
    body.traverse(node => { if ((node as THREE.SkinnedMesh).isSkinnedMesh) skinned = node as THREE.SkinnedMesh })
    if (!skinned) throw new Error('The rigged model has no skinned mesh.')
    const source = skinned as THREE.SkinnedMesh
    source.frustumCulled = false
    this.mesh = outfit ? this.dress(source, outfit) : source

    const rootInv = this.root.getWorldQuaternion(new THREE.Quaternion()).invert()
    body.traverse(node => {
      const bone = node as THREE.Bone
      const name = bone.isBone ? BONES[bone.name.replace(/^mixamorig:?/, '')] : undefined
      if (!name) return
      const world = rootInv.clone().multiply(bone.getWorldQuaternion(new THREE.Quaternion()))
      this.joints[name] = { bone, rest: bone.quaternion.clone(), world, worldInv: world.clone().invert() }
    })
    this.hipsRest.copy(this.joints.hips!.bone.position)
  }

  /** Give the statue the rigged model's skin weights, and put it in the rigged model's place. */
  private dress(source: THREE.SkinnedMesh, outfit: NonNullable<ConstructorParameters<typeof Puppet>[1]>) {
    // The rigged model's points, where they stand in the root's space.
    const sourcePos = source.geometry.getAttribute('position')
    const points = new Float32Array(sourcePos.count * 3)
    const v = new THREE.Vector3()
    for (let i = 0; i < sourcePos.count; i++) {
      v.fromBufferAttribute(sourcePos, i).applyMatrix4(source.matrixWorld)
      v.toArray(points, i * 3)
    }
    const nearest = grid(points, .02)
    const skinIndex = source.geometry.getAttribute('skinIndex')
    const skinWeight = source.geometry.getAttribute('skinWeight')

    let statue: THREE.Mesh | null = null
    outfit.gltf.scene.updateMatrixWorld(true)
    outfit.gltf.scene.traverse(node => { if ((node as THREE.Mesh).isMesh && !statue) statue = node as THREE.Mesh })
    if (!statue) throw new Error('The outfit has no mesh.')
    const mesh = statue as THREE.Mesh
    const pos = mesh.geometry.getAttribute('position'), normal = mesh.geometry.getAttribute('normal'), uv = mesh.geometry.getAttribute('uv')
    const count = pos.count
    const scale = outfit.scale ?? 1, offset = new THREE.Vector3(...(outfit.offset ?? [0, 0, 0]))
    const toLocal = source.matrixWorld.clone().invert()
    const normalToWorld = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
    const normalToLocal = new THREE.Matrix3().getNormalMatrix(toLocal)
    const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3), uvs = new Float32Array(count * 2)
    const indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4)
    const n = new THREE.Vector3(), tally = new Map<number, number>()
    for (let i = 0; i < count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).multiplyScalar(scale).add(offset)
      // Weights from the few nearest points of the rigged model, nearer ones counting for more.
      tally.clear()
      const found = nearest(v.x, v.y, v.z, 6)
      for (const [p, d2] of found) {
        const w = 1 / (Math.sqrt(d2) + .004)
        for (let k = 0; k < 4; k++) {
          const weight = skinWeight.getComponent(p, k)
          if (weight <= 0) continue
          const bone = skinIndex.getComponent(p, k)
          tally.set(bone, (tally.get(bone) ?? 0) + weight * w)
        }
      }
      const top = [...tally].sort((a, b) => b[1] - a[1]).slice(0, 4)
      const total = top.reduce((sum, [, w]) => sum + w, 0) || 1
      top.forEach(([bone, w], k) => { indices[i * 4 + k] = bone; weights[i * 4 + k] = w / total })
      v.applyMatrix4(toLocal).toArray(positions, i * 3)
      n.fromBufferAttribute(normal, i).applyMatrix3(normalToWorld).applyMatrix3(normalToLocal).normalize().toArray(normals, i * 3)
      uvs[i * 2] = uv.getX(i)
      uvs[i * 2 + 1] = uv.getY(i)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geometry.setAttribute('skinIndex', new THREE.BufferAttribute(indices, 4))
    geometry.setAttribute('skinWeight', new THREE.BufferAttribute(weights, 4))
    if (mesh.geometry.index) geometry.setIndex(Array.from(mesh.geometry.index.array))
    const dressed = new THREE.SkinnedMesh(geometry, mesh.material)
    dressed.position.copy(source.position)
    dressed.quaternion.copy(source.quaternion)
    dressed.scale.copy(source.scale)
    dressed.frustumCulled = false
    source.parent!.add(dressed)
    dressed.bind(source.skeleton, source.bindMatrix)
    source.visible = false
    return dressed
  }

  /** Where one of his joints is in the world now, for putting something in his hand. */
  where(joint: Joint, out = new THREE.Vector3()) {
    const bone = this.joints[joint]?.bone
    return bone ? bone.getWorldPosition(out) : this.root.getWorldPosition(out)
  }

  /** Stand him in a pose. Joints not named go back to rest. */
  pose(pose: Pose) {
    for (const name of Object.keys(this.joints) as Joint[]) {
      const joint = this.joints[name]!
      const a = pose[name]
      if (!a) { joint.bone.quaternion.copy(joint.rest); continue }
      this.q.setFromEuler(this.e.set(a[0], a[1], a[2]))
      joint.bone.quaternion.copy(joint.rest).multiply(joint.worldInv.clone().multiply(this.q).multiply(joint.world))
    }
    // The hips carry the whole body: down for a crouch or a seat, and along for a shift of weight.
    const hips = this.joints.hips!.bone
    hips.position.copy(this.hipsRest)
    if (pose.lift || pose.shift) {
      // From his own space, through the world, into the space the hips are moved in.
      const d = new THREE.Vector3(pose.shift?.[0] ?? 0, pose.lift ?? 0, pose.shift?.[2] ?? 0)
      d.applyMatrix3(new THREE.Matrix3().setFromMatrix4(this.root.matrixWorld))
      d.applyMatrix3(new THREE.Matrix3().setFromMatrix4(hips.parent!.matrixWorld.clone().invert()))
      hips.position.add(d)
    }
  }
}

/** The rigged model, and any outfit statues, loaded once each. */
export async function puppet(outfit?: { url: string; scale?: number; offset?: [number, number, number] }) {
  const rigged = await load(RIGGED)
  if (!outfit) return new Puppet(rigged)
  const gltf = await load(outfit.url)
  return new Puppet(rigged, { gltf, scale: outfit.scale, offset: outfit.offset })
}
