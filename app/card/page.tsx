import type { Metadata } from 'next'
import { ArrowUpRight, FileText, Globe } from 'lucide-react'
import Painting from '../components/Painting'
import { links } from '../content'
import styles from './card.module.css'

// Where the NFC card at events lands: the ridge from the first plate, and three ways in.
// This season's events are security ones, so the résumé here is the cyber one; the main site keeps the software one.
const RESUME = '/resumes/cyber/resume.pdf'

export const metadata: Metadata = {
  title: 'Omar Ibrahim — Developer & Security Auditor',
  description: 'Website, LinkedIn and résumé, one tap each.',
  alternates: { canonical: '/card' },
  robots: { index: false },
}

function LinkedIn() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

const options = [
  { href: '/', label: 'My website', note: 'projects, wins & my story', icon: <Globe size={22} />, external: false },
  { href: links.linkedin, label: 'LinkedIn', note: 'connect with me', icon: <LinkedIn />, external: true },
  { href: RESUME, label: 'Résumé', note: 'security-focused, one page', icon: <FileText size={22} />, external: true },
]

export default function Card() {
  return (
    <main className={styles.card}>
      <div className={styles.sky} aria-hidden="true"><i className={styles.moon} /></div>

      <div className={styles.copy}>
        <p className={styles.hello}>hi, my name is</p>
        <h1 aria-label="Omar Ibrahim">
          <span aria-hidden="true"><span>Omar</span></span>
          <span aria-hidden="true"><span>Ibrahim</span></span>
        </h1>
        <p className={styles.lede}>A <strong>developer</strong> and <strong>security auditor</strong>.</p>

        <nav className={styles.options} aria-label="Where to next">
          {options.map(option => (
            <a key={option.label} className={styles.option} href={option.href}
              {...(option.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              <span className={styles.icon}>{option.icon}</span>
              <span className={styles.text}>
                <b>{option.label}</b>
                <small>{option.note}</small>
              </span>
              <ArrowUpRight className={styles.arrow} size={20} aria-hidden="true" />
            </a>
          ))}
        </nav>
      </div>

      <div className={styles.land} aria-hidden="true">
        <Painting scene="ridge" className={styles.painting} />
      </div>
      <p className={`label ${styles.caption}`}><span>Software Engineering</span><span>Carleton University</span></p>
    </main>
  )
}
