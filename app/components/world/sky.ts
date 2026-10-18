import * as THREE from 'three'
import { plain } from '../toon/kit'

// The sky over the whole voyage: a dome that goes wherever the camera does, coloured by height above the
// horizon in five bands, with the sun drawn into it as a disc and a halo. Its colours are uniforms, so the
// time of day can run on from one stop to the next without building anything again.

export type SkyColors = [string, string, string, string, string]

const vertex = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = normalize((modelMatrix * vec4(position, 1.)).xyz - cameraPosition);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  gl_Position = p.xyww;
}
`

const fragment = /* glsl */`
uniform vec3 uBands[5];
uniform vec3 uSun;
uniform vec3 uSunColor;
uniform float uSunSize;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float up = max(d.y, 0.);
  vec3 c = mix(uBands[0], uBands[1], smoothstep(0., .035, up));
  c = mix(c, uBands[2], smoothstep(.035, .12, up));
  c = mix(c, uBands[3], smoothstep(.12, .32, up));
  c = mix(c, uBands[4], smoothstep(.32, .75, up));
  // The sun: a flat disc with a ring of halo, as a printer would do it.
  float a = dot(d, normalize(uSun));
  float disc = smoothstep(cos(uSunSize), cos(uSunSize * .96), a);
  float halo = smoothstep(cos(uSunSize * 2.6), cos(uSunSize * 2.2), a) * (1. - smoothstep(cos(uSunSize * 1.7), cos(uSunSize * 1.5), a));
  c = mix(c, mix(c, uSunColor, .35), halo);
  c = mix(c, uSunColor, disc);
  // Below the horizon the haze carries on, so the sea fades into it.
  c = mix(c, uBands[0], smoothstep(0., -.05, d.y));
  gl_FragColor = vec4(c, 1.);
  #include <colorspace_fragment>
}
`

export function createSky() {
  const uniforms = {
    uBands: { value: Array.from({ length: 5 }, () => new THREE.Color()) },
    uSun: { value: new THREE.Vector3(0, .3, -1) },
    uSunColor: { value: new THREE.Color('#fff2c8') },
    uSunSize: { value: .05 },
  }
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, side: THREE.BackSide, depthWrite: false, fog: false })
  const dome = plain(new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), material))
  dome.renderOrder = -10
  dome.frustumCulled = false
  return {
    dome,
    set(bands: THREE.Color[], sun: THREE.Vector3, sunColor: THREE.Color, sunSize: number) {
      bands.forEach((c, i) => uniforms.uBands.value[i].copy(c))
      uniforms.uSun.value.copy(sun)
      uniforms.uSunColor.value.copy(sunColor)
      uniforms.uSunSize.value = sunSize
    },
  }
}
