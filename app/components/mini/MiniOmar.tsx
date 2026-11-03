'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, ArrowUpRight, MessageCircle, RotateCcw, Square, X } from 'lucide-react'
import { email, placeHref } from '../../content'
import { useMotionPreference } from '../useMotionPreference'
import styles from './mini.module.css'

// The small Omar: an AI stand-in who answers questions about the work, behind a button in the corner.
// The chat is the one from Mamdani (its size, its layout and the way it opens), in this site's colours.
// His answers come from /api/ask.

type Place = { id: string; label: string }
type Message = { id: number; from: 'you' | 'him'; text: string; places: Place[]; failed?: boolean; done: boolean }

const SUGGESTIONS = [
  'What are you best at?',
  'Tell me about Revenant',
  'What security work have you done?',
  'Are you open to internships?',
  'How did you build this site?',
]
const OFFLINE = `My brain is not plugged in here. The real Omar answers at ${email}.`
const LOST = 'I lost my train of thought. Try again?'
const BUSY = `I have talked a lot today. Give me a minute, or write to the real Omar at ${email}.`

let nextId = 1

export default function MiniOmar() {
  const reduced = useMotionPreference()
  const [open, setOpen] = useState(false)
  const [asked, setAsked] = useState(false)
  const [active, setActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const launcher = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const request = useRef<AbortController | null>(null)

  // The green dot by his name: whether there is a model behind him to answer. Asked the first time he is opened.
  useEffect(() => {
    if (!asked) return
    let cancelled = false
    fetch('/api/ask').then(response => response.json()).then((status: { active?: boolean }) => { if (!cancelled) setActive(Boolean(status.active)) }).catch(() => {})
    return () => { cancelled = true }
  }, [asked])

  // Opening, as in Mamdani: the panel grows out of the corner and the box takes focus (on a touch screen the
  // panel does, so the keyboard stays down).
  useEffect(() => {
    if (!open) return
    const focus = window.setTimeout(() => (window.matchMedia('(hover: hover) and (pointer: fine)').matches ? field : panel).current?.focus({ preventScroll: true }), 350)
    return () => window.clearTimeout(focus)
  }, [open])

  // Closing hands focus back to the corner.
  const close = useCallback(() => {
    setOpen(false)
    launcher.current?.focus({ preventScroll: true })
  }, [])

  // Escape closes. Ctrl or Cmd + J toggles.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) close()
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        if (open) close()
        else talk()
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
    setAsked(true)
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
          if (event.type === 'text') patch(current => ({ ...current, text: current.text + event.delta }))
          else if (event.type === 'show') patch(current => ({ ...current, places: [...current.places, { id: event.id!, label: event.label! }] }))
          else if (event.type === 'error') fail(event.message ?? 'Something went wrong.')
        }
      }
      // A marker taken out of the middle of a sentence can leave a space before the full stop.
      patch(current => ({ ...current, text: current.text.replace(/\s+([.,!?;:])/g, '$1').trim() || 'I have nothing for that one.', done: true }))
    } catch (error) {
      if (stalled) fail(LOST, true)
      else if ((error as Error).name !== 'AbortError') fail('I could not reach my brain. Are you online?')
      // Stopped by the visitor: keep whatever he had said so far.
      else patch(current => ({ ...current, text: current.text.trim() || 'Stopped.', done: true }))
    } finally {
      window.clearTimeout(quiet)
      setBusy(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void send(input)
  }

  const stop = () => request.current?.abort()
  const reset = () => { stop(); setMessages([]); field.current?.focus() }

  return (
    <>
      <button ref={launcher} type="button" className={styles.launcher} data-open={open} onClick={talk} tabIndex={open ? -1 : 0}
        aria-label="Ask Omar, an AI version of him" aria-expanded={open} aria-controls="mini-omar-chat" title="Ask Omar (Ctrl J)">
        <MessageCircle size={16} aria-hidden="true" />Ask my AI
      </button>

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
              <p className={styles.note}>I’m an AI version of Omar: I only know what is on this site, and I can be wrong. The real one is at <a href={`mailto:${email}`}>{email}</a>.</p>
            </div>
          )}
          {messages.map(message => message.from === 'you' ? (
            <div key={message.id} className={styles.msg} data-from="you">{message.text}</div>
          ) : (
            <div key={message.id} className={styles.msg} data-from="him" data-failed={message.failed}>
              {message.text ? <p>{message.text}</p> : !message.done && <p className={styles.typing} aria-label="Thinking"><i /><i /><i /></p>}
              {message.places.map(place => (
                <a key={place.id} className={styles.cta} href={placeHref(place.id)} onClick={() => setOpen(false)}><ArrowUpRight size={14} /><span>On the site: {place.label}</span></a>
              ))}
            </div>
          ))}
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
