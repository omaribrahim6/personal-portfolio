'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const skillCategories = [
  {
    title: 'Languages',
    skills: ['JavaScript', 'TypeScript', 'Python', 'C++', 'HTML/CSS'],
  },
  {
    title: 'Frameworks & Libraries',
    skills: ['Next.js', 'React', 'Node.js', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    title: 'Tools & Technologies',
    skills: ['Docker', 'CI/CD', 'GitHub Actions', 'Supabase', 'PostgreSQL', 'Cloudflare', 'API Development'],
  },
  {
    title: 'Security',
    skills: ['Penetration Testing', 'Ethical Hacking'],
  },
]

function SkillCategory({ category, index }: { category: typeof skillCategories[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="mb-12"
    >
      <h3 className="font-display text-2xl md:text-3xl uppercase mb-6 text-accent-yellow tracking-wide">
        {category.title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {category.skills.map((skill, skillIndex) => (
          <motion.div
            key={skill}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ delay: index * 0.1 + skillIndex * 0.05, duration: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-dark-secondary px-4 py-3 rounded-lg border border-dark-tertiary hover:border-accent-yellow transition-all duration-300 text-center cursor-pointer group"
          >
            <span className="text-light-primary font-medium group-hover:text-accent-yellow transition-colors duration-300">
              {skill}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Skills() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="skills" className="min-h-screen py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase mb-4">
            <span className="text-accent-yellow">{'//'}</span> skills & tools
          </h2>
          <p className="text-light-secondary text-lg md:text-xl">
            technologies I work with
          </p>
          <div className="w-24 h-1 bg-accent-yellow mt-4" />
        </motion.div>

        <div>
          {skillCategories.map((category, index) => (
            <SkillCategory key={category.title} category={category} index={index} />
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 p-6 bg-dark-secondary rounded-lg border border-dark-tertiary"
        >
          <p className="text-light-primary leading-relaxed">
            <span className="text-accent-yellow font-semibold">Always learning.</span> I&apos;m constantly 
            exploring new technologies and staying up-to-date with the latest trends in web development. 
            Currently diving deeper into systems programming and distributed systems.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

