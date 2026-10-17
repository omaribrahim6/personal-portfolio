'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { roleFilters, roles, type Category, type Role } from '../content'
import Opener from './Opener'
import styles from './FieldNotes.module.css'

const MONTHS = 'JFMAMJJASOND'
const NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthIndex = (ym: string) => { const [year, month] = ym.split('-').map(Number); return year * 12 + month - 1 }
const FAR = 1e6
const endOf = (role: Role) => !role.end ? -FAR : role.end === 'present' ? FAR : monthIndex(role.end)
// Most recent first. Whatever is still going leads; the one entry without dates goes last.
const entries = [...roles].sort((a, b) => endOf(b) - endOf(a) || monthIndex(a.start ?? '9999-01') - monthIndex(b.start ?? '9999-01'))

// "This month" only exists in the browser: the server draws the wheel without its rings.
const never = () => () => {}
const thisMonth = () => { const today = new Date(); return today.getFullYear() * 12 + today.getMonth() }
const unknown = () => null

// The wheel: the months run clockwise round it from the top, leaving a gap at the top for the pointer.
const FROM = -158, TO = 158
const R_SUN = 44, R_IN = 66, R_OUT = 170
const polar = (deg: number, r: number) => {
  const a = (deg - 90) * Math.PI / 180
  return [Math.cos(a) * r, Math.sin(a) * r] as const
}
function arc(from: number, to: number, r: number) {
  const [x0, y0] = polar(from, r), [x1, y1] = polar(to, r)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export default function FieldNotes() {
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [reading, setReading] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const pendingJump = useRef<string | null>(null)
  const list = useRef<HTMLOListElement>(null)
  const now = useSyncExternalStore(never, thisMonth, unknown)

  const wheel = useMemo(() => {
    if (now === null) return null
    const dated = roles.filter(role => role.start && role.end)
    const first = Math.min(...dated.map(role => monthIndex(role.start!)))
    const months = now - first + 1
    const at = (month: number) => FROM + (TO - FROM) * month / months
    const rows = dated
      .map(role => ({ role, from: monthIndex(role.start!) - first, to: Math.min(endOf(role), now) - first + 1, continues: endOf(role) > now }))
      .sort((a, b) => a.from - b.from || a.to - b.to)
    const pitch = (R_OUT - R_IN) / (rows.length - 1)
    const rings = rows.map((row, index) => {
      const r = R_IN + index * pitch
      const a0 = at(row.from) + .9, a1 = at(row.to) - .9
      const tip = polar(a1, r)
      return { ...row, r, d: arc(a0, a1, r), tip, angle: a1 }
    })
    const ticks = Array.from({ length: months + 1 }, (_, m) => ({ m, angle: at(m), month: (first + m) % 12, year: Math.floor((first + m) / 12) }))
    return { first, months, rings, ticks, pitch, at }
  }, [now])

  const shown = entries.filter(role => filter === 'all' || role.category === filter)
  const lit = hover ?? reading
  const litRole = roles.find(role => role.id === lit)

  // The wheel follows whichever note is being read.
  useEffect(() => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[data-entry]') ?? [])]
    const observer = new IntersectionObserver(seen => {
      for (const entry of seen) if (entry.isIntersecting) setReading((entry.target as HTMLElement).dataset.entry ?? null)
    }, { rootMargin: '-42% 0px -52% 0px' })
    items.forEach(item => observer.observe(item))
    return () => observer.disconnect()
  }, [filter])

  function reveal(id: string) {
    document.getElementById(`story-${id}`)?.scrollIntoView({ block: 'center' })
  }

  useEffect(() => {
    if (!pendingJump.current) return
    const id = pendingJump.current
    pendingJump.current = null
    reveal(id)
  }, [filter])

  // Receipts in the seed bank link straight to entries. If a filter is hiding the target, drop the filter first.
  useEffect(() => {
    function onHash() {
      const id = window.location.hash.replace('#story-', '')
      const role = window.location.hash.startsWith('#story-') ? roles.find(role => role.id === id) : undefined
      if (role && filter !== 'all' && role.category !== filter) {
        pendingJump.current = id
        setFilter('all')
      } else if (role) {
        reveal(role.id)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [filter])

  function jump(role: Role) {
    if (filter !== 'all' && role.category !== filter) {
      pendingJump.current = role.id
      setFilter('all')
      return
    }
    reveal(role.id)
  }

  return (
    <section id="about" className={styles.notes} aria-labelledby="about-title">
      <div className="measure">
        <Opener chapter="about" title="Field notes" titleId="about-title">
          The story so far: school, work, and the things I volunteer for, written up as I went.
        </Opener>

        <div className={styles.body}>
          <figure className={styles.figure}>
            <div className={styles.wheel}>
              <svg viewBox="-222 -222 444 444" aria-hidden="true">
                {/* The face: a paper disc with a double rim. */}
                <circle r="196" className={styles.face} />
                <circle r="188" className={styles.rim} />
                {wheel && wheel.ticks.map(({ m, angle, month, year }) => {
                  const [x0, y0] = polar(angle, 177), [x1, y1] = polar(angle, month === 0 ? 189 : 182)
                  const [tx, ty] = polar(angle + (TO - FROM) / wheel.months / 2, 184)
                  return (
                    <g key={m}>
                      <path d={`M${x0} ${y0}L${x1} ${y1}`} className={month === 0 ? styles.yearTick : styles.tick} />
                      {m < wheel.months && <text x={tx} y={ty} className={styles.month} dominantBaseline="central" textAnchor="middle">{MONTHS[month]}</text>}
                      {month === 0 && <YearLabel angle={angle} year={year} />}
                    </g>
                  )
                })}
                {wheel && <YearLabel angle={FROM} year={Math.floor(wheel.first / 12)} start />}
                {/* Guides under the rings. */}
                {wheel && wheel.rings.map(({ r, role }) => <path key={`g-${role.id}`} d={arc(FROM, TO, r)} className={styles.guide} />)}
                {/* The rings: one per role, as long as it ran, inked and then coloured. */}
                {wheel && wheel.rings.map(({ role, d, continues, tip, angle }) => {
                  const dim = (filter !== 'all' && role.category !== filter) || (lit !== null && lit !== role.id)
                  return (
                    <g key={role.id} className={styles.ring} data-category={role.category} data-lit={lit === role.id} data-dim={dim}
                      onPointerEnter={() => setHover(role.id)} onPointerLeave={() => setHover(null)} onClick={() => jump(role)}>
                      <path d={d} className={styles.hit} />
                      <path d={d} className={styles.glow} />
                      <path d={d} className={styles.ink} />
                      <path d={d} className={styles.paint} />
                      {continues && (
                        <path className={styles.arrow} transform={`translate(${tip[0]} ${tip[1]}) rotate(${angle})`} d="M0 -5.5 7 0 0 5.5Z" />
                      )}
                    </g>
                  )
                })}
                {/* Now: a hand at the top of the dial. */}
                {wheel && (() => {
                  const [x, y] = polar(TO, 196)
                  return <g className={styles.now} transform={`translate(${x} ${y}) rotate(${TO})`}><path d="M0 0 0 -12" /><circle cy="-15" r="3.4" /></g>
                })()}
                {/* The sun in the middle, with its rays. */}
                <g className={styles.sun}>
                  {Array.from({ length: 16 }, (_, k) => <path key={k} d={`M0 ${-R_SUN - 5}V${-R_SUN - 12}`} transform={`rotate(${k * 22.5})`} />)}
                  <circle r={R_SUN} />
                </g>
              </svg>
              {/* What the sun says: the role you are on, or the span of the whole thing. */}
              <div className={styles.centre} aria-hidden="true">
                {litRole ? (
                  <>
                    <span className="label">{litRole.category}</span>
                    <b>{litRole.label}</b>
                    <span className="label">{litRole.period?.replace(/ · .*/, '').replace(' (expected)', '') ?? 'undated'}</span>
                  </>
                ) : wheel ? (
                  <>
                    <span className="label">since</span>
                    <b>{NAMES[wheel.first % 12]} {Math.floor(wheel.first / 12)}</b>
                    <span className="label">{wheel.months} months</span>
                  </>
                ) : null}
              </div>
            </div>
            <figcaption className={styles.caption}>
              <span className={styles.key}>
                <span data-category="experience"><i />experience</span>
                <span data-category="volunteer"><i />volunteer</span>
                <span data-category="education"><i />education</span>
              </span>
              <span>Fig. 1 — The growing season. One ring for each role, as long as it ran, the months going round clockwise from the first, bottom left, to the hand at now; an arrowhead means it is still going. cumsa.ca isn’t dated, so it lives only in the notes.</span>
            </figcaption>
          </figure>

          <div className={styles.column}>
            <div className={`label tabs ${styles.tabs}`} role="group" aria-label="Filter the notes">
              {roleFilters.map(([key, label]) => (
                <button key={key} type="button" aria-pressed={filter === key} data-category={key} onClick={() => setFilter(key)}>
                  {label}<small>{key === 'all' ? roles.length : roles.filter(role => role.category === key).length}</small>
                </button>
              ))}
            </div>

            <ol ref={list} className={styles.entries}>
              {shown.map((role, index) => (
                <motion.li key={role.id} id={`story-${role.id}`} data-entry={role.id} data-category={role.category} data-lit={lit === role.id}
                  className={styles.entry} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ duration: .5 }} onPointerEnter={() => setHover(role.id)} onPointerLeave={() => setHover(null)}>
                  <div className={styles.margin}>
                    <span className={styles.no}>{String(index + 1).padStart(2, '0')}</span>
                    <span className="stamp" style={{ ['--tilt' as string]: `${index % 2 ? 2.5 : -3}deg` }}>{stamp(role)}</span>
                  </div>
                  <div className={styles.text}>
                    <p className={`label ${styles.kind}`}><i />{role.category}{role.period?.includes('·') && <span> · {role.period.split(' · ')[1]}</span>}{role.period?.includes('expected') && <span> · expected</span>}</p>
                    <h3>{role.title}</h3>
                    <p className={styles.org}>{role.organization}</p>
                    <ul>
                      {role.details.map((item, i) => (
                        <li key={i}>
                          {typeof item === 'string' ? item : <>{item.prefix}<a className="vine" href={item.href}>{item.linkText}</a>{item.suffix}</>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/** The dates as a stamp prints them: the start, and under it where it got to. */
function stamp(role: Role) {
  if (!role.period) return 'undated'
  const [from, to] = role.period.replace(' (expected)', '').replace(/ · .*/, '').split(' — ')
  return to ? <>{from}<br />→ {to}</> : from
}

function YearLabel({ angle, year, start = false }: { angle: number; year: number; start?: boolean }) {
  const [x, y] = polar(angle, 208)
  return <text x={x} y={y} className={styles.year} textAnchor={start ? 'end' : 'middle'} dominantBaseline="central">{year}</text>
}
