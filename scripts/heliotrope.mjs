// Heliotrope: the display face for the solar punk site. Capitals only (lower case maps onto them), drawn
// the way the lettering on a retro-futurist expo poster is: one heavy monoline stroke, wide, with big
// rounded bends, flat ends with their corners just softened, and stencil gaps wherever a bar would meet a stem.
//
//   node scripts/heliotrope.mjs
//
// Writes app/fonts/heliotrope.woff       the solid letters
//        app/fonts/heliotrope-line.woff  a hairline down the middle of every stroke, on the same metrics,
//                                        to lay over the solid in a second colour (an inline, like a sign)
//        app/fonts/heliotrope-light.woff the same skeletons, drawn thin
//
// Every letter is a skeleton: a few polylines on a 1000-unit em, cap height 700, with a fillet radius at
// each corner. The outline is worked out exactly from it: straight edges stay straight and each bend is a
// pair of concentric arcs, written as cubic curves. Strokes overlap where they join; the fill is nonzero,
// so the overlaps simply merge.
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import opentype from 'opentype.js'

const OUT = 'app/fonts'
const CAP = 700

/* ---------------------------------------------------------------- geometry */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const len = a => Math.hypot(a[0], a[1])
const unit = a => mul(a, 1 / len(a))
const left = d => [-d[1], d[0]]
const cross = (a, b) => a[0] * b[1] - a[1] * b[0]
const inner = (a, b) => a[0] * b[0] + a[1] * b[1]

/** Where two lines meet: through p along d, and through q along e. */
function meet(p, d, q, e) {
  const den = cross(d, e)
  if (Math.abs(den) < 1e-9) return p
  const t = cross(sub(q, p), e) / den
  return add(p, mul(d, t))
}

/**
 * A skeleton polyline as a run of straight pieces and fillet arcs. Each corner is rounded with its own
 * radius (0 keeps it sharp), shrunk where neighbouring corners would otherwise overlap on a short side.
 */
function centreline(points, closed, fallback, keep) {
  const n = points.length
  const at = i => points[(i + n) % n]
  const corners = []
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) { corners.push(null); continue }
    const p = at(i), d0 = unit(sub(p, at(i - 1))), d1 = unit(sub(at(i + 1), p))
    const turn = Math.atan2(cross(d0, d1), inner(d0, d1))
    const r = p[2] ?? fallback
    corners.push({ p, d0, d1, turn, r, t: r * Math.tan(Math.abs(turn) / 2) })
  }
  // Fit the fillets: on every side, the two tangent lengths together may not be longer than the side.
  const sides = closed ? n : n - 1
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < sides; i++) {
      const a = corners[i], b = corners[(i + 1) % n]
      const room = len(sub(at(i + 1), at(i))) - ((!closed && (i === 0 || i === sides - 1)) ? keep : 0)
      const need = (a?.t ?? 0) + (b?.t ?? 0)
      if (need > room && need > 0) {
        const k = Math.max(0, room) / need
        for (const c of [a, b]) if (c) { c.t *= k; c.r = c.t / Math.tan(Math.abs(c.turn) / 2 || 1e-6) }
      }
    }
  }
  // Pieces: [line from a to b] or [arc], in order.
  const pieces = []
  let cursor = closed ? null : points[0]
  const order = closed ? [...Array(n).keys(), 0] : [...Array(n).keys()]
  let first = null
  for (const i of order.slice(closed ? 0 : 1, closed ? n : n - 1)) {
    const c = corners[i]
    const a = c.r > .5 ? sub(c.p, mul(c.d0, c.t)) : c.p
    const b = c.r > .5 ? add(c.p, mul(c.d1, c.t)) : c.p
    if (cursor) pieces.push({ kind: 'line', from: cursor, to: a, d: c.d0 })
    else first = a
    if (c.r > .5) {
      const side = Math.sign(c.turn) // +1 turns left
      const centre = add(a, mul(left(c.d0), c.r * side))
      pieces.push({ kind: 'arc', centre, r: c.r, from: a, to: b, side, a0: Math.atan2(a[1] - centre[1], a[0] - centre[0]), sweep: c.turn, d0: c.d0, d1: c.d1 })
    } else pieces.push({ kind: 'corner', at: c.p, d0: c.d0, d1: c.d1 })
    cursor = b
  }
  if (closed) pieces.push({ kind: 'line', from: cursor, to: first, d: unit(sub(first, cursor)) })
  else pieces.push({ kind: 'line', from: cursor, to: points[n - 1], d: unit(sub(points[n - 1], cursor)) })
  return pieces.filter(p => p.kind !== 'line' || len(sub(p.to, p.from)) > .01)
}

