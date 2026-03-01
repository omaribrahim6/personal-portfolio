'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useRef, useLayoutEffect, useEffect, useState, type MouseEvent } from 'react'

type Detail =
  | string
  | {
      prefix?: string
      linkText: string
      href: string
      suffix?: string
    }

type Role = {
  title: string
  organization: string
  period?: string
  details: Detail[]
}

type SingleExperience = {
  category: string
  title: string
  organization: string
  period: string
  details: Detail[]
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
    details: [],
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
    roles: [
      {
        title: 'Cybersecurity Analyst (Contract)',
        organization: 'Journale.ai',
        period: 'NOV 2025 - Present',
        details: [
          'Conducted security assessments and vulnerability testing',
          'Implemented security best practices and protocols',
          'Monitored and responded to security incidents',
        ],
      },
      {
        title: 'Freelance Web Developer',
        organization: 'Independent',
        details: [
          {
            prefix: '(',
            linkText: 'contact',
            href: '#contact',
            suffix: ' me for a website)',
          },
        ],
      },
    ],
  },
]

export default function About() {
  const education = experiences[0] as SingleExperience
  const volunteer = experiences[1] as MultiRoleExperience
  const professional = experiences[2] as MultiRoleExperience
  const sectionRef = useRef<HTMLElement>(null)
  const rotatorRef = useRef<HTMLDivElement>(null)
  const [sectionTop, setSectionTop] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const rotationRange = useTransform(scrollY, (value) => {
    if (typeof window === 'undefined') return 90
    const vh = window.innerHeight

    const start = sectionTop + vh * 0.3
    const mid1 = sectionTop + vh * 0.7
    const mid2 = sectionTop + vh * 1.2
    const end = sectionTop + vh * 1.6

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

  const handleHashLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')
    if (!href || !href.startsWith('#')) return

    const target = document.getElementById(href.slice(1))
    if (!target) return

    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', href)
  }

  const renderDetail = (item: Detail, index: number, className = '') => (
    <li
      key={index}
      className={`text-sm text-light-primary opacity-80 ${className}`.trim()}
    >
      {typeof item === 'string' ? (
        item
      ) : (
        <>
          {item.prefix}
          <a
            href={item.href}
            onClick={item.href.startsWith('#') ? handleHashLinkClick : undefined}
            className="underline underline-offset-2 text-inherit hover:text-accent-yellow transition-colors duration-300"
          >
            {item.linkText}
          </a>
          {item.suffix}
        </>
      )}
    </li>
  )

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative"
      style={{
        height: isMobile ? '280vh' : '280vh',
        paddingTop: 0,
        marginBottom: isMobile ? '20vh' : '30vh',
      }}
    >
      <div
        className="sticky top-4 md:top-12"
        style={{ height: isMobile ? '55vh' : '70vh' }}
      >
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase mb-4 relative z-10 px-4 md:pl-56">
          <span className="text-accent-yellow">{'//'}</span> The Story So Far
        </h2>

        <motion.div
          ref={rotatorRef}
          className="absolute rounded-full border-2 border-dark-tertiary"
          style={{
            rotate,
            width: isMobile ? '70vh' : '70vh',
            height: isMobile ? '70vh' : '70vh',
            transformOrigin: '50% 50%',
            top: isMobile ? '10vh' : '100px',
            right: isMobile ? '55%' : '80%',
            scale: isMobile ? 0.55 : 1,
          }}
        >
          <div
            className="absolute whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'sideways',
              height: 'max-content',
              bottom: 'calc(100% + 16px)',
              left: '50%',
              transform: 'translateX(-50%) scale(-1)',
            }}
            tabIndex={0}
          >
            <h3 className="font-display text-6xl lg:text-7xl uppercase m-0 text-accent-yellow opacity-80">
              {education.category}
            </h3>
            <h4 className="text-lg leading-8 m-0 text-light-primary">
              <span className="bg-accent-yellow text-dark-primary px-1 py-0.5 text-base">
                {education.title}
              </span>{' '}
              <span className="text-accent-yellow text-base">@{education.organization}</span>
            </h4>
            <p className="text-sm font-normal tracking-wider my-1 uppercase text-light-secondary">
              {education.period}
            </p>
            {!!education.details.length && (
              <ul className="pl-6 list-disc space-y-1">
                {education.details.map((item, index) => renderDetail(item, index))}
              </ul>
            )}
          </div>

          <div
            className="absolute"
            style={{
              maxWidth: '1000px',
              left: 'calc(100% + 16px)',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            tabIndex={0}
          >
            <h3 className="font-display text-6xl lg:text-7xl uppercase m-0 text-accent-yellow opacity-80">
              {volunteer.category}
            </h3>
            {volunteer.roles.map((role, index) => (
              <div key={index} className={index > 0 ? 'mt-3' : ''}>
                <h4 className="text-lg leading-8 my-1 text-light-primary">
                  <span className="bg-accent-yellow text-dark-primary px-1 py-0.5 text-base">
                    {role.title}
                  </span>{' '}
                  <span className="text-accent-yellow text-base">@{role.organization}</span>
                </h4>
                <ul className="pl-6 list-disc space-y-1">
                  {role.details.map((item, detailIndex) =>
                    renderDetail(item, detailIndex, 'whitespace-nowrap')
                  )}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="absolute whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'sideways',
              height: 'max-content',
              top: 'calc(100% + 16px)',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            tabIndex={0}
          >
            <h3 className="font-display text-6xl lg:text-7xl uppercase m-0 text-accent-yellow opacity-80">
              {professional.category}
            </h3>
            {professional.roles.map((role, index) => (
              <div key={index} className={index > 0 ? 'mt-3' : ''}>
                <h4 className="text-lg leading-8 m-0 text-light-primary">
                  <span className="bg-accent-yellow text-dark-primary px-1 py-0.5 text-base">
                    {role.title}
                  </span>{' '}
                  <span className="text-accent-yellow text-base">@{role.organization}</span>
                </h4>
                {role.period && (
                  <p className="text-sm font-normal tracking-wider my-1 uppercase text-light-secondary">
                    {role.period}
                  </p>
                )}
                {!!role.details.length && (
                  <ul className="pl-6 list-disc space-y-1">
                    {role.details.map((item, detailIndex) =>
                      renderDetail(item, detailIndex)
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
