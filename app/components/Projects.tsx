'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { ExternalLink, Trophy } from 'lucide-react'
import { Github } from './BrandIcons'

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
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  return (
    <div className="relative h-full">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ delay: index * 0.15, duration: 0.6 }}
        className="group relative bg-dark-secondary p-5 md:p-8 rounded-lg border-2 border-dark-tertiary hover:border-accent-yellow transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-accent-yellow/10 h-full flex flex-col"
      >
        {/* Project number */}
        <div className="absolute -top-3 -left-3 w-14 h-14 md:w-16 md:h-16 bg-accent-yellow rounded-full flex items-center justify-center">
          <span className="font-display text-xl md:text-2xl text-dark-primary">{project.number}</span>
        </div>

        <div className="mt-4 flex flex-col grow">
          <h3 className="font-display text-2xl md:text-4xl uppercase mb-2 group-hover:text-accent-yellow transition-colors duration-300">
            {project.title}
          </h3>
          {project.award && (
            <p className="inline-flex self-start items-center gap-2 mb-4 px-2.5 py-1 text-xs md:text-sm uppercase tracking-wider text-accent-yellow border border-accent-yellow/40 bg-accent-yellow/5 rounded-sm">
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>{project.award}</span>
            </p>
          )}
          <p className="text-base md:text-lg text-light-primary mb-6 leading-relaxed grow">
            {project.description}
          </p>

          {/* Tech stack tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-dark-primary text-accent-yellow border border-dark-tertiary rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-4 items-start mt-auto">
            {project.github ? (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-dark-primary hover:bg-accent-yellow text-light-primary hover:text-dark-primary rounded-lg transition-all duration-300"
              >
                <Github className="w-4 h-4" />
                <span>Code</span>
              </a>
            ) : null}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-dark-primary hover:bg-accent-yellow text-light-primary hover:text-dark-primary rounded-lg transition-all duration-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{project.demoLabel ?? 'Demo'}</span>
              </a>
            )}
            {project.devpost && (
              <a
                href={project.devpost}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-dark-primary hover:bg-accent-yellow text-light-primary hover:text-dark-primary rounded-lg transition-all duration-300"
              >
                <Trophy className="w-4 h-4" />
                <span>Devpost</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>

    </div>
  )
}

export default function Projects() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="projects" className="min-h-screen py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase mb-4">
            <span className="text-accent-yellow">{'//'}</span> my projects
          </h2>
          <p className="text-light-secondary text-lg md:text-xl">
            hackathon wins and things I build for fun
          </p>
          <div className="w-24 h-1 bg-accent-yellow mt-4" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {projects.map((project, index) => (
            <ProjectCard key={index} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
