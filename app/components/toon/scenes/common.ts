import * as THREE from 'three'
import { sunlight } from '../kit'

// What the small dioramas share: a scene with no sky (the paper of the page shows through), a warm sun from
// the upper left, and a camera that swings a little with the pointer and steps back when the picture is narrow.

export const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
/** How far through the stretch from `a` to `b` the value `p` is, eased in and out. */
export const span = (p: number, a: number, b: number) => { const t = clamp01((p - a) / (b - a)); return t * t * (3 - 2 * t) }
/** An overshoot, for things that pop into being. */
export const pop = (t: number) => t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2)

export function studio(o: { target: THREE.Vector3; distance: number; yaw: number; pitch: number; fov?: number; span?: number; sun?: THREE.Vector3 }) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(o.fov ?? 28, 4 / 3, .2, 200)
  sunlight(scene, { from: o.sun ?? v(-8, 12, 7), span: o.span ?? 7, strength: 2.6, fill: 1.65 })
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  let aspect = 4 / 3
  const aim = () => {
    // Narrower than it was drawn for: step back so the sides stay in.
    const distance = o.distance * Math.max(1, 1.25 / aspect)
    const yaw = o.yaw + pointer.x * .1, pitch = o.pitch + pointer.y * .05
    camera.position.set(
      o.target.x + Math.sin(yaw) * Math.cos(pitch) * distance,
      o.target.y + Math.sin(pitch) * distance,
      o.target.z + Math.cos(yaw) * Math.cos(pitch) * distance,
    )
    camera.lookAt(o.target)
  }
  aim()
  return {
    scene,
    camera,
    resize(width: number, height: number) { aspect = width / height; aim() },
    pointer(x: number, y: number) { pointer.tx = x; pointer.ty = y },
    /** Ease the pointer in, and move the camera with it. */
    follow(dt: number) {
      const k = 1 - Math.exp(-dt * 3)
      pointer.x += (pointer.tx - pointer.x) * k
      pointer.y += (pointer.ty - pointer.y) * k
      aim()
    },
  }
}

/** A value that runs toward 1 while something is on and back to 0 when it is off, over `seconds`. */
export function lever(seconds: number) {
  let on = false, value = 0
  return {
    set(next: boolean) { on = next },
    get on() { return on },
    /** Move on by `dt`. With no time passing (a still picture), it jumps straight to where it is going. */
    step(dt: number) {
      if (dt === 0) value = on ? 1 : 0
      else value = Math.min(1, Math.max(0, value + (on ? dt : -dt * 1.6) / seconds))
      return value
    },
  }
}

export function disposeAll(scene: THREE.Scene) {
  scene.traverse(node => { if (node instanceof THREE.Mesh) node.geometry.dispose() })
}
