'use client'

import { MotionConfig, motion, useScroll } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import styles from './ExperienceShell.module.css'
import { useMotionPreference } from './useMotionPreference'

const chapters = [
  ['home', 'Hello'], ['about', 'The story'], ['projects', 'Selected work'],
  ['awards', 'Wins'], ['skills', 'The toolkit'], ['contact', 'Say hello'],
]

export default function ExperienceShell({ children }: { children: ReactNode }) {
  const [active, setActive] = useState('home')
  const reduced = useMotionPreference()
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      const readingLine = window.innerHeight * .35
      let current = 'home'
      for (const [id] of chapters) {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= readingLine) current = id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) current = 'contact'
      setActive(current)
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(schedule)
    observer.observe(document.body)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <a className={styles.skip} href="#projects">Skip to selected work</a>
      <motion.div className={styles.progress} style={{ scaleX: scrollYProgress }} aria-hidden="true" />
      <nav className={styles.chapters} aria-label="Page chapters">
        {chapters.map(([id, label], index) => (
          <a key={id} href={`#${id}`} aria-label={label} aria-current={active === id ? 'location' : undefined}>
            <span className={styles.mark} aria-hidden="true" />
            <span className={styles.chapterLabel}><small>0{index + 1}</small> {label}</span>
          </a>
        ))}
      </nav>
      {children}
    </MotionConfig>
  )
}
