'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function Hero() {
  const name = "OMAR IBRAHIM"
  const letters = name.split("")

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.3,
      },
    },
  }

  const child = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  }

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 sm:px-6 pt-20 pb-16 md:pt-0 md:pb-0 overflow-hidden max-w-full">
      {/* Background decorative element */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-accent-yellow rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        {/* Small intro text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 md:mb-8"
        >
          <p className="text-2xl md:text-3xl text-light-secondary font-body">
            hi, my name is
          </p>
        </motion.div>

        {/* Large animated name */}
        <motion.h1
          variants={container}
          initial="hidden"
          animate="visible"
          className="font-display text-[clamp(4.5rem,14vw,12rem)] font-bold leading-none mb-4 md:mb-6 flex flex-wrap overflow-hidden w-full"
        >
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              variants={child}
              className={`hover:text-accent-yellow transition-colors duration-300 ${letter === ' ' ? 'w-3 sm:w-4 md:w-6 lg:w-8' : ''}`}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </motion.h1>

        {/* Bio with yellow highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="max-w-3xl"
        >
          <p className="text-xl sm:text-2xl md:text-2xl lg:text-3xl text-light-primary font-body leading-relaxed">
            A <span className="text-accent-yellow font-semibold">developer</span> who creates{' '}
            <span className="text-accent-yellow font-semibold">secure</span> and{' '}
            <span className="text-accent-yellow font-semibold">elegant</span> digital experiences.
          </p>
          <p className="text-base md:text-xl text-light-secondary mt-4 md:mt-4">
            Building and securing modern web applications.
          </p>
        </motion.div>

        {/* Mobile social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8 flex gap-4 md:hidden"
        >
          <a
            href="https://github.com/omaribrahim6"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 text-base bg-dark-secondary hover:bg-accent-yellow text-light-primary hover:text-dark-primary rounded-lg transition-all duration-300"
          >
            GitHub
          </a>
          <a
            href="http://linkedin.com/in/omar-ibrahim-14825838a"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 text-base bg-dark-secondary hover:bg-accent-yellow text-light-primary hover:text-dark-primary rounded-lg transition-all duration-300"
          >
            LinkedIn
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { delay: 1.6, duration: 0.6 },
          y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
        }}
        onClick={scrollToAbout}
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 text-light-secondary hover:text-accent-yellow transition-colors duration-300"
        aria-label="Scroll down"
      >
        <ChevronDown className="w-7 h-7 md:w-8 md:h-8" />
      </motion.button>
    </section>
  )
}

