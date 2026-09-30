'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, ArrowUpRight, RotateCcw, Square, X } from 'lucide-react'
import { email } from '../../content'
import { useMotionPreference } from '../useMotionPreference'
import { world } from '../scroll'
import type { Behavior, Framing, MiniStage } from './stage'
import styles from './mini.module.css'

// The small Omar. He leans out of a low moon in the corner of every chapter and watches the pointer;
// at the shore, where the walk ends, he is standing on the beach instead, and for once facing you.
// Click him and the corner empties: a chat grows out of it, and he is standing behind the message box.
// The chat is the one from Mamdani (its size, its layout and the way it opens), in this site's colours.
// His answers come from /api/ask. Where WebGL or the model cannot be had, a picture of him stands in.

type Place = { id: string; label: string }
type Message = { id: number; from: 'you' | 'him'; text: string; places: Place[]; failed?: boolean; done: boolean }
type Spot = 'dock' | 'shore' | 'chat'

const SUGGESTIONS = [
  'What are you best at?',
  'Tell me about Revenant',
  'What security work have you done?',
  'Are you open to internships?',
  'How did you build this site?',
]
const FRAMINGS: Record<Spot, Framing> = { dock: 'bust', shore: 'full', chat: 'waist' }
const POSTER = '/models/omar-bust.webp'
const OFFLINE = `My brain is not plugged in here. The real Omar answers at ${email}.`
const LOST = 'I lost my train of thought. Try again?'
const BUSY = `I have talked a lot today. Give me a minute, or write to the real Omar at ${email}.`

let nextId = 1

