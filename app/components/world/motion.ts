import type { Angles, Joint, Pose } from './puppet'

// How Omar moves: each clip is a pose worked out from a time or a phase, in the puppet's own space (facing +Z).
// Signs, as the rig has them: a limb swings forward with a negative x, a knee or an elbow bends with a
// positive x on the lower bone, the right arm lifts out to the side with a negative z and the left with a
// positive one, and the spine leans forward with a positive x. `lift` lowers or raises the whole body.

const s = Math.sin, c = Math.cos

/** Standing, breathing, the weight shifting slowly from foot to foot. */
export function idle(t: number): Pose {
  const breath = s(t * 1.7), sway = s(t * .55)
  return {
    spine: [.02 + breath * .012, sway * .02, sway * .015],
    chest: [-breath * .015, 0, 0],
    head: [s(t * .4) * .04, s(t * .27) * .18, 0],
    armL: [breath * .02, 0, .1], armR: [-breath * .02, 0, -.1],
    foreL: [-.12, 0, 0], foreR: [-.12, 0, 0],
    hips: [0, sway * .03, sway * .015],
  }
}

/**
 * Walking. `phase` runs 2π a stride (a step with each foot); one stride covers about .78 of the body's height.
 * `arms` scales how much the arms swing, for outfits that do not like it.
 */
export function walk(phase: number, arms = 1): Pose {
  const sp = s(phase), cp = c(phase)
  return {
    lift: -.018 * Math.abs(sp),
    hips: [0, -sp * .06, 0],
    spine: [.06, sp * .05, 0],
    chest: [0, sp * .07, 0],
    head: [-.04, -sp * .05, 0],
    thighL: [-sp * .45, 0, 0], thighR: [sp * .45, 0, 0],
    shinL: [.08 + .65 * Math.max(0, cp), 0, 0], shinR: [.08 + .65 * Math.max(0, -cp), 0, 0],
    footL: [-.2 * Math.max(0, cp), 0, 0], footR: [-.2 * Math.max(0, -cp), 0, 0],
    armL: [sp * .35 * arms, 0, .08], armR: [-sp * .35 * arms, 0, -.08],
    foreL: [-.25 - .15 * Math.max(0, -sp) * arms, 0, 0], foreR: [-.25 - .15 * Math.max(0, sp) * arms, 0, 0],
  }
}
/** How far one radian of the walk goes, for a body 1 tall. */
export const STRIDE = .78 / (Math.PI * 2)

/** Waving with the right hand, high. */
export function wave(t: number): Pose {
  const base = idle(t)
  const swing = s(t * 9) * .45
  return { ...base, armR: [-.2, 0, -2.25], foreR: [0, 0, -.55 + swing * .5], handR: [0, 0, swing * .3], head: [-.06, -.15, .06] }
}

/** Pointing ahead with the right arm, at something off to the right. */
export function point(t: number, aim = .4): Pose {
  const base = idle(t)
  return { ...base, armR: [-1.25, -aim, -.25], foreR: [-.15, 0, 0], head: [-.04, -aim * .8, 0], chest: [0, -aim * .25, 0] }
}

/** Both arms up, bouncing. */
export function cheer(t: number): Pose {
  const bounce = Math.abs(s(t * 5.5))
  return {
    lift: bounce * .05,
    spine: [-.08, 0, 0],
    armL: [-.3, 0, 2.3 + s(t * 11) * .15], armR: [-.3, 0, -2.3 - s(t * 11) * .15],
    foreL: [0, 0, .3], foreR: [0, 0, -.3],
    head: [-.15, 0, s(t * 5.5) * .05],
    thighL: [-.1 * bounce, 0, 0], thighR: [-.1 * bounce, 0, 0], shinL: [.2 * bounce, 0, 0], shinR: [.2 * bounce, 0, 0],
  }
}

