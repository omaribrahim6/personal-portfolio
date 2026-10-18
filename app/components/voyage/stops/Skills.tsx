'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { skillGroups } from '../../../content'
import { Beat, Stop, StopHead } from '../Voyage'
import { useWorld } from '../World'
import styles from './stops.module.css'

// The glasshouse: a card for each bed, like the seed packet stuck on a stick at the end of it. Pick a skill
// and its plant in the bed stands up and its tag swings down; the card says where on this page it grew.

// The beds' colours, as in the world (glasshouse.ts).
const BEDS = ['#ec7b60', '#8a6cd8', '#2f60c8', '#2f9e8a', '#e2a92c']
const all = skillGroups.flatMap(group => group.skills)
const blooming = all.filter(skill => skill.receipts?.length).length

export default function Skills() {
  const world = useWorld()
  // The skill picked in each bed: to begin with, the one most in flower.
  const [picked, setPicked] = useState(() => skillGroups.map(group => [...group.skills].sort((a, b) => (b.receipts?.length ?? 0) - (a.receipts?.length ?? 0))[0].name))
  const [inView, setInView] = useState<number | null>(null)

  // Which bed's card is in front of you; its pick is the one shown in the world.
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setInView(Number((entry.target as HTMLElement).dataset.bed))
    }, { rootMargin: '-35% 0px -35% 0px' })
    document.querySelectorAll<HTMLElement>('[data-bed]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  useEffect(() => { if (inView !== null) world.tell('skills', 'skill', picked[inView]) }, [world, inView, picked])

  // A plant clicked in the world.
  useEffect(() => world.hear((name, value) => {
    if (name !== 'skill') return
    const bed = skillGroups.findIndex(group => group.skills.some(skill => skill.name === value))
    if (bed >= 0) setPicked(list => list.map((each, i) => i === bed ? value : each))
  }), [world])

  return (
    <Stop id="skills">
      <Beat>
        <StopHead id="skills" title="The glasshouse">
          Everything I work with, grown from something I made. Each skill is a plant, and it flowers once for every place on this page you can see it used.
        </StopHead>
        <p className={`label ${styles.legend}`}>
          {skillGroups.map((group, i) => <span key={group.title} style={{ '--c': BEDS[i] } as CSSProperties}><i />{group.title}</span>)}
        </p>
        <p className={styles.note}>{blooming} of {all.length} in flower. The rest are in leaf: used, just not anywhere on this page yet.</p>
      </Beat>
      {skillGroups.map((group, i) => {
        const current = group.skills.find(skill => skill.name === picked[i]) ?? group.skills[0]
        return (
          <Beat key={group.title} side={i % 2 ? 'right' : 'left'}>
            <div className={styles.packet} data-bed={i} style={{ '--c': BEDS[i] } as CSSProperties}>
              <p className={`label ${styles.packetHead}`}><span>Bed Nº {String(i + 1).padStart(2, '0')}</span><span>{group.skills.length} plants</span></p>
              <h3 id={`bed-${i}`} className={styles.packetTitle}>{group.title}</h3>
              <div className={styles.seeds} role="group" aria-label={`${group.title}: pick a skill`}>
                {group.skills.map(skill => (
                  <button key={skill.name} type="button" aria-pressed={skill.name === current.name} onClick={() => setPicked(list => list.map((each, k) => k === i ? skill.name : each))}>
                    {skill.name}
                    {!!skill.receipts?.length && <span aria-label={`${skill.receipts.length} receipts`}>{skill.receipts.map((_, k) => <i key={k} />)}</span>}
                  </button>
                ))}
              </div>
              {/* The index card for the one picked. */}
              <div className={styles.index} aria-live="polite">
                <p className={`label ${styles.indexHead}`}><span>{current.name}</span><span>{current.receipts?.length ? `${current.receipts.length} in bloom` : 'in leaf'}</span></p>
                {current.receipts?.length ? (
                  <ul>
                    {current.receipts.map(receipt => (
                      <li key={receipt.label}>
                        <a href={receipt.href}><b>{receipt.label}</b><span>{receipt.note}</span><ArrowUpRight size={12} /></a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.leaf}>Nothing on this page to point at yet. Ask Omar in the corner where it came from.</p>
                )}
              </div>
            </div>
          </Beat>
        )
      })}
    </Stop>
  )
}
