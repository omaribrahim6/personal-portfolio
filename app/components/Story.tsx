'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { roleFilters, roles, type Category, type Role } from '../content'
import Plate, { Ground } from './Plate'
import Rail from './Rail'
import { rng } from './paint/core'
import styles from './Story.module.css'

const MONTH_LETTERS = 'JFMAMJJASOND'
const monthIndex = (ym: string) => { const [year, month] = ym.split('-').map(Number); return year * 12 + month - 1 }

// "This month" only exists in the browser. The server renders the chapter without the range, and it fills in on arrival.
// Most recent first. Whatever is still going leads; the one entry without dates goes last.
const FAR = 1e6
const endOf = (role: Role) => !role.end ? -FAR : role.end === 'present' ? FAR : monthIndex(role.end)
const entries = [...roles].sort((a, b) => endOf(b) - endOf(a) || monthIndex(a.start ?? '9999-01') - monthIndex(b.start ?? '9999-01'))

const never = () => () => {}
const thisMonth = () => { const today = new Date(); return today.getFullYear() * 12 + today.getMonth() }
const unknown = () => null

// The plot's own coordinates. It stretches to whatever box it is given.
const VW = 600, GAP = 30, RISE = 50, TOP = 56

/** A smooth line through the given points. */
function through(points: [number, number][]) {
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 5, p1[1] + (p2[1] - p0[1]) / 5]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 5, p2[1] - (p3[1] - p1[1]) / 5]
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

