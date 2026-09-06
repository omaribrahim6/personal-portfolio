'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import ProjectArtifact from './ProjectArtifact'
import styles from './Projects.module.css'

type Project = {
  number: string
  title: string
  award?: string
  description: string
  tags: string[]
  github?: string
  demo?: string
  demoLabel?: string
  devpost?: string
}

const projects: Project[] = [
  {
    number: '00',
    title: 'Clascade',
    award: 'cuHacking 2026 — Best Use of Gemini',
    description: 'Teachers upload the slide deck they already have and Clascade turns it into a collaborative 3D lesson the whole class moves through together in the browser. The teacher controls every phase from their own screen so no student can rush ahead, every generated fact is grounded in cited sources, and every scene is age-checked before students ever see it.',
    tags: ['Next.js', 'TypeScript', '3D / WebGL', 'RAG', 'EdTech'],
    demo: 'https://clascade-page.vercel.app/',
    demoLabel: 'Case Study & Demos',
    devpost: 'https://devpost.com/software/clascade',
  },
  {
    number: '01',
    title: 'Revenant',
    award: 'GenAI Genesis 2026 — Winner, Moorcheh.ai Track',
    description: 'Won Canada\'s largest AI hackathon against 1,000+ hackers. Every company slowly loses its memory — the reasoning behind engineering decisions gets buried in Slack threads and pull requests. Revenant captures that reasoning as it happens, so two years later a developer can ask "why did we pick Postgres?" and get the original discussion back. Built in 36 hours.',
    tags: ['Next.js', 'FastAPI', 'Python', 'PostgreSQL', 'Redis', 'RAG', 'Docker'],
    devpost: 'https://devpost.com/software/revenent',
  },
  {
    number: '02',
    title: 'QueryForge',
    award: 'MindBridge AI Challenge',
    description: 'A natural-language-to-SQL agent that lets anyone query a database in plain English. Hit 98% accuracy across 172 test cases, including trick questions written specifically to break it. Runs entirely on CPU through Ollama with no external API, so data never leaves the machine and inference costs nothing.',
    tags: ['Python', 'DuckDB', 'Ollama', 'SQL', 'Local LLM'],
    github: 'https://github.com/omaribrahim6/QueryForge',
  },
  {
    number: '03',
    title: 'RoadSense',
    award: 'Hack the Future — 2nd Place',
    description: 'Cities find potholes through manual inspection and citizen complaints — slow, expensive, reactive. RoadSense turns ordinary dashcam footage into a live map of road conditions using a fine-tuned YOLOv8 model, with frame extraction, severity scoring, GPS resolution, and duplicate filtering feeding a MapLibre dashboard engineers can filter by damage type and severity.',
    tags: ['Python', 'YOLOv8', 'OpenCV', 'Supabase', 'Next.js', 'MapLibre'],
    github: 'https://github.com/omaribrahim6/roadsense',
    demo: 'https://roadsense-live.vercel.app/',
  },
]

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const links = [
    ...(project.demo ? [{ href: project.demo, label: project.demoLabel ?? 'Demo' }] : []),
    ...(project.github ? [{ href: project.github, label: 'Code' }] : []),
    ...(project.devpost ? [{ href: project.devpost, label: 'Devpost' }] : []),
  ]

  return (
    <motion.article className={styles.project} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: .6 }} aria-labelledby={`project-${index}`}>
      <div className={styles.projectCopy}>
        <div className={styles.projectNumber}><span>{project.number}</span><span>{project.award}</span></div>
        <h3 id={`project-${index}`}>{project.title}</h3>
        <p className={styles.description}>{project.description}</p>
        <ul className={styles.tags} aria-label={`${project.title} technologies`}>
          {project.tags.map(tag => <li key={tag}>{tag}</li>)}
        </ul>
        <div className={styles.links}>
          {links.map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight size={15} /></a>)}
        </div>
      </div>
      <ProjectArtifact index={index} title={project.title} />
    </motion.article>
  )
}

export default function Projects() {
  return (
    <section id="projects" className={styles.section} aria-labelledby="projects-title">
      <div className={styles.container}>
        <div className={styles.heading}>
          <div><p className={styles.kicker}>ideas, made real</p><h2 id="projects-title"><span>{'//'}</span> my projects</h2></div>
          <p>hackathon wins and things I build for fun<br /><span>There’s a little something to play with in each one.</span></p>
        </div>
        <div className={styles.projectList}>
          {projects.map((project, index) => <ProjectCard key={project.title} project={project} index={index} />)}
        </div>
      </div>
    </section>
  )
}
