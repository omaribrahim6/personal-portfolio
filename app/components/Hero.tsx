'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

const PIXEL_FONT: Record<string, number[][] | null> = {
  O: [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  M: [
    [1,0,0,0,1],
    [1,1,0,1,1],
    [1,0,1,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  A: [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  R: [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,1,0,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
  ],
  I: [
    [0,1,1,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,1,1,0],
  ],
  B: [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
  ],
  H: [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  ' ': null,
}

type Phase = 'intro' | 'settling' | 'calm'

function usePixelSize() {
  const [size, setSize] = useState(13)
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      setSize(w >= 1280 ? 16 : w >= 1024 ? 13 : w >= 768 ? 10 : w >= 640 ? 8 : 6)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

function FlickerSquare({ size, phase }: { size: number; phase: Phase }) {
  const [params] = useState(() => {
    const isActiveFlickerer = Math.random() < 0.06

    // Intro: fast chaotic startup
    const introOps: number[] = [1]
    for (let i = 0; i < 20; i++) {
      const r = Math.random()
      introOps.push(r < 0.32 ? Math.random() * 0.07 : r < 0.52 ? 0.35 + Math.random() * 0.5 : 1)
    }

    // Calm: long stretches of full brightness, sudden brief cuts — like a dying fluorescent tube
    const calmOps = [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0.03, 1,               // sharp cut, snap back
      0.06, 0.9, 1,          // double-flicker
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0.02, 0.8, 1,          // another event with slight wobble
      1, 1, 1, 1, 1, 1, 1, 1,
      0.04, 1,               // single quick cut
      1, 1, 1, 1, 1, 1, 1,
    ]

    return {
      isActiveFlickerer,
      introDelay: Math.random() * 0.7,
      introDuration: 0.1 + Math.random() * 0.4,
      introOps,
      calmDelay: Math.random() * 8,
      calmDuration: 14 + Math.random() * 16,
      calmOps,
    }
  })

  const style = {
    width: size,
    height: size,
    borderRadius: Math.max(2, Math.round(size * 0.3)),
    backgroundColor: '#FFD700',
    flexShrink: 0 as const,
  }

  if (phase === 'intro') {
    return (
      <motion.div
        style={style}
        animate={{ opacity: params.introOps }}
        transition={{
          duration: params.introDuration,
          delay: params.introDelay,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    )
  }

  // Settling phase: all squares smoothly power up to full brightness
  if (phase === 'settling') {
    return (
      <motion.div
        style={style}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    )
  }

  // Calm phase: most squares are static, ~6% continue to flicker
  if (!params.isActiveFlickerer) {
    return <div style={{ ...style, opacity: 1 }} />
  }

  return (
    <motion.div
      style={style}
      animate={{ opacity: params.calmOps }}
      transition={{
        duration: params.calmDuration,
        delay: params.calmDelay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}

function PixelLetter({
  letter,
  size,
  index,
  phase,
}: {
  letter: string
  size: number
  index: number
  phase: Phase
}) {
  const grid = PIXEL_FONT[letter.toUpperCase()]
  const gap = Math.max(1, Math.round(size * 0.18))

  if (grid === undefined || grid === null) return null

  const cols = grid[0].length

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.07, duration: 0.45, type: 'spring', damping: 14, stiffness: 100 }}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gap: `${gap}px`,
        flexShrink: 0,
      }}
    >
      {grid.flat().map((pixel, i) =>
        pixel === 1 ? (
          <FlickerSquare key={i} size={size} phase={phase} />
        ) : (
          <div key={i} style={{ width: size, height: size, flexShrink: 0 }} />
        )
      )}
    </motion.div>
  )
}

function PixelName({ name }: { name: string }) {
  const size = usePixelSize()
  const [phase, setPhase] = useState<Phase>('intro')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('settling'), 1500)
    const t2 = setTimeout(() => setPhase('calm'), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const words = name.split(' ')
  const letterGap = Math.max(2, Math.round(size * 0.45))
  const wordGap = Math.max(8, Math.round(size * 2.5))
  const rowGap = Math.max(4, Math.round(size * 1.4))

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: `${rowGap}px`,
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      {words.map((word, wi) => (
        <div
          key={wi}
          style={{
            display: 'flex',
            gap: `${letterGap}px`,
            alignItems: 'flex-start',
            flexShrink: 0,
            marginRight: wi < words.length - 1 ? `${wordGap}px` : 0,
          }}
        >
          {word.split('').map((char, ci) => (
            <PixelLetter
              key={ci}
              letter={char}
              size={size}
              index={wi * 8 + ci}
              phase={phase}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function Hero() {
  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 sm:px-6 pt-20 pb-16 md:pt-0 md:pb-0 overflow-hidden max-w-full">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-accent-yellow rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl w-full">
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

        <div className="mb-6 md:mb-8">
          <PixelName name="OMAR IBRAHIM" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
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

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { delay: 1.8, duration: 0.6 },
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
