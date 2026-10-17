'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { chapters, links, pages } from '../content'
import Monogram from './Monogram'
import styles from './Folio.module.css'

/** A number on wheels, like a counter: each digit rolls to its new value. */
export function Odometer({ value, digits = 2 }: { value: number; digits?: number }) {
  const text = String(value).padStart(digits, '0')
  return (
    <span className={styles.odometer} aria-hidden="true">
      {[...text].map((digit, index) => (
        <span key={index} className={styles.wheel}>
          <span style={{ transform: `translateY(${-Number(digit) * 10}%)` }}>
            {'0123456789'.split('').map(n => <i key={n}>{n}</i>)}
          </span>
        </span>
      ))}
    </span>
  )
}

/**
 * The running header, as printed across the top of every page of a magazine: the title of the issue, the
 * section you are in, and the page number, which counts on as you read. It stays out of the way on the
 * cover, which has a masthead of its own. On small screens the sections fold into a contents sheet.
 */
export default function Folio({ active, page, onCover }: { active: string; page: number; onCover: boolean }) {
  const [open, setOpen] = useState(false)
  const sheet = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const current = chapters.find(chapter => chapter.id === active) ?? chapters[0]

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sheet.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const ask = () => window.dispatchEvent(new Event('ask-omar'))

  return (
    <>
      <header className={styles.bar} data-away={onCover && !open}>
        <a href="#home" className={styles.title} aria-label="The Omar Ibrahim Almanac, back to the cover" onClick={() => setOpen(false)}>
          <Monogram className={styles.mark} />
          <span className="label"><b>The Omar Ibrahim Almanac</b><span>Issue Nº 01</span></span>
        </a>

        <nav className={styles.sections} aria-label="Sections">
          {chapters.slice(1).map(chapter => (
            <a key={chapter.id} href={`#${chapter.id}`} aria-current={active === chapter.id ? 'location' : undefined}>
              <i className="label">{chapter.numeral}</i>{chapter.section}
            </a>
          ))}
        </nav>

        <p className={`label ${styles.here}`} aria-hidden="true"><i>§ {current.numeral}</i>{current.section}</p>

        <div className={styles.end}>
          <p className={styles.folio} aria-label={`Page ${page} of ${pages}`}>
            <span className="label">p.</span><Odometer value={page} /><span className="label">/ {pages}</span>
          </p>
          <a className={`btn ${styles.wide}`} data-size="small" data-tone="paper" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé<ArrowUpRight size={12} /></a>
          <button type="button" className={`btn ${styles.wide}`} data-size="small" data-tone="ink" onClick={ask}>Ask Omar<ArrowUpRight size={12} /></button>
          <button ref={toggle} type="button" className={`label ${styles.toggle}`} aria-expanded={open} aria-controls="contents-sheet" onClick={() => setOpen(!open)}>
            {open ? <X size={14} /> : <span className={styles.lines} aria-hidden="true"><i /><i /><i /></span>}
            {open ? 'Close' : 'Contents'}
          </button>
        </div>
      </header>

      {/* The contents, on a sheet of its own, for screens too small to list the sections across the top. */}
      <div id="contents-sheet" ref={sheet} className={styles.sheet} data-open={open} hidden={!open}>
        <p className={`label ${styles.sheetHead}`}><span>In this issue</span><span>{pages} pages</span></p>
        <nav aria-label="Contents">
          {chapters.map(chapter => (
            <a key={chapter.id} href={`#${chapter.id}`} aria-current={active === chapter.id ? 'location' : undefined} onClick={() => setOpen(false)}>
              <span className={styles.page}>{String(chapter.page).padStart(2, '0')}</span>
              <span className={styles.entry}>
                <span className="label">{chapter.numeral} · {chapter.section}</span>
                {chapter.label}
              </span>
            </a>
          ))}
        </nav>
        <p className={styles.elsewhere}>
          <a className="btn" data-tone="paper" data-size="small" href={links.github} target="_blank" rel="noopener noreferrer">GitHub<ArrowUpRight size={12} /></a>
          <a className="btn" data-tone="paper" data-size="small" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<ArrowUpRight size={12} /></a>
          <a className="btn" data-tone="paper" data-size="small" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé<ArrowUpRight size={12} /></a>
          <button type="button" className="btn" data-tone="ink" data-size="small" onClick={() => { setOpen(false); ask() }}>Ask Omar<ArrowUpRight size={12} /></button>
        </p>
      </div>
    </>
  )
}
