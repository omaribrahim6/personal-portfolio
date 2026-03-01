'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { ExternalLink, Github } from 'lucide-react'

type Project = {
  number: string
  title: string
  description: string
  tags: string[]
  github?: string
  demo?: string
  privateRepo?: boolean
}

const projects: Project[] = [
  {
    number: '00',
    title: 'Empower Orphans Website',
    description: 'Full-stack website for NGO Empower Orphans, a student-led organization fundraising and volunteering to support orphaned children across university chapters.',
    tags: ['Next.js', 'TypeScript', 'TailwindCSS'],
    github: 'https://github.com/omaribrahim6/Empower-Orphans-Website',
    demo: 'https://www.empowerorphans.com/',
  },
  {
    number: '01',
    title: 'RoadSense',
    description: 'AI-powered road damage detection system using dashcam video analysis. Detects potholes, cracks, ruts, and debris, then visualizes them on an interactive map dashboard for engineers.',
    tags: ['AI', 'Computer Vision', 'Mapping', 'Dashcam Analytics'],
    github: 'https://github.com/omaribrahim6/roadsense',
    demo: 'https://astrali.tech/',
  },
  {
    number: '02',
    title: 'CUMSA Website',
    description: 'Conducted security audits and implemented fixes for Carleton University Muslim Students\' Association website. Integrated Instagram Graph API for dynamic social content.',
    tags: ['Security', 'Instagram API', 'Next.js'],
    github: 'https://github.com/machine-moon/cumsa-web',
    demo: 'https://cumsa.ca/',
    privateRepo: true,
  },
  {
    number: '03',
    title: 'Astralis VPS Infrastructure',
    description: 'Self-hosted production environment running on an Ubuntu-based VPS with automated CI/CD, Nginx reverse-proxy routing, SSL certificates, and isolated production services. Includes secure deployment pipelines, systemd-managed applications, SSH key authentication, and custom automation scripts for seamless zero-touch updates.',
    tags: ['DevOps', 'Linux', 'Nginx', 'CI/CD', 'GitHub Actions', 'Systemd', 'Node.js', 'Security', 'VPS'],
  },
]

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [showPrivateMsg, setShowPrivateMsg] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const fullText = "// it's a private repo, click again if u really wanna check"

  useEffect(() => {
    if (showPrivateMsg && displayText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length + 1))
      }, 35)
      return () => clearTimeout(timeout)
    } else if (showPrivateMsg && displayText.length === fullText.length) {
      setTypingDone(true)
    }
  }, [showPrivateMsg, displayText, fullText])

  const handlePrivateRepoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!showPrivateMsg) {
      setShowPrivateMsg(true)
    } else if (typingDone) {
      window.open(project.github, '_blank', 'noopener,noreferrer')
    }
  }

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

        <div className="mt-4 flex flex-col flex-grow">
          <h3 className="font-display text-2xl md:text-4xl uppercase mb-3 group-hover:text-accent-yellow transition-colors duration-300">
            {project.title}
          </h3>
          <p className="text-base md:text-lg text-light-primary mb-6 leading-relaxed flex-grow">
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
            {project.github && project.privateRepo ? (
              <button
                onClick={handlePrivateRepoClick}
                className="flex items-center gap-2 px-4 py-2 bg-dark-primary hover:bg-accent-yellow text-light-primary hover:text-dark-primary rounded-lg transition-all duration-300"
              >
                <Github className="w-4 h-4" />
                <span>Code</span>
              </button>
            ) : project.github ? (
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
                <span>Demo</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Private repo message - below the card, absolutely positioned */}
      {project.privateRepo && showPrivateMsg && (
        <div className="absolute left-2 -bottom-7">
          <span 
            className="font-mono text-sm text-accent-yellow"
            style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', 'Consolas', monospace" }}
          >
            {displayText}
            {!typingDone && <span className="animate-pulse">|</span>}
          </span>
        </div>
      )}
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
            a non-exhaustive list
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
