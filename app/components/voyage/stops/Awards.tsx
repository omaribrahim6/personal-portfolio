'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { awardFilters, awards, modes, type Award, type Mode } from '../../../content'
import { Beat, Stop, StopHead } from '../Voyage'
import { useWorld } from '../World'
import styles from './stops.module.css'

// The station: the switches on the first card change what the departures board in the world shows (and
// which marks on the wind farm behind it turn); the second card is a ticket for one win, picked from the
// board's rows, which the board lights as you go.

export default function Awards() {
  const world = useWorld()
  const [filter, setFilter] = useState<Mode | 'all'>('all')
  const [chosen, setChosen] = useState<Award>(awards[0])
  const shown = awards.filter(award => filter === 'all' || award.mode === filter)
  const current = shown.includes(chosen) ? chosen : shown[0]
  const at = shown.indexOf(current)

  useEffect(() => { world.tell('awards', 'filter', filter) }, [world, filter])
  useEffect(() => { world.tell('awards', 'chosen', String(awards.indexOf(current))) }, [world, current])

  const step = (by: number) => setChosen(shown[(at + by + shown.length) % shown.length])

  return (
    <Stop id="awards">
      <Beat>
        <StopHead id="awards" title="The station">
          Hackathons, CTFs, and one award I didn’t see coming. Every win on the board was either something I built or something I broke.
        </StopHead>
        <div className={styles.switches} role="group" aria-label="Filter the board">
          {awardFilters.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} data-mode={key} onClick={() => setFilter(key)}>
              <i aria-hidden="true" />{label}<small>{key === 'all' ? awards.length : awards.filter(award => award.mode === key).length}</small>
            </button>
          ))}
        </div>
        <p className={styles.note}>
          Behind the platform, the wind farm keeps count: a turbine for every win that was built, a flag for every system broken into, and a sun for the one I was given.
        </p>
      </Beat>

      <Beat>
        {current && (
          <div className={styles.ticket} data-mode={current.mode} aria-live="polite">
            <p className={`label ${styles.ticketHead}`}><span>Admit one · platform {at + 1}</span><span>{current.date}</span></p>
            <h3 id="awards-ticket">{current.result}</h3>
            <p className={styles.event}>{current.event}</p>
            <span className="stamp" style={{ ['--tilt' as string]: '-6deg' }}>{modes[current.mode]}</span>
            <p className={styles.detail}>{current.detail}</p>
            {current.project && (
              <a className="btn" data-size="small" href={current.project.href} {...(current.project.href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                {current.project.label}<ArrowUpRight size={12} />
              </a>
            )}
            {/* The rows of the board, as punches along the stub. */}
            <div className={styles.stub}>
              <button type="button" aria-label="Previous win" onClick={() => step(-1)}><ArrowLeft size={14} /></button>
              <ol aria-label="Wins on the board">
                {shown.map((award, i) => (
                  <li key={award.event}>
                    <button type="button" aria-pressed={award === current} aria-label={`${award.result}, ${award.event}`} onClick={() => setChosen(award)}>{i + 1}</button>
                  </li>
                ))}
              </ol>
              <button type="button" aria-label="Next win" onClick={() => step(1)}><ArrowRight size={14} /></button>
            </div>
            <span className={`label ${styles.serial}`} aria-hidden="true">Nº {String(awards.indexOf(current) + 1).padStart(3, '0')} · {shown.length} on the board</span>
          </div>
        )}
      </Beat>
    </Stop>
  )
}