/** A path writer that keeps the current point, and turns arcs into cubics no wider than a quarter turn. */
function writer() {
  const ops = []
  let at = null
  return {
    ops,
    move(p) { ops.push(['M', p]); at = p },
    line(p) { if (!at || len(sub(p, at)) > .01) ops.push(['L', p]); at = p },
    arc(centre, r, a0, sweep) {
      const steps = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2) - 1e-6))
      const da = sweep / steps, k = 4 / 3 * Math.tan(da / 4)
      for (let s = 0; s < steps; s++) {
        const u = a0 + da * s, v = u + da
        const p0 = [centre[0] + r * Math.cos(u), centre[1] + r * Math.sin(u)]
        const p3 = [centre[0] + r * Math.cos(v), centre[1] + r * Math.sin(v)]
        const p1 = add(p0, mul([-Math.sin(u), Math.cos(u)], r * k))
        const p2 = sub(p3, mul([-Math.sin(v), Math.cos(v)], r * k))
        if (!at || len(sub(p0, at)) > .01) ops.push(['L', p0])
        ops.push(['C', p1, p2, p3])
        at = p3
      }
    },
    close() { ops.push(['Z']); at = null },
  }
}

/** One side of a stroke, offset by `off` (positive is to the left of the direction of travel). */
function side(pieces, off, w, reverse) {
  const list = reverse ? [...pieces].reverse() : pieces
  for (const piece of list) {
    if (piece.kind === 'line') {
      const n = mul(left(piece.d), off)
      w.line(add(reverse ? piece.to : piece.from, n))
      w.line(add(reverse ? piece.from : piece.to, n))
    } else if (piece.kind === 'arc') {
      const r = piece.r - off * piece.side
      if (reverse) w.arc(piece.centre, r, piece.a0 + piece.sweep, -piece.sweep)
      else w.arc(piece.centre, r, piece.a0, piece.sweep)
    } else {
      // A sharp corner: where the two offset edges meet, or a bevel if that would be a long spike.
      const d0 = reverse ? mul(piece.d1, -1) : piece.d0, d1 = reverse ? mul(piece.d0, -1) : piece.d1
      const o = reverse ? -off : off
      const p = meet(add(piece.at, mul(left(d0), o)), d0, add(piece.at, mul(left(d1), o)), d1)
      if (len(sub(p, piece.at)) > Math.abs(off) * 3.2) { w.line(add(piece.at, mul(left(d0), o))); w.line(add(piece.at, mul(left(d1), o))) }
      else w.line(p)
    }
  }
}

/** An end of a stroke: flat with softened corners, or a full half round. */
function cap(w, end, d, h, soft, round) {
  // d points out of the stroke; the path arrives on the left side of travel (end + h·n) and leaves on the right.
  const n = left(d)
  if (round) { w.arc(end, h, Math.atan2(n[1], n[0]), -Math.PI); return }
  const rc = Math.min(soft, h * .9)
  const c1 = add(sub(add(end, mul(n, h - rc)), mul(d, rc)), [0, 0])
  w.line(add(end, add(mul(n, h), mul(d, -rc))))
  w.arc(c1, rc, Math.atan2(n[1], n[0]), -Math.PI / 2)
  w.line(add(end, mul(n, -(h - rc))))
  w.arc(add(sub(end, mul(n, h - rc)), mul(d, -rc)), rc, Math.atan2(d[1], d[0]), -Math.PI / 2)
}

