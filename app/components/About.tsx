'use client'

import { motion } from 'framer-motion'
import { useState, type MouseEvent } from 'react'

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
      {
        title: 'Software Developer Student',
        organization: 'uOttawa MSA',
        period: 'Dec 2025 — Apr 2026',
        details: [
          'Built uomsa.ca in Next.js, eliminating the GoDaddy builder and cutting annual costs by $500',
          'Worked on an 8-developer Agile team building a library system supporting 1,000+ students across 5 organizations',
          'Built React components and shipped PostgreSQL migrations for the admin dashboard',
        ],
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
        title: 'Penetration Tester',
        organization: 'cuHacking',
        period: 'Mar 2026 — Apr 2026',
        details: ["Security testing across Canada's largest student-run hackathon platform (on-call)"],
      },
      {
        title: 'Penetration Tester',
        organization: 'BearHacks',
        period: 'Apr 2026',
        details: ['Security testing for the event platform ahead of launch (remote, on-call)'],
      },
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
    ],
  },
  {
    category: 'volunteer',
    roles: [
      {
        title: 'Co-Founder & Co-President',
        organization: 'Empower Orphans Foundation',
        period: 'Mar 2025 — Apr 2026',
        details: [
          'Lead a 20+ member team across marketing, events, and sponsorship divisions',
          'Organized fundraisers and collaborations with Islamic Relief for orphan care',
          'Oversee partnerships, finance tracking, and organizational strategy across Carleton and uOttawa',
        ],
      },
      {
        title: 'Web Developer',
        organization: 'Empower Orphans Foundation',
        period: 'Sep 2025 — Apr 2026',
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

function RoleCard({ role }: { role: Role }) {
  const handleHashLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')
    if (!href || !href.startsWith('#')) return

    const target = document.getElementById(href.slice(1))
    if (!target) return

    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', href)
  }

  return (
    <div className="h-full bg-dark-secondary p-5 md:p-6 rounded-lg border border-dark-tertiary hover:border-accent-yellow transition-colors duration-300 flex flex-col">
      <h3 className="text-base md:text-lg leading-snug font-medium text-light-primary">
        {role.title}
      </h3>
      <p className="mt-1 text-accent-yellow text-sm md:text-base">@{role.organization}</p>

      {role.period && (
        <p className="mt-2 text-xs tracking-wider uppercase text-light-secondary">
          {role.period}
        </p>
      )}

      {!!role.details.length && (
        <ul className="mt-4 pl-4 list-disc space-y-1.5">
          {role.details.map((item, index) => (
            <li
              key={index}
              className="text-sm text-light-primary opacity-80 leading-relaxed"
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
          ))}
        </ul>
      )}
    </div>
  )
}

export default function About() {
  const [activeTab, setActiveTab] = useState(1) // default to experience — the meat

  const activeGroup = groups[activeTab]

  return (
    <section id="about" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-12"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase mb-4">
            <span className="text-accent-yellow">{'//'}</span> The Story So Far
          </h2>
          <div className="w-24 h-1 bg-accent-yellow" />
        </motion.div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="About categories"
          className="flex gap-6 sm:gap-10 mb-8 md:mb-10 border-b border-dark-tertiary"
        >
          {groups.map((group, index) => {
            const isActive = index === activeTab
            return (
              <button
                key={group.category}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(index)}
                className={`relative pb-3 font-display text-2xl sm:text-3xl md:text-4xl uppercase transition-colors duration-300 ${
                  isActive ? 'text-accent-yellow' : 'text-dark-tertiary hover:text-light-secondary'
                }`}
              >
                {group.category}
                {isActive && (
                  <motion.span
                    layoutId="about-tab-underline"
                    className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent-yellow"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Active group */}
        <motion.div
          key={activeGroup.category}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`grid gap-4 md:gap-6 ${
            activeGroup.roles.length > 1 ? 'md:grid-cols-2' : 'md:max-w-2xl'
          }`}
        >
          {activeGroup.roles.map((role) => (
            <RoleCard key={`${role.organization}-${role.title}`} role={role} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
