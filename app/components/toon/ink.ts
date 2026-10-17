import * as THREE from 'three'

// The ink. A scene is drawn twice: once in colour (with its depth), and once as nothing but the direction
// each surface faces. A last pass looks for where the depth jumps (an object standing in front of another)
// and where the facing turns sharply (a fold, a rim, the edge of a step), and draws a line there in ink. The
// lines boil a little, a few times a second, the way redrawn frames do; the darkest shadows are hatched, and
// the whole picture is laid on paper. This is what makes simple shapes read as an illustration.

/** Layer for things that are drawn but never outlined from their facing: water, glass, lines, particles. */
export const PLAIN = 1

const vertex = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }
`

const fragment = /* glsl */`
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform vec2 uSize;
uniform float uNear;
uniform float uFar;
uniform float uLine;
uniform float uTime;
uniform float uBoil;
uniform vec3 uInk;
uniform float uHatch;
uniform float uPaper;
uniform float uDepthEdge;
uniform vec2 uFog;
varying vec2 vUv;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float depthAt(vec2 uv) {
  float z = texture2D(tDepth, uv).x * 2. - 1.;
  return 2. * uNear * uFar / (uFar + uNear - z * (uFar - uNear));
}
vec4 normalAt(vec2 uv) { vec4 n = texture2D(tNormal, uv); return vec4(n.xyz * 2. - 1., n.a); }

