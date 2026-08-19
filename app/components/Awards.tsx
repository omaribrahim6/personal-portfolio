'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

type Award = {
  result: string
  event: string
  detail: string
  date: string
}

const awards: Award[] = [
  {
    result: 'Best Use of Gemini',
    event: 'cuHacking 2026',
    detail:
      'Built Clascade with a team of four — turning teachers’ existing slide decks into collaborative 3D lessons.',
    date: 'Jul 2026',
  },
  {
    result: 'Engineer of the Year',
    event: 'IEEE uOttawa Student Branch',
    detail: 'Awarded at WIPS 2026.',
    date: 'Apr 2026',
  },
  {
    result: '1st Place',
    event: 'uOttawa Cybersecurity Club CTF',
    detail:
      'Won as a team and posted the highest individual score in the room, across web, crypto, and reverse engineering.',
    date: 'Apr 2026',
  },
  {
    result: 'Most Flags Found',
    event: 'BSides Ottawa Meetup CTF',
    detail:
      'Orchestrated parallel AI sub-agents across the challenge board and led the field at ~4000 points, before an unconstrained agent spent ~1000 of them on hints. Finished 5th with the most flags found.',
    date: 'Apr 2026',
  },
  {
    result: 'Winner — Moorcheh.ai Track',
    event: 'GenAI Genesis 2026',
    detail:
      'Canada’s largest AI hackathon. Built Revenant in 36 hours against 1,000+ hackers at the University of Toronto.',
    date: 'Mar 2026',
  },
  {
    result: '1st Place',
    event: 'IEEE uOttawa × Hack The Box CTF',
    detail: 'Team finished with 64 of 67 flags. 2nd individually at 40.',
    date: 'Feb 2026',
  },
  {
    result: '2nd Place',
    event: 'Hack the Future Hackathon',
    detail: 'Built RoadSense, an AI road-damage detection system, with a team of four.',
    date: 'Feb 2026',
  },
]

function AwardRow({ award, index }: { award: Award; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="group grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-x-8 gap-y-2 border-t border-dark-tertiary py-6 md:py-8 transition-colors duration-300 hover:border-accent-yellow"
    >
      <div className="min-w-0">
        <h3 className="font-display text-2xl md:text-4xl uppercase tracking-wide text-accent-yellow">
          {award.result}
        </h3>
        <p className="mt-1 text-base md:text-xl text-light-primary font-medium">
          {award.event}
        </p>
        <p className="mt-2 text-sm md:text-base text-light-secondary leading-relaxed max-w-3xl">
          {award.detail}
        </p>
      </div>

      <p className="text-sm md:text-base uppercase tracking-wider text-light-secondary md:text-right md:pt-3 whitespace-nowrap">
        {award.date}
      </p>
    </motion.li>
  )
}

export default function Awards() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="awards" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase mb-4">
            <span className="text-accent-yellow">{'//'}</span> wins
          </h2>
          <p className="text-light-secondary text-lg md:text-xl">
            hackathons, CTFs, and one award I didn&apos;t see coming
          </p>
          <div className="w-24 h-1 bg-accent-yellow mt-4" />
        </motion.div>

        <ul className="border-b border-dark-tertiary">
          {awards.map((award, index) => (
            <AwardRow key={`${award.event}-${award.result}`} award={award} index={index} />
          ))}
        </ul>
      </div>
    </section>
  )
}
