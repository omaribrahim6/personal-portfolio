// Tripo 3D API helper for the mini Omar on the portfolio. Same steps as the Mamdani build:
// one stylised image in, a textured model out, then (separately) a biped rig with Mixamo bone names.
//
//   node scripts/tripo.mjs balance
//   node scripts/tripo.mjs generate <image.png|jpg|webp> <name>   image → textured 3D model (waits, downloads)
//   node scripts/tripo.mjs rig <task_id> <name>                   rig check, then auto-rig
//   node scripts/tripo.mjs task <task_id>                         show a task
//
// Key: TRIPO_API_KEY in .env.local. Downloads land in .data/tripo/ (not committed).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, extname } from 'node:path'

try {
  process.loadEnvFile('.env.local')
} catch {
  /* env from the shell */
}
const KEY = process.env.TRIPO_API_KEY
if (!KEY) throw new Error('Set TRIPO_API_KEY in .env.local')
const BASE = 'https://openapi.tripo3d.ai/v3'
const OUT = '.data/tripo'
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }

async function call(path, init = {}) {
  const response = await fetch(BASE + path, { ...init, headers: { Authorization: `Bearer ${KEY}`, ...(init.headers ?? {}) } })
  const body = await response.json()
  if (body.code !== 0) throw new Error(`${path}: ${body.code} ${body.message ?? ''} ${body.suggestion ?? ''}`)
  return body.data
}

const post = (path, payload) => call(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

async function upload(file) {
  const form = new FormData()
  form.append('file', new Blob([readFileSync(file)], { type: TYPES[extname(file).toLowerCase()] ?? 'image/png' }), basename(file))
  return (await call('/files', { method: 'POST', body: form })).file_token
}

async function wait(taskId) {
  for (;;) {
    const task = await call(`/tasks/${taskId}`)
    process.stdout.write(`\r${taskId} ${task.status} ${task.progress ?? 0}%   `)
    if (['success', 'failed', 'cancelled'].includes(task.status)) {
      process.stdout.write('\n')
      return task
    }
    await new Promise(resolve => setTimeout(resolve, 4000))
  }
}

async function save(url, file) {
  if (!url) return
  const response = await fetch(url)
  writeFileSync(file, Buffer.from(await response.arrayBuffer()))
  console.log(`saved ${file}`)
}

async function finish(task, name) {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/${name}.task.json`, JSON.stringify(task, null, 2))
  if (task.status !== 'success') throw new Error(`task ${task.task_id} ${task.status}`)
  await save(task.output?.model_url, `${OUT}/${name}.glb`)
  const preview = task.output?.rendered_image_url
  await save(preview, `${OUT}/${name}.preview.${preview?.includes('.png') ? 'png' : 'webp'}`)
  console.log(`credits used: ${task.credits_consumed ?? '?'}`)
}

const [command, a, b] = process.argv.slice(2)
if (command === 'balance') {
  console.log(await call('/account/balance'))
} else if (command === 'task') {
  console.log(JSON.stringify(await call(`/tasks/${a}`), null, 2))
} else if (command === 'generate') {
  const { task_id } = await post('/generation/image-to-model', {
    input: await upload(a),
    model: 'v3.1-20260211',
    texture: true,
    pbr: false, // he is lit like a painting, not a product shot: base colour is all that is used
    texture_quality: 'standard',
    texture_alignment: 'original_image', // keep the faceted shading the drawing already has
    face_limit: 30000,
  })
  console.log(`task ${task_id}`)
  await finish(await wait(task_id), b)
} else if (command === 'rig') {
  const check = await post('/animations/rig-check', { input: a })
  console.log('rig check', JSON.stringify((await wait(check.task_id)).output))
  const { task_id } = await post('/animations/rig', { input: a, model: 'v1.0-20240301', rig_type: 'biped', spec: 'mixamo', out_format: 'glb' })
  console.log(`task ${task_id}`)
  await finish(await wait(task_id), b)
} else {
  console.log('usage: balance | generate <image> <name> | rig <task_id> <name> | task <id>')
}
