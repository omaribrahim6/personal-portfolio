import { GoogleGenAI } from '@google/genai'
import { instructions, PLACES } from './dossier'

// POST /api/ask { messages: [{ role, text }] } → text/event-stream
//   { type: 'text', delta }   a piece of his answer
//   { type: 'show', id, label }   a place on the page he is pointing at
//   { type: 'error', message }
//   { type: 'done' }
// The key stays on the server. Anyone can reach this route, so it is kept small, short and rate limited.

type Turn = { role: 'user' | 'assistant'; text: string }

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const MAX_QUESTION = 400
const MAX_TURNS = 8
const MAX_WAIT = 25_000

let client: GoogleGenAI | null | undefined
function genai() {
  if (client !== undefined) return client
  const key = process.env.GEMINI_API_KEY
  // Keys from Vertex AI express mode and from the Gemini API look different and go to different endpoints.
  client = key ? new GoogleGenAI(key.startsWith('AIza') ? { apiKey: key } : { vertexai: true, apiKey: key }) : null
  return client
}

// A sliding window per visitor, and a ceiling for the whole day, held in memory. The site runs as one process.
const PER_MINUTE = 8, PER_HOUR = 40, PER_DAY_ALL = 1500
const seen = new Map<string, number[]>()
let day = { date: '', count: 0 }
function allowed(who: string) {
  const now = Date.now()
  const today = new Date(now).toISOString().slice(0, 10)
  if (day.date !== today) day = { date: today, count: 0 }
  if (day.count >= PER_DAY_ALL) return false
  const times = (seen.get(who) ?? []).filter(t => now - t < 3_600_000)
  if (times.length >= PER_HOUR || times.filter(t => now - t < 60_000).length >= PER_MINUTE) { seen.set(who, times); return false }
  times.push(now)
  seen.set(who, times)
  day.count++
  if (seen.size > 5000) for (const [key, list] of seen) if (!list.some(t => now - t < 3_600_000)) seen.delete(key)
  return true
}

const clean = (text: unknown, max: number) => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

export async function POST(request: Request) {
  let body: { messages?: Turn[] }
  try { body = await request.json() } catch { return Response.json({ error: 'Ask something.' }, { status: 400 }) }
  const turns = (Array.isArray(body.messages) ? body.messages : [])
    .filter(turn => turn && (turn.role === 'user' || turn.role === 'assistant'))
    .map(turn => ({ role: turn.role, text: clean(turn.text, turn.role === 'user' ? MAX_QUESTION : 900) }))
    .filter(turn => turn.text)
    .slice(-MAX_TURNS)
  // The conversation has to start and end with the visitor.
  while (turns.length && turns[0].role !== 'user') turns.shift()
  if (!turns.length || turns[turns.length - 1].role !== 'user') return Response.json({ error: 'Ask something.' }, { status: 400 })

  const ai = genai()
  if (!ai) return Response.json({ error: 'offline' }, { status: 503 })
  // The proxy in front of the site adds the visitor's address last; anything before it is the visitor's own claim.
  const who = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'local'
  if (!allowed(who)) return Response.json({ error: 'busy' }, { status: 429 })

  const encoder = new TextEncoder()
  // Stop asking the model when the visitor has gone, or when it has taken far too long.
  const left = new AbortController()
  const stop = AbortSignal.any([left.signal, request.signal, AbortSignal.timeout(MAX_WAIT)])
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) => { if (!left.signal.aborted) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)) }
      const shown = new Set<string>()
      // His answer arrives in pieces, and a <<show:…>> marker can be split across two of them:
      // hold back anything that might be the start of one.
      let held = ''
      const release = (final = false) => {
        held = held.replace(/<<\s*(?:show:)?\s*([a-z0-9-]+)\s*>>/gi, (_, id: string) => {
          if (PLACES[id] && !shown.has(id) && shown.size < 2) { shown.add(id); emit({ type: 'show', id, label: PLACES[id] }) }
          return ''
        })
        // Anything from an unclosed "<" to the end might still turn into a marker.
        const open = final ? -1 : held.search(/<[^>]*$/)
        const safe = open >= 0 && held.length - open < 40 ? held.slice(0, open) : held
        held = held.slice(safe.length)
        const text = final ? safe.replace(/<[^>]*$/, '') : safe
        if (text) emit({ type: 'text', delta: text })
      }
      try {
        const response = await ai.models.generateContentStream({
          model: MODEL,
          contents: turns.map(turn => ({ role: turn.role === 'user' ? 'user' : 'model', parts: [{ text: turn.text }] })),
          config: { systemInstruction: instructions(new Date().toISOString().slice(0, 10)), temperature: .4, maxOutputTokens: 320, abortSignal: stop },
        })
        for await (const chunk of response) {
          held += chunk.text ?? ''
          release()
        }
        release(true)
      } catch (error) {
        if (left.signal.aborted || request.signal.aborted) return
        console.error('ask failed', error)
        emit({ type: 'error', message: 'I lost my train of thought. Try again?' })
      }
      if (left.signal.aborted) return
      emit({ type: 'done' })
      controller.close()
    },
    cancel() { left.abort() },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' } })
}
