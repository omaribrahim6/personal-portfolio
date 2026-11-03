'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { competitions } from '../content'
import { useMotionPreference } from './useMotionPreference'
import type { IslandStage, Outfit } from './islands/stage'
import styles from './site.module.css'

// Off the clock: the 3D Omars, each on an island doing the thing, picked one at a time. On the outdoors
// island he changes outfits by himself every few seconds. Without WebGL the words still work.

const OUTFITS: Outfit[] = ['hike', 'bike', 'paddle']
const CHANGE = 4500 // ms in each outfit

const STEPS: { label: string; island: number; outfits?: boolean; line: ReactNode }[] = [
  { label: 'Outdoors', island: 0, outfits: true, line: 'I hike, ride trails on a mountain bike, and get out on a paddleboard or in a kayak.' },
  { label: 'Competing', island: 1, line: `${competitions.length} hackathons and CTFs, and I came away with something from every one.` },
  { label: 'Making games', island: 2, line: <>I build games on Roblox. <a href="https://www.roblox.com/games/81999621480692/Downhill" target="_blank" rel="noopener noreferrer">Downhill</a> is out now.</> },
  { label: 'Security', island: 3, line: 'Breaking in, with permission.' },
  { label: 'Soccer', island: 4, line: 'I play every week. Liverpool, always.' },
]

// The fog fades into the page colour, which changes with the theme.
const ground = () => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()

export default function Islands() {
  const reduced = useMotionPreference()
  const [active, setActive] = useState(0)
  const [ready, setReady] = useState(false)
  const [flat, setFlat] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<IslandStage | null>(null)
  const [pointing, setPointing] = useState(false)
  const step = STEPS[active]

  // Three.js and the first model are fetched only once the islands are close.
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let cancelled = false, started = false
    const begin = async () => {
      started = true
      try {
        if (!document.createElement('canvas').getContext('webgl2')) throw new Error('This browser has no WebGL 2.')
        const { IslandStage } = await import('./islands/stage')
        if (cancelled) return
        const made = new IslandStage(el, reduced)
        stage.current = made
        made.ground(ground())
        made.resize()
        await made.ready
        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) setFlat(true)
      }
    }
    const approach = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !started) void begin()
    }, { rootMargin: '80% 0px' })
    approach.observe(el)
    const resize = new ResizeObserver(() => stage.current?.resize())
    resize.observe(el)
    const recolour = () => stage.current?.ground(ground())
    const theme = new MutationObserver(recolour)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const scheme = matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', recolour)
    return () => {
      cancelled = true
      approach.disconnect()
      resize.disconnect()
      theme.disconnect()
      scheme.removeEventListener('change', recolour)
      stage.current?.dispose()
      stage.current = null
    }
  }, [reduced])

  useEffect(() => {
    stage.current?.go(step.island)
  }, [step, ready])

  // Hiking, then biking, then paddling, round and round while the outdoors island is up.
  useEffect(() => {
    if (!ready || !step.outfits || reduced) return
    let next = 1
    const timer = window.setInterval(() => {
      stage.current?.dress(OUTFITS[next])
      next = (next + 1) % OUTFITS.length
    }, CHANGE)
    return () => {
      window.clearInterval(timer)
      stage.current?.dress(OUTFITS[0])
    }
  }, [step, ready, reduced])

  return (
    <section id="interests" className={styles.section} aria-labelledby="interests-title">
      <h2 id="interests-title" className={styles.label}>Interests</h2>
      <div className={styles.islandStage}>
        <div className={styles.islandWords}>
          <div className={styles.picks} role="group" aria-label="Interests">
            {STEPS.map((each, index) => (
              <button key={each.label} type="button" aria-pressed={index === active} onClick={() => setActive(index)}>{each.label}</button>
            ))}
          </div>
          <p aria-live="polite">{step.line}</p>
        </div>
        <div className={styles.world} data-ready={ready} data-flat={flat}>
          <canvas ref={canvas} aria-hidden="true" data-pointing={pointing}
            onPointerMove={event => { const over = !!stage.current?.hits(event.clientX, event.clientY); if (over !== pointing) setPointing(over) }}
            onPointerLeave={() => setPointing(false)}
            onClick={event => { if (stage.current?.hits(event.clientX, event.clientY)) stage.current.poke() }} />
        </div>
      </div>
    </section>
  )
}