/** Sitting on something about knee high, hands on the knees. */
export function sit(t: number, drop = .3): Pose {
  const breath = s(t * 1.7)
  return {
    lift: -drop,
    spine: [.08 + breath * .01, 0, 0],
    thighL: [-1.45, 0, .08], thighR: [-1.45, 0, -.08],
    shinL: [1.45, 0, 0], shinR: [1.45, 0, 0],
    armL: [-.55, 0, .15], armR: [-.55, 0, -.15], foreL: [-.6, 0, 0], foreR: [-.6, 0, 0],
    head: [s(t * .4) * .05, s(t * .3) * .2, 0],
  }
}

/** Sitting on an edge with the legs over it, swinging them. */
export function perch(t: number, drop = .3): Pose {
  const base = sit(t, drop)
  return { ...base, shinL: [.9 + s(t * 1.6) * .25, 0, 0], shinR: [.9 + s(t * 1.6 + 1.7) * .25, 0, 0], armL: [.3, 0, .3], armR: [.3, 0, -.3], foreL: [-.2, 0, 0], foreR: [-.2, 0, 0], spine: [-.05, 0, 0] }
}

/** A kick with the right foot. `u` runs 0 to 1: wind up, strike, follow through. */
export function kick(u: number): Pose {
  const back = Math.max(0, s(Math.min(1, u / .45) * Math.PI / 2))
  const strike = u < .45 ? 0 : s(Math.min(1, (u - .45) / .3) * Math.PI / 2)
  const settle = u < .8 ? 0 : (u - .8) / .2
  const thigh = (.55 * back - 1.4 * strike) * (1 - settle)
  return {
    spine: [.1 - strike * .15, 0, 0],
    chest: [0, -.25 * back + .3 * strike, 0],
    thighR: [thigh, 0, 0], shinR: [(.9 * back) * (1 - strike) + .1, 0, 0],
    thighL: [.1, 0, 0], shinL: [.15, 0, 0],
    armL: [-.5 * strike, 0, .5 + .3 * strike], armR: [.4 * strike, 0, -.4 - .2 * back],
    head: [.15, 0, 0],
  }
}

/** Watering: the can held out in the right hand, tipped. */
export function water(t: number): Pose {
  const base = idle(t)
  const tip = .25 + s(t * .8) * .1
  return { ...base, armR: [-.9, 0, -.2], foreR: [-.35, 0, 0], handR: [tip, 0, 0], armL: [.05, 0, .15], head: [.25, 0, 0], spine: [.12, 0, 0] }
}

/** At a laptop, cross-legged or seated: typing, with a nod now and then. */
export function type(t: number): Pose {
  const tap = s(t * 14) * .05, tap2 = s(t * 13 + 1) * .05
  return {
    spine: [.15, 0, 0], head: [.2 + s(t * .9) * .05, s(t * .35) * .12, 0],
    armL: [-.75, 0, .2], armR: [-.75, 0, -.2], foreL: [-.75 + tap, 0, 0], foreR: [-.75 + tap2, 0, 0],
  }
}

/** On a longboard, side on, knees bent, arms out for balance. */
export function skate(t: number): Pose {
  const lean = s(t * .9) * .12
  return {
    lift: -.08,
    hips: [0, Math.PI / 2 * .9, lean],
    spine: [.15, -.3, -lean],
    thighL: [-.45, 0, .25], thighR: [.2, 0, -.2], shinL: [.7, 0, 0], shinR: [.5, 0, 0],
    armL: [-.2, 0, 1.1 + lean], armR: [.2, 0, -1.0 + lean], foreL: [0, 0, .3], foreR: [0, 0, -.3],
    head: [0, -1.1, 0],
  }
}

/** One pose part way to another. */
export function blend(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return a
  if (t >= 1) return b
  const out: Pose = {}
  const joints = new Set([...Object.keys(a), ...Object.keys(b)].filter(k => k !== 'lift' && k !== 'shift')) as Set<Joint>
  for (const joint of joints) {
    const x = (a[joint] as Angles | undefined) ?? [0, 0, 0], y = (b[joint] as Angles | undefined) ?? [0, 0, 0]
    out[joint] = [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]
  }
  out.lift = (a.lift ?? 0) + ((b.lift ?? 0) - (a.lift ?? 0)) * t
  return out
}