void main() {
  vec4 color = texture2D(tColor, vUv);
  // The pen wanders by a pixel or so, and settles somewhere else a few times a second.
  float frame = floor(uTime * uBoil);
  vec2 px = 1. / uSize;
  vec2 wander = (vec2(noise(vUv * uSize / 36. + frame * 7.13), noise(vUv * uSize / 36. + 41.7 + frame * 3.31)) - .5) * 1.8 * px;
  vec2 uv = vUv + wander;

  float d0 = depthAt(uv);
  // Far things are drawn with a finer pen.
  float reach = uLine * mix(1., .55, smoothstep(uNear * 6., uFar * .6, d0));
  vec2 dx = vec2(reach, 0.) * px, dy = vec2(0., reach) * px;
  // Measured in one over the distance, which runs straight across any flat surface however it is tilted, so a
  // floor seen at a slant makes no lines, and only a real step does.
  float w0 = 1. / d0;
  float wl = 1. / depthAt(uv - dx), wr = 1. / depthAt(uv + dx), wu = 1. / depthAt(uv + dy), wd = 1. / depthAt(uv - dy);
  float jump = max(abs(wl + wr - 2. * w0), abs(wu + wd - 2. * w0)) / w0;
  float depthEdge = smoothstep(uDepthEdge, uDepthEdge * 2.4, jump);

  vec4 n0 = normalAt(uv);
  vec4 nl = normalAt(uv - dx), nr = normalAt(uv + dx), nu = normalAt(uv + dy), nd = normalAt(uv - dy);
  float turn = 0.;
  if (n0.a > .5) {
    turn = max(turn, nl.a > .5 ? 1. - dot(n0.xyz, nl.xyz) : 0.);
    turn = max(turn, nr.a > .5 ? 1. - dot(n0.xyz, nr.xyz) : 0.);
    turn = max(turn, nu.a > .5 ? 1. - dot(n0.xyz, nu.xyz) : 0.);
    turn = max(turn, nd.a > .5 ? 1. - dot(n0.xyz, nd.xyz) : 0.);
  }
  float normalEdge = smoothstep(.32, .6, turn);
  // Lines fade into the haze along with everything else.
  float ink = max(depthEdge, normalEdge) * (1. - .85 * smoothstep(uFog.x, uFog.y, d0));

  vec3 col = color.rgb;
  // Hatching where the shade is deepest: diagonal strokes, a second set across them where it is deeper still.
  float lum = dot(col, vec3(.299, .587, .114));
  vec2 p = gl_FragCoord.xy + wander * uSize * .6;
  float strokeA = smoothstep(.55, .9, abs(fract((p.x + p.y) / 6.) - .5) * 2.);
  float strokeB = smoothstep(.55, .9, abs(fract((p.x - p.y) / 7.) - .5) * 2.);
  float shade = 1. - smoothstep(.06, .2, lum);
  float deep = 1. - smoothstep(.02, .09, lum);
  col = mix(col, col * .55, uHatch * (strokeA * shade * .55 + strokeB * deep * .5));

  col = mix(col, uInk, ink * .92);
  // Paper: a fine tooth, and a few fibres.
  float tooth = hash(floor(gl_FragCoord.xy)) - .5;
  float fibre = noise(gl_FragCoord.xy * vec2(.015, .11)) - .5;
  col *= 1. + uPaper * (tooth * .07 + fibre * .05);

  float alpha = max(color.a, ink * .92);
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}
`

export type InkOptions = {
  /** Line weight in device pixels. */
  line?: number
  /** Redraws per second; 0 holds the lines still. */
  boil?: number
  hatch?: number
  paper?: number
  ink?: string
  /** How big a jump in depth, relative to the distance, makes a line. Lower draws more. */
  depthEdge?: number
}

/** Draws a scene through the ink pass, into whatever render target (or the canvas) is current. */
export class Inker {
  private color: THREE.WebGLRenderTarget
  private normals: THREE.WebGLRenderTarget
  private normalMaterial = new THREE.MeshNormalMaterial()
  private quad: THREE.Mesh
  private flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private material: THREE.ShaderMaterial
  private hidden: THREE.Object3D[] = []
  private swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = []

  constructor(private renderer: THREE.WebGLRenderer, options: InkOptions = {}) {
    const make = (samples: number) => {
      const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples })
      return target
    }
    this.color = make(4)
    this.color.depthTexture = new THREE.DepthTexture(1, 1)
    this.normals = make(0)
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        tColor: { value: this.color.texture },
        tDepth: { value: this.color.depthTexture },
        tNormal: { value: this.normals.texture },
        uSize: { value: new THREE.Vector2(1, 1) },
        uNear: { value: .1 },
        uFar: { value: 100 },
        uLine: { value: options.line ?? 1.6 },
        uTime: { value: 0 },
        uBoil: { value: options.boil ?? 5 },
        uInk: { value: new THREE.Color(options.ink ?? '#16241d') },
        uHatch: { value: options.hatch ?? 1 },
        uPaper: { value: options.paper ?? 1 },
        uDepthEdge: { value: options.depthEdge ?? .045 },
        uFog: { value: new THREE.Vector2(1e6, 2e6) },
      },
      depthTest: false,
      depthWrite: false,
      // The picture replaces whatever was there: it is already premultiplied, alpha and all.
      blending: THREE.NoBlending,
    })
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
  }

  set(options: InkOptions) {
    const u = this.material.uniforms
    if (options.line !== undefined) u.uLine.value = options.line
    if (options.boil !== undefined) u.uBoil.value = options.boil
    if (options.hatch !== undefined) u.uHatch.value = options.hatch
    if (options.paper !== undefined) u.uPaper.value = options.paper
    if (options.depthEdge !== undefined) u.uDepthEdge.value = options.depthEdge
  }

  setSize(width: number, height: number) {
    if (this.color.width === width && this.color.height === height) return
    this.color.setSize(width, height)
    this.normals.setSize(width, height)
    this.material.uniforms.uSize.value.set(width, height)
  }

  /**
   * Draw `scene` through `camera`. `target` is where the finished picture goes: null for the renderer's
   * canvas. Objects on the PLAIN layer are left out of the facing pass, so water and glass do not crinkle.
   */
  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, time: number, target: THREE.WebGLRenderTarget | null = null) {
    const r = this.renderer
    const background = scene.background, fog = scene.fog
    const clear = r.getClearColor(new THREE.Color()), alpha = r.getClearAlpha()

    // Facing, without the sky, the fog, the shadows or anything plain. Each mesh is drawn in the facing
    // material, or in one of its own (`userData.inkNormal`) where it needs to cut or clip the same way it
    // does in colour.
    const shadows = r.shadowMap.autoUpdate
    r.shadowMap.autoUpdate = false
    scene.background = null
    scene.fog = null
    this.hidden.length = 0
    this.swapped.length = 0
    scene.traverse(node => {
      if (!node.visible) return
      if (node.layers.mask & (1 << PLAIN)) { node.visible = false; this.hidden.push(node); return }
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh) return
      this.swapped.push([mesh, mesh.material])
      mesh.material = (mesh.userData.inkNormal as THREE.Material | undefined) ?? this.normalMaterial
    })
    r.setRenderTarget(this.normals)
    r.setClearColor(0x000000, 0)
    r.clear()
    r.render(scene, camera)
    for (const node of this.hidden) node.visible = true
    for (const [mesh, material] of this.swapped) mesh.material = material
    scene.background = background
    scene.fog = fog

    // Colour and depth.
    r.shadowMap.autoUpdate = shadows
    r.setClearColor(clear, alpha)
    r.setRenderTarget(this.color)
    r.clear()
    r.render(scene, camera)

    // Ink.
    const u = this.material.uniforms
    u.uNear.value = camera.near
    u.uFar.value = camera.far
    u.uTime.value = time
    if (fog instanceof THREE.Fog) u.uFog.value.set(fog.near, fog.far)
    else u.uFog.value.set(1e6, 2e6)
    r.setRenderTarget(target)
    r.render(this.quad, this.flat)
  }

  dispose() {
    this.color.depthTexture?.dispose()
    this.color.dispose()
    this.normals.dispose()
    this.normalMaterial.dispose()
    this.material.dispose()
    this.quad.geometry.dispose()
  }
}