/** The outline of one stroke of width 2h, as path ops. */
function outline(stroke, h, { soft = 0, round = false, fallback }) {
  const pieces = centreline(stroke.p, stroke.closed, stroke.r ?? fallback, round ? 0 : soft + 2)
  const w = writer()
  if (stroke.closed) {
    // Two loops, one each way round: the outer one fills and the inner one cuts the counter out.
    const s0 = pieces[0]
    const start = s0.from ?? s0.at
    const dir = s0.d ?? s0.d0
    w.move(add(start, mul(left(dir), h)))
    side(pieces, h, w, false)
    w.close()
    const last = pieces[pieces.length - 1]
    const end = last.to ?? last.at
    const back = last.d ?? last.d1
    w.move(add(end, mul(left(back), -h)))
    side(pieces, -h, w, true)
    w.close()
    return w.ops
  }
  const first = pieces[0], last = pieces[pieces.length - 1]
  const d0 = first.kind === 'line' ? first.d : first.d0
  const d1 = last.kind === 'line' ? last.d : last.d1
  const p0 = first.from ?? first.at, p1 = last.to ?? last.at
  const trim = round ? 0 : Math.min(soft, h * .9)
  // Start on the left, just past the softened corner of the starting end.
  w.move(add(add(p0, mul(left(d0), h)), mul(d0, trim)))
  // Leave the first and last points to the caps: the sides run between them.
  const inner = pieces.map(piece => ({ ...piece }))
  if (!round) {
    if (inner[0].kind === 'line') inner[0].from = add(inner[0].from, mul(d0, trim))
    const z = inner.length - 1
    if (inner[z].kind === 'line') inner[z].to = sub(inner[z].to, mul(d1, trim))
  }
  side(inner, h, w, false)
  if (round) cap(w, p1, d1, h, 0, true)
  else cap(w, p1, d1, h, soft, false)
  side(inner, -h, w, true)
  if (round) cap(w, p0, mul(d0, -1), h, 0, true)
  else cap(w, p0, mul(d0, -1), h, soft, false)
  w.close()
  return w.ops
}

/* ------------------------------------------------------------------- glyphs */

/**
 * The letters, as skeletons for a stroke of width S. Each returns its width (outer edge to outer edge)
 * and its strokes. Points are [x, y, radius?] with y up from the baseline. A free end sits on the edge of
 * the letter (strokes end flat, so a stem that ends at y = 0 really stands on the baseline); a bar lies
 * half a stroke in from the edge it runs along.
 */
