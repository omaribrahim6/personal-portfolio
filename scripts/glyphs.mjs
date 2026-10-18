// Heliotrope's outlines, for building the letters in 3D.
//
//   node scripts/glyphs.mjs
//
// Reads  app/fonts/heliotrope.woff and heliotrope-line.woff (made by scripts/heliotrope.mjs)
// Writes app/components/world/glyphs.json
//
// For each character: its advance and its outline as a list of commands (M, L, Q, C, Z) in font units,
// y up, for the solid cut and for the hairline cut that is laid over it in a second colour.
import { readFileSync, writeFileSync } from 'node:fs'
import opentype from 'opentype.js'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:·-–—’\'!?/&→№É '

function outlines(file) {
  const buffer = readFileSync(file)
  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
  const glyphs = {}
  for (const char of CHARS) {
    const glyph = font.charToGlyph(char)
    if (!glyph || glyph.index === 0) continue
    const commands = glyph.getPath(0, 0, font.unitsPerEm).commands.map(c => {
      // opentype gives y down at this size; flip back to y up, and round to whole units.
      const p = (x, y) => [Math.round(x), Math.round(-y)]
      if (c.type === 'M' || c.type === 'L') return [c.type, ...p(c.x, c.y)]
      if (c.type === 'Q') return ['Q', ...p(c.x1, c.y1), ...p(c.x, c.y)]
      if (c.type === 'C') return ['C', ...p(c.x1, c.y1), ...p(c.x2, c.y2), ...p(c.x, c.y)]
      return ['Z']
    })
    glyphs[char] = { advance: glyph.advanceWidth, path: commands }
  }
  return { unitsPerEm: font.unitsPerEm, ascender: font.ascender, glyphs }
}

const solid = outlines('app/fonts/heliotrope.woff')
const line = outlines('app/fonts/heliotrope-line.woff')
writeFileSync('app/components/world/glyphs.json', JSON.stringify({ unitsPerEm: solid.unitsPerEm, ascender: solid.ascender, solid: solid.glyphs, line: line.glyphs }))
console.log('app/components/world/glyphs.json', Object.keys(solid.glyphs).length, 'glyphs')