export default function Story() {
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [active, setActive] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const pendingJump = useRef<string | null>(null)
  const now = useSyncExternalStore(never, thisMonth, unknown)

  // Every ridge is derived from the dates: a dune as wide as the months it covers, the oldest furthest away.
  const range = useMemo(() => {
    if (now === null) return null
    const dated = roles.filter(role => role.start && role.end)
    const first = Math.min(...dated.map(role => monthIndex(role.start!)))
    const cols = now - first + 1
    const cw = VW / cols
    const rows = dated
      .map(role => ({ role, from: monthIndex(role.start!) - first, to: Math.min(endOf(role), now) - first, continues: endOf(role) > now }))
      .sort((a, b) => a.from - b.from || a.to - b.to)
      .map((row, index) => {
        const rand = rng(index * 97 + 5)
        const base = TOP + (index + 1) * GAP
        const x0 = row.from * cw, x1 = (row.to + 1) * cw
        // A long windward slope on the left, a short slip face on the right.
        const points: [number, number][] = [[x0 - cw * 2.6, base], [x0 - cw * .9, base - RISE * .12]]
        for (let col = row.from; col <= row.to; col++) points.push([(col + .55) * cw, base - RISE * (.74 + rand() * .26)])
        if (row.continues) points.push([VW + cw, base - RISE * .8])
        else points.push([x1 + cw * .5, base - RISE * .16], [x1 + cw * 1.5, base])
        return { ...row, base, crest: through(points), end: row.continues ? VW + cw : x1 + cw * 1.5, start: x0 - cw * 2.6 }
      })
    const years = Array.from({ length: cols }, (_, col) => first + col).flatMap((index, col) => col === 0 || index % 12 === 0 ? [{ col, year: Math.floor(index / 12) }] : [])
    return { first, cols, rows, years, height: TOP + (rows.length + 1) * GAP }
  }, [now])

  const shown = entries.filter(role => filter === 'all' || role.category === filter)
  const lit = hover ?? active

  // The range follows whichever card the rail is showing.
  const follow = useCallback((index: number) => setActive(shown[index]?.id ?? null), [shown])

  function reveal(id: string) {
    document.getElementById(`story-${id}`)?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }

  useEffect(() => {
    if (!pendingJump.current) return
    const id = pendingJump.current
    pendingJump.current = null
    reveal(id)
  }, [filter])

  // Receipts in the toolkit link straight to entries. If a filter is hiding the target, drop the filter first.
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
    <section id="about" aria-labelledby="about-title">
      <Plate index={1} scene="dunes" after="ridge" tone="dark" numeral="II" place="the dunes" kicker="where the time went" title="The story so far" titleId="about-title">
        School, work, and the things I volunteer for.
      </Plate>

      <Ground scene="dunes" className={styles.ground}>
        <div className="measure">
          <div className={`label filters ${styles.filters}`} role="group" aria-label="Filter the story">
            {roleFilters.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {label}<small>{key === 'all' ? roles.length : roles.filter(role => role.category === key).length}</small>
              </button>
            ))}
          </div>

          <div className={styles.body}>
            <div className={styles.range}>
              <p className={`label ${styles.rangeHead}`}>the range · one dune per role, as wide as the months it lasted</p>
              <div className={styles.plot} style={{ aspectRatio: range ? `${VW} / ${range.height}` : `${VW} / 380` }}>
                {range && (
                  <>
                    <svg viewBox={`0 0 ${VW} ${range.height}`} preserveAspectRatio="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="dune-rest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#6a4486" stopOpacity=".5" /><stop offset=".7" stopColor="#3a2452" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="dune-lit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#f6866a" /><stop offset=".28" stopColor="#c8485a" stopOpacity=".92" /><stop offset=".75" stopColor="#4a2350" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {range.rows.map(({ role, base, crest, start, end }) => (
                        <g key={role.id} className={styles.dune} data-category={role.category} data-active={lit === role.id}
                          data-dim={filter !== 'all' && role.category !== filter}>
                          <path className={styles.fill} d={`${crest}L${end.toFixed(1)} ${base + RISE}L${start.toFixed(1)} ${base + RISE}Z`} />
                          <path className={styles.glow} d={`${crest}L${end.toFixed(1)} ${base + RISE}L${start.toFixed(1)} ${base + RISE}Z`} />
                          <path className={styles.crest} d={crest} />
                          <path className={styles.floor} d={`M0 ${base}H${VW}`} />
                        </g>
                      ))}
                    </svg>
                    <ul className={styles.rows}>
                      {range.rows.map(({ role, base, continues }) => (
                        <li key={role.id} style={{ top: `${(base - GAP) / range.height * 100}%`, height: `${GAP / range.height * 100}%` }}>
                          <button type="button" data-active={lit === role.id} data-dim={filter !== 'all' && role.category !== filter}
                            aria-label={`${role.title} at ${role.organization}, ${role.period}. Jump to this entry.`}
                            onClick={() => jump(role)} onPointerEnter={() => setHover(role.id)} onPointerLeave={() => setHover(null)}
                            onFocus={() => setHover(role.id)} onBlur={() => setHover(null)}>
                            <span>{role.label}</span>{continues && <i aria-hidden="true">→</i>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              {range && (
                <div className={styles.axis} aria-hidden="true" style={{ gridTemplateColumns: `repeat(${range.cols}, 1fr)` }}>
                  {range.years.map(({ col, year }) => <b key={year} style={{ gridColumn: col + 1 }}>{year}</b>)}
                  {Array.from({ length: range.cols }, (_, col) => <span key={col} style={{ gridColumn: col + 1 }}>{MONTH_LETTERS[(range.first + col) % 12]}</span>)}
                </div>
              )}
              <div className={styles.legend}>
                <span data-category="experience"><i />experience</span>
                <span data-category="volunteer"><i />volunteer</span>
                <span data-category="education"><i />education</span>
              </div>
              <p className={styles.foot}>→ still going · cumsa.ca isn’t dated, so it lives in the list · the range follows the cards, and a dune will take you to its entry</p>
            </div>

            <Rail label="The story so far, one card per role" reset={filter} onActive={follow}>
              {shown.map(role => (
                <motion.li key={role.id} id={`story-${role.id}`} data-entry={role.id} data-active={lit === role.id} data-category={role.category}
                  className={styles.entry} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: .5 }}
                  onPointerEnter={() => setHover(role.id)} onPointerLeave={() => setHover(null)}>
                  <p className={`label ${styles.meta}`}><span>{role.category}</span><span>{role.period ?? 'undated'}</span></p>
                  <h3>{role.title}</h3>
                  <p className={styles.org}>@{role.organization}</p>
                  <ul>
                    {role.details.map((item, index) => (
                      <li key={index}>
                        {typeof item === 'string' ? item : <>{item.prefix}<a href={item.href}>{item.linkText}</a>{item.suffix}</>}
                      </li>
                    ))}
                  </ul>
                </motion.li>
              ))}
            </Rail>
          </div>
        </div>
      </Ground>
    </section>
  )
}
