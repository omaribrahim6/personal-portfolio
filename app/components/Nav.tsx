'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { chapters, links } from '../content'
import SunDial from './SunDial'
import styles from './Nav.module.css'

const short: Record<string, string> = { about: 'Story', projects: 'Work', awards: 'Wins', skills: 'Toolkit', interests: 'Off hours', contact: 'Contact' }

export default function Nav({ active, tone, progress }: { active: string; tone: 'dark' | 'light'; progress: number }) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  // Step aside while reading down the page, come back on the way up.
  useEffect(() => {
    let last = window.scrollY
    function onScroll() {
      const y = window.scrollY
      if (Math.abs(y - last) < 6) return
      setHidden(y > last && y > window.innerHeight * .6)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <header className={styles.bar} data-tone={open ? 'dark' : tone} data-hidden={hidden && !open}>
        {/* The name on a lacquered plaque in a brass frame. The sun on it crosses the sky as you read down the page. */}
        <a href="#home" className={styles.plaque} aria-label="Omar Ibrahim, back to the top" onClick={() => setOpen(false)}>
          <SunDial at={progress} className={styles.dial} />
          <span className={styles.name}>Omar Ibrahim</span>
        </a>
        <nav className={styles.links} aria-label="Chapters">
          {chapters.slice(1).map(chapter => (
            <a key={chapter.id} href={`#${chapter.id}`} className="label" aria-current={active === chapter.id ? 'location' : undefined}>
              <i aria-hidden="true">{chapter.hour}</i>{short[chapter.id]}
            </a>
          ))}
          <a className={`label ${styles.resume}`} href={links.resume} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={12} /></a>
        </nav>
        <button ref={toggle} type="button" className={`label ${styles.toggle}`} aria-expanded={open} aria-controls="index" onClick={() => setOpen(!open)}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.sun} data-open={open}>
            <circle cx="10" cy="10" r="3.6" />
            {Array.from({ length: 8 }, (_, k) => <path key={k} d="M10 1.6v2.6" transform={`rotate(${k * 45} 10 10)`} />)}
          </svg>
          {open ? 'Close' : 'Index'}
        </button>
      </header>

      {/* The index on small screens: the day as a timetable, one stop for each chapter. */}
      <div id="index" ref={panel} className={styles.index} data-open={open} hidden={!open}>
        <p className={`label ${styles.heading}`}>Today’s route · sunrise to sunset</p>
        <nav aria-label="Index">
          {chapters.map(chapter => (
            <a key={chapter.id} href={`#${chapter.id}`} aria-current={active === chapter.id ? 'location' : undefined} onClick={() => setOpen(false)}>
              <span className={`label ${styles.hour}`}>{chapter.hour}</span>
              <i aria-hidden="true" />
              <span className={styles.stop}>
                <span className="label">{chapter.numeral} · {chapter.place}</span>
                {chapter.label}
              </span>
            </a>
          ))}
        </nav>
        <p className={styles.elsewhere}>
          <a className="go" href={links.github} target="_blank" rel="noopener noreferrer">GitHub<ArrowUpRight size={14} /></a>
          <a className="go" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<ArrowUpRight size={14} /></a>
          <a className="go" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé<ArrowUpRight size={14} /></a>
          <a className="go" href={links.email}>Email<ArrowUpRight size={14} /></a>
        </p>
      </div>
    </>
  )
}