export default function MiniOmar() {
  const reduced = useMotionPreference()
  const [ready, setReady] = useState(false)
  const [flat, setFlat] = useState(false)
  const [open, setOpen] = useState(false)
  const [atShore, setAtShore] = useState(false)
  const [crowded, setCrowded] = useState(false)
  const [dawn, setDawn] = useState(false)
  const [bubble, setBubble] = useState(false)
  const [hover, setHover] = useState(false)
  const [active, setActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [stand, setStand] = useState<HTMLElement | null>(null)

  const stage = useRef<MiniStage | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const dockSeat = useRef<HTMLSpanElement>(null)
  const shoreSeat = useRef<HTMLSpanElement>(null)
  const chatSeat = useRef<HTMLSpanElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const beach = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const request = useRef<AbortController | null>(null)

  // Behind the message box while the chat is open; otherwise on the beach if it is in view, or in the corner.
  const spot: Spot = open ? 'chat' : ready && atShore ? 'shore' : 'dock'
  const present = ready || flat
  const behavior: Behavior = streaming ? 'talk' : busy ? 'think' : open && input ? 'listen' : 'watch'

  // Load three.js and the model only once the page has settled, so the opening is not slowed by him.
  useEffect(() => {
    let cancelled = false
    const begin = async () => {
      try {
        // Asked first, so a browser without WebGL never downloads three.js only to be told no.
        if (!document.createElement('canvas').getContext('webgl2')) throw new Error('This browser has no WebGL 2.')
        const { MiniStage } = await import('./stage')
        if (cancelled) return
        const el = document.createElement('canvas')
        el.className = styles.canvas
        el.setAttribute('aria-hidden', 'true')
        const made = new MiniStage(el, window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        canvas.current = el
        stage.current = made
        await made.ready
        if (cancelled) return
        setReady(true)
      } catch (error) {
        console.warn(`Mini Omar is a picture here: the 3D one could not be loaded. ${error instanceof Error ? error.message : ''}`)
        stage.current?.dispose()
        stage.current = null
        canvas.current = null
        if (!cancelled) setFlat(true)
      }
    }
    const timer = window.setTimeout(begin, 2600)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      stage.current?.dispose()
      stage.current = null
      canvas.current?.remove()
    }
  }, [])

  // The green dot by his name: whether there is a model behind him to answer.
  useEffect(() => {
    if (!present) return
    let cancelled = false
    fetch('/api/ask').then(response => response.json()).then((status: { active?: boolean }) => { if (!cancelled) setActive(Boolean(status.active)) }).catch(() => {})
    return () => { cancelled = true }
  }, [present])

  // Where he can stand on the shore, when the beach is in view, and when the corner is needed by the page.
  useEffect(() => {
    const terrain = document.querySelector<HTMLElement>('[data-terrain="shore"]')
    const toolkit = document.querySelector<HTMLElement>('#skills [data-ground]')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the slot is rendered by the shore plate, outside this component
    setStand(terrain?.querySelector<HTMLElement>('[data-stand]') ?? null)
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === terrain) setAtShore(entry.intersectionRatio > .45)
        // On small screens the toolkit's receipt is pinned to the bottom edge; he keeps out of its way.
        else setCrowded(entry.isIntersecting && window.innerWidth < 1000)
      }
    }, { threshold: [0, .45, .6] })
    if (terrain) observer.observe(terrain)
    if (toolkit) observer.observe(toolkit)
    // His moon pales with the sky, once the walk is past the dunes. The page works out its chapter in a
    // frame of its own, so this reads it one frame later.
    let frame = 0
    const onScroll = () => { frame ||= requestAnimationFrame(() => { frame = requestAnimationFrame(() => { frame = 0; setDawn(world.chapter > 1.5) }) }) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  // Move the one canvas to wherever he is, and reframe the camera for it.
  useEffect(() => {
    const el = canvas.current, made = stage.current
    const seat = { dock: dockSeat, shore: shoreSeat, chat: chatSeat }[spot].current
    if (!ready || !el || !made || !seat) return
    seat.appendChild(el)
    made.frame(FRAMINGS[spot])
    made.resize()
    const observer = new ResizeObserver(() => made.resize())
    observer.observe(seat)
    document.querySelector<HTMLElement>('[data-terrain="shore"]')?.toggleAttribute('data-mini', true)
    return () => observer.disconnect()
  }, [ready, spot, stand])

  useEffect(() => { stage.current?.act(behavior) }, [behavior, ready])
  useEffect(() => { stage.current?.light(spot === 'shore' || (spot === 'dock' && dawn) ? 'dawn' : 'night') }, [dawn, spot, ready])

  // He arrives with a wave, and once per visit says what he is for.
  useEffect(() => {
    if (!present) return
    const wave = window.setTimeout(() => stage.current?.wave(), 700)
    let seen = false
    try { seen = sessionStorage.getItem('mini-omar') === 'met' } catch { /* private window */ }
    if (seen) return () => window.clearTimeout(wave)
    const show = window.setTimeout(() => setBubble(true), 1500)
    const hide = window.setTimeout(() => setBubble(false), 9000)
    try { sessionStorage.setItem('mini-omar', 'met') } catch { /* private window */ }
    return () => { window.clearTimeout(wave); window.clearTimeout(show); window.clearTimeout(hide) }
  }, [present])

  // His head follows the pointer. Left alone for a few seconds, he goes back to looking around.
  useEffect(() => {
    if (!ready || reduced) { stage.current?.aim(reduced ? [0, 0] : null); return }
    let idle = 0, frame = 0
    function onMove(event: PointerEvent) {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const box = canvas.current?.getBoundingClientRect()
        if (!box || !box.width) return
        const reach = Math.max(380, box.width * 1.4)
        const yaw = Math.max(-.85, Math.min(.85, Math.atan2(event.clientX - (box.left + box.width / 2), reach) * 1.15))
        const pitch = Math.max(-.45, Math.min(.4, Math.atan2(event.clientY - (box.top + box.height * .3), reach) * .95))
        stage.current?.aim([pitch, yaw])
        window.clearTimeout(idle)
        idle = window.setTimeout(() => stage.current?.aim(null), 4500)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.clearTimeout(idle)
      cancelAnimationFrame(frame)
    }
  }, [ready, reduced])

  // Opening, as in Mamdani: the corner empties, the panel grows out of it, he greets you from behind the
  // message box and the box takes focus (on a touch screen the panel does, so the keyboard stays down).
  useEffect(() => {
    if (!open) return
    const focus = window.setTimeout(() => (window.matchMedia('(hover: hover) and (pointer: fine)').matches ? field : panel).current?.focus({ preventScroll: true }), 350)
    const greet = window.setTimeout(() => stage.current?.wave(), 450)
    return () => { window.clearTimeout(focus); window.clearTimeout(greet) }
  }, [open])

  // Closing hands focus back to wherever he went: the beach or the corner.
  const close = useCallback(() => {
    setOpen(false)
    ;(atShore && ready ? beach : launcher).current?.focus({ preventScroll: true })
  }, [atShore, ready])

  // Escape closes. Ctrl or Cmd + J toggles.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) close()
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        if (open) close()
        else setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  // Follow the conversation down; with nothing said yet, stay at the top, on the greeting.
  useEffect(() => {
    log.current?.scrollTo({ top: messages.length ? log.current.scrollHeight : 0, behavior: reduced || !messages.length ? 'auto' : 'smooth' })
  }, [messages, reduced])

  useEffect(() => () => request.current?.abort(), [])

  function talk() {
    setBubble(false)
    setHover(false)
    setOpen(true)
  }

  async function send(text: string) {
    const question = text.trim().slice(0, 400)
    if (!question || busy) return
    setInput('')
    const asked: Message = { id: nextId++, from: 'you', text: question, places: [], done: true }
    const answer: Message = { id: nextId++, from: 'him', text: '', places: [], done: false }
    const history = [...messages, asked].filter(message => message.text && !message.failed).map(message => ({ role: message.from === 'you' ? 'user' : 'assistant', text: message.text }))
    setMessages(list => [...list, asked, answer])
    setBusy(true)
    const patch = (change: (message: Message) => Message) => setMessages(list => list.map(message => message.id === answer.id ? change(message) : message))
    const fail = (message: string, whole = false) => patch(current => ({ ...current, text: whole ? message : current.text || message, failed: true, done: true }))
    const controller = request.current = new AbortController()
    // If he goes quiet half way through a sentence, give up rather than leave the visitor waiting on him.
    let quiet = 0, stalled = false
    const heard = () => {
      window.clearTimeout(quiet)
      quiet = window.setTimeout(() => { stalled = true; controller.abort() }, 12_000)
    }
    heard()
    try {
      const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }), signal: controller.signal })
      if (!response.ok || !response.body) {
        if (response.status === 503) setActive(false)
        fail(response.status === 503 ? OFFLINE : response.status === 429 ? BUSY : LOST)
        return
      }
      setActive(true)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let pending = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        heard()
        pending += decoder.decode(value, { stream: true })
        const events = pending.split('\n\n')
        pending = events.pop() ?? ''
        for (const block of events) {
          if (!block.startsWith('data: ')) continue
          const event = JSON.parse(block.slice(6)) as { type: string; delta?: string; id?: string; label?: string; message?: string }
          if (event.type === 'text') { setStreaming(true); patch(current => ({ ...current, text: current.text + event.delta })) }
          else if (event.type === 'show') patch(current => ({ ...current, places: [...current.places, { id: event.id!, label: event.label! }] }))
          else if (event.type === 'error') fail(event.message ?? 'Something went wrong.')
        }
      }
      patch(current => ({ ...current, text: current.text.trim() || 'I have nothing for that one.', done: true }))
    } catch (error) {
      if (stalled) fail(LOST, true)
      else if ((error as Error).name !== 'AbortError') fail('I could not reach my brain. Are you online?')
      // Stopped by the visitor: keep whatever he had said so far.
      else patch(current => ({ ...current, text: current.text.trim() || 'Stopped.', done: true }))
    } finally {
      window.clearTimeout(quiet)
      setBusy(false)
      setStreaming(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void send(input)
  }

  const stop = () => request.current?.abort()
  const reset = () => { stop(); setMessages([]); field.current?.focus() }

  const hidden = !present || (!open && (spot === 'shore' || crowded))
  const still = (seat: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- a small static stand-in, shown only when the canvas cannot be
    flat && <img className={seat} src={POSTER} alt="" />
  )

  return (
    <>
      <div className={styles.dock} data-open={open} data-hidden={hidden} data-dawn={dawn}>
        {bubble && !open && !hover && spot === 'dock' && (
          <button type="button" className={styles.bubble} onClick={talk} tabIndex={-1}>I’m the small Omar. Ask me anything about my work.</button>
        )}
        {/* Outside the quarter circle, so nothing clips it. */}
        <span className={styles.hint} data-on={hover && !open} aria-hidden="true">Ask Omar <kbd>Ctrl J</kbd></span>
        <button ref={launcher} type="button" className={styles.launcher} onClick={talk} tabIndex={hidden || open ? -1 : 0}
          onPointerEnter={event => { if (event.pointerType === 'mouse') setHover(true) }} onPointerLeave={() => setHover(false)}
          onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setHover(true) }} onBlur={() => setHover(false)}
          aria-label="Ask Omar, a small AI version of him" aria-expanded={open} aria-controls="mini-omar-chat">
          <span className={styles.moon} aria-hidden="true" />
          <span ref={dockSeat} className={styles.seat}>{still(styles.canvas)}</span>
        </button>
      </div>

      {stand && createPortal(
        <button ref={beach} type="button" className={styles.beach} data-here={spot === 'shore'} onClick={talk} tabIndex={spot === 'shore' ? 0 : -1}
          aria-label="Ask Omar, a small AI version of him" aria-expanded={open} aria-controls="mini-omar-chat">
          <span className={styles.footing} aria-hidden="true" />
          <span ref={shoreSeat} className={styles.seat} />
          <span className={`label ${styles.invite}`} aria-hidden="true">ask me <ArrowUpRight size={11} /></span>
        </button>,
        stand,
      )}

      <div ref={panel} id="mini-omar-chat" className={styles.chat} data-open={open} role="dialog" aria-label="Ask Omar" aria-hidden={!open} inert={!open} tabIndex={-1}>
        <header className={styles.head}>
          <div className={styles.title}>
            <b>Omar</b>
            {active && <i className={styles.live} role="img" aria-label="The AI is online" title="The AI is online" />}
          </div>
          <button type="button" className={styles.icon} onClick={reset} aria-label="New conversation" title="New conversation"><RotateCcw size={16} /></button>
          <button type="button" className={styles.icon} onClick={close} aria-label="Close"><X size={16} /></button>
        </header>

        <div ref={log} className={styles.scroll} role="log" aria-live="polite">
          {!messages.length && (
            <div className={styles.hello}>
              <p className={styles.big}>Hey, I’m Omar.<br /><span>What do you want to know?</span></p>
              <div className={styles.list}>
                {SUGGESTIONS.map(question => <button key={question} type="button" onClick={() => void send(question)}>{question}</button>)}
              </div>
              <p className={styles.note}>I’m an AI version of Omar: I only know what is on this page, and I can be wrong. The real one is at <a href={`mailto:${email}`}>{email}</a>.</p>
            </div>
          )}
          {messages.map(message => message.from === 'you' ? (
            <div key={message.id} className={styles.msg} data-from="you">{message.text}</div>
          ) : (
            <div key={message.id} className={styles.msg} data-from="him" data-failed={message.failed}>
              {message.text ? <p>{message.text}</p> : !message.done && <p className={styles.typing} aria-label="Thinking"><i /><i /><i /></p>}
              {message.places.map(place => (
                <a key={place.id} className={styles.cta} href={`#${place.id}`} onClick={() => setOpen(false)}><ArrowUpRight size={14} /><span>On the page: {place.label}</span></a>
              ))}
            </div>
          ))}
        </div>

        {/* He stands behind the message box. */}
        <div className={styles.stage} aria-hidden="true">
          <span ref={chatSeat} className={styles.behind}>{still(styles.canvas)}</span>
        </div>

        <form className={styles.composer} onSubmit={submit}>
          <textarea ref={field} value={input} rows={1} maxLength={400} placeholder="Ask about any project, role or win…" aria-label="Your question"
            onChange={event => setInput(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(input) } }} />
          {busy
            ? <button type="button" className={styles.send} data-stop onClick={stop} aria-label="Stop"><Square size={14} fill="currentColor" /></button>
            : <button type="submit" className={styles.send} disabled={!input.trim()} aria-label="Send"><ArrowUp size={18} /></button>}
        </form>
      </div>
    </>
  )
}
