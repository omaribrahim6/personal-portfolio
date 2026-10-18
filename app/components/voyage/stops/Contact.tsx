'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowUpRight, Check, Copy, Send } from 'lucide-react'
import { email, links } from '../../../content'
import Sign from '../../Sign'
import { Beat, Stop, StopHead } from '../Voyage'
import { useWorld } from '../World'
import styles from './stops.module.css'

// The pier: where to find Omar, then a letter to write (ticking the boxes writes its subject line), which
// the mail drone carries off into the sunset when it's sent, and last the colophon, at the end of the line.

const TOPICS = ['an internship', 'a project', 'a website', 'just saying hello'] as const

export default function Contact() {
  const world = useWorld()
  const [topics, setTopics] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [sent, setSent] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  useEffect(() => { world.tell('contact', 'send', String(sent)) }, [world, sent])

  const copy = async () => {
    if (timer.current) clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setCopyError(false)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }

  const about = TOPICS.filter(topic => topics.includes(topic))
  const subject = about.length ? `Hello from your site: about ${about.join(' & ')}` : 'Hello from your site'
  const mailto = `${links.email}?subject=${encodeURIComponent(subject)}`

  return (
    <Stop id="contact">
      <Beat>
        <StopHead id="contact" title="The pier">
          The end of the line, and the best seat for the sunset. Have a project in mind or just want to chat? I’d love to hear from you.
        </StopHead>
        <div className={styles.address}>
          <a href={mailto}>{email}</a>
          <button type="button" onClick={copy} aria-label={copied ? 'Email copied' : 'Copy email'} title="Copy the address">
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        <p className={`label ${styles.copied}`} aria-live="polite">{copied ? 'Copied to your clipboard.' : copyError ? 'Could not copy. You can select the address instead.' : ''}</p>
        <div className={styles.links}>
          <a className="btn" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé<ArrowUpRight size={14} /></a>
          <a className="btn" data-tone="paper" href={links.github} target="_blank" rel="noopener noreferrer">GitHub<ArrowUpRight size={14} /></a>
          <a className="btn" data-tone="paper" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<ArrowUpRight size={14} /></a>
        </div>
      </Beat>

      <Beat side="right">
        {/* A postcard: the message side on the left, the address and the stamp on the right. */}
        <div className={styles.postcard}>
          <div className={styles.message}>
            <p className={`label ${styles.kicker}`}>Write me a letter</p>
            <h3 id="contact-letter" className={styles.letterTitle}><Sign text="Let’s talk" /></h3>
            <fieldset className={styles.topics}>
              <legend className="label">It’s about</legend>
              {TOPICS.map(topic => (
                <label key={topic}>
                  <input type="checkbox" checked={topics.includes(topic)} onChange={() => setTopics(list => list.includes(topic) ? list.filter(each => each !== topic) : [...list, topic])} />
                  <span>{topic}</span>
                </label>
              ))}
            </fieldset>
          </div>
          <div className={styles.addressee}>
            <span className={styles.stamp} aria-hidden="true">☀</span>
            <p className="label">To</p>
            <p className={styles.to}>Omar Ibrahim<br />The end of the pier<br />Ottawa</p>
            <p className={`label ${styles.subject}`}>Subject: {subject}</p>
          </div>
          <a className={`btn ${styles.send}`} data-tone="coral" href={mailto} onClick={() => setSent(n => n + 1)}>
            <Send size={14} />Send it with the drone
          </a>
        </div>
      </Beat>

      <Beat>
        <div className={styles.colophon}>
          <p className={`label ${styles.kicker}`}>End of the line</p>
          <h3 id="contact-colophon" className={styles.letterTitle}>Thanks for coming</h3>
          <p className={styles.body}>
            Every stop on this trip was drawn live in your browser with three.js and inked like a comic. The type is Heliotrope, drawn for this site; I was modelled from a drawing and rigged to walk, wave and water the plants. Built with Next.js.
          </p>
          <div className={styles.links}>
            <a className="btn" data-tone="paper" href="#home"><ArrowUp size={14} />Back to the start</a>
            <a className="btn" data-tone="paper" href="/almanac">Read the magazine edition<ArrowUpRight size={14} /></a>
          </div>
        </div>
      </Beat>
    </Stop>
  )
}
