import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// The islands: one floating island for each interest, and a camera that flies from one to the next.
// Omar stands on each of them, as a Tripo model baked by scripts/bake-interests.mjs (facing +Z, feet on
// y = 0, his face the same size in every one). On the first island he changes from one outfit into the
// next with a spin, fast enough that you never see the swap. On the games island he is not a model at all
// but the drawing itself, cut out and stood up like a card that always turns to face you. Like the small Omar, this module is the only
// place that imports three, and it is loaded on demand.

export type IslandId = 'outdoors' | 'competing' | 'games' | 'soccer'
export type Outfit = 'hike' | 'bike' | 'paddle'
type ModelName = Outfit | 'podium' | 'soccer'

const ORDER: IslandId[] = ['outdoors', 'competing', 'games', 'soccer']
const OUTFITS: Outfit[] = ['hike', 'bike', 'paddle']
const MODEL_OF: Record<Exclude<IslandId, 'outdoors' | 'games'>, ModelName> = { competing: 'podium', soccer: 'soccer' }
const url = (name: ModelName) => `/models/interests/${name}.glb`

// The page under the canvas. Fog fades into it, so far islands sink into the ground colour, not into black.
const GROUND = '#14153f'
// Rock: from the band of earth under the meadow down to the tip, lit coral and falling into violet.
const ROCK_TOP = new THREE.Color('#d9607a'), ROCK_LOW = new THREE.Color('#3a2150'), EARTH = new THREE.Color('#4a2a5c')

// The drawing that stands on the games island, and its shape.
const CARD = '/interests/posters/games.webp'
const CARD_RATIO = 637 / 900
const CARD_HEIGHT = 1.02

const SPIN = 1.15 // seconds for a change of clothes
const TURNS = 4 // full turns in it
const FLIGHT = 1.7 // seconds between islands

const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * One floating island, cut in facets: a gently domed meadow, a band of earth, and a cone of rock hanging
 * under it. `grass` colours the meadow per facet, so the pitch can have its stripes.
 */
function island(radius: number, depth: number, seed: number, grass: (x: number, z: number) => THREE.Color) {
  const rand = rng(seed)
  const N = 16
  const ring = (r: number, y: number, jitter: number, shift = 0) => Array.from({ length: N }, (_, i) => {
    const a = (i + shift) / N * Math.PI * 2
    const k = r * (1 + (rand() - .5) * jitter)
    return new THREE.Vector3(Math.cos(a) * k, y + (rand() - .5) * jitter * .4, Math.sin(a) * k)
  })
  const rim = ring(radius, 0, .1)
  const inner = rim.map(p => new THREE.Vector3(p.x * .55, .035, p.z * .55))
  const centre = new THREE.Vector3(0, .05, 0)
  const lip = rim.map(p => new THREE.Vector3(p.x * .97, -.13, p.z * .97))
  const upper = ring(radius * .72, -depth * .38, .22, .5)
  const lower = ring(radius * .36, -depth * .74, .3)
  const tip = new THREE.Vector3((rand() - .5) * radius * .3, -depth, (rand() - .5) * radius * .3)

  const positions: number[] = [], colors: number[] = []
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, color: THREE.Color) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b)
  }
  const rock = (y: number) => ROCK_LOW.clone().lerp(ROCK_TOP, THREE.MathUtils.clamp(1 + y / depth * 1.1, 0, 1)).multiplyScalar(.82 + rand() * .3)
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N
    const meadow = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => tri(a, b, c, grass((a.x + b.x + c.x) / 3, (a.z + b.z + c.z) / 3))
    meadow(centre, inner[j], inner[i])
    meadow(inner[i], inner[j], rim[j])
    meadow(inner[i], rim[j], rim[i])
    const earth = EARTH.clone().multiplyScalar(.85 + rand() * .3)
    tri(rim[i], rim[j], lip[j], earth)
    tri(rim[i], lip[j], lip[i], earth)
    tri(lip[i], lip[j], upper[i], rock(-depth * .2))
    tri(lip[j], upper[(i + 1) % N], upper[i], rock(-depth * .2))
    tri(upper[i], upper[j], lower[i], rock(-depth * .55))
    tri(upper[j], lower[j], lower[i], rock(-depth * .55))
    tri(lower[i], lower[j], tip, rock(-depth * .9))
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 }))
}