function letters(S) {
  const h = S / 2
  const H = CAP
  const top = H - h, bot = h
  const G = S * .42 // the stencil gap
  const R = 150 + S * .05 // the big bends
  const mid = H * .5
  const stem = (x, y0 = 0, y1 = H) => ({ p: [[x, y0], [x, y1]] })
  const bar = (x0, x1, y) => ({ p: [[x0, y], [x1, y]] })
  const loop = (x0, y0, x1, y1, r = R) => ({ p: [[x0, y0, r], [x1, y0, r], [x1, y1, r], [x0, y1, r]], closed: true })
  // A diagonal between two points inside other strokes, or ending on the baseline or cap height: its flat
  // ends are pulled in until their corners no longer stick out above the cap or below the baseline.
  const diag = (a, b, { clampA = true, clampB = true } = {}) => {
    const d = unit(sub(b, a)), rise = h * Math.abs(d[0])
    const pull = (p, toward, on) => {
      if (!on) return p
      const over = p[1] + rise > H ? p[1] + rise - H : p[1] - rise < 0 ? rise - p[1] : 0
      return over ? add(p, mul(toward, over / Math.abs(toward[1] || 1))) : p
    }
    return { p: [pull(a, d, clampA), pull(b, mul(d, -1), clampB)] }
  }
  const dot = (x, y = 0) => ({ p: [[x, y], [x, y + S]] })
  // The same for the free ends of a longer polyline.
  const ends = (p, extra = {}) => {
    const n = p.length
    const a = diag(p[0], p[1], { clampB: false }).p[0], b = diag(p[n - 2], p[n - 1], { clampA: false }).p[1]
    return { ...extra, p: [a, ...p.slice(1, -1), b] }
  }

  const W = 560
  const g = {
    A: [W, [{ p: [[h, 0], [h, top], [W - h, top], [W - h, 0]] }, bar(S + G, W - S - G, H * .42)]],
    B: [W, [stem(h), { p: [[S + G, top], [W - h - 34, top], [W - h - 34, mid], [S + G, mid]] }, { p: [[S + G, mid], [W - h, mid], [W - h, bot], [S + G, bot]] }]],
    C: [W - 30, [{ p: [[W - 30, top], [h, top], [h, bot], [W - 30, bot]] }]],
    D: [W, [stem(h), { p: [[S + G, top], [W - h, top], [W - h, bot], [S + G, bot]] }]],
    E: [W - 40, [{ p: [[W - 40, top], [h, top], [h, bot], [W - 40, bot]] }, bar(S + G, W - 90, mid)]],
    F: [W - 50, [{ p: [[W - 50, top], [h, top], [h, 0]] }, bar(S + G, W - 110, H * .44)]],
    G: [W, [{ p: [[W - h, top + h], [W - h, top, 0], [h, top], [h, bot], [W - h, bot], [W - h, H * .44, 0], [W * .52, H * .44]] }]],
    H: [W, [stem(h), stem(W - h), bar(S + G, W - S - G, H * .52)]],
    I: [S, [stem(h)]],
    J: [W - 60, [{ p: [[W - 60 - h, H], [W - 60 - h, bot], [h, bot], [h, H * .34]] }]],
    K: [W, [stem(h), ends([[W - h - 6, H], [S + G + S * .62, mid, S * .2], [W - h - 6, 0]], { r: 0 })]],
    L: [W - 60, [{ p: [[h, H], [h, bot], [W - 60, bot]] }]],
    M: [W + 110, [{ p: [[h, 0], [h, top], [W + 110 - h, top], [W + 110 - h, 0]] }, stem((W + 110) / 2, 0, top)]],
    N: [W, [stem(h), stem(W - h), diag([h, H], [W - h, 0])]],
    O: [W + 20, [{ p: [[(W + 20) / 2 - G / 2, top], [h, top], [h, bot], [(W + 20) / 2 - G / 2, bot]] }, { p: [[(W + 20) / 2 + G / 2, bot], [W + 20 - h, bot], [W + 20 - h, top], [(W + 20) / 2 + G / 2, top]] }]],
    P: [W - 20, [stem(h), { p: [[S + G, top], [W - 20 - h, top], [W - 20 - h, H * .4], [S + G, H * .4]] }]],
    Q: [W + 20, [loop(h, bot, W + 20 - h, top), diag([(W + 20) * .6, H * .3], [W + 20 + 20, -70], { clampA: false, clampB: false })]],
    R: [W - 10, [stem(h), { p: [[S + G, top], [W - 10 - h, top], [W - 10 - h, H * .42], [S + G, H * .42]] }, diag([(W - 10) * .55, H * .42], [W - 10 - h, 0], { clampA: false })]],
    S: [W - 20, [{ p: [[W - 20, top], [h, top], [h, mid], [W - 20 - h, mid], [W - 20 - h, bot], [0, bot]] }]],
    T: [W, [bar(0, W, top), stem(W / 2, 0, H - S - G)]],
    U: [W, [{ p: [[h, H], [h, bot], [W / 2 - G / 2, bot]] }, { p: [[W / 2 + G / 2, bot], [W - h, bot], [W - h, H]] }]],
    V: [W, [ends([[h * .2, H], [W / 2 - 52, bot, S * .7], [W / 2 + 52, bot, S * .7], [W - h * .2, H]])]],
    W: [W + 110, [{ p: [[h, H], [h, bot], [W + 110 - h, bot], [W + 110 - h, H]] }, stem((W + 110) / 2, bot, H * .78)]],
    X: [W, [diag([h * .4, H], [W - h * .4, 0]), diag([W - h * .4, H], [h * .4, 0])]],
    Y: [W, [{ p: [[h, H], [h, H * .44], [W - h, H * .44], [W - h, H]] }, stem(W / 2, 0, H * .44 - h - G)]],
    Z: [W, [bar(0, W, top), bar(0, W, bot), diag([W - h * 1.6, top], [h * 1.6, bot], { clampA: false, clampB: false })]],

    0: [W - 70, [loop(h, bot, W - 70 - h, top)]],
    1: [300, [{ p: [[0, top], [300 - h, top, S * .5], [300 - h, 0]] }]],
    2: [W - 40, [{ p: [[0, top], [W - 40 - h, top], [W - 40 - h, mid], [h, mid], [h, bot], [W - 40, bot]] }]],
    3: [W - 40, [{ p: [[0, top], [W - 40 - h, top], [W - 40 - h, bot], [0, bot]] }, bar((W - 40) * .3, W - 40 - h, mid)]],
    4: [W - 20, [{ p: [[h, H], [h, H * .36, S * .6], [W - 20, H * .36]] }, stem((W - 20) * .66, 0, H * .7)]],
    5: [W - 40, [{ p: [[W - 40, top], [h, top, 0], [h, H * .53, 0], [W - 40 - h, H * .53], [W - 40 - h, bot], [0, bot]] }]],
    6: [W - 40, [{ p: [[W - 40 - h, top + h], [W - 40 - h, top, 0], [h, top], [h, bot], [W - 40 - h, bot], [W - 40 - h, H * .52], [h, H * .52]] }]],
    7: [W - 40, [ends([[0, top], [W - 40 - h, top, S * .5], [W - 40 - h, H * .62, R * 1.6], [W * .3, 0]])]],
    8: [W - 40, [loop(h + 26, mid, W - 40 - h - 26, top), loop(h, bot, W - 40 - h, mid)]],
    9: [W - 40, [loop(h, H * .46, W - 40 - h, top), { p: [[W - 40 - h, H * .6], [W - 40 - h, bot], [0, bot]] }]],

    '.': [S, [dot(h)]],
    ',': [S, [{ p: [[h, S], [h, -S * .9]] }]],
    ':': [S, [dot(h), dot(h, H * .5)]],
    ';': [S, [{ p: [[h, S], [h, -S * .9]] }, dot(h, H * .5)]],
    '·': [S, [dot(h, H * .5 - h)]],
    '•': [S * 1.3, [{ p: [[S * .65, H * .44 - .5], [S * .65, H * .44 + .5]], wide: true }]],
    '-': [300, [bar(0, 300, H * .44)]],
    '–': [480, [bar(0, 480, H * .44)]],
    '—': [820, [bar(0, 820, H * .44)]],
    '\'': [S, [stem(h, H * .66, H)]],
    '’': [S + 30, [diag([h + 30, H], [h, H * .6], { clampB: false })]],
    '‘': [S + 30, [diag([h, H * .6], [h + 30, H], { clampA: false })]],
    '"': [S * 2 + G, [stem(h, H * .66, H), stem(S + G + h, H * .66, H)]],
    '“': [S * 2 + G + 30, [diag([h, H * .6], [h + 30, H], { clampA: false }), diag([S + G + h, H * .6], [S + G + h + 30, H], { clampA: false })]],
    '”': [S * 2 + G + 30, [diag([h + 30, H], [h, H * .6], { clampB: false }), diag([S + G + h + 30, H], [S + G + h, H * .6], { clampB: false })]],
    '!': [S, [stem(h, S + G, H), dot(h)]],
    '?': [W - 60, [{ p: [[0, top], [W - 60 - h, top], [W - 60 - h, H * .5], [(W - 60) / 2, H * .5, S * .5], [(W - 60) / 2, S + G]] }, dot((W - 60) / 2)]],
    '/': [380, [diag([380 - h * .5, H], [h * .5, 0])]],
    '+': [460, [bar(0, 460, H * .44), stem(230, H * .44 - 230 + h, H * .44 + 230 - h)]],
    '(': [260, [{ p: [[260, H + 40 - h], [h, H + 40 - h, R * 1.2], [h, -40 + h, R * 1.2], [260, -40 + h]] }]],
    ')': [260, [{ p: [[0, H + 40 - h], [260 - h, H + 40 - h, R * 1.2], [260 - h, -40 + h, R * 1.2], [0, -40 + h]] }]],
    '&': [W + 40, [
      { p: [[W + 40, bot], [S * 1.55, H * .5, S * .3], [S * 1.55, top], [W * .74, top], [W * .74, H * .56], [h, H * .3, S * .5], [h, bot], [W * .8, bot, S * .4]] },
      bar(W * .55, W + 40, H * .44),
    ]],
    '→': [W + 60, [bar(0, W + 60 - h * 1.1, H * .44), { p: [[W + 60 - 230, H * .44 + 230], [W + 60 - h * 1.15, H * .44, 0], [W + 60 - 230, H * .44 - 230]] }]],
    '↗': [W, [diag([h * .9, h * .9], [W - h * 1.3, H - h * 1.3], { clampA: false, clampB: false }), { p: [[W * .28, top], [W - h, top, 0], [W - h, H * .28 * 1.6]] }]],
    '№': [W + 300, [stem(h), stem(W - h), diag([h, H], [W - h, 0]), loop(W + 70, H * .45, W + 300 - h * .7, top, S * .6), bar(W + 50, W + 300, H * .2)]],
  }
  // É and é: E with an acute above it.
  g['É'] = [g.E[0], [...g.E[1], diag([g.E[0] * .38, H + 70], [g.E[0] * .62, H + 230], { clampA: false, clampB: false })]]
  return g
}

