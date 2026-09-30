'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { chapters, links } from '../content'
import styles from './Nav.module.css'

const short: Record<string, string> = { about: 'Story', projects: 'Work', awards: 'Wins', skills: 'Toolkit', contact: 'Contact' }

// How far down the page you are, drawn as how full the moon is.
function Phase({ progress }: { progress: number }) {
  const p = Math.min(.999, Math.max(.02, progress))
  const bulge = (7 * Math.abs(1 - 2 * p)).toFixed(2)
  return (
    <svg className={styles.phase} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeOpacity=".45" />
      <path d={`M8 1A7 7 0 0 1 8 15A${bulge} 7 0 0 ${p < .5 ? 0 : 1} 8 1`} fill="currentColor" />
    </svg>
  )
}

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
        <a href="#home" className={styles.name} aria-label="Omar Ibrahim, back to the top" onClick={() => setOpen(false)}>
          <Phase progress={progress} />
          <span>Omar Ibrahim</span>
        </a>
        <nav className={styles.links} aria-label="Chapters">
          {chapters.slice(1).map(chapter => (
            <a key={chapter.id} href={`#${chapter.id}`} className="label" aria-current={active === chapter.id ? 'location' : undefined}>
              <i aria-hidden="true">{chapter.numeral}</i>{short[chapter.id]}
            </a>
          ))}
          <a className="label" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={11} /></a>
        </nav>
        <button ref={toggle} type="button" className={`label ${styles.toggle}`} aria-expanded={open} aria-controls="index" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Index'}
        </button>
      </header>

      <div id="index" ref={panel} className={styles.index} data-open={open} hidden={!open}>
        <nav aria-label="Index">
          {chapters.map(chapter => (
            <a key={chapter.id} href={`#${chapter.id}`} aria-current={active === chapter.id ? 'location' : undefined} onClick={() => setOpen(false)}>
              <span className="label">{chapter.numeral} · {chapter.place}</span>
              {chapter.label}
            </a>
          ))}
        </nav>
        <p className={`label ${styles.elsewhere}`}>
          <a href={links.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={links.resume} target="_blank" rel="noopener noreferrer">Résumé</a>
          <a href={links.email}>Email</a>
        </p>
      </div>
    </>
  )
}
