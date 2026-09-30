'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, ArrowUpRight, X } from 'lucide-react'
import { email } from '../../content'
import { useMotionPreference } from '../useMotionPreference'
import { world } from '../scroll'
import type { Behavior, MiniStage } from './stage'
import styles from './mini.module.css'

// The small Omar. He leans out of a low moon in the corner of every chapter and watches the pointer;
// at the shore, where the walk ends, he is standing on the beach instead, and for once facing you.
// Click him anywhere and he comes over to talk. His answers come from /api/ask.
// Where WebGL or the model cannot be had, a picture of him sits in the corner instead and the chat still works.

type Place = { id: string; label: string }
type Message = { id: number; from: 'you' | 'him'; text: string; places: Place[]; failed?: boolean; done: boolean }

const SUGGESTIONS = ['What are you best at?', 'Tell me about Revenant', 'What security work have you done?', 'Are you open to internships?']
const OFFLINE = `My brain is not plugged in here. The real Omar answers at ${email}.`
const POSTER = '/models/omar-bust.webp'
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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [stand, setStand] = useState<HTMLElement | null>(null)

  const stage = useRef<MiniStage | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const dockSeat = useRef<HTMLSpanElement>(null)
  const shoreSeat = useRef<HTMLSpanElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const request = useRef<AbortController | null>(null)

  // On the beach while the chat is closed; in the corner otherwise.
  const onShore = ready && atShore && !open
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
    const seat = onShore ? shoreSeat.current : dockSeat.current
    if (!ready || !el || !made || !seat) return
    seat.appendChild(el)
    made.frame(onShore ? 'full' : 'bust')
    made.resize()
    const observer = new ResizeObserver(() => made.resize())
    observer.observe(seat)
    document.querySelector<HTMLElement>('[data-terrain="shore"]')?.toggleAttribute('data-mini', true)
    return () => observer.disconnect()
  }, [ready, onShore, stand])

  useEffect(() => { stage.current?.act(behavior) }, [behavior, ready])
  useEffect(() => { stage.current?.light(dawn || onShore ? 'dawn' : 'night') }, [dawn, onShore, ready])

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

  // Opening: focus the question box, or on a touch screen the panel itself, so the keyboard does not
  // cover his suggestions. Escape closes and gives focus back. Ctrl or Cmd + J toggles.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) { setOpen(false); launcher.current?.focus() }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') { event.preventDefault(); setOpen(value => !value) }
    }
    window.addEventListener('keydown', onKey)
    if (open) window.setTimeout(() => (window.matchMedia('(hover: hover) and (pointer: fine)').matches ? field : panel).current?.focus(), 320)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [messages, reduced])

  useEffect(() => () => request.current?.abort(), [])

  const talk = useCallback(() => {
    setBubble(false)
    setOpen(true)
    if (!messages.length) stage.current?.wave()
  }, [messages.length])

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
        fail(response.status === 503 ? OFFLINE : response.status === 429 ? BUSY : LOST)
        return
      }
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

  const hidden = !present || (!open && (onShore || crowded))

  return (
    <>
      <div className={styles.dock} data-open={open} data-hidden={hidden} data-dawn={dawn}>
        {bubble && !open && !onShore && (
          <p className={styles.bubble} role="status">I’m the small one. Ask me anything about Omar.</p>
        )}
        <button ref={launcher} type="button" className={styles.launcher} onClick={() => open ? setOpen(false) : talk()} tabIndex={hidden ? -1 : 0}
          aria-label={open ? 'Close the chat with mini Omar' : 'Talk to mini Omar, a small AI version of Omar'} aria-expanded={open} aria-controls="mini-omar-chat">
          <span className={styles.moon} aria-hidden="true" />
          <span ref={dockSeat} className={styles.seat}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a small static stand-in, shown only when the canvas cannot be */}
            {flat && <img className={styles.canvas} src={POSTER} alt="" />}
          </span>
        </button>
      </div>

      {stand && createPortal(
        <button type="button" className={styles.beach} data-here={onShore} onClick={talk} tabIndex={onShore ? 0 : -1}
          aria-label="Talk to mini Omar, a small AI version of Omar">
          <span className={styles.footing} aria-hidden="true" />
          <span ref={shoreSeat} className={styles.seat} />
          <span className={`label ${styles.invite}`} aria-hidden="true">ask me <ArrowUpRight size={11} /></span>
        </button>,
        stand,
      )}

      <section ref={panel} id="mini-omar-chat" className={styles.panel} data-open={open} role="dialog" aria-label="Chat with mini Omar" aria-hidden={!open} inert={!open} tabIndex={-1}>
        <header className={styles.head}>
          <p className="label"><span>Mini Omar</span><span>an AI stand-in</span></p>
          <button type="button" onClick={() => { setOpen(false); launcher.current?.focus() }} aria-label="Close the chat"><X size={18} /></button>
        </header>

        <div ref={log} className={styles.log} role="log" aria-live="polite">
          {!messages.length && (
            <div className={styles.opening}>
              <p>Ask me about the work, the wins or the tools. I only know what’s on this page.</p>
              <ul>
                {SUGGESTIONS.map(question => <li key={question}><button type="button" onClick={() => void send(question)}>{question}</button></li>)}
              </ul>
            </div>
          )}
          {messages.map(message => (
            <div key={message.id} className={styles.message} data-from={message.from} data-failed={message.failed}>
              {message.text ? <p>{message.text}</p> : <p className={styles.thinking} aria-label="Thinking"><i /><i /><i /></p>}
              {message.places.length > 0 && (
                <p className={styles.places}>
                  {message.places.map(place => (
                    <a key={place.id} className="go" href={`#${place.id}`} onClick={() => setOpen(false)}>{place.label}<ArrowUpRight size={13} /></a>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>

        <form className={styles.ask} onSubmit={submit}>
          <textarea ref={field} value={input} rows={1} maxLength={400} placeholder="Ask mini Omar…" aria-label="Your question"
            onChange={event => setInput(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(input) } }} />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send"><ArrowUp size={17} /></button>
        </form>
        <p className={styles.small}>An AI version of Omar. It can be wrong; the real one is at <a href={`mailto:${email}`}>{email}</a>.</p>
      </section>
    </>
  )
}
