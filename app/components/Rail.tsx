'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './Rail.module.css'

// A sideways shelf: every card is one swipe, arrow, or arrow key away, so nothing needs a long scroll down the page.
// Pass `reset` (anything that changes when the cards do) to send the shelf back to its first card.
export default function Rail({ label, reset, onActive, children }: {
  label: string
  reset?: unknown
  onActive?: (index: number) => void
  children: ReactNode
}) {
  const track = useRef<HTMLUListElement>(null)
  const [state, setState] = useState({ index: 0, count: 0, start: true, end: true })
  const onActiveRef = useRef(onActive)
  onActiveRef.current = onActive

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    const cards = Array.from(el.children) as HTMLElement[]
    const left = el.scrollLeft
    let index = 0, best = Infinity
    cards.forEach((card, i) => {
      const gap = Math.abs(card.offsetLeft - left)
      if (gap < best) { best = gap; index = i }
    })
    const end = left + el.clientWidth >= el.scrollWidth - 2
    if (end && cards.length) index = cards.length - 1
    setState(prev => prev.index === index && prev.count === cards.length && prev.start === (left <= 2) && prev.end === end
      ? prev : { index, count: cards.length, start: left <= 2, end })
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    let frame = 0
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure() }) }
    el.addEventListener('scroll', schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(el)
    el.childNodes.forEach(node => observer.observe(node as Element))
    schedule()
    return () => { cancelAnimationFrame(frame); el.removeEventListener('scroll', schedule); observer.disconnect() }
  }, [measure, children])

  useEffect(() => { onActiveRef.current?.(state.index) }, [state.index])

  useEffect(() => { track.current?.scrollTo({ left: 0, behavior: 'instant' }) }, [reset])

  function go(delta: number) {
    const el = track.current
    if (!el) return
    const card = el.children[Math.max(0, Math.min(state.count - 1, state.index + delta))] as HTMLElement | undefined
    if (card) el.scrollTo({ left: card.offsetLeft })
  }

  function onKey(event: React.KeyboardEvent) {
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1) }
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className={styles.rail}>
      <div className={styles.bar}>
        <p className={`label ${styles.count}`} aria-live="polite">{pad(state.index + 1)} <i>/</i> {pad(state.count)}</p>
        <div className={styles.arrows}>
          <button type="button" aria-label="Previous" disabled={state.start} onClick={() => go(-1)}><ArrowLeft size={16} /></button>
          <button type="button" aria-label="Next" disabled={state.end} onClick={() => go(1)}><ArrowRight size={16} /></button>
        </div>
      </div>
      <ul ref={track} className={styles.track} aria-label={label} tabIndex={0} onKeyDown={onKey}>
        {children}
      </ul>
      <div className={styles.progress} aria-hidden="true">
        <i style={{ width: `${state.count ? (state.index + 1) / state.count * 100 : 0}%` }} />
      </div>
    </div>
  )
}