/* --------------------------------------------------------------------- build */

const LSB = 52

function build({ family, style, S, line }) {
  const h = S / 2
  const shapes = letters(S)
  const glyphs = [new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 600, path: new opentype.Path() })]
  const space = new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: 250, path: new opentype.Path() })
  space.addUnicode(160)
  glyphs.push(space)
  for (const [char, [width, strokes]] of Object.entries(shapes)) {
    const path = new opentype.Path()
    const put = ops => {
      for (const op of ops) {
        const p = q => [q[0] + LSB, q[1]]
        if (op[0] === 'M') path.moveTo(...p(op[1]))
        else if (op[0] === 'L') path.lineTo(...p(op[1]))
        else if (op[0] === 'C') path.curveTo(...p(op[1]), ...p(op[2]), ...p(op[3]))
        else path.close()
      }
    }
    if (!line) {
      for (const stroke of strokes) put(outline(stroke, stroke.wide ? h * 1.15 : h, { soft: S * .17, fallback: 150 + S * .05, round: !!stroke.wide }))
    } else {
      // The hairline: down the middle of every stroke. Free ends stop short of the end of the stroke;
      // ends that run into another stroke carry on to its middle, so the lines join up.
      const hair = Math.max(14, S * .15)
      for (const [index, stroke] of strokes.entries()) {
        if (stroke.wide) continue
        const others = strokes.filter((_, k) => k !== index)
        const inside = q => others.some(o => near(o, q) <= h + .5)
        let pts = stroke.p.map(q => [...q])
        if (!stroke.closed) {
          const inset = S * .62
          const n = pts.length
          if (!inside(pts[0])) pts[0] = add(pts[0], mul(unit(sub(pts[1], pts[0])), inset)).concat(pts[0].slice(2))
          if (!inside(pts[n - 1])) pts[n - 1] = add(pts[n - 1], mul(unit(sub(pts[n - 2], pts[n - 1])), inset)).concat(pts[n - 1].slice(2))
          // A stroke too short to carry a line (a dot, an apostrophe) is left plain.
          const total = pts.slice(1).reduce((s, q, i) => s + len(sub(q, pts[i])), 0)
          if (total < S * .5) continue
        }
        put(outline({ ...stroke, p: pts }, hair / 2, { round: true, fallback: 150 + S * .05 }))
      }
    }
    const glyph = new opentype.Glyph({ name: /^[A-Za-z]$/.test(char) ? char : `uni${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`, unicode: char.codePointAt(0), advanceWidth: width + LSB * 2, path })
    const lower = char.toLowerCase()
    if (lower !== char) glyph.addUnicode(lower.codePointAt(0))
    glyphs.push(glyph)
  }
  return new opentype.Font({
    familyName: family, styleName: style, unitsPerEm: 1000, ascender: 790, descender: -250, glyphs,
    description: 'Heliotrope, the display face of omaribrahim.me. Generated by scripts/heliotrope.mjs.',
  })
}

