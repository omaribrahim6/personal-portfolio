'use client'

import { useState, type PointerEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { skillGroups } from '../content'
import Plate, { Ground } from './Plate'
import styles from './Toolkit.module.css'

const all = skillGroups.flatMap(group => group.skills.map(skill => ({ ...skill, group: group.title })))
const withReceipts = all.filter(skill => skill.receipts?.length).length

// Every tool is a sunflower in the field. The ones with something to show for themselves open when you come
// to them; the ones without stay green buds.
function Bloom() {
  return (
    <svg viewBox="0 0 20 20" className={styles.bloom} aria-hidden="true">
      <g className={styles.petals}>
        {Array.from({ length: 12 }, (_, k) => <ellipse key={k} cx="10" cy="4.4" rx="1.9" ry="3.4" transform={`rotate(${k * 30} 10 10)`} />)}
      </g>
      <circle className={styles.seed} cx="10" cy="10" r="3.4" />
    </svg>
  )
}

export default function Toolkit() {
  const [selected, setSelected] = useState('Next.js')
  const [preview, setPreview] = useState<string | null>(null)
  const current = all.find(skill => skill.name === (preview ?? selected)) ?? all[0]

  function enter(event: PointerEvent<HTMLButtonElement>, name: string) {
    if (event.pointerType !== 'touch') setPreview(name)
  }

  return (
    <section id="skills" aria-labelledby="skills-title">
      <Plate index={4} chapter="skills" scene="sunflowers" after="windfarm" tone="dark" kicker="with receipts" title="Skills & tools" titleId="skills-title">
        Technologies I work with. Pick a tool. The receipt shows where on this page I actually used it.
      </Plate>

      <Ground scene="sunflowers" className={styles.ground}>
        <div className={`measure ${styles.body}`}>
          <div>
            <div className={styles.groups}>
              {skillGroups.map(group => (
                <div key={group.title} className={styles.group}>
                  <h3 className="label">{group.title}</h3>
                  <div className={styles.tools} onPointerLeave={() => setPreview(null)}>
                    {group.skills.map(skill => (
                      <button key={skill.name} type="button" className={styles.tool} data-has={!!skill.receipts?.length}
                        data-current={current.name === skill.name} aria-pressed={selected === skill.name}
                        onClick={() => setSelected(skill.name)} onPointerEnter={event => enter(event, skill.name)}>
                        <Bloom />{skill.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.note}>
              <strong>Always learning.</strong> Most of what I know came from shipping under a deadline — hackathons, CTFs, and production sites people actually depend on. Currently going deeper on agentic AI systems and offensive security.
            </p>
          </div>

          <aside className={styles.receipt} aria-live="polite" aria-label="Where this tool was used">
            <p className={`label ${styles.shop}`} aria-hidden="true">Sunflower co-op · est. 2024</p>
            <p className={`label ${styles.overline}`}><span>receipt</span><span>{current.group}</span></p>
            <h3>{current.name}</h3>
            {current.receipts?.length ? (
              <>
                <p className={styles.lead}>seen in</p>
                <ul className={styles.receipts}>
                  {current.receipts.map(receipt => (
                    <li key={receipt.href + receipt.label}>
                      <a href={receipt.href}><b>{receipt.label}</b><i aria-hidden="true" /><ArrowUpRight size={13} /></a>
                      <span>{receipt.note}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={styles.none}>Nothing public to point at yet. Coursework and side work so far — ask me about it.</p>
            )}
            <p className={styles.receiptFoot}>{withReceipts} of {all.length} tools point at something you can check.</p>
            <span className={styles.barcode} aria-hidden="true" />
          </aside>
        </div>
      </Ground>
    </section>
  )
}
