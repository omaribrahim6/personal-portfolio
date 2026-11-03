// Draws the contour map the site sits on: fractal terrain, traced with marching squares into public/topo.svg.
// Run with: node scripts/topo.mjs

import { writeFileSync } from 'node:fs'

const W = 1600, H = 1000, STEP = 5, LEVELS = 26, SEED = 11
const COLUMNS = Math.ceil(W / STEP) + 1, ROWS = Math.ceil(H / STEP) + 1

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7 + SEED * 74.7) * 43758.5453
  return s - Math.floor(s)
}
const fade = t => t * t * (3 - 2 * t)
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = fade(x - ix), fy = fade(y - iy)
  const top = hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx
  const bottom = hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx
  return top * (1 - fy) + bottom * fy
}
function terrain(x, y) {
  let height = 0, size = 1, amount = 1
  for (let octave = 0; octave < 4; octave++) {
    height += noise(x / 420 * size + octave * 9, y / 420 * size - octave * 5) * amount
    size *= 2
    amount *= .42
  }
  return height
}

const field = []
for (let row = 0; row < ROWS; row++) {
  field.push([])
  for (let column = 0; column < COLUMNS; column++) field[row].push(terrain(column * STEP, row * STEP))
}
const all = field.flat(), low = Math.min(...all), high = Math.max(...all)

const round = n => Math.round(n * 10) / 10
const between = (a, b, level) => (level - a) / (b - a)

// One run of marching squares per height, with the segments joined into lines as they are found.
function trace(level) {
  const segments = new Map()
  const add = (a, b) => {
    const key = `${a[0]},${a[1]}`
    if (!segments.has(key)) segments.set(key, [])
    segments.get(key).push(b)
    const back = `${b[0]},${b[1]}`
    if (!segments.has(back)) segments.set(back, [])
    segments.get(back).push(a)
  }
  for (let row = 0; row < ROWS - 1; row++) {
    for (let column = 0; column < COLUMNS - 1; column++) {
      const a = field[row][column], b = field[row][column + 1], c = field[row + 1][column + 1], d = field[row + 1][column]
      const x = column * STEP, y = row * STEP
      const n = [round(x + between(a, b, level) * STEP), y]
      const e = [x + STEP, round(y + between(b, c, level) * STEP)]
      const s = [round(x + between(d, c, level) * STEP), y + STEP]
      const w = [x, round(y + between(a, d, level) * STEP)]
      const shape = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0)
      const pairs = { 1: [[w, s]], 2: [[s, e]], 3: [[w, e]], 4: [[n, e]], 5: [[w, n], [s, e]], 6: [[n, s]], 7: [[w, n]], 8: [[w, n]], 9: [[n, s]], 10: [[w, s], [n, e]], 11: [[n, e]], 12: [[w, e]], 13: [[s, e]], 14: [[w, s]] }[shape]
      for (const [from, to] of pairs ?? []) add(from, to)
    }
  }
  const lines = []
  const take = (key, point) => {
    const list = segments.get(key)
    if (!list) return
    list.splice(list.findIndex(p => p[0] === point[0] && p[1] === point[1]), 1)
    if (!list.length) segments.delete(key)
  }
  while (segments.size) {
    const [startKey, startList] = segments.entries().next().value
    const start = startKey.split(',').map(Number)
    const line = [start]
    let at = start, next = startList[0]
    while (next) {
      take(`${at[0]},${at[1]}`, next)
      take(`${next[0]},${next[1]}`, at)
      line.push(next)
      at = next
      next = segments.get(`${at[0]},${at[1]}`)?.[0]
    }
    if (line.length > 6) lines.push(line)
  }
  return lines
}

// Every other point is plenty at this step, and the curves through them hide the grid.
function smooth(line) {
  const thin = line.filter((_, index) => index % 2 === 0 || index === line.length - 1)
  let d = `M${thin[0][0]} ${thin[0][1]}`
  for (let i = 1; i < thin.length - 1; i++) {
    const mid = [round((thin[i][0] + thin[i + 1][0]) / 2), round((thin[i][1] + thin[i + 1][1]) / 2)]
    d += `Q${thin[i][0]} ${thin[i][1]} ${mid[0]} ${mid[1]}`
  }
  const end = thin[thin.length - 1]
  return `${d}L${end[0]} ${end[1]}`
}

let fine = '', index = ''
for (let i = 1; i < LEVELS; i++) {
  const d = trace(low + (high - low) * i / LEVELS).map(smooth).join('')
  if (i % 5 === 0) index += d
  else fine += d
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#163a2d"><path stroke-opacity=".2" stroke-width=".8" d="${fine}"/><path stroke-opacity=".34" stroke-width="1.3" d="${index}"/></svg>`
writeFileSync('public/topo.svg', svg)
console.log(`public/topo.svg ${Math.round(svg.length / 1024)} KB`)
