'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowUpRight, Check, Copy } from 'lucide-react'
import { email, links } from '../content'
import Plate, { Ground } from './Plate'
import styles from './Shore.module.css'

const elsewhere = [
  { href: links.github, label: 'GitHub' },
  { href: links.linkedin, label: 'LinkedIn' },
  { href: links.resume, label: 'Résumé' },
]

export default function Shore() {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
    <section id="contact" aria-labelledby="contact-title">
      <Plate index={5} scene="shore" after="field" tone="light" numeral="VI" place="the shore" kicker="one more thing to build?" title="Let’s talk" titleId="contact-title" href={links.email} />

      <Ground scene="shore" tone="light" className={styles.ground}>
        <div className={`measure ${styles.body}`}>
          <p className={styles.invite}>
            Have a project in mind or just want to chat? <em>I’d love to hear from you.</em>
          </p>

          <div className={styles.reach}>
            <div className={styles.email}>
              <a href={links.email}>{email}</a>
              <button type="button" onClick={copyEmail} aria-label={copied ? 'Email copied' : 'Copy email'}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <p className={styles.status} role="status">
              {copied ? 'Email copied to clipboard.' : copyError ? 'Could not copy. You can select the address or use the email link.' : ''}
            </p>
            <div className={styles.links}>
              {elsewhere.map(link => (
                <a key={link.label} className="go" href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight size={15} /></a>
              ))}
            </div>
          </div>
        </div>

        <footer className={`measure label ${styles.footer}`}>
          <p>Designed &amp; built by <span>Omar</span></p>
          <p suppressHydrationWarning>© {new Date().getFullYear()} All rights reserved.</p>
          <a href="#home">Back to the ridge <ArrowUp size={12} /></a>
        </footer>
      </Ground>
    </section>
  )
}
