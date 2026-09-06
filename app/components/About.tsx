'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import styles from './About.module.css'

type Category = 'experience' | 'volunteer' | 'education'
type Detail = string | { prefix?: string; linkText: string; href: string; suffix?: string }
type Role = {
  id: string
  category: Category
  title: string
  organization: string
  label: string
  period?: string
  start?: string
  end?: string
  details: Detail[]
}

const roles: Role[] = [
  {
    id: 'carleton', category: 'education', title: 'B.Eng. in Software Engineering', organization: 'Carleton University', label: 'Carleton',
    period: 'Sep 2024 — Apr 2028 (expected)', start: '2024-09', end: '2028-04',
    details: ['Relevant coursework: Data Structures, Digital Systems, Computer Architecture, Software Engineering'],
  },
  {
    id: 'journale', category: 'experience', title: 'Software Developer & Security Analyst', organization: 'Journale AI', label: 'Journale AI',
    period: 'Oct 2025 — Jan 2026 · Contract', start: '2025-10', end: '2026-01',
    details: [
      'Built a cloud AI dialogue system that plugs into game engines through custom SDKs',
      'Diagnosed backend and REST APIs to discover 6 critical flaws using Burp Suite, Postman, and cURL',
      'Fixed a Stripe integration flaw that bypassed payment and granted subscriptions, in under 5 hours',
      'Validated risks with the engineering team and recommended remediation under responsible disclosure',
    ],
  },
  {
    id: 'uomsa', category: 'experience', title: 'Software Developer Student', organization: 'uOttawa MSA', label: 'uOttawa MSA',
    period: 'Dec 2025 — Apr 2026', start: '2025-12', end: '2026-04',
    details: [
      'Built uomsa.ca in Next.js, eliminating the GoDaddy builder and cutting annual costs by $500',
      'Worked on an 8-developer Agile team building a library system supporting 1,000+ students across 5 organizations',
      'Built React components and shipped PostgreSQL migrations for the admin dashboard',
    ],
  },
  {
    id: 'ieee', category: 'experience', title: 'Technical Workshop Lead', organization: 'IEEE uOttawa Student Branch', label: 'IEEE uOttawa',
    period: 'Mar 2026', start: '2026-03', end: '2026-03',
    details: [
      'Delivered 4 technical workshops to 100+ students across a two-week series',
      'Taught Linux fundamentals, Docker, GitHub Actions CI/CD, AI/ML, and cybersecurity',
      'Built a lab environment of isolated per-student Docker containers with custom challenges',
    ],
  },
  {
    id: 'cuhacking', category: 'experience', title: 'Penetration Tester', organization: 'cuHacking', label: 'cuHacking',
    period: 'Mar 2026 — Apr 2026', start: '2026-03', end: '2026-04',
    details: ["Security testing across Canada's largest student-run hackathon platform (on-call)"],
  },
  {
    id: 'bearhacks', category: 'experience', title: 'Penetration Tester', organization: 'BearHacks', label: 'BearHacks',
    period: 'Apr 2026', start: '2026-04', end: '2026-04',
    details: ['Security testing for the event platform ahead of launch (remote, on-call)'],
  },
  {
    id: 'freelance', category: 'experience', title: 'Freelance Developer', organization: 'Independent', label: 'Freelance',
    period: 'Sep 2025 — Present', start: '2025-09', end: 'present',
    details: [
      'Design, deploy, and maintain containerized production websites for clients in Next.js, owning full-stack development, SEO, and infrastructure',
      'Manage Linux VPS environments including domains, SSL, firewall hardening, backups, and uptime monitoring',
      'Hosting 5+ sites and APIs over HTTPS, handling ~8,000 unique visitors and 300k requests monthly',
      { prefix: '(', linkText: 'contact', href: '#contact', suffix: ' me for a website)' },
    ],
  },
  {
    id: 'eof-lead', category: 'volunteer', title: 'Co-Founder & Co-President', organization: 'Empower Orphans Foundation', label: 'EOF · lead',
    period: 'Mar 2025 — Apr 2026', start: '2025-03', end: '2026-04',
    details: [
      'Lead a 20+ member team across marketing, events, and sponsorship divisions',
      'Organized fundraisers and collaborations with Islamic Relief for orphan care',
      'Oversee partnerships, finance tracking, and organizational strategy across Carleton and uOttawa',
    ],
  },
  {
    id: 'eof-web', category: 'volunteer', title: 'Web Developer', organization: 'Empower Orphans Foundation', label: 'EOF · web',
    period: 'Sep 2025 — Apr 2026', start: '2025-09', end: '2026-04',
    details: [
      'Built empowerorphans.com with Next.js, Supabase, and Tailwind CSS',
      'Shipped a secure admin dashboard and event-management system for real-time updates',
      'Deployed for cross-campus use across the Carleton and uOttawa chapters',
    ],
  },
  {
    id: 'redshifted', category: 'volunteer', title: 'Mentor & Judge', organization: 'Redshifted Catalyst Hackathon', label: 'Redshifted',
    period: 'Mar 2026', start: '2026-03', end: '2026-03',
    details: [
      'Mentored high school teams designing hardware for a space-survival challenge, taking them from idea to prototype to pitch in a few hours',
      'Mentored teams in C++ as they built everything from alien proximity detectors to remote-controlled rovers',
      'Sat on the judging panel for the advanced teams, evaluating their projects and final pitches',
      'Supported by Thales, CIRA, the uOttawa Faculty of Engineering, and ElevenLabs',
    ],
  },
  {
    id: 'cumsa', category: 'volunteer', title: 'Web Security', organization: 'CUMSA', label: 'CUMSA',
    details: ['Security audit, fixes, and authentication logic for cumsa.ca'],
  },
]

