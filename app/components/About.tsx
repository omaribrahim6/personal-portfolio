'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type MouseEvent } from 'react'

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

type Group = {
  category: string
  roles: Role[]
}

const groups: Group[] = [
  {
    category: 'education',
    roles: [
      {
        title: 'B.Eng. in Software Engineering',
        organization: 'Carleton University',
        period: 'Sep 2024 — Apr 2028 (expected)',
        details: [
          'Relevant coursework: Data Structures, Digital Systems, Computer Architecture, Software Engineering',
        ],
      },
    ],
  },
  {
    category: 'experience',
    roles: [
      {
        title: 'Freelance Developer',
        organization: 'Independent',
        period: 'Sep 2025 — Present',
        details: [
          'Design, deploy, and maintain containerized production websites for clients in Next.js, owning full-stack development, SEO, and infrastructure',
          'Manage Linux VPS environments including domains, SSL, firewall hardening, backups, and uptime monitoring',
          'Hosting 5+ sites and APIs over HTTPS, handling ~8,000 unique visitors and 300k requests monthly',
          {
            prefix: '(',
            linkText: 'contact',
            href: '#contact',
            suffix: ' me for a website)',
          },
        ],
      },
      {
        title: 'Penetration Tester',
        organization: 'BearHacks',
        period: 'Apr 2026',
        details: ['Security testing for the event platform ahead of launch (remote, on-call)'],
      },
      {
        title: 'Penetration Tester',
        organization: 'cuHacking',
        period: 'Mar 2026 — Apr 2026',
        details: ["Security testing across Canada's largest student-run hackathon platform (on-call)"],
      },
      {
        title: 'Technical Workshop Lead',
        organization: 'IEEE uOttawa Student Branch',
        period: 'Mar 2026',
        details: [
          'Delivered 4 technical workshops to 100+ students across a two-week series',
          'Taught Linux fundamentals, Docker, GitHub Actions CI/CD, AI/ML, and cybersecurity',
          'Built a lab environment of isolated per-student Docker containers with custom challenges',
        ],
      },
      {
        title: 'Software Developer Student',
        organization: 'uOttawa MSA',
        period: 'Dec 2025 — Apr 2026',
        details: [
          'Built uomsa.ca in Next.js, eliminating the GoDaddy builder and cutting annual costs by $500',
          'Worked on an 8-developer Agile team building a library system supporting 1,000+ students across 5 organizations',
          "Built React components and shipped PostgreSQL migrations for the admin dashboard",
        ],
      },
      {
        title: 'Software Developer & Security Analyst',
        organization: 'Journale AI',
        period: 'Oct 2025 — Jan 2026 · Contract',
        details: [
          'Built a cloud AI dialogue system that plugs into game engines through custom SDKs',
          'Diagnosed backend and REST APIs to discover 6 critical flaws using Burp Suite, Postman, and cURL',
          'Fixed a Stripe integration flaw that bypassed payment and granted subscriptions, in under 5 hours',
          'Validated risks with the engineering team and recommended remediation under responsible disclosure',
        ],
      },
    ],
  },
  {
    category: 'volunteer',
    roles: [
      {
        title: 'Co-Founder & Co-President',
        organization: 'Empower Orphans Foundation',
        period: 'Mar 2025 — Present',
        details: [
          'Lead a 20+ member team across marketing, events, and sponsorship divisions',
          'Organized fundraisers and collaborations with Islamic Relief for orphan care',
          'Oversee partnerships, finance tracking, and organizational strategy across Carleton and uOttawa',
        ],
      },
      {
        title: 'Web Developer',
        organization: 'Empower Orphans Foundation',
        period: 'Sep 2025 — Present',
        details: [
          'Built empowerorphans.com with Next.js, Supabase, and Tailwind CSS',
          'Shipped a secure admin dashboard and event-management system for real-time updates',
          'Deployed for cross-campus use across the Carleton and uOttawa chapters',
        ],
      },
      {
        title: 'Web Security',
        organization: 'CUMSA',
        details: ['Security audit, fixes, and authentication logic for cumsa.ca'],
      },
    ],
  },
]

function useActiveGroup(count: number) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // The active group is the last one whose top has crossed the viewport middle.
    const update = () => {
      const mid = window.innerHeight / 2
      let index = 0
      refs.current.slice(0, count).forEach((node, i) => {
        if (node && node.getBoundingClientRect().top <= mid) index = i
      })
      setActive(index)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [count])

  return { active, refs }
}

function CategoryRail({
  active,
  onSelect,
}: {
  active: number
  onSelect: (index: number) => void
}) {
  return (
    <nav aria-label="About sections" className="flex flex-col gap-6">
      {groups.map((group, index) => {
        const isActive = index === active
        return (
          <button
            key={group.category}
            onClick={() => onSelect(index)}
            className="group flex items-center gap-4 text-left"
          >
            <span
              className={`h-0.5 bg-accent-yellow transition-all duration-500 ${
                isActive ? 'w-10 opacity-100' : 'w-4 opacity-25'
              }`}
            />
            <span
              className={`font-display text-3xl lg:text-4xl uppercase transition-colors duration-500 ${
                isActive
                  ? 'text-accent-yellow'
                  : 'text-dark-tertiary group-hover:text-light-secondary'
              }`}
            >
              {group.category}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default function About() {
  const { active, refs } = useActiveGroup(groups.length)

  const handleHashLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')
    if (!href || !href.startsWith('#')) return

    const target = document.getElementById(href.slice(1))
    if (!target) return

    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', href)
  }

  const renderDetail = (item: Detail, index: number) => (
    <li key={index} className="text-sm md:text-base text-light-primary opacity-80 leading-relaxed">
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
    <section id="about" className="relative py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase mb-4">
            <span className="text-accent-yellow">{'//'}</span> The Story So Far
          </h2>
          <div className="w-24 h-1 bg-accent-yellow" />
        </motion.div>

        <div className="md:grid md:grid-cols-[14rem_1fr] md:gap-12 lg:gap-20">
          {/* Sticky category nav — desktop only */}
          <div className="hidden md:block">
            <div className="sticky top-32">
              <CategoryRail
                active={active}
                onSelect={(index) => {
                  refs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              />
            </div>
          </div>

          {/* Entries */}
          <div className="min-w-0 space-y-16 md:space-y-24">
            {groups.map((group, groupIndex) => (
              <div
                key={group.category}
                data-index={groupIndex}
                ref={(node) => {
                  refs.current[groupIndex] = node
                }}
              >
                {/* Mobile-only category heading */}
                <h3 className="md:hidden font-display text-4xl uppercase text-accent-yellow opacity-80 mb-6">
                  {group.category}
                </h3>

                <div className="space-y-10 md:space-y-12">
                  {group.roles.map((role, roleIndex) => (
                    <motion.div
                      key={`${role.organization}-${role.title}`}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ delay: roleIndex * 0.06, duration: 0.5 }}
                    >
                      <h4 className="text-lg leading-8 flex flex-wrap items-baseline gap-x-2">
                        <span className="bg-accent-yellow text-dark-primary px-1.5 py-0.5 text-base font-medium">
                          {role.title}
                        </span>
                        <span className="text-accent-yellow text-base">@{role.organization}</span>
                      </h4>

                      {role.period && (
                        <p className="text-xs md:text-sm font-normal tracking-wider mt-2 uppercase text-light-secondary">
                          {role.period}
                        </p>
                      )}

                      {!!role.details.length && (
                        <ul className="mt-3 pl-5 list-disc space-y-1.5 max-w-2xl">
                          {role.details.map(renderDetail)}
                        </ul>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
