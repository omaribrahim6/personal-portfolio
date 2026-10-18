// Screenshots of the voyage, centred on the given element ids (the cards), waiting for the world to draw.
//
//   node scripts/walk.mjs <prefix> <width> <height> <id>[@offset] ...
//
// An offset moves the scroll that many screens on from the card (awards-title@.5). Shots land in
// .data/shots/. Environment: URL (default http://localhost:3000/), FIRST (ms to wait for the first
// stops to build, default 30000), WAIT (ms after each scroll, default 6000), CHROME (a Chromium to use
// instead of Playwright's own), SOFT=1 (draw with SwiftShader, for machines without a GPU).
// Needs Playwright: npx playwright install chromium (or npm i -g playwright).
import { mkdirSync } from 'node:fs'

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright')
const [prefix = 'w', w = '1440', h = '900', ...ids] = process.argv.slice(2)
const out = new URL('../.data/shots/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
const args = process.env.SOFT ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--ignore-gpu-blocklist']
const browser = await chromium.launch({ executablePath: process.env.CHROME, args })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const logs = []
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text().slice(0, 240)}`) })
page.on('pageerror', e => logs.push('pageerror ' + e.message))
await page.goto(process.env.URL ?? 'http://localhost:3000/', { waitUntil: 'networkidle', timeout: 180000 })
await page.waitForTimeout(+(process.env.FIRST ?? 30000))
for (const id of ids) {
  await page.evaluate(target => {
    const [name, offset = '0'] = target.split('@')
    const el = document.getElementById(name)
    if (!el) return
    const box = el.getBoundingClientRect()
    window.scrollTo({ top: box.top + window.scrollY + box.height / 2 - window.innerHeight / 2 + Number(offset) * window.innerHeight, behavior: 'instant' })
  }, id)
  await page.waitForTimeout(+(process.env.WAIT ?? 6000))
  for (let i = 0; i < 4; i++) {
    try { await page.screenshot({ path: `${out}${prefix}-${id.replace(/[@.]/g, '_')}.png`, timeout: 30000 }); break } catch { await page.waitForTimeout(2000) }
  }
}
console.log(logs.filter(l => !/toNonIndexed|Reduced Motion|preloaded/.test(l)).slice(0, 20).join('\n'))
await browser.close()
