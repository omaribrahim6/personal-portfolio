'use client'

import { MotionConfig } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { chapters, pages } from '../content'
import Cursor from './Cursor'
import Folio from './Folio'
import MiniOmar from './mini/MiniOmar'
import { useMotionPreference } from './useMotionPreference'
import styles from './Almanac.module.css'

const clamp = (v: number) => Math.min(1, Math.max(0, v))

/**
 * The issue: the running header, the pages, and the small Omar in the corner. Where the reader is (which
 * section, and which page of it) is worked out here once a frame, for the folio at the top.
 */
export default function Almanac({ children }: { children: ReactNode }) {
  const reduced = useMotionPreference()
  const [active, setActive] = useState<string>('home')
  const [page, setPage] = useState(1)
  const [onCover, setOnCover] = useState(true)

  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      const vh = window.innerHeight
      const line = vh * .35
      let current: (typeof chapters)[number] = chapters[0], index = 0
      chapters.forEach((chapter, i) => {
        if ((document.getElementById(chapter.id)?.getBoundingClientRect().top ?? Infinity) <= line) { current = chapter; index = i }
      })
      const max = document.documentElement.scrollHeight - vh
      if (window.scrollY >= max - 8) { current = chapters[chapters.length - 1]; index = chapters.length - 1 }
      // The page number runs on through each section, from its first page to the next one's.
      const box = document.getElementById(current.id)?.getBoundingClientRect()
      const next = chapters[index + 1]?.page ?? pages + 1
      const through = box ? clamp((line - box.top) / Math.max(1, box.height)) : 0
      setActive(current.id)
      setPage(Math.min(pages, current.page + Math.floor(through * (next - current.page))))
      const cover = document.getElementById('home')?.getBoundingClientRect()
      setOnCover(!!cover && cover.bottom > 80)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <a className={styles.skip} href="#projects">Skip to the features</a>
      <Folio active={active} page={page} onCover={onCover} />
      <div className={styles.issue}>{children}</div>
      <MiniOmar />
      <Cursor />
    </MotionConfig>
  )
}