const flat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: .9, ...extra })

function pine(height: number, seed: number) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.018, .026, height * .3, 5), flat('#3a2430'))
  trunk.position.y = height * .15
  group.add(trunk)
  for (let k = 0; k < 3; k++) {
    const r = height * (.3 - k * .07), h = height * (.42 - k * .06)
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), flat(k === 2 ? '#3f7766' : '#2c5a50'))
    cone.position.y = height * (.32 + k * .2) + h / 2 - height * .1
    cone.rotation.y = rand() * 3
    group.add(cone)
  }
  return group
}

function puff(seed: number, size: number) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const material = flat('#e6e0f6', { roughness: 1 })
  for (let i = 0; i < 5; i++) {
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(size * (.5 + rand() * .5), 0), material)
    ball.position.set((i - 2) * size * .7, (rand() - .3) * size * .4, (rand() - .5) * size * .6)
    ball.rotation.set(rand() * 3, rand() * 3, 0)
    group.add(ball)
  }
  return group
}

/** A soft round glow, drawn once, for the flash at the moment he changes. */
function glowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,246,228,1)')
  g.addColorStop(.35, 'rgba(255,214,170,.55)')
  g.addColorStop(1, 'rgba(255,190,150,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

/** The pitch, painted once: mown stripes, the halfway line and the centre circle, fading out at the edge of the meadow. */
function pitchTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? '#5662d2' : '#6d79e0'
    ctx.fillRect(i * size / 12, 0, size / 12 + 1, size)
  }
  ctx.strokeStyle = 'rgba(242,236,219,.95)'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(size / 2, 0)
  ctx.lineTo(size / 2, size)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * .2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(242,236,219,.95)'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'destination-in'
  const edge = ctx.createRadialGradient(size / 2, size / 2, size * .38, size / 2, size / 2, size / 2)
  edge.addColorStop(0, '#000')
  edge.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

type Isle = {
  id: IslandId
  group: THREE.Group
  /** Where the model stands. It spins, hops and squashes; the island does not. */
  mount: THREE.Group
  home: THREE.Vector3
  phase: number
  view: { at: THREE.Vector3; look: THREE.Vector3 }
  tick?: (t: number, dt: number) => void
}

type Loaded = { root: THREE.Object3D; meshes: THREE.Mesh[]; ghosts: THREE.Group }

export class IslandStage {
  readonly ready: Promise<void>
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(30, 1, .1, 60)
  private isles: Isle[] = []
  private models: Partial<Record<ModelName, Loaded>> = {}
  private loading: Partial<Record<ModelName, Promise<Loaded | null>>> = {}
  private raf = 0
  private last = 0
  private clock = 0
  private visible = true
  private disposed = false
  private observer: IntersectionObserver
  private raycaster = new THREE.Raycaster()
  private current = 0
  private flight: { from: [THREE.Vector3, THREE.Vector3]; to: number; t: number } | null = null
  private look = new THREE.Vector3()
  private outfit: Outfit = 'hike'
  private shown: ModelName | null = null
  private spin: { to: ModelName; t: number; swapped: boolean; turns: number; length: number } | null = null
  private water: THREE.Mesh | null = null
  private waterBase: Float32Array | null = null
  private waterOn = 0
  private sparkles: THREE.Points
  private flash: THREE.Sprite
  private card: THREE.Mesh | null = null
  private hop = -1

  constructor(private canvas: HTMLCanvasElement, private reduced = false) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.scene.fog = new THREE.Fog(GROUND, 9, 26)

    const sky = new THREE.HemisphereLight('#d6d9ff', '#4a2f78', 1.5)
    const key = new THREE.DirectionalLight('#ffd6b8', 2.3)
    key.position.set(3, 5, 4)
    const rim = new THREE.DirectionalLight('#8e9cee', 1.3)
    rim.position.set(-4, 2, -3)
    this.scene.add(sky, key, rim)

    this.build()

