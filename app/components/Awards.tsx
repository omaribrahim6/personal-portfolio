'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import styles from './Awards.module.css'

type Mode = 'built' | 'broke' | 'named'
type Award = {
  result: string
  event: string
  detail: string
  date: string
  mode: Mode
  project?: { label: string; href: string }
}

const modes: Record<Mode, string> = { built: 'built it', broke: 'broke it', named: 'named' }

const awards: Award[] = [
  {
    result: 'Best Use of Gemini', event: 'cuHacking 2026', date: 'Jul 2026', mode: 'built',
    detail: 'Built Clascade with a team of four — turning teachers’ existing slide decks into collaborative 3D lessons.',
    project: { label: 'see the build · Clascade', href: '#project-0' },
  },
  {
    result: 'Engineer of the Year', event: 'IEEE uOttawa Student Branch', date: 'Apr 2026', mode: 'named',
    detail: 'Awarded at WIPS 2026.',
  },
  {
    result: '1st Place', event: 'uOttawa Cybersecurity Club CTF', date: 'Apr 2026', mode: 'broke',
    detail: 'Won as a team and posted the highest individual score in the room, across web, crypto, and reverse engineering.',
  },
  {
    result: 'Most Flags Found', event: 'BSides Ottawa Meetup CTF', date: 'Apr 2026', mode: 'broke',
    detail: 'Orchestrated parallel AI sub-agents across the challenge board and led the field at ~4000 points, before an unconstrained agent spent ~1000 of them on hints. Finished 5th with the most flags found.',
  },
  {
    result: 'Winner — Moorcheh.ai Track', event: 'GenAI Genesis 2026', date: 'Mar 2026', mode: 'built',
    detail: 'Canada’s largest AI hackathon. Built Revenant in 36 hours against 1,000+ hackers at the University of Toronto.',
    project: { label: 'see the build · Revenant', href: '#project-1' },
  },
  {
    result: '1st Place', event: 'IEEE uOttawa × Hack The Box CTF', date: 'Feb 2026', mode: 'broke',
    detail: 'Team finished with 64 of 67 flags. 2nd individually at 40.',
  },
  {
    result: '2nd Place', event: 'Hack the Future Hackathon', date: 'Feb 2026', mode: 'built',
    detail: 'Built RoadSense, an AI road-damage detection system, with a team of four.',
    project: { label: 'see the build · RoadSense', href: '#project-3' },
  },
]

const filters: [Mode | 'all', string][] = [['all', 'everything'], ['built', 'built it'], ['broke', 'broke it'], ['named', 'named']]

// One glyph per kind of win. Flags get captured, blocks get assembled, the trophy block gets lifted onto its pedestal.
function Glyph({ mode }: { mode: Mode }) {
  if (mode === 'broke') return (
    <svg viewBox="0 0 18 40" className={styles.glyph} aria-hidden="true">
      <rect x="2" y="0" width="1.5" height="40" fill="#6b6b5e" />
      <g className={styles.flag}>
        {[0, 1, 2].flatMap(row => [0, 1, 2, 3].map(col => (
          <rect key={`${row}${col}`} x={4.5 + col * 2.6} y={1 + row * 2.6} width="2.2" height="2.2" fill={row === 1 && col === 3 ? '#b8961f' : '#e4c748'} />
        )))}
      </g>
    </svg>
  )
  if (mode === 'built') return (
    <svg viewBox="0 0 18 40" className={styles.glyph} aria-hidden="true">
      <rect className={styles.b1} x="2" y="19" width="6" height="6" fill="#e4c748" />
      <rect className={styles.b2} x="9.5" y="19" width="6" height="6" fill="#c0a43b" />
      <rect className={styles.b3} x="2" y="26.5" width="6" height="6" fill="#c0a43b" />
      <rect className={styles.b4} x="9.5" y="26.5" width="6" height="6" fill="#e4c748" />
      <rect x="0" y="34.5" width="18" height="1" fill="#6b6b5e" />
    </svg>
  )
  return (
    <svg viewBox="0 0 18 40" className={styles.glyph} aria-hidden="true">
      <rect x="1" y="29" width="16" height="5" fill="#6b6b5e" />
      <rect x="4" y="24" width="10" height="5" fill="#8b7426" />
      <rect className={styles.top} x="6" y="15" width="6" height="6" fill="#e4c748" />
    </svg>
  )
}

export default function Awards() {
  const [filter, setFilter] = useState<Mode | 'all'>('all')
  const shown = awards.filter(award => filter === 'all' || award.mode === filter)

  return (
    <section id="awards" className={styles.section} aria-labelledby="awards-title">
      <div className={styles.container}>
        <div className={styles.heading}>
          <div><p className={styles.kicker}>scoreboard</p><h2 id="awards-title"><span>{'//'}</span> wins</h2></div>
          <p>hackathons, CTFs, and one award I didn’t see coming<br /><span>Every win was either something I built or something I broke.</span></p>
        </div>

        <div className={styles.filters} role="group" aria-label="Filter the wins">
          {filters.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label}<small>{key === 'all' ? awards.length : awards.filter(award => award.mode === key).length}</small>
            </button>
          ))}
        </div>

        <ul className={styles.list}>
          {shown.map(award => (
            <motion.li key={`${award.event}-${award.result}`} layout className={styles.row} data-lit={filter !== 'all'}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .45 }}>
              <Glyph mode={award.mode} />
              <div>
                <h3>{award.result}</h3>
                <p className={styles.event}>{award.event}</p>
                <p className={styles.detail}>{award.detail}</p>
                {award.project && <a className={styles.build} href={award.project.href}>{award.project.label}<ArrowUpRight size={13} /></a>}
              </div>
              <div className={styles.meta}><span>{modes[award.mode]}</span><span>{award.date}</span></div>
            </motion.li>
          ))}
        </ul>
        <p className={styles.count}>{shown.length} of {awards.length} · Feb – Jul 2026</p>
      </div>
    </section>
  )
}