/** How far a point is from a stroke's skeleton. */
function near(stroke, q) {
  const pts = stroke.p, n = pts.length
  let best = Infinity
  for (let i = 0; i < (stroke.closed ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], ab = sub(b, a)
    const t = Math.max(0, Math.min(1, inner(sub(q, a), ab) / inner(ab, ab)))
    best = Math.min(best, len(sub(q, add(a, mul(ab, t)))))
  }
  return best
}

/** WOFF 1.0: the same tables, each deflated. */
function woff(otf) {
  const view = new DataView(otf)
  const flavor = view.getUint32(0), count = view.getUint16(4)
  const tables = []
  for (let i = 0; i < count; i++) {
    const o = 12 + i * 16
    const tag = view.getUint32(o), checksum = view.getUint32(o + 4), offset = view.getUint32(o + 8), length = view.getUint32(o + 12)
    const data = new Uint8Array(otf, offset, length)
    const packed = deflateSync(data, { level: 9 })
    tables.push({ tag, checksum, data, packed: packed.length < length ? packed : data, length })
  }
  const pad = n => (n + 3) & ~3
  let size = 44 + count * 20
  for (const t of tables) size += pad(t.packed.length)
  const out = new Uint8Array(size)
  const w = new DataView(out.buffer)
  w.setUint32(0, 0x774f4646); w.setUint32(4, flavor); w.setUint32(8, size); w.setUint16(12, count); w.setUint16(14, 0)
  w.setUint32(16, otf.byteLength); w.setUint16(20, 1); w.setUint16(22, 0)
  let at = 44 + count * 20
  tables.forEach((t, i) => {
    const o = 44 + i * 20
    w.setUint32(o, t.tag); w.setUint32(o + 4, at); w.setUint32(o + 8, t.packed.length); w.setUint32(o + 12, t.length); w.setUint32(o + 16, t.checksum)
    out.set(t.packed, at)
    at += pad(t.packed.length)
  })
  return out
}

/**
 * opentype.js stamps a font with the time it is written. Give it a fixed time instead, so the same letters
 * always make the same file and running the script again changes nothing.
 */
function stamped(write) {
  const clock = Date.prototype.getTime
  Date.prototype.getTime = () => Date.UTC(2026, 9, 17)
  try { return write() } finally { Date.prototype.getTime = clock }
}

mkdirSync(OUT, { recursive: true })
for (const face of [
  { file: 'heliotrope', family: 'Heliotrope', style: 'Regular', S: 120 },
  { file: 'heliotrope-line', family: 'Heliotrope Line', style: 'Regular', S: 120, line: true },
  { file: 'heliotrope-light', family: 'Heliotrope Light', style: 'Regular', S: 54 },
]) {
  const font = build(face)
  const data = woff(stamped(() => font.toArrayBuffer()))
  writeFileSync(`${OUT}/${face.file}.woff`, data)
  console.log(`${OUT}/${face.file}.woff`, `${(data.length / 1024).toFixed(1)} KB`, `${font.glyphs.length} glyphs`)
}
