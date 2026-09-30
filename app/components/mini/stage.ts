import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// The small 3D Omar: a Tripo model (one drawing in, a textured mesh out, auto-rigged with Mixamo bone
// names) and everything that makes it seem alive. Tripo gives a skeleton but no face, so the blink and
// the talking mouth are added here. This module is the only one that imports three, and it is loaded
// on demand, so the rest of the site never pays for it.

export type Behavior = 'watch' | 'listen' | 'think' | 'talk'
export type Framing = 'bust' | 'full'
export type Light = 'night' | 'dawn'

const MODEL = '/models/omar-rigged.glb'

// Where his features are, in the model's own space (he faces +X, stands 1 unit tall, Z runs across
// the face). Measured once from the mesh and its texture; the model is a fixed asset.
const FACE = {
  centre: .0745,
  eyes: [new THREE.Vector3(.116, .770, .015), new THREE.Vector3(.124, .766, .134)],
  eye: new THREE.Vector2(.037, .028),
  mouth: new THREE.Vector3(.167, .683, .0745),
  lid: '#d89254',
}

const FRAMES: Record<Framing, { at: [number, number, number]; look: [number, number, number]; fov: number; turn: number }> = {
  // Head and shoulders, turned a little toward the page he is watching from the corner.
  bust: { at: [0, .8, 1.78], look: [0, .71, 0], fov: 24, turn: -.3 },
  // The whole of him, facing you.
  full: { at: [0, .54, 2.95], look: [0, .5, 0], fov: 22, turn: .1 },
}

const LIGHTS: Record<Light, { sky: string; ground: string; key: string; from: [number, number, number]; fill: number; strength: number }> = {
  night: { sky: '#cfd4ff', ground: '#4a2f78', key: '#ffd0b4', from: [1.2, 1.6, 2.2], fill: 1.35, strength: 2.1 },
  dawn: { sky: '#fff4e2', ground: '#8f88d6', key: '#fff2d6', from: [1.8, 1.9, 1.6], fill: 2.2, strength: 2.3 },
}

type Angles = [number, number, number]
type Joint = { bone: THREE.Bone; rest: THREE.Quaternion; world: THREE.Quaternion; worldInv: THREE.Quaternion }
const JOINTS = { Hips: 'hips', Spine: 'spine', Spine2: 'chest', Neck: 'neck', Head: 'head', RightArm: 'armR', RightForeArm: 'foreR', LeftArm: 'armL', LeftForeArm: 'foreL' } as const
type JointName = (typeof JOINTS)[keyof typeof JOINTS]

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const bell = (x: number, s: number) => Math.exp(-((x / s) ** 2))

/** One sculpted shape: the lower face swings down about a hinge behind the mouth. The painted beard rides along. */
function addJaw(geometry: THREE.BufferGeometry) {
  const pos = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const jaw = new Float32Array(pos.count * 3)
  const hinge = [FACE.mouth.x - .1, FACE.mouth.y + .008]
  const cos = Math.cos(-.3), sin = Math.sin(-.3)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    // Only the front of the head, below the mouth line, fading out before the scarf.
    const weight = smooth(.05, .12, x) * smooth(-.2, .25, normal.getX(i)) * smooth(.004, -.014, y - FACE.mouth.y) * smooth(.588, .614, y) * bell(z - FACE.centre, .075)
    if (weight <= 0) continue
    const rx = x - hinge[0], ry = y - hinge[1]
    jaw[i * 3] = (rx * cos - ry * sin - rx) * weight
    jaw[i * 3 + 1] = (rx * sin + ry * cos - ry) * weight
  }
  geometry.morphAttributes.position = [new THREE.BufferAttribute(jaw, 3)]
  geometry.morphTargetsRelative = true
}

