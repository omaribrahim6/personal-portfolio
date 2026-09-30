export const vertex = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0., 1.); }
`

const header = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`

// One full-screen painting, every frame: a graded sky, stars, a moon that becomes the morning sun, and two
// clouds. The clouds' shapes are not worked out here. They arrive as small images (see clouds.ts) holding a
// surface normal, a contact shadow and a coverage value per texel; this shader lights them, lets them drift,
// and adds grain and specks last. Keeping the hundred-odd spheres out of the shader matters twice over: it
// is cheap to run, and it compiles instantly. Written out in GLSL they took Direct3D seconds to compile.
export const fragment = `${header}
uniform vec2 uRes;
uniform float uPx;
uniform float uTime;
uniform vec3 uSkyTop;
uniform vec3 uSkyMid;
uniform vec3 uSkyLow;
uniform vec3 uGlow;
uniform vec2 uGlowAt;
uniform float uStars;
uniform vec4 uOrb;
uniform vec3 uOrbCol;
uniform float uHalo;
uniform sampler2D uShapeA;
uniform sampler2D uShapeB;
uniform vec4 uBoxA;
uniform vec4 uBoxB;
uniform vec4 uA;
uniform vec4 uB;
uniform vec3 uALit;
uniform vec3 uAShade;
uniform vec3 uADeep;
uniform vec3 uATop;
uniform vec3 uBLit;
uniform vec3 uBShade;
uniform vec3 uBDeep;
uniform vec3 uBTop;
uniform vec3 uLightA;
uniform vec3 uLightB;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}

vec3 shade(vec4 shape, vec2 q, vec3 lit, vec3 shadow, vec3 deep, vec3 top, vec3 light, float speck) {
  vec3 n = vec3(shape.rg * 2. - 1., 0.);
  n.z = sqrt(max(1. - dot(n.xy, n.xy), 0.));
  // Small-scale cauliflower: nudge the normal with noise so no surface is perfectly smooth.
  vec3 m = normalize(n + vec3(vnoise(q * 15.) - .5, vnoise(q * 15. + 31.) - .5, 0.) * .4);
  float facing = dot(m, light);
  float k = smoothstep(-.3, .68, facing);
  vec3 c = mix(shadow, lit, k);
  // Faces turned up to the sky pick up its colour; faces square to the light burn hotter.
  c = mix(c, top, smoothstep(.2, .9, m.y) * .45 * (1. - k));
  c += lit * .16 * smoothstep(.72, 1., facing);
  // Each lobe darkens toward its own edge, and into the gaps where a nearer lobe overhangs it.
  float limb = pow(1. - n.z, 2.2);
  vec3 dark = mix(shadow * .62, deep, k * .75 + .1);
  c = mix(c, dark, clamp(limb * .42 + shape.b * .62, 0., .85));
  // Pigment: a soft mottle, then bright specks where the light lands.
  c *= .93 + .14 * vnoise(q * 34.);
  c += speck * (.07 + .3 * k);
  return c;
}

// Clouds never hold still: the lookup drifts a little, so the whole mass slowly boils.
vec4 shapeAt(sampler2D shape, vec4 box, vec2 q, float t) {
  q += .05 * vec2(vnoise(q * 3.2 + vec2(t, 0.)) - .5, vnoise(q * 3.2 + vec2(9., t * .8)) - .5);
  vec2 st = (q - box.xy) / box.zw;
  if (st.x < 0. || st.x > 1. || st.y < 0. || st.y > 1.) return vec4(.5, .5, 0., 0.);
  return texture2D(shape, st);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - .5) * aspect, uv.y);
  float g = hash(floor(gl_FragCoord.xy / uPx));

  vec3 col = mix(uSkyLow, uSkyMid, smoothstep(.1, .52, uv.y));
  col = mix(col, uSkyTop, smoothstep(.42, 1., uv.y));
  col += (vnoise(p * 2.6 + 4.) - .5) * .035;

  float band = exp(-pow((uv.y - uGlowAt.x) / .17, 2.));
  col = mix(col, uGlow, band * uGlowAt.y);

  if (uStars > .01) {
    float s = 0.;
    for (int i = 0; i < 2; i++) {
      float scale = i == 0 ? 46. : 90.;
      vec2 gp = p * scale + float(i) * 17.3;
      vec2 id = floor(gp);
      float h = hash(id);
      if (h > .83) {
        vec2 o = (vec2(hash(id + 3.1), hash(id + 7.7)) - .5) * .7;
        float d = length(fract(gp) - .5 - o);
        float twinkle = .62 + .38 * sin(uTime * (.5 + h * 1.7) + h * 40.);
        float size = (i == 0 ? .05 : .075) + .07 * fract(h * 13.);
        s += smoothstep(size, 0., d) * twinkle * (.45 + .55 * fract(h * 7.));
      }
    }
    col += s * uStars * smoothstep(.18, .6, uv.y) * vec3(1., .93, .86);
  }

  vec2 o = p - vec2((uOrb.x - .5) * aspect, uOrb.y);
  float od = length(o);
  col += uOrbCol * exp(-od / (uOrb.z * 3.2)) * uHalo * uOrb.w;
  float disc = smoothstep(uOrb.z, uOrb.z - 1.5 / uRes.y, od) * uOrb.w;
  col = mix(col, uOrbCol * (.9 + .16 * vnoise(o / uOrb.z * 2.4 + 3.)), disc);

  float speck = step(.986, g);

  if (uB.w > .01) {
    vec2 q = (p - vec2((uB.x - .5) * aspect, uB.y)) / uB.z;
    vec4 shape = shapeAt(uShapeB, uBoxB, q, uTime * .03);
    if (shape.a > .004) col = mix(col, shade(shape, q, uBLit, uBShade, uBDeep, uBTop, uLightB, speck), shape.a * smoothstep(-.06, .3, q.y) * uB.w);
  }

  if (uA.w > .01) {
    vec2 q = (p - vec2((uA.x - .5) * aspect, uA.y)) / uA.z;
    vec4 shape = shapeAt(uShapeA, uBoxA, q, uTime * .034);
    if (shape.a > .004) col = mix(col, shade(shape, q, uALit, uAShade, uADeep, uATop, uLightA, speck), shape.a * smoothstep(-.06, .26, q.y) * uA.w);
  }

  col += (g - .5) * .05;
  gl_FragColor = vec4(col, 1.);
}
`