    // Stars that swirl up around him while he changes.
    const count = 120
    const glow = glowTexture()
    const sparkle = new THREE.BufferGeometry()
    sparkle.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3))
    const tints = new Float32Array(count * 3)
    const palette = ['#fff1dc', '#f6b455', '#f6866a', '#c9cffb'].map(c => new THREE.Color(c))
    for (let i = 0; i < count; i++) palette[i % palette.length].toArray(tints, i * 3)
    sparkle.setAttribute('color', new THREE.Float32BufferAttribute(tints, 3))
    this.sparkles = new THREE.Points(sparkle, new THREE.PointsMaterial({ map: glow, vertexColors: true, size: .11, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }))
    this.sparkles.visible = false
    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }))
    this.flash.visible = false
    this.isles[0].mount.parent!.add(this.sparkles, this.flash)

    const first = this.isles[0].view
    this.camera.position.copy(first.at)
    this.look.copy(first.look)
    this.camera.lookAt(this.look)

    this.observer = new IntersectionObserver(entries => { this.visible = entries.some(entry => entry.isIntersecting) })
    this.observer.observe(canvas)
    this.ready = this.show('hike').then(() => {
      // The rest arrive in the order you are likely to need them.
      void ['bike', 'paddle', 'podium', 'soccer'].reduce<Promise<unknown>>((wait, name) => wait.then(() => this.load(name as ModelName)), Promise.resolve())
    })
    this.start()
  }

  private build() {
    const place = (id: IslandId, at: [number, number, number], radius: number, depth: number, seed: number, grass: (x: number, z: number) => THREE.Color) => {
      const group = new THREE.Group()
      group.position.set(...at)
      group.add(island(radius, depth, seed, grass))
      const mount = new THREE.Group()
      mount.position.y = .05
      group.add(mount)
      const home = new THREE.Vector3(...at)
      // Each island is seen from a little to the left and only just above the meadow, so the rock under it shows.
      const view = { at: home.clone().add(new THREE.Vector3(-.55, .86, 4.15)), look: home.clone().add(new THREE.Vector3(.12, .3, 0)) }
      const isle: Isle = { id, group, mount, home, phase: seed * .7, view }
      this.isles.push(isle)
      this.scene.add(group)
      return isle
    }
    const meadow = (seed: number) => { const rand = rng(seed); return () => new THREE.Color('#5f6ad8').lerp(new THREE.Color('#8e9cee'), rand() * .6) }

    // The outdoors: pines, a few stones, and a pool that opens up under him when he takes the board out.
    const outdoors = place('outdoors', [0, 0, 0], 1.3, 1.25, 11, meadow(12))
    ;[[-.92, .38, .62, 1], [-.7, -.62, .48, 2], [.98, -.42, .54, 3], [.55, -.9, .36, 4]].forEach(([x, z, h, s]) => {
      const tree = pine(h, s)
      tree.position.set(x, .02, z)
      outdoors.group.add(tree)
    })
    ;[[.78, .55, .07], [-.5, .9, .05], [.25, .95, .04]].forEach(([x, z, r], i) => {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), flat('#8f7fb8'))
      stone.position.set(x, .03, z)
      stone.rotation.set(i, i * 2, 0)
      outdoors.group.add(stone)
    })
    const pool = new THREE.RingGeometry(.001, .74, 20, 3)
    pool.rotateX(-Math.PI / 2)
    this.water = new THREE.Mesh(pool, new THREE.MeshStandardMaterial({ color: '#3f86d8', flatShading: true, roughness: .25, transparent: true, opacity: .94 }))
    this.waterBase = Float32Array.from(pool.getAttribute('position').array as Float32Array)
    this.water.position.y = .06
    this.water.scale.setScalar(.001)
    this.water.visible = false
    outdoors.group.add(this.water)

    // Competing: a meadow with a few gold stars turning slowly over it.
    const competing = place('competing', [5.2, .55, -1.8], 1.2, 1.1, 21, meadow(22))
    const stars: THREE.Mesh[] = []
    for (let i = 0; i < 5; i++) {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(.045 + (i % 2) * .02, 0), flat('#f6b455', { emissive: '#7a4a10', emissiveIntensity: .6, metalness: .3, roughness: .5 }))
      competing.group.add(star)
      stars.push(star)
    }
    competing.tick = t => stars.forEach((star, i) => {
      const a = t * .35 + i / stars.length * Math.PI * 2
      star.position.set(Math.cos(a) * .95, .9 + Math.sin(t * 1.3 + i) * .08, Math.sin(a) * .55 - .2)
      star.rotation.y = t * 1.5 + i
    })

    // Games and security: a baseplate with studs, the drawing of him on his bricks, and behind him a little
    // house that builds itself brick by brick.
    const games = place('games', [10.1, -.15, -.6], 1.25, 1.2, 31, meadow(32))
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.5, .06, 1.5), flat('#5fa35a'))
    plate.position.y = .06
    plate.rotation.y = .2
    games.group.add(plate)
    const studs = new THREE.InstancedMesh(new THREE.CylinderGeometry(.035, .035, .03, 8), flat('#6db566'), 64)
    const m = new THREE.Matrix4()
    for (let i = 0; i < 64; i++) {
      m.makeTranslation(-.66 + (i % 8) * .19, .105, -.66 + Math.floor(i / 8) * .19)
      studs.setMatrixAt(i, m)
    }
    plate.add(studs)
    studs.position.y = -.06
    const colours = ['#d9485a', '#3b6fd4', '#f6b455', '#f2ecdb']
    const bricks: { mesh: THREE.Mesh; at: THREE.Vector3; when: number }[] = []
    const layout: [number, number, number, number][] = [
      [-.3, 0, -.2, 0], [0, 0, -.2, 0], [.3, 0, -.2, 0], [-.3, 0, .1, 1], [.3, 0, .1, 1],
      [-.3, 1, -.2, 2], [0, 1, -.2, 2], [.3, 1, -.2, 2], [-.3, 1, .1, 1], [.3, 1, .1, 1],
      [-.15, 2, -.05, 0], [.15, 2, -.05, 0], [0, 3, -.05, 3],
    ]
    layout.forEach(([x, layer, z, c], i) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(.22, .14, .21), flat(colours[c]))
      plate.add(mesh)
      bricks.push({ mesh, at: new THREE.Vector3(x * .8 + .38, .1 + layer * .14, z * .8 - .48), when: i * .28 })
    })
    games.tick = t => {
      // Thirteen bricks drop in, the house stands for a while, then it is packed away and begun again.
      const cycle = (t % 7.5)
      for (const brick of bricks) {
        const local = cycle - brick.when
        const fall = THREE.MathUtils.clamp(local / .35, 0, 1)
        const gone = THREE.MathUtils.clamp((cycle - 6.6) / .4, 0, 1)
        brick.mesh.visible = local > 0 && gone < 1
        brick.mesh.position.copy(brick.at)
        brick.mesh.position.y += (1 - fall * fall) * 1.2 + (fall >= 1 ? Math.max(0, Math.sin((local - .35) * 18) * .03 * Math.exp(-(local - .35) * 8)) : 0)
        brick.mesh.scale.setScalar(1 - gone)
      }
    }

    const art = new THREE.TextureLoader().load(CARD)
    art.colorSpace = THREE.SRGBColorSpace
    art.anisotropy = 4
    const card = new THREE.Mesh(new THREE.PlaneGeometry(CARD_HEIGHT * CARD_RATIO, CARD_HEIGHT), new THREE.MeshBasicMaterial({ map: art, transparent: true, alphaTest: .35 }))
    card.position.set(0, CARD_HEIGHT / 2 + .03, .12)
    games.mount.add(card)
    this.card = card

    // Soccer: the meadow mown in stripes, with the centre circle and halfway line, and a goal behind him.
    const soccer = place('soccer', [15.2, .45, -2.2], 1.3, 1.2, 41, meadow(42))
    const pitch = new THREE.Mesh(new THREE.CircleGeometry(1.16, 40), new THREE.MeshStandardMaterial({ map: pitchTexture(), roughness: .95, transparent: true }))
    pitch.rotation.x = -Math.PI / 2
    pitch.position.y = .056
    soccer.group.add(pitch)
    const line = flat('#f2ecdb')
    const goal = new THREE.Group()
    const post = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), line)
      bar.position.set(x, y, z)
      goal.add(bar)
    }
    post(.035, .42, .035, -.48, .21, 0)
    post(.035, .42, .035, .48, .21, 0)
    post(1, .035, .035, 0, .42, 0)
    const net: number[] = []
    for (let k = 0; k <= 10; k++) net.push(-.48 + k * .096, 0, -.18, -.48 + k * .096, .42, -.18)
    for (let k = 0; k <= 4; k++) net.push(-.48, k * .105, -.18, .48, k * .105, -.18)
    for (let k = 0; k <= 4; k++) net.push(-.48, k * .105, 0, -.48, k * .105, -.18, .48, k * .105, 0, .48, k * .105, -.18)
    const netGeometry = new THREE.BufferGeometry()
    netGeometry.setAttribute('position', new THREE.Float32BufferAttribute(net, 3))
    goal.add(new THREE.LineSegments(netGeometry, new THREE.LineBasicMaterial({ color: '#d6d4f2', transparent: true, opacity: .55 })))
    goal.position.set(.15, .06, -.85)
    soccer.group.add(goal)

    // Far islands and loose cloud, for depth. They are scenery: nothing stands on them.
    const rand = rng(51)
    for (let i = 0; i < 9; i++) {
      const far = island(.5 + rand() * .7, .6 + rand() * .6, 60 + i, meadow(70 + i))
      far.position.set(-4 + i * 2.6 + rand(), -1.2 + rand() * 3.2, -8 - rand() * 8)
      far.rotation.y = rand() * 6
      this.scene.add(far)
    }
    for (let i = 0; i < 14; i++) {
      const cloud = puff(80 + i, .22 + rand() * .3)
      cloud.position.set(-3 + i * 1.45 + rand(), -1.7 - rand() * 1.4, -1 - rand() * 6)
      this.scene.add(cloud)
    }
  }

  private load(name: ModelName) {
    this.loading[name] ??= new GLTFLoader().loadAsync(url(name)).then(gltf => {
      if (this.disposed) return null
      const meshes: THREE.Mesh[] = []
      gltf.scene.traverse(node => { if ((node as THREE.Mesh).isMesh) meshes.push(node as THREE.Mesh) })
      // A few faint copies trailing behind, shown only while he spins: the blur.
      const ghosts = new THREE.Group()
      for (let k = 0; k < 5; k++) {
        const ghost = gltf.scene.clone(true)
        ghost.traverse(node => {
          const mesh = node as THREE.Mesh
          if (!mesh.isMesh) return
          const material = (mesh.material as THREE.MeshStandardMaterial).clone()
          material.transparent = true
          material.depthWrite = false
          material.opacity = 0
          mesh.material = material
        })
        ghosts.add(ghost)
      }
      ghosts.visible = false
      const loaded = { root: gltf.scene, meshes, ghosts }
      this.models[name] = loaded
      return loaded
    }).catch(() => null)
    return this.loading[name]!
  }

  /** Put a model on the island it belongs to, and take the one that stood there before away. */
  private async show(name: ModelName) {
    const model = await this.load(name)
    if (!model || this.disposed) return
    const isle = this.isles[OUTFITS.includes(name as Outfit) ? 0 : ORDER.indexOf(name === 'podium' ? 'competing' : 'soccer')]
    if (OUTFITS.includes(name as Outfit)) {
      for (const other of OUTFITS) if (other !== name && this.models[other]) { this.models[other]!.root.removeFromParent(); this.models[other]!.ghosts.removeFromParent() }
      this.shown = name
    }
    if (model.root.parent !== isle.mount) isle.mount.add(model.root, model.ghosts)
  }

  /** Fly to an island. */
  go(index: number) {
    if (index === this.current && !this.flight) return
    this.current = index
    const isle = this.isles[index]
    const model = isle.id === 'competing' || isle.id === 'soccer' ? MODEL_OF[isle.id] : null
    if (model) void this.show(model)
    if (this.reduced) {
      this.flight = null
      this.camera.position.copy(isle.view.at)
      this.look.copy(isle.view.look)
      return
    }
    this.flight = { from: [this.camera.position.clone(), this.look.clone()], to: index, t: 0 }
  }

  /** Change into another outfit, with a spin. */
  dress(outfit: Outfit) {
    if (outfit === this.outfit && !this.spin) return
    this.outfit = outfit
    if (this.reduced || !this.shown) {
      void this.show(outfit)
      return
    }
    void this.load(outfit)
    this.spin = { to: outfit, t: 0, swapped: false, turns: TURNS, length: SPIN }
  }

  /** Clicked: on the first island that means the next outfit; anywhere else, a little hop and a turn. */
  poke() {
    if (this.reduced || this.spin) return
    const isle = this.isles[this.current]
    if (isle.id === 'games') { this.hop = 0; return }
    if (isle.id !== 'competing' && isle.id !== 'soccer') return
    this.spin = { to: MODEL_OF[isle.id], t: 0, swapped: true, turns: 1, length: .8 }
  }

  /** Whether a point on the canvas (in client coordinates) is over him. */
  hits(x: number, y: number) {
    const isle = this.isles[this.current]
    if (!isle || this.flight) return false
    const box = this.canvas.getBoundingClientRect()
    this.raycaster.setFromCamera(new THREE.Vector2((x - box.left) / box.width * 2 - 1, -((y - box.top) / box.height) * 2 + 1), this.camera)
    const targets = isle.mount.children.filter(child => child.visible)
    return this.raycaster.intersectObjects(targets, true).length > 0
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // Squarer and taller screens step back, so the island still fits across.
    this.camera.fov = w / h < 1.15 ? 37 : 30
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

    // Every island bobs on its own slow swell.
    for (const isle of this.isles) {
      isle.group.position.y = isle.home.y + (still ? 0 : Math.sin(t * .6 + isle.phase) * .04)
      isle.group.rotation.y = still ? 0 : Math.sin(t * .25 + isle.phase) * .05
      isle.tick?.(still ? 2.5 : t, dt)
    }

    // The camera: along an arc from where it was to the next island, rising over the gap.
    const isle = this.isles[this.current]
    const bob = new THREE.Vector3(0, isle.group.position.y - isle.home.y, 0)
    if (this.flight) {
      this.flight.t = Math.min(1, this.flight.t + dt / FLIGHT)
      const k = ease(this.flight.t)
      this.camera.position.lerpVectors(this.flight.from[0], isle.view.at.clone().add(bob), k).y += Math.sin(Math.PI * k) * .7
      this.look.lerpVectors(this.flight.from[1], isle.view.look.clone().add(bob), k)
      if (this.flight.t >= 1) this.flight = null
    } else {
      this.camera.position.copy(isle.view.at).add(bob)
      this.look.copy(isle.view.look).add(bob)
    }
    this.camera.lookAt(this.look)

    // He turns a little this way and that while he stands there.
    for (const each of this.isles) if (!this.spin || each !== isle) each.mount.rotation.y = still ? 0 : Math.sin(t * .5 + each.phase) * .22

    this.updateSpin(dt)
    this.updateWater(t, dt)

    // The card always turns to face the camera, and hops when it is clicked.
    if (this.card) {
      const at = this.card.getWorldPosition(new THREE.Vector3())
      this.card.lookAt(this.camera.position.x, at.y, this.camera.position.z)
      let lift = 0
      if (this.hop >= 0) {
        this.hop += dt
        lift = Math.sin(Math.PI * Math.min(1, this.hop / .45)) * .16
        if (this.hop >= .45) this.hop = -1
      }
      this.card.position.y = CARD_HEIGHT / 2 + .03 + lift
    }
  }

  private updateSpin(dt: number) {
    const spin = this.spin
    const isle = this.isles[this.current]
    const mount = isle.mount
    if (!spin) {
      this.sparkles.visible = this.flash.visible = false
      mount.scale.set(1, 1, 1)
      mount.position.y = .05
      return
    }
    spin.t = Math.min(1, spin.t + dt / spin.length)
    const t = spin.t
    const speed = Math.sin(Math.PI * t)
    // The angle is the integral of that speed, so it ends exactly a whole number of turns later, facing you.
    mount.rotation.y = spin.turns * Math.PI * (1 - Math.cos(Math.PI * t)) + Math.sin(this.clock * .5 + isle.phase) * .22 * (1 - speed)
    mount.scale.set(1 - .1 * speed, 1 + .14 * speed, 1 - .1 * speed)
    mount.position.y = .05 + (spin.turns === 1 ? .2 : .1) * speed

    // At full speed, when he is only a blur, the swap.
    if (!spin.swapped && t >= .5) {
      spin.swapped = true
      void this.show(spin.to)
    }

    const current = this.models[this.shown && isle.id === 'outdoors' ? this.shown : spin.to]
    if (current) {
      current.ghosts.visible = speed > .2
      current.ghosts.children.forEach((ghost, k) => {
        ghost.rotation.y = -(k + 1) * .3 * speed
        ghost.traverse(node => { const mesh = node as THREE.Mesh; if (mesh.isMesh) (mesh.material as THREE.MeshStandardMaterial).opacity = .42 * speed * (1 - k / 5.5) })
      })
      // He lights up as he goes round, brightest at the swap.
      const glow = Math.pow(speed, 2.5) * (spin.turns === 1 ? .25 : 1)
      for (const mesh of current.meshes) {
        const material = mesh.material as THREE.MeshStandardMaterial
        material.emissive.setRGB(1, .9, .78)
        material.emissiveIntensity = glow * 1.1
      }
    }

    // A column of stars around him, rising as he turns, and a flash of light at the swap.
    const parent = mount.parent!
    if (this.sparkles.parent !== parent) parent.add(this.sparkles, this.flash)
    this.sparkles.visible = true
    ;(this.sparkles.material as THREE.PointsMaterial).opacity = speed
    const position = this.sparkles.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < position.count; i++) {
      const h = ((i / position.count) * 1.7 + t * 1.6) % 1
      const a = i * 2.39996 + this.clock * 9
      const r = .55 - h * .25 + Math.sin(i * 7.1) * .06
      position.setXYZ(i, Math.cos(a) * r, h * 1.4, Math.sin(a) * r)
    }
    position.needsUpdate = true
    const flash = Math.max(0, 1 - Math.abs(t - .5) * 4.5) * (spin.turns === 1 ? 0 : 1)
    this.flash.visible = flash > 0
    this.flash.position.set(0, .5, .35)
    this.flash.scale.set(.8 + flash * 1.6, 1 + flash * 2.2, 1)
    ;(this.flash.material as THREE.SpriteMaterial).opacity = Math.min(1, flash * 1.3)

    if (t >= 1) {
      this.spin = null
      for (const model of Object.values(this.models)) {
        model.ghosts.visible = false
        for (const mesh of model.meshes) (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0
      }
    }
  }

  /** The pool on the first island: there while he has the board out, rippling, gone when he puts it away. */
  private updateWater(t: number, dt: number) {
    const water = this.water
    if (!water || !this.waterBase) return
    const wanted = this.shown === 'paddle' ? 1 : 0
    const rate = this.reduced ? 1 : Math.min(1, dt * 3.2)
    this.waterOn += (wanted - this.waterOn) * rate
    water.visible = this.waterOn > .01
    if (!water.visible) return
    water.scale.setScalar(Math.max(.001, this.waterOn))
    const position = water.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < position.count; i++) {
      const x = this.waterBase[i * 3], z = this.waterBase[i * 3 + 2]
      const edge = Math.hypot(x, z) / .74
      position.setY(i, this.reduced ? 0 : (Math.sin(x * 9 + t * 2.2) + Math.cos(z * 8 - t * 1.7)) * .012 * (1 - edge * .6))
    }
    position.needsUpdate = true
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.scene.traverse(node => {
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh && !(node as THREE.Points).isPoints && !(node as THREE.Sprite).isSprite) return
      mesh.geometry?.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials) {
        ;(material as THREE.MeshStandardMaterial).map?.dispose()
        material?.dispose()
      }
    })
    for (const model of Object.values(this.models)) model.root.traverse(node => {
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.geometry.dispose()
      ;(mesh.material as THREE.MeshStandardMaterial).map?.dispose()
      ;(mesh.material as THREE.MeshStandardMaterial).dispose()
    })
    this.renderer.dispose()
  }
}
