// Prepares the photos for the interests chapter.
//
//   node scripts/photos.mjs
//
// Reads  .data/photos/<interest>/<name>.(png|jpg|jpeg|webp|heic)
// Writes public/interests/<interest>/<name>.webp       (the print, 720px on its long side)
//        public/interests/<interest>/<name>.full.webp  (opened large, 1800px)
//
// Everything is re-encoded, so nothing from the camera survives: no GPS, no device, no time stamp.
// Each photo's shape is printed, to copy into app/content.ts.
import { mkdirSync, readdirSync } from 'node:fs'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const SOURCE = '.data/photos'
const TARGET = 'public/interests'

for (const interest of readdirSync(SOURCE, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
  mkdirSync(join(TARGET, interest.name), { recursive: true })
  for (const file of readdirSync(join(SOURCE, interest.name))) {
    const { name, ext } = parse(file)
    if (!/^\.(png|jpe?g|webp|heic)$/i.test(ext)) continue
    const input = sharp(join(SOURCE, interest.name, file)).rotate() // upright, whatever the camera said
    const { width, height } = await input.metadata()
    const out = join(TARGET, interest.name, name)
    const print = await input.clone().resize({ width: 720, height: 720, fit: 'inside' }).webp({ quality: 80 }).toFile(`${out}.webp`)
    const full = await input.clone().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${out}.full.webp`)
    console.log(`${interest.name}/${name}: ratio ${(print.width / print.height).toFixed(3)} · print ${(print.size / 1024).toFixed(0)} KB · full ${(full.size / 1024).toFixed(0)} KB (from ${width}×${height})`)
  }
}
