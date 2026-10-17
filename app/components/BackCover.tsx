'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowUpRight, Check, Copy, Scissors } from 'lucide-react'
import { chapters, email, links } from '../content'
import Sign from './Sign'
import Diorama from './toon/Diorama'
import styles from './BackCover.module.css'

const TOPICS = ['an internship', 'a project', 'a website', 'just saying hello'] as const

const elsewhere = [
  { href: links.github, label: 'GitHub' },
  { href: links.linkedin, label: 'LinkedIn' },
  { href: links.resume, label: 'Résumé' },
]

// The back cover: the same island as on the front, at the end of the day, and a coupon to clip and send.
// Ticking the boxes writes the subject line of the email it opens.
export default function BackCover() {
  const [topics, setTopics] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { numeral, section, page } = chapters.find(chapter => chapter.id === 'contact')!

  useEffect(() => () => { if (copyTimeout.current) clearTimeout(copyTimeout.current) }, [])

  const copyEmail = async () => {
    if (copyTimeout.current) clearTimeout(copyTimeout.current)
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setCopyError(false)
      copyTimeout.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }

  const toggle = (topic: string) => setTopics(list => list.includes(topic) ? list.filter(each => each !== topic) : [...list, topic])
  const about = TOPICS.filter(topic => topics.includes(topic))
  const subject = about.length ? `Hello from your site: about ${about.join(' & ')}` : 'Hello from your site'
  const mailto = `${links.email}?subject=${encodeURIComponent(subject)}`

  return (
    <section id="contact" className={styles.back} aria-labelledby="contact-title" data-shore>
      <Diorama scene="evening" className={styles.art} />

      <div className={styles.sheet}>
        <p className={`label ${styles.folio}`}><span><b>§ {numeral}</b> {section}</span><i /><span>p. {page}</span></p>

        <div className={styles.grid}>
          <div className={styles.words}>
            <p className={styles.kicker}>one more thing to build?</p>
            <h2 id="contact-title" className={styles.title}><a href={mailto}><Sign text="Let’s talk" /></a></h2>
            <p className={styles.invite}>Have a project in mind or just want to chat? <em>I’d love to hear from you.</em></p>
            <div className={styles.links}>
              {elsewhere.map(link => (
                <a key={link.label} className="btn" data-tone="paper" href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight size={14} /></a>
              ))}
            </div>
          </div>

          {/* The coupon: dashed all round, with the scissors on the line. */}
          <div className={styles.coupon} role="group" aria-label="Reply coupon">
            <Scissors className={styles.scissors} size={18} aria-hidden="true" />
            <p className={`label ${styles.couponHead}`}><span>Reply coupon</span><span>No stamp needed</span></p>
            <fieldset>
              <legend>Yes! I’d like to talk to Omar about:</legend>
              <div className={styles.boxes}>
                {TOPICS.map(topic => (
                  <label key={topic} className={styles.box}>
                    <input type="checkbox" checked={topics.includes(topic)} onChange={() => toggle(topic)} />
                    <span aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                    {topic}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className={styles.address}>
              <span className="label">Write to</span>
              <a href={mailto}>{email}</a>
              <button type="button" onClick={copyEmail} aria-label={copied ? 'Email copied' : 'Copy email'} title="Copy the address">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className={styles.status} role="status">
              {copied ? 'Copied to your clipboard.' : copyError ? 'Could not copy. You can select the address, or use the button.' : ''}
            </p>
            <a className="btn" data-tone="coral" href={mailto}>Send it by email<ArrowUpRight size={14} /></a>
            <p className={`label ${styles.subject}`}>Subject: {subject}</p>
          </div>
        </div>

        {/* Where the small Omar stands when you get here. */}
        <span className={styles.stand} data-stand />

        <footer className={`label ${styles.colophon}`}>
          <p>Designed &amp; built by <b>Omar</b>. Set in Heliotrope, a stencil face drawn in code for this issue, with Instrument Sans &amp; Serif, Unbounded and Martian Mono. Every illustration is a small 3D scene, inked live in your browser.</p>
          <p suppressHydrationWarning>© {new Date().getFullYear()} · All rights reserved</p>
          <a href="#home">Back to the cover <ArrowUp size={12} /></a>
        </footer>
      </div>
    </section>
  )
}