const filters: [Category | 'all', string][] = [['all', 'everything'], ['experience', 'experience'], ['volunteer', 'volunteer'], ['education', 'education']]
const MONTH_LETTERS = 'JFMAMJJASOND'
const monthIndex = (ym: string) => { const [year, month] = ym.split('-').map(Number); return year * 12 + month - 1 }

export default function About() {
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [active, setActive] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const pendingJump = useRef<string | null>(null)

  // Everything on the ledger is derived from the dates above: one block per month, from the first start to this month.
  const ledger = useMemo(() => {
    const today = new Date()
    const nowIndex = today.getFullYear() * 12 + today.getMonth()
    const dated = roles.filter(role => role.start && role.end)
    const first = Math.min(...dated.map(role => monthIndex(role.start!)))
    const cols = nowIndex - first + 1
    const endOf = (role: Role) => role.end === 'present' ? nowIndex : monthIndex(role.end!)
    const rows = dated
      .map(role => ({ role, from: monthIndex(role.start!) - first, to: Math.min(endOf(role), nowIndex) - first, continues: endOf(role) > nowIndex }))
      .sort((a, b) => a.from - b.from || a.to - b.to)
    const years = Array.from({ length: cols }, (_, col) => first + col).flatMap((index, col) => col === 0 || index % 12 === 0 ? [{ col, year: Math.floor(index / 12) }] : [])
    const entries = [...roles].sort((a, b) => {
      const endA = a.end ? endOf(a) : -Infinity
      const endB = b.end ? endOf(b) : -Infinity
      return endB - endA || monthIndex(a.start ?? '9999-01') - monthIndex(b.start ?? '9999-01')
    })
    return { first, cols, rows, years, entries }
  }, [])

  const shown = ledger.entries.filter(role => filter === 'all' || role.category === filter)
  const highlighted = hover ?? active

  // The ledger follows whichever entry is at the reading line, the same way the chapter rail follows the page.
  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      const line = window.innerHeight * .4
      const items = list.current?.querySelectorAll<HTMLElement>('[data-entry]') ?? []
      let current: string | null = null
      for (const item of items) if (item.getBoundingClientRect().top <= line) current = item.dataset.entry ?? null
      setActive(current ?? items[0]?.dataset.entry ?? null)
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [filter])

  useEffect(() => {
    if (!pendingJump.current) return
    const id = pendingJump.current
    pendingJump.current = null
    document.getElementById(`story-${id}`)?.scrollIntoView({ block: 'center' })
  }, [filter])

  // Receipts in the skills section link straight to entries. If a filter is hiding the target, drop the filter first.
  useEffect(() => {
    function reveal() {
      const id = window.location.hash.replace('#story-', '')
      const role = window.location.hash.startsWith('#story-') ? roles.find(role => role.id === id) : undefined
      if (role && filter !== 'all' && role.category !== filter) {
        pendingJump.current = id
        setFilter('all')
      }
    }
    window.addEventListener('hashchange', reveal)
    return () => window.removeEventListener('hashchange', reveal)
  }, [filter])

  function jump(role: Role) {
    if (filter !== 'all' && role.category !== filter) {
      pendingJump.current = role.id
      setFilter('all')
      return
    }
    document.getElementById(`story-${role.id}`)?.scrollIntoView({ block: 'center' })
  }

  return (
    <section id="about" className={styles.section} aria-labelledby="about-title">
      <div className={styles.container}>
        <div className={styles.heading}>
          <div><p className={styles.kicker}>where the time went</p><h2 id="about-title"><span>{'//'}</span> the story so far</h2></div>
          <p>school, work, and the things I volunteer for<br /><span>The ledger follows the list. Click a row to jump to it.</span></p>
        </div>

        <div className={styles.filters} role="group" aria-label="Filter the story">
          {filters.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label}<small>{key === 'all' ? roles.length : roles.filter(role => role.category === key).length}</small>
            </button>
          ))}
        </div>

        <div className={styles.body}>
          <div className={styles.ledger} style={{ '--cols': ledger.cols } as CSSProperties}>
            <div className={styles.ledgerHead}><span>the ledger · one block per month</span></div>
            <div className={styles.axis} aria-hidden="true">
              <span />
              <div className={`${styles.grid} ${styles.years}`}>{ledger.years.map(({ col, year }) => <span key={year} style={{ gridColumn: col + 1 }}>{year}</span>)}</div>
              <span />
              <div className={`${styles.grid} ${styles.months}`}>{Array.from({ length: ledger.cols }, (_, col) => <span key={col}>{MONTH_LETTERS[(ledger.first + col) % 12]}</span>)}</div>
            </div>
            <ul className={styles.rows}>
              {ledger.rows.map(({ role, from, to, continues }) => (
                <li key={role.id}>
                  <button type="button" className={styles.row} data-category={role.category}
                    data-active={highlighted === role.id} data-dim={filter !== 'all' && role.category !== filter}
                    aria-label={`${role.title} at ${role.organization}, ${role.period}. Jump to this entry.`}
                    onClick={() => jump(role)} onPointerEnter={() => setHover(role.id)} onPointerLeave={() => setHover(null)}>
                    <span className={styles.rowLabel}>{role.label}</span>
                    <span className={styles.grid}>
                      {Array.from({ length: ledger.cols }, (_, col) => <i key={col} data-on={from <= col && col <= to ? 'true' : undefined} />)}
                      <span className={styles.more}>{continues ? '→' : ''}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.ledgerFoot}>
              <div className={styles.legend}>
                <span><i style={{ background: '#e4c748' }} />experience</span>
                <span><i style={{ background: '#c7ad63' }} />volunteer</span>
                <span><i style={{ background: '#9c9d70' }} />education</span>
              </div>
              <span>→ still going · cumsa.ca isn’t dated, so it lives below</span>
            </div>
          </div>

          <div className={styles.entries} ref={list}>
            {shown.map(role => (
              <motion.article key={role.id} id={`story-${role.id}`} data-entry={role.id} data-active={highlighted === role.id}
                className={styles.entry} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }} transition={{ duration: .45 }}
                onPointerEnter={() => setHover(role.id)} onPointerLeave={() => setHover(null)}>
                <div className={styles.entryMeta}><span>{role.category}</span><span>{role.period ?? 'undated'}</span></div>
                <h3>{role.title}</h3>
                <p className={styles.org}>@{role.organization}</p>
                <ul>
                  {role.details.map((item, index) => (
                    <li key={index}>
                      {typeof item === 'string' ? item : <>{item.prefix}<a href={item.href}>{item.linkText}</a>{item.suffix}</>}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
