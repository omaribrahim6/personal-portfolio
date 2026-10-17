'use client'

import { useState, type PointerEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { skillGroups } from '../content'
import Opener from './Opener'
import styles from './SeedBank.module.css'

const all = skillGroups.flatMap((group, g) => group.skills.map(skill => ({ ...skill, group: group.title, drawer: g })))
const withReceipts = all.filter(skill => skill.receipts?.length).length

/** The packet's picture: a sprout coming up if it has been planted somewhere you can see, a seed if not. */
function Sprout({ grown }: { grown: boolean }) {
  return grown ? (
    <svg viewBox="0 0 24 24" className={styles.sprout} aria-hidden="true">
      <path d="M12 22V11" />
      <path d="M12 13C12 8 8.5 6 4.5 6.5 4.5 10.5 7.5 13 12 13Z" />
      <path d="M12 11C12 6.5 15 4 19.5 4.5 19.5 9 16.5 11 12 11Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={styles.sprout} aria-hidden="true">
      <ellipse cx="12" cy="15" rx="4.2" ry="5.6" transform="rotate(-20 12 15)" />
      <path d="M10.5 12.5c1 1.5 1.2 3.6.4 5.4" />
    </svg>
  )
}

// The toolkit as a seed bank: a cabinet with a drawer for each kind of tool, and a packet in it for each tool.
// The ones planted somewhere on these pages have come up; pick one and its index card says where.
export default function SeedBank() {
  const [selected, setSelected] = useState('Next.js')
  const [preview, setPreview] = useState<string | null>(null)
  const current = all.find(skill => skill.name === (preview ?? selected)) ?? all[0]
  const number = all.indexOf(current) + 1

  function enter(event: PointerEvent<HTMLButtonElement>, name: string) {
    if (event.pointerType !== 'touch') setPreview(name)
  }

  return (
    <section id="skills" className={styles.bank} aria-labelledby="skills-title" data-crowds-mini>
      <div className="measure">
        <Opener chapter="skills" title="Seed bank" titleId="skills-title"
          aside={<p className={`label ${styles.count}`}>{withReceipts} of {all.length} sprouted</p>}>
          Technologies I work with, one packet each. Pick a packet: its card shows where on these pages I actually used it.
        </Opener>

        <div className={styles.body}>
          <div className={styles.cabinet}>
            <div className={styles.crest} aria-hidden="true"><span>Seed bank</span><i>est. on these pages</i></div>
            {skillGroups.map((group, g) => (
              <div key={group.title} className={styles.drawer} data-drawer={g}>
                <div className={styles.front}>
                  <span className={styles.holder}><span className="label">{String(g + 1).padStart(2, '0')}</span>{group.title}</span>
                  <span className={styles.pull} aria-hidden="true" />
                  <span className={`label ${styles.drawerCount}`}>{group.skills.length}</span>
                </div>
                <div className={styles.tray} onPointerLeave={() => setPreview(null)}>
                  {group.skills.map(skill => (
                    <button key={skill.name} type="button" className={styles.packet} data-grown={!!skill.receipts?.length}
                      data-current={current.name === skill.name} aria-pressed={selected === skill.name}
                      onClick={() => setSelected(skill.name)} onPointerEnter={event => enter(event, skill.name)}>
                      <Sprout grown={!!skill.receipts?.length} />
                      <span>{skill.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.side}>
            {/* The index card: lined, with a red margin and a hole punched for the rod. */}
            <aside className={styles.card} aria-live="polite" aria-label="Where this tool was used">
              <p className={`label ${styles.cardHead}`}><span>Card Nº {String(number).padStart(3, '0')}</span><span>{current.group}</span></p>
              <h3>{current.name}</h3>
              {current.receipts?.length ? (
                <>
                  <p className={styles.planted}>Planted in —</p>
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
                <p className={styles.none}>Not planted anywhere you can see yet. Coursework and side work so far — ask me about it.</p>
              )}
              <p className={styles.cardFoot}>{withReceipts} of {all.length} tools point at something you can check.</p>
              <span className={styles.hole} aria-hidden="true" />
            </aside>
            <p className={styles.note}>
              <strong>Always learning.</strong> Most of what I know came from shipping under a deadline — hackathons, CTFs, and production sites people actually depend on. Currently going deeper on agentic AI systems and offensive security.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