/** His eyes are painted on. To blink, skin is painted over them from the brow down, in the shader. */
function addEyelids(material: THREE.MeshStandardMaterial, blink: { value: number }) {
  material.onBeforeCompile = shader => {
    shader.uniforms.uBlink = blink
    shader.uniforms.uLid = { value: new THREE.Color(FACE.lid) }
    shader.uniforms.uEyes = { value: FACE.eyes }
    shader.uniforms.uEye = { value: FACE.eye }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBind;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBind;\nuniform float uBlink;\nuniform vec3 uLid;\nuniform vec3 uEyes[2];\nuniform vec2 uEye;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        if (uBlink > .001) {
          for (int i = 0; i < 2; i++) {
            vec2 d = (vBind.zy - uEyes[i].zy) / uEye;
            float inside = (1. - smoothstep(.82, 1., length(d))) * step(uEyes[i].x - .06, vBind.x);
            float line = 1.15 - 2.3 * uBlink;
            diffuseColor.rgb = mix(diffuseColor.rgb, uLid, inside * smoothstep(line - .1, line + .02, d.y));
            diffuseColor.rgb = mix(diffuseColor.rgb, uLid * .35, inside * (1. - smoothstep(0., .16, abs(d.y - line))) * .85);
          }
        }`)
  }
}

export class MiniStage {
  readonly ready: Promise<void>
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(24, 1, .05, 30)
  private character = new THREE.Group()
  private sky = new THREE.HemisphereLight()
  private key = new THREE.DirectionalLight()
  private joints: Partial<Record<JointName, Joint>> = {}
  private mesh: THREE.SkinnedMesh | null = null
  private mouth: THREE.Mesh | null = null
  private blink = { value: 0 }
  private raf = 0
  private last = 0
  private clock = 0
  private visible = true
  private disposed = false
  private observer: IntersectionObserver
  // What he is doing, and the eased values that follow it.
  private behavior: Behavior = 'watch'
  private aimAt: [number, number] | null = null
  private wander = { until: 0, pitch: 0, yaw: 0 }
  private look = { pitch: 0, yaw: 0, roll: 0 }
  private jaw = { open: 0, target: 0, until: 0 }
  private nextBlink = 2
  private blinkT = -1
  private waveT = -1
  private hands = 0
  private held: Partial<Record<JointName, Angles>> | null = null
  private turn = FRAMES.bust.turn

  constructor(private canvas: HTMLCanvasElement, private reduced = false) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.scene.add(this.sky, this.key, this.character)
    this.light('night')
    this.frame('bust')
    this.observer = new IntersectionObserver(entries => { this.visible = entries.some(entry => entry.isIntersecting) })
    this.observer.observe(canvas)
    this.ready = this.load()
  }

  private async load() {
    const gltf = await new GLTFLoader().loadAsync(MODEL)
    if (this.disposed) return
    // Tripo models face +X and he is not quite centred on the origin. Face the camera, centre the face.
    gltf.scene.rotation.y = -Math.PI / 2
    gltf.scene.position.x = FACE.centre
    this.character.add(gltf.scene)
    this.character.rotation.y = 0
    this.character.updateMatrixWorld(true)
    const rootInv = this.character.getWorldQuaternion(new THREE.Quaternion()).invert()

    gltf.scene.traverse(node => {
      const mesh = node as THREE.SkinnedMesh
      if (mesh.isSkinnedMesh) {
        this.mesh = mesh
        mesh.frustumCulled = false // skinned bounds move with the pose
        addJaw(mesh.geometry)
        mesh.updateMorphTargets()
        const material = mesh.material as THREE.MeshStandardMaterial
        material.roughness = .9
        addEyelids(material, this.blink)
      }
      const bone = node as THREE.Bone
      const name = bone.isBone ? JOINTS[bone.name.replace(/^mixamorig:?/, '') as keyof typeof JOINTS] : undefined
      if (!name) return
      const world = rootInv.clone().multiply(bone.getWorldQuaternion(new THREE.Quaternion()))
      this.joints[name] = { bone, rest: bone.quaternion.clone(), world, worldInv: world.clone().invert() }
    })

    // The inside of his mouth: a dark shape on the mouth line that opens as the jaw drops. It is mounted
    // on the head bone, at the spot the mouth has in the bind pose.
    const head = this.joints.head?.bone
    if (head && this.mesh) {
      const index = this.mesh.skeleton.bones.indexOf(head)
      const mouth = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: '#3a1320' }))
      const mount = new THREE.Group()
      this.mesh.skeleton.boneInverses[index].clone().multiply(new THREE.Matrix4().makeTranslation(FACE.mouth.x + .0035, FACE.mouth.y, FACE.mouth.z))
        .decompose(mount.position, mount.quaternion, mount.scale)
      mouth.rotation.y = Math.PI / 2 // its face looks out along +X, the way he does
      mouth.visible = false
      mount.add(mouth)
      head.add(mount)
      this.mouth = mouth
    }
    this.character.rotation.y = this.turn
    this.start()
  }

  /** Turn a joint by angles given in character space (he faces +Z), whatever axes the rigger gave the bone. */
  private turnJoint(name: JointName, angles: Angles, amount = 1) {
    const joint = this.joints[name]
    if (!joint) return
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(angles[0] * amount, angles[1] * amount, angles[2] * amount))
    joint.bone.quaternion.copy(joint.rest).multiply(joint.worldInv.clone().multiply(q).multiply(joint.world))
  }

  frame(framing: Framing) {
    const f = FRAMES[framing]
    this.camera.position.set(...f.at)
    this.camera.fov = f.fov
    this.camera.lookAt(...f.look)
    this.camera.updateProjectionMatrix()
    this.turn = f.turn
  }

  light(light: Light) {
    const l = LIGHTS[light]
    this.sky.color.set(l.sky)
    this.sky.groundColor.set(l.ground)
    this.sky.intensity = l.fill
    this.key.color.set(l.key)
    this.key.intensity = l.strength
    this.key.position.set(...l.from)
  }

  /** Look somewhere: head pitch (+ down) and yaw (+ toward screen right), in radians. Null lets him look around on his own. */
  aim(to: [number, number] | null) { this.aimAt = to }

  act(behavior: Behavior) { this.behavior = behavior }

  /** Hold joints at fixed angles, over whatever he is doing. The bench uses it to test the skin; null lets go. */
  hold(pose: Partial<Record<JointName, Angles>> | null) { this.held = pose }

  /** Lift his right hand and wave. */
  wave() { if (!this.reduced) this.waveT = 0 }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  private start() {
    const tick = (now: number) => {
      this.raf = requestAnimationFrame(tick)
      const dt = Math.min(.05, (now - this.last) / 1000 || 0)
      this.last = now
      if (!this.visible || document.hidden) return
      this.update(dt)
      this.renderer.render(this.scene, this.camera)
    }
    this.raf = requestAnimationFrame(tick)
  }

  private update(dt: number) {
    const t = (this.clock += dt)
    const still = this.reduced
    const ease = (rate: number) => still ? 1 : Math.min(1, dt * rate)

    // Where to look. Thinking looks up and away; otherwise the pointer, or a slow wander of his own.
    let pitch = 0, yaw = 0, roll = 0
    if (this.behavior === 'think') { pitch = -.26; yaw = -.42; roll = .1 }
    else if (this.aimAt) { [pitch, yaw] = this.aimAt }
    else if (!still) {
      if (t > this.wander.until) this.wander = { until: t + 2 + Math.random() * 3, pitch: (Math.random() - .6) * .3, yaw: (Math.random() - .5) * .9 }
      pitch = this.wander.pitch
      yaw = this.wander.yaw
    }
    if (this.behavior === 'listen') roll = -.07
    // His body is already turned; the head makes up the difference so he really does face the pointer.
    yaw -= this.turn * .6
    this.look.pitch += (pitch - this.look.pitch) * ease(7)
    this.look.yaw += (yaw - this.look.yaw) * ease(7)
    this.look.roll += (roll - this.look.roll) * ease(5)

    // Talking: the jaw follows a made-up rhythm of syllables, with a nod on the strong ones.
    if (this.behavior === 'talk' && !still) {
      if (t > this.jaw.until) {
        const pause = Math.random() < .16
        this.jaw.target = pause ? 0 : .25 + Math.random() * .75
        this.jaw.until = t + (pause ? .16 : .07 + Math.random() * .09)
      }
    } else this.jaw.target = 0
    this.jaw.open += (this.jaw.target - this.jaw.open) * ease(22)
    if (this.mesh?.morphTargetInfluences) this.mesh.morphTargetInfluences[0] = this.jaw.open
    if (this.mouth) {
      this.mouth.visible = this.jaw.open > .04
      this.mouth.scale.set(.021 - this.jaw.open * .004, .003 + this.jaw.open * .012, 1)
      this.mouth.position.y = -this.jaw.open * .0075
    }

    // Blinking, now and then, and once on purpose when he starts to think.
    if (!still) {
      if (this.blinkT < 0 && t > this.nextBlink) this.blinkT = 0
      if (this.blinkT >= 0) {
        this.blinkT += dt
        const p = this.blinkT / .17
        this.blink.value = p >= 1 ? 0 : Math.sin(p * Math.PI)
        if (p >= 1) { this.blinkT = -1; this.nextBlink = t + 1.6 + Math.random() * 3.8 }
      }
    }

    // Breathing and a slow shift of weight, so he is never a statue.
    const breath = still ? 0 : Math.sin(t * 1.7)
    const sway = still ? 0 : Math.sin(t * .55)
    const nod = this.behavior === 'talk' ? this.jaw.open * .05 : 0
    this.turnJoint('hips', [0, sway * .012, sway * .01])
    this.turnJoint('spine', [breath * .008 + (this.behavior === 'listen' ? .05 : 0), 0, -sway * .012])
    this.turnJoint('chest', [-breath * .012, 0, 0])
    this.turnJoint('neck', [this.look.pitch + nod, this.look.yaw, this.look.roll], .35)
    this.turnJoint('head', [this.look.pitch + nod, this.look.yaw, this.look.roll], .65)

    // The wave: arm up, forearm back and forth, arm down.
    let lift = 0, swing = 0
    if (this.waveT >= 0) {
      this.waveT += dt
      const w = this.waveT
      lift = smooth(0, .35, w) * (1 - smooth(1.55, 1.95, w))
      swing = Math.sin(w * 11) * lift
      if (w > 2) this.waveT = -1
    }
    // While he talks his hands come up a little and move with the words.
    this.hands += ((this.behavior === 'talk' && !still ? 1 : 0) - this.hands) * ease(4)
    const beat = Math.sin(t * 2.3) * .5 + .5, off = Math.sin(t * 1.7 + 1) * .5 + .5
    const say = this.hands * (1 - lift)
    this.turnJoint('armR', [-.34 * say * beat, 0, -2.15 * lift - .16 * say])
    this.turnJoint('foreR', [-.75 * say * (.5 + .5 * beat), 0, (-.55 + swing * .4) * lift])
    this.turnJoint('armL', [-.26 * say * off, 0, breath * .01 + .3 * say * (.4 + .6 * off)])
    this.turnJoint('foreL', [-.6 * say * off, 0, 0])
    if (this.held) for (const [name, angles] of Object.entries(this.held)) this.turnJoint(name as JointName, angles)
    this.character.rotation.y += (this.turn - this.character.rotation.y) * ease(6)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.scene.traverse(node => {
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.geometry.dispose()
      const material = mesh.material as THREE.MeshStandardMaterial
      material.map?.dispose()
      material.dispose()
    })
    this.renderer.dispose()
  }
}
