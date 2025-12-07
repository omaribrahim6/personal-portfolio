'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useRef, useLayoutEffect, useEffect, useState } from 'react'

type Role = {
  title: string
  organization: string
  details: string[]
}

type SingleExperience = {
  category: string
  title: string
  organization: string
  period: string
  details: string[]
  roles?: never
}

type MultiRoleExperience = {
  category: string
  roles: Role[]
  title?: never
  organization?: never
  period?: never
  details?: never
}

type Experience = SingleExperience | MultiRoleExperience

const experiences: Experience[] = [
  {
    category: 'education',
    title: 'B.Eng. in Software Engineering',
    organization: 'Carleton University',
    period: 'Expected April 2028',
    details: [
      'GPA: 10.33/12.00',
    ],
  },
  {
    category: 'volunteer',
    roles: [
      {
        title: 'Co-Founder & Full-Stack Developer',
        organization: 'Empower Orphans',
        details: ['Website, infra, security, content systems'],
      },
      {
        title: 'Web Security',
        organization: 'CUMSA',
        details: ['Security audit, fixes, auth logic'],
      },
    ],
  },
  {
    category: 'experience',
    title: 'Cybersecurity Analyst (Contract)',
    organization: 'Journale.ai',
    period: 'NOV 2025 – Present',
    details: [
      'Conducted security assessments and vulnerability testing',
      'Implemented security best practices and protocols',
      'Monitored and responded to security incidents',
    ],
  },
]

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const rotatorRef = useRef<HTMLDivElement>(null)
  const [sectionTop, setSectionTop] = useState(0)
  const { scrollY } = useScroll()

  // Get section position on mount and resize
  useEffect(() => {
    const updateSectionTop = () => {
      if (sectionRef.current) {
        setSectionTop(sectionRef.current.offsetTop)
      }
    }
    updateSectionTop()
    window.addEventListener('resize', updateSectionTop)
    return () => window.removeEventListener('resize', updateSectionTop)
  }, [])

  // Calculate rotation based on scroll position
  const rotationRange = useTransform(scrollY, (value) => {
    if (typeof window === 'undefined') return 90
    const vh = window.innerHeight
    
    // Define scroll points relative to section position
    // Extra scroll at start to view option 1, extra at end to view option 3
    const start = sectionTop + vh * 0.3      // Delay start - more time on option 1
    const mid1 = sectionTop + vh * 0.7       // Transition to option 2
    const mid2 = sectionTop + vh * 1.2       // Pause on option 2
    const end = sectionTop + vh * 1.6        // Transition to option 3

    if (value < start) return 90
    if (value < mid1) {
      const progress = (value - start) / (mid1 - start)
      return 90 - 90 * progress
    }
    if (value < mid2) return 0
    if (value < end) {
      const progress = (value - mid2) / (end - mid2)
      return -90 * progress
    }
    return -90
  })

  const rotate = useSpring(rotationRange, { stiffness: 400, damping: 90 })

  useLayoutEffect(() => {
    if (rotatorRef.current && typeof window !== 'undefined') {
      const checkScroll = () => {
        if (scrollY.get() > sectionTop + window.innerHeight * 1.6) {
          rotatorRef.current!.style.transform = 'rotate(-90deg)'
        }
      }
      checkScroll()
    }
  }, [scrollY, sectionTop])

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative"
      style={{ height: '280vh', paddingTop: 0, marginBottom: '30vh' }}
    >
      {/* Sticky container that keeps wheel in view */}
      <div className="sticky top-12" style={{ height: '70vh' }}>
        {/* Section title */}
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl uppercase mb-4 relative z-10 pl-4 md:pl-56">
          <span className="text-accent-yellow">{'//'}</span> The Story So Far
        </h2>

        {/* The rotating wheel */}
        <motion.div
          ref={rotatorRef}
          className="absolute rounded-full border-2 border-dark-tertiary"
          style={{
            rotate,
            width: '70vh',
            height: '70vh',
            transformOrigin: '50% 50%',
            top: '100px',
            right: '80%',
          }}
        >
          {/* Education - Top position (vertical text, rotated 180°) */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'sideways',
              maxHeight: '365px',
              top: '-64%',
              transform: 'translateX(-50%) scale(-1)',
            }}
            tabIndex={0}
          >
            <h3 className="font-display text-5xl md:text-6xl lg:text-7xl uppercase m-0 text-accent-yellow opacity-80">
              {experiences[0].category}
            </h3>
            <h4 className="text-base md:text-lg leading-8 m-0 text-light-primary">
              <span className="bg-accent-yellow text-dark-primary px-1 py-0.5">
                {experiences[0].title}
              </span>{' '}
              <span className="text-accent-yellow">@{experiences[0].organization}</span>
            </h4>
            <p className="text-xs md:text-sm font-normal tracking-wider my-1 uppercase text-light-secondary">
              {experiences[0].period}
            </p>
            <ul className="pl-6 list-disc space-y-1">
              {experiences[0].details?.map((item, i) => (
                <li
                  key={i}
                  className="text-xs md:text-sm text-light-primary opacity-80"
                  style={{ listStyleType: 'disc' }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Volunteer - Right position (horizontal text) */}
          <div
            className="absolute top-1/2"
            style={{
              maxWidth: '450px',
              right: '-80%',
              transform: 'translateY(-50%)',
            }}
            tabIndex={0}
          >
            <h3 className="font-display text-5xl md:text-6xl lg:text-7xl uppercase m-0 text-accent-yellow opacity-80">
              {experiences[1].category}
            </h3>
            {experiences[1].roles?.map((role, idx) => (
              <div key={idx} className={idx > 0 ? 'mt-3' : ''}>
                <h4 className="text-base md:text-lg leading-8 my-1 text-light-primary">
                  <span className="bg-accent-yellow text-dark-primary px-1 py-0.5">
                    {role.title}
                  </span>{' '}
                  <span className="text-accent-yellow">@{role.organization}</span>
                </h4>
                <ul className="pl-6 list-disc space-y-1">
                  {role.details.map((item, i) => (
                    <li
                      key={i}
                      className="text-xs md:text-sm text-light-primary opacity-80"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Experience 2 - Bottom position (vertical text) */}
          <div
            className="absolute left-1/2"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'sideways',
              maxHeight: '450px',
              bottom: '-80%',
              transform: 'translateX(-50%)',
            }}
            tabIndex={0}
          >
            <h3 className="font-display text-5xl md:text-6xl lg:text-7xl uppercase m-0 text-accent-yellow opacity-80">
              {experiences[2].category}
            </h3>
            <h4 className="text-base md:text-lg leading-8 m-0 text-light-primary">
              <span className="bg-accent-yellow text-dark-primary px-1 py-0.5">
                {experiences[2].title}
              </span>{' '}
              <span className="text-accent-yellow">@{experiences[2].organization}</span>
            </h4>
            <p className="text-xs md:text-sm font-normal tracking-wider my-1 uppercase text-light-secondary">
              {experiences[2].period}
            </p>
            <ul className="pl-6 list-disc space-y-1">
              {experiences[2].details?.map((item, i) => (
                <li
                  key={i}
                  className="text-xs md:text-sm text-light-primary opacity-80"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
