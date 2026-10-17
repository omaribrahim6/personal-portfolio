'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { awardFilters, awards, modes, type Award, type Mode } from '../content'
import Opener from './Opener'
import { useMotionPreference } from './useMotionPreference'
import styles from './Record.module.css'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const ROWS = awards.length
const short = (date: string) => date.toUpperCase()

/**
 * One flap of a split-flap board. When its value changes it riffles through a few others first, each turn a
 * real flip: the top half of the old one falls away and the bottom half of the new one drops into place.
 */
function Flap({ value, delay = 0, riffle = 3, className }: { value: string; delay?: number; riffle?: number; className?: string }) {
  const reduced = useMotionPreference()
  const [face, setFace] = useState({ now: value, was: value, turn: 0 })

  useEffect(() => {
    // With reduced motion it simply changes, without the riffle or the flip.
    const steps = reduced ? [] : Array.from({ length: riffle }, () => value.length <= 1 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : '')
    const timers = [...steps, value].map((next, i) => window.setTimeout(() => setFace(f => {
      if (f.now === next) return f
      return reduced ? { now: next, was: next, turn: f.turn } : { now: next, was: f.now, turn: f.turn + 1 }
    }), reduced ? 0 : delay + i * 75))
    return () => timers.forEach(window.clearTimeout)
  }, [value, delay, riffle, reduced])

  return (
    <span className={`${styles.flap} ${className ?? ''}`}>
      <span className={styles.top}><span>{face.now || ' '}</span></span>
      <span className={styles.bottom}><span>{face.now || ' '}</span></span>
      {face.turn > 0 && (
        <>
          <span key={`a${face.turn}`} className={`${styles.top} ${styles.falling}`}><span>{face.was || ' '}</span></span>
          <span key={`b${face.turn}`} className={`${styles.bottom} ${styles.landing}`}><span>{face.now || ' '}</span></span>
        </>
      )}
    </span>
  )
}

/** A word made of single-letter flaps. */
function Letters({ text, width, delay }: { text: string; width: number; delay: number }) {
  const padded = text.padEnd(width).slice(0, width)
  return (
    <span className={styles.letters}>
      {[...padded].map((char, i) => <Flap key={i} value={char.trim()} delay={delay + i * 35} riffle={char.trim() ? 3 : 1} className={styles.cell} />)}
    </span>
  )
}

/** The station clock on the board: this minute, once the page is in the browser. */
function Clock() {
  const [time, setTime] = useState<string | null>(null)
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }))
    tick()
    const timer = window.setInterval(tick, 15_000)
    return () => window.clearInterval(timer)
  }, [])
  return <span className={styles.clock}>{time ?? '--:--'}</span>
}

export default function Record() {
  const [filter, setFilter] = useState<Mode | 'all'>('all')
  const shown = awards.filter(award => filter === 'all' || award.mode === filter)
  const [chosen, setChosen] = useState<Award>(awards[0])
  const current = shown.includes(chosen) ? chosen : shown[0]

  return (
    <section id="awards" className={styles.record} aria-labelledby="awards-title">
      <div className="measure">
        <Opener chapter="awards" title="The record" titleId="awards-title"
          aside={<p className={`label ${styles.count}`}>{shown.length} of {awards.length} · Feb – Sep 2026</p>}>
          Hackathons, CTFs, and one award I didn’t see coming. Every win was either something I built or something I broke.
        </Opener>

        <div className={styles.switches} role="group" aria-label="Filter the wins">
          {awardFilters.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              <i aria-hidden="true" />{label}<small>{key === 'all' ? awards.length : awards.filter(award => award.mode === key).length}</small>
            </button>
          ))}
        </div>

        <div className={styles.station}>
          {/* The board. Its rows are buttons; the flaps are for the eye, and each row says itself in full. */}
          <div className={styles.board}>
            <div className={styles.head} aria-hidden="true">
              <span className={styles.name}>Arrivals · wins</span>
              <Clock />
            </div>
            <div className={`label ${styles.columns}`} aria-hidden="true">
              <span>Date</span><span>Event</span><span>Result</span><span>Kind</span>
            </div>
            <ol className={styles.rows}>
              {Array.from({ length: ROWS }, (_, i) => {
                const award = shown[i]
                const delay = i * 90
                return (
                  <li key={i}>
                    {award ? (
                      <button type="button" className={styles.row} data-mode={award.mode} aria-pressed={current === award} onClick={() => setChosen(award)}
                        aria-label={`${award.result}, ${award.event}, ${award.date}. ${modes[award.mode]}.`}>
                        <Letters text={short(award.date)} width={8} delay={delay} />
                        <Flap value={award.event} delay={delay + 120} className={styles.wide} />
                        <Flap value={award.result} delay={delay + 200} className={styles.wide} />
                        <Flap value={modes[award.mode]} delay={delay + 260} className={styles.kind} />
                      </button>
                    ) : (
                      <span className={styles.row} aria-hidden="true">
                        <Letters text="" width={8} delay={delay} />
                        <Flap value="" delay={delay + 120} className={styles.wide} />
                        <Flap value="" delay={delay + 200} className={styles.wide} />
                        <Flap value="" delay={delay + 260} className={styles.kind} />
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>

          {/* The ticket for whichever row is chosen. */}
          {current && (
            <article className={styles.ticket} data-mode={current.mode} aria-live="polite">
              <p className={`label ${styles.ticketHead}`}><span>Admit one</span><span>{current.date}</span></p>
              <h3>{current.result}</h3>
              <p className={styles.event}>{current.event}</p>
              <span className="stamp" style={{ ['--tilt' as string]: '-6deg' }}>{modes[current.mode]}</span>
              <p className={styles.detail}>{current.detail}</p>
              {current.project && (
                <a className="btn" data-size="small" href={current.project.href} {...(current.project.href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                  {current.project.label}<ArrowUpRight size={12} />
                </a>
              )}
              <span className={styles.stub} aria-hidden="true">Nº {String(awards.indexOf(current) + 1).padStart(3, '0')}</span>
            </article>
          )}
        </div>
      </div>
    </section>
  )
}
