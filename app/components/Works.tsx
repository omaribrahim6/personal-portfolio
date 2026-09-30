'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { projects, type Project } from '../content'
import Plate, { Ground } from './Plate'
import ProjectWindow from './ProjectWindow'
import styles from './Works.module.css'

function Work({ project, index }: { project: Project; index: number }) {
  const links = [
    ...(project.demo ? [{ href: project.demo, label: project.demoLabel ?? 'Demo' }] : []),
    ...(project.github ? [{ href: project.github, label: 'Code' }] : []),
    ...(project.devpost ? [{ href: project.devpost, label: 'Devpost' }] : []),
  ]

  return (
    <motion.article className={styles.work} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }} transition={{ duration: .7, ease: [.2, .7, .2, 1] }} aria-labelledby={`project-${index}`}>
      <ProjectWindow project={project} index={index} />
      <div className={styles.copy}>
        <p className={`label ${styles.number}`}><span>Nº {project.number}</span><span>{project.award}</span></p>
        <h3 id={`project-${index}`}>{project.title}</h3>
        <p className={styles.description}>{project.description}</p>
        <ul className={styles.tags} aria-label={`${project.title} technologies`}>
          {project.tags.map(tag => <li key={tag}>{tag}</li>)}
        </ul>
        <div className={styles.links}>
          {links.map(link => <a key={link.href} className="go" href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight size={15} /></a>)}
        </div>
      </div>
    </motion.article>
  )
}

export default function Works() {
  return (
    <section id="projects" aria-labelledby="projects-title">
      <Plate index={2} scene="arch" after="dunes" tone="light" numeral="III" place="the arch" kicker="ideas, made real" title="Selected work" titleId="projects-title" tall>
        Hackathon wins and things I build for fun. There’s a little something to play with in each one.
      </Plate>
      <Ground scene="arch" className={styles.ground}>
        <div className={`measure ${styles.list}`}>
          {projects.map((project, index) => <Work key={project.title} project={project} index={index} />)}
        </div>
      </Ground>
    </section>
  )
}
