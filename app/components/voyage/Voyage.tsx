'use client'

import { MotionConfig } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { chapters, links } from '../../content'
import Cursor from '../Cursor'
import MiniOmar from '../mini/MiniOmar'
import Monogram from '../Monogram'
import Sign from '../Sign'
import { useMotionPreference } from '../useMotionPreference'
import { STOPS } from './itinerary'
import World, { useWorld } from './World'
import styles from './Voyage.module.css'

// The voyage: the portfolio as a trip across a solar punk archipelago, from sunrise to sunset. The world is
// drawn behind the page, and the page is a track of cards: each stop is a section, each card a moment at
// it. Scrolling moves the camera along; when a card is in the middle of the screen, the camera is where
// that card is about. All the words are real text in the page, in order, whether or not the world can be
// drawn.

export function Stop({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  const n = STOPS.findIndex(stop => stop.id === id)
  return (
    <section id={id} data-stop={id} className={`${styles.stop} ${className}`} aria-labelledby={`${id}-title`} style={{ ['--n' as string]: n }}>
      {children}
    </section>
  )
}

/** One moment at a stop: a card that passes through the middle of the screen while the camera is there. */
export function Beat({ children, side = 'left', id, wide = false, className = '' }: { children: ReactNode; side?: 'left' | 'right' | 'center'; id?: string; wide?: boolean; className?: string }) {
  return (
    <div className={styles.beat} data-beat data-side={side}>
      <article id={id} className={`${styles.card} ${className}`} data-wide={wide}>{children}</article>
    </div>
  )
}

/** The head of a stop's first card: which stop, its name, and the title. */
export function StopHead({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  const n = STOPS.findIndex(stop => stop.id === id)
  const chapter = chapters.find(each => each.id === id)
  return (
    <header className={styles.head}>
      <p className={`label ${styles.folio}`}><span><b>Stop {n + 1}</b> of {STOPS.length}</span><i /><span>{STOPS[n].name}</span></p>
      <h2 id={`${id}-title`} className={styles.title}><Sign text={title} /></h2>
      {children && <p className={styles.dek}>{children}</p>}
      {chapter?.label && <span className="sr-only">{chapter.label}</span>}
    </header>
  )
}

/** The route along the left: every stop, the one you are at lit, and how far along you are. */
function Route() {
  const [at, setAt] = useState(0)
  const [through, setThrough] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * .5
      let current = 0
      STOPS.forEach((stop, i) => { if ((document.getElementById(stop.id)?.getBoundingClientRect().top ?? Infinity) <= line) current = i })
      setAt(current)
      const max = document.documentElement.scrollHeight - window.innerHeight
      setThrough(max > 0 ? window.scrollY / max : 0)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    update()
    return () => { window.removeEventListener('scroll', schedule); cancelAnimationFrame(frame) }
  }, [])
  return (
    <nav className={styles.route} aria-label="Stops" style={{ ['--through' as string]: through }}>
      <i className={styles.line} aria-hidden="true" />
      {STOPS.map((stop, i) => (
        <a key={stop.id} href={`#${stop.id}`} aria-current={at === i ? 'location' : undefined} data-past={i < at}>
          <b>{i + 1}</b><span>{stop.name}</span>
        </a>
      ))}
    </nav>
  )
}

function Bar() {
  const ask = () => window.dispatchEvent(new Event('ask-omar'))
  return (
    <header className={styles.bar}>
      <a href="#home" className={styles.brand} aria-label="Omar Ibrahim, back to the start">
        <Monogram className={styles.mark} />
        <span className="label"><b>Omar Ibrahim</b><span>a voyage in seven stops</span></span>
      </a>
      <div className={styles.actions}>
        <a className={`label ${styles.almanac}`} href="/almanac">Read it as a magazine</a>
        <a className="btn" data-size="small" data-tone="paper" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé<ArrowUpRight size={12} /></a>
        <button type="button" className="btn" data-size="small" data-tone="ink" onClick={ask}>Ask Omar<ArrowUpRight size={12} /></button>
      </div>
    </header>
  )
}

function Fallback() {
  const { failed } = useWorld()
  if (!failed) return null
  return (
    <p className={styles.fallback} role="note">
      This site is a voyage through a 3D world, and this browser can’t draw it. Everything is still here to read, or <a className="vine" href="/almanac">read it as a magazine</a>.
    </p>
  )
}

export default function Voyage({ children }: { children: ReactNode }) {
  const reduced = useMotionPreference()
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <World>
        <a className={styles.skip} href="#projects">Skip to the work</a>
        <Bar />
        <Route />
        <Fallback />
        <main className={styles.track}>{children}</main>
        <MiniOmar />
        <Cursor />
      </World>
    </MotionConfig>
  )
}

/** "Scroll to set off": the cue at the foot of the first card. */
export function Onward({ children }: { children: ReactNode }) {
  return <p className={`label ${styles.onward}`}><ArrowDown size={13} />{children}</p>
}
