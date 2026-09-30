'use client'

import { MotionConfig } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { chapters } from '../content'
import MiniOmar from './mini/MiniOmar'
import Nav from './Nav'
import Sky from './sky/Sky'
import { scenes, type SceneName } from './paint/scenes'
import { useMotionPreference } from './useMotionPreference'
import { world } from './scroll'
import styles from './World.module.css'

const clamp = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Everything that depends on where the page is scrolled to is worked out here, once per frame:
 * which sky to paint, where the figure is standing, what the header is sitting on, and which chapter is open.
 */
export default function World({ children }: { children: ReactNode }) {
  const reduced = useMotionPreference()
  const [active, setActive] = useState<string>('home')
  const [tone, setTone] = useState<'dark' | 'light'>('dark')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    let plates: HTMLElement[] = [], terrains: HTMLElement[] = [], zones: HTMLElement[] = []
    function collect() {
      plates = [...document.querySelectorAll<HTMLElement>('[data-plate]')]
      terrains = [...document.querySelectorAll<HTMLElement>('[data-terrain]')]
      zones = [...document.querySelectorAll<HTMLElement>('[data-tone]')]
    }

    function update() {
      frame = 0
      const vh = window.innerHeight

      // The sky: each plate pulls the sky toward its own as it comes up from below.
      let chapter = 0, visible = false
      plates.forEach((plate, index) => {
        const box = plate.getBoundingClientRect()
        // Done by the time its title is well into view; not yet begun while it is still below the fold.
        if (index > 0) chapter += clamp((vh - box.top) / (vh * .62))
        if (box.top < vh && box.bottom > 0) visible = true
      })
      world.chapter = chapter
      world.skyVisible = visible

      // The figure: a few steps along the ground for every plate that scrolls past.
      for (const terrain of terrains) {
        const box = terrain.getBoundingClientRect()
        if (box.bottom < -40 || box.top > vh + 40) continue
        const scene = scenes[terrain.dataset.terrain as SceneName]
        const figure = terrain.querySelector<HTMLElement>('[data-wanderer]')
        if (!scene.ground || !scene.walk || !figure) continue
        const along = reduced ? .5 : clamp((vh - box.top) / (vh + box.height))
        const t = scene.walk[0] + (scene.walk[1] - scene.walk[0]) * along
        const x = t * box.width
        figure.style.transform = `translate3d(${x.toFixed(1)}px, ${(scene.ground(t, box.width, box.height) * box.height).toFixed(1)}px, 0) translate(-50%, -97%)`
        figure.dataset.step = String(Math.floor(x / 7) % 2)
        figure.dataset.placed = 'true'
      }

      // The header: light or dark, depending on what is behind it right now.
      let under: 'dark' | 'light' = 'dark'
      for (const zone of zones) {
        const box = zone.getBoundingClientRect()
        if (box.top <= 36 && box.bottom > 36) under = zone.dataset.tone as 'dark' | 'light'
      }
      for (const terrain of terrains) {
        const box = terrain.getBoundingClientRect()
        if (box.top > 36 || box.bottom <= 36) continue
        const scene = scenes[terrain.dataset.terrain as SceneName]
        under = scene.tone ? scene.tone((36 - box.top) / box.height) : 'dark'
      }
      setTone(under)

      let current = 'home'
      for (const { id } of chapters) {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= vh * .4) current = id
      }
      const max = document.documentElement.scrollHeight - vh
      if (window.scrollY >= max - 8) current = 'contact'
      setActive(current)
      setProgress(max > 0 ? Math.round(clamp(window.scrollY / max) * 40) / 40 : 0)
    }

    function schedule() { if (!frame) frame = requestAnimationFrame(update) }
    function remeasure() { collect(); schedule() }
    const observer = new ResizeObserver(remeasure)
    observer.observe(document.body)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure)
    collect()
    update()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', remeasure)
    }
  }, [reduced])

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <a className={styles.skip} href="#projects">Skip to selected work</a>
      <Sky />
      <Nav active={active} tone={tone} progress={progress} />
      <div className={styles.page}>{children}</div>
      <MiniOmar />
    </MotionConfig>
  )
}
