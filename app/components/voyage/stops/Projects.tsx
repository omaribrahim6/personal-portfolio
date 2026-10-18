'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { projects } from '../../../content'
import { CALLOUTS, Rosette, award, standfirst } from '../../Features'
import Sign from '../../Sign'
import { Beat, Stop, StopHead } from '../Voyage'
import { useWorld } from '../World'
import styles from './stops.module.css'

// The workshops: a card for each island. Its lever (on the card, or the brass one on the jetty) runs the
// model; notes pinned to the model say what is going on, and follow it as the camera moves.

export default function Projects() {
  const world = useWorld()
  const [open, setOpen] = useState<boolean[]>(projects.map(() => false))
  const [inView, setInView] = useState<number | null>(null)
  const notes = useRef<(HTMLSpanElement | null)[]>([])

  const pull = useCallback((i: number, next?: boolean) => {
    setOpen(list => {
      const value = next ?? !list[i]
      world.tell('projects', `project-${i}`, value ? 'open' : 'closed')
      return list.map((each, k) => k === i ? value : each)
    })
  }, [world])

  // A click on a lever in the world.
  useEffect(() => world.hear((name, value) => {
    if (name.startsWith('project-')) pull(Number(name.slice(8)), value === 'open')
  }), [world, pull])

  // Which island's card is in front of you.
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setInView(Number((entry.target as HTMLElement).dataset.index))
    }, { rootMargin: '-35% 0px -35% 0px' })
    document.querySelectorAll<HTMLElement>('[data-workshop]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Pin the notes for that island to their places.
  useEffect(() => {
    if (inView === null) return
    const scene = projects[inView].window.scene
    const stops = CALLOUTS[scene].map((note, k) => world.follow('projects', `${inView}:${note.at}`, (x, y, seen) => {
      const el = notes.current[k]
      if (!el) return
      el.style.transform = `translate3d(${(x * window.innerWidth).toFixed(1)}px, ${(y * window.innerHeight).toFixed(1)}px, 0)`
      el.dataset.seen = String(seen)
    }))
    return () => stops.forEach(stop => stop())
  }, [inView, world])

  return (
    <Stop id="projects">
      <Beat>
        <StopHead id="projects" title="The workshops">
          Hackathon wins and things I build for fun, each on its own island with a working model. Pull the lever on the jetty.
        </StopHead>
        <p className={`label ${styles.legend}`}>{projects.length} builds · {projects.filter(p => p.award.includes('—')).length} prizes</p>
      </Beat>
      {projects.map((project, i) => {
        const { event, prize } = award(project.award)
        const [lead, rest] = standfirst(project.description)
        const links = [
          ...(project.demo ? [{ href: project.demo, label: project.demoLabel ?? 'Demo' }] : []),
          ...(project.github ? [{ href: project.github, label: 'Code' }] : []),
          ...(project.devpost ? [{ href: project.devpost, label: 'Devpost' }] : []),
        ]
        return (
          <Beat key={project.title} side={i % 2 ? 'right' : 'left'}>
            <div className={styles.project} data-workshop data-index={i} data-scene={project.window.scene}>
              <p className={`label ${styles.workshop}`}><span>Workshop Nº {project.number}</span><i /><span>{project.window.caption}</span></p>
              <div className={styles.prize}>
                <Rosette won={!!prize} />
                <p><b>{prize ?? 'Challenge entry'}</b><span>{event}</span></p>
              </div>
              <h3 id={`project-${i}`} className={styles.projectTitle}><Sign text={project.title} /></h3>
              <p className={styles.lead}>{lead}</p>
              {rest && <p className={styles.body}>{rest}</p>}
              <ul className={styles.tags} aria-label={`${project.title} technologies`}>
                {project.tags.map(tag => <li key={tag}>{tag}</li>)}
              </ul>
              <div className={styles.links}>
                <button type="button" className={styles.lever} aria-pressed={open[i]} onClick={() => pull(i)}>
                  <span className={styles.track} aria-hidden="true"><i /></span>{project.window.action[open[i] ? 1 : 0]}
                </button>
                {links.map(link => (
                  <a key={link.href} className="btn" data-tone="paper" data-size="small" href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight size={12} /></a>
                ))}
              </div>
            </div>
          </Beat>
        )
      })}
      {/* The notes pinned in the world, for whichever island is in front of you. */}
      <div className={styles.notes} aria-hidden="true">
        {inView !== null && CALLOUTS[projects[inView].window.scene].map((note, k) => (
          <span key={`${inView}-${k}`} ref={el => { notes.current[k] = el }} className={styles.note2} data-code={note.code}
            data-shown={note.when === 'always' || (note.when === 'open') === open[inView]}>
            <span>{note.text}</span>
          </span>
        ))}
      </div>
    </Stop>
  )
}
