'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { awardFilters, awards, modes, type Mode } from '../content'
import Plate, { Ground } from './Plate'
import Rail from './Rail'
import styles from './Wins.module.css'

// One mark per kind of win, left on the hill. A flag gets raised for something broken into,
// stones get stacked for something built, and the moon fills for the one that was given.
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
      <ellipse className={styles.stone} data-stone="0" cx="15" cy="36" rx="10" ry="4.6" />
      <ellipse className={styles.stone} data-stone="1" cx="15" cy="27.4" rx="7.4" ry="4" />
      <ellipse className={styles.stone} data-stone="2" cx="15" cy="20" rx="5" ry="3.2" />
      <ellipse className={styles.stone} data-stone="3" cx="15" cy="14.4" rx="3" ry="2.2" />
    </svg>
  )
  return (
    <svg viewBox="0 0 30 44" className={styles.mark} aria-hidden="true">
      <circle className={styles.halo} cx="15" cy="21" r="12.5" />
      <circle className={styles.disc} cx="15" cy="21" r="8" />
      <circle className={styles.bite} cx="19.5" cy="18.5" r="7" />
    </svg>
  )
}

export default function Wins() {
  const [filter, setFilter] = useState<Mode | 'all'>('all')
  const shown = awards.filter(award => filter === 'all' || award.mode === filter)

  return (
    <section id="awards" aria-labelledby="awards-title">
      <Plate index={3} scene="summit" after="arch" tone="light" numeral="IV" place="the hill" kicker="scoreboard" title="Wins" titleId="awards-title">
        Hackathons, CTFs, and one award I didn’t see coming. Every win was either something I built or something I broke.
      </Plate>

      <Ground scene="summit" className={styles.ground}>
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
