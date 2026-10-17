'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { awardFilters, awards, modes, type Mode } from '../content'
import Plate, { Ground } from './Plate'
import Rail from './Rail'
import styles from './Wins.module.css'

// One mark per kind of win, as on the hill. A turbine for something built, which spins up; a flag for
// something broken into, which runs up its pole; and a sun for the one that was given, whose rays come out.
function Mark({ mode }: { mode: Mode }) {
  if (mode === 'broke') return (
    <svg viewBox="0 0 30 44" className={styles.mark} aria-hidden="true">
      <path className={styles.pole} d="M8 3v38" />
      <path className={styles.flag} d="M8.8 4 26 9.5 8.8 15Z" />
      <path className={styles.base} d="M2 41h13" />
    </svg>
  )
  if (mode === 'built') return (
    <svg viewBox="0 0 30 44" className={styles.mark} aria-hidden="true">
      <path className={styles.tower} d="M13.9 42 14.6 15h.8l.7 27Z" />
      <g className={styles.blades}>
        <path d="M15 15 14 2.5Q15 1.4 16 2.6Z" />
        <path d="M15 15 14 2.5Q15 1.4 16 2.6Z" transform="rotate(120 15 15)" />
        <path d="M15 15 14 2.5Q15 1.4 16 2.6Z" transform="rotate(240 15 15)" />
      </g>
      <circle className={styles.hub} cx="15" cy="15" r="1.8" />
      <path className={styles.base} d="M8 42h14" />
    </svg>
  )
  return (
    <svg viewBox="0 0 30 44" className={styles.mark} aria-hidden="true">
      <g className={styles.rays}>
        {Array.from({ length: 12 }, (_, k) => <path key={k} d="M15 5.2v-3.6" transform={`rotate(${k * 30} 15 21)`} />)}
      </g>
      <circle className={styles.disc} cx="15" cy="21" r="8" />
      <path className={styles.face} d="M11.8 20.2h.01M18.2 20.2h.01M12.2 23.6q2.8 2.4 5.6 0" />
    </svg>
  )
}

export default function Wins() {
  const [filter, setFilter] = useState<Mode | 'all'>('all')
  const shown = awards.filter(award => filter === 'all' || award.mode === filter)

  return (
    <section id="awards" aria-labelledby="awards-title">
      <Plate index={3} chapter="awards" scene="windfarm" after="glasshouse" tone="dark" kicker="scoreboard" title="Wins" titleId="awards-title">
        Hackathons, CTFs, and one award I didn’t see coming. Every win was either something I built or something I broke.
      </Plate>

      <Ground scene="windfarm" className={styles.ground}>
        <div className="measure">
          <div className={`label filters ${styles.filters}`} role="group" aria-label="Filter the wins">
            {awardFilters.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {label}<small>{key === 'all' ? awards.length : awards.filter(award => award.mode === key).length}</small>
              </button>
            ))}
          </div>

          <Rail label="Wins, one card per award" reset={filter}>
              {shown.map(award => (
                <motion.li key={`${award.event}-${award.result}`} className={styles.row} data-mode={award.mode} data-lit={filter !== 'all'}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
                  <p className={`label ${styles.when}`}><span>{award.date}</span><span>{modes[award.mode]}</span></p>
                  <Mark mode={award.mode} />
                  <div className={styles.what}>
                    <h3>{award.result}</h3>
                    <p className={styles.event}>{award.event}</p>
                    <p className={styles.detail}>{award.detail}</p>
                    {award.project && (
                      <a className={`go ${styles.build}`} href={award.project.href} {...(award.project.href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                        {award.project.label}<ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>
                </motion.li>
              ))}
          </Rail>
          <p className={`label ${styles.count}`}>{shown.length} of {awards.length} · Feb – Sep 2026</p>
        </div>
      </Ground>
    </section>
  )
}
