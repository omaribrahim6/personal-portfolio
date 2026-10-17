'use client'

import { useCallback, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { projects, type Project } from '../content'
import Opener from './Opener'
import Sign from './Sign'
import Diorama from './toon/Diorama'
import styles from './Features.module.css'

type Scene = Project['window']['scene']
type Callout = { at: string; text: string; when: 'open' | 'closed' | 'always'; code?: boolean }

// The notes pinned to each drawing, at named places in its scene. They follow the place as the camera moves.
const CALLOUTS: Record<Scene, Callout[]> = {
  signal: [
    { at: 'report', text: 'a pothole, and one report', when: 'open' },
    { at: 'neighbours', text: 'five neighbours: me too', when: 'open' },
    { at: 'crew', text: 'a crew on the way', when: 'open' },
    { at: 'report', text: 'a pothole', when: 'closed' },
  ],
  cascade: [
    { at: 'source', text: '01 / source material', when: 'open' },
    { at: 'shared', text: '02 / shared exploration', when: 'open' },
    { at: 'dimension', text: '03 / a new dimension', when: 'open' },
  ],
  trail: [
    { at: 'conversation', text: 'the conversation', when: 'always' },
    { at: 'decision', text: 'the decision', when: 'open' },
    { at: 'reason', text: 'the reason why', when: 'open' },
  ],
  reflection: [
    { at: 'question', text: '“How many ideas have we shipped?”', when: 'always' },
    { at: 'local', text: 'on this machine, and nowhere else', when: 'open' },
    { at: 'query', text: 'SELECT COUNT(*) FROM ideas WHERE shipped = true;', when: 'open', code: true },
  ],
}

/** The prize, split from the event it was won at. */
function award(text: string) {
  const [event, prize] = text.split(' — ')
  return { event, prize }
}

/** The first sentence, to stand above the rest as the standfirst. */
function standfirst(text: string) {
  const match = text.match(/^([^]+?[.!?])\s+([^]*)$/)
  return match ? [match[1], match[2]] : [text, '']
}

/** A rosette, as pinned to a winner at a show: a scalloped badge with a star, and two tails. */
function Rosette({ won }: { won: boolean }) {
  const scallops = Array.from({ length: 18 }, (_, k) => {
    const a = k / 18 * Math.PI * 2
    return `${(32 + Math.cos(a) * 25).toFixed(1)} ${(30 + Math.sin(a) * 25).toFixed(1)}`
  })
  return (
    <svg viewBox="0 0 64 84" className={styles.rosette} data-won={won} aria-hidden="true">
      <path className={styles.tail} d="M22 44 14 80l9-6 6 8 6-36Z" />
      <path className={styles.tail} d="M42 44 50 80l-9-6-6 8-6-36Z" />
      <g className={styles.scallops}>{scallops.map((p, k) => { const [x, y] = p.split(' '); return <circle key={k} cx={x} cy={y} r="5.6" /> })}</g>
      <circle cx="32" cy="30" r="22" className={styles.disc} />
      <circle cx="32" cy="30" r="16" className={styles.inner} />
      <path className={styles.star} d="M32 19l3.2 6.6 7.2 1-5.2 5 1.3 7.2L32 35.4l-6.5 3.4 1.3-7.2-5.2-5 7.2-1Z" />
    </svg>
  )
}

function Feature({ project, index }: { project: Project; index: number }) {
  const [open, setOpen] = useState(false)
  const notes = useRef<(HTMLSpanElement | null)[]>([])
  const { scene, caption, action } = project.window
  const callouts = CALLOUTS[scene]
  const { event, prize } = award(project.award)
  const [lead, rest] = standfirst(project.description)
  const links = [
    ...(project.demo ? [{ href: project.demo, label: project.demoLabel ?? 'Demo' }] : []),
    ...(project.github ? [{ href: project.github, label: 'Code' }] : []),
    ...(project.devpost ? [{ href: project.devpost, label: 'Devpost' }] : []),
  ]

  // Pin each note to its place in the drawing, every frame, without asking React to draw anything.
  const place = useCallback((anchors: Record<string, { x: number; y: number }>) => {
    callouts.forEach((note, i) => {
      const el = notes.current[i], at = anchors[note.at]
      if (!el || !at) return
      el.style.left = `${(at.x * 100).toFixed(2)}%`
      el.style.top = `${(at.y * 100).toFixed(2)}%`
      el.dataset.placed = 'true'
    })
  }, [callouts])

  return (
    <article className={styles.feature} data-scene={scene} data-flip={index % 2 === 1} aria-labelledby={`project-${index}`}>
      <figure className={styles.figure}>
        <div className={styles.plate}>
          <Diorama scene={scene} state={open ? 'open' : 'closed'} className={styles.canvas} onAnchors={place} />
          {callouts.map((note, i) => (
            <span key={`${note.at}-${note.when}`} ref={el => { notes.current[i] = el }} className={styles.callout} data-code={note.code}
              data-shown={note.when === 'always' || (note.when === 'open') === open} aria-hidden="true">
              <span>{note.text}</span>
            </span>
          ))}
          <span className={`label ${styles.plateNo}`} aria-hidden="true">Pl. {String(index + 1).padStart(2, '0')}</span>
        </div>
        <figcaption className={styles.caption}>
          <span className="label">Fig. {index + 2} — {caption}</span>
          <button type="button" className={styles.lever} aria-pressed={open} onClick={() => setOpen(!open)}
            aria-label={`${action[open ? 1 : 0]}: ${project.title} illustration`}>
            <span className={styles.track} aria-hidden="true"><i /></span>
            {action[open ? 1 : 0]}
          </button>
        </figcaption>
      </figure>

      <div className={styles.copy}>
        <p className={`label ${styles.kicker}`}><span>Feature Nº {project.number}</span><i /></p>
        <div className={styles.prize}>
          <Rosette won={!!prize} />
          <p><b>{prize ?? 'Challenge entry'}</b><span>{event}</span></p>
        </div>
        <h3 id={`project-${index}`} className={styles.title}><Sign text={project.title} /></h3>
        <p className={styles.lead}>{lead}</p>
        {rest && <p className={styles.body}>{rest}</p>}
        <p className={`label ${styles.builtWith}`}>Built with</p>
        <ul className={styles.tags} aria-label={`${project.title} technologies`}>
          {project.tags.map(tag => <li key={tag}>{tag}</li>)}
        </ul>
        <div className={styles.links}>
          {links.map((link, i) => (
            <a key={link.href} className="btn" data-tone={i === 0 ? undefined : 'paper'} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}<ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function Features() {
  return (
    <section id="projects" className={styles.features} aria-labelledby="projects-title">
      <div className="measure">
        <Opener chapter="projects" title="Features" titleId="projects-title"
          aside={<p className={`label ${styles.count}`}>{projects.length} builds · {projects.filter(p => p.award.includes('—')).length} prizes</p>}>
          Hackathon wins and things I build for fun. Each comes with a working model: pull its lever.
        </Opener>
        {projects.map((project, index) => <Feature key={project.title} project={project} index={index} />)}
      </div>
    </section>
  )
}
