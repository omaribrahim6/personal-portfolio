'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMotionPreference } from '../useMotionPreference'
import type { Engine, Station } from '../world/engine'
import styles from './Voyage.module.css'

// The world behind the page: one canvas the size of the window, and the engine that draws it. The stops are
// built one after another once the page is up, nearest first. The page's sections and cards tell it where
// each stop is in the scroll; the cards can talk back to the stops (pull a lever, pick a filter) through
// the context, and hear about clicks in the world.

type Builder = (engine: Engine) => Promise<Station>
const STOPS: [string, () => Promise<{ default: Builder }>][] = [
  ['home', () => import('../world/stations/arrival')],
  ['about', () => import('../world/stations/garden')],
  ['projects', () => import('../world/stations/workshops')],
  ['awards', () => import('../world/stations/station')],
  ['skills', () => import('../world/stations/glasshouse')],
  ['interests', () => import('../world/stations/islands')],
  ['contact', () => import('../world/stations/pier')],
]

type Bus = {
  /** Tell a stop something. */
  tell: (id: string, name: string, value: string) => void
  /** Hear what the world says (something clicked in it). */
  hear: (listener: (name: string, value: string) => void) => () => void
  /** Where a named place in a stop is on screen, each frame. */
  follow: (id: string, name: string, at: (x: number, y: number, seen: boolean) => void) => () => void
  ready: boolean
  failed: boolean
}
const WorldContext = createContext<Bus>({ tell: () => {}, hear: () => () => {}, follow: () => () => {}, ready: false, failed: false })
export const useWorld = () => useContext(WorldContext)

export default function World({ children }: { children: ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<Engine | null>(null)
  const listeners = useRef(new Set<(name: string, value: string) => void>())
  const followers = useRef(new Set<{ id: string; name: string; at: (x: number, y: number, seen: boolean) => void }>())
  // What the cards have said, kept so that stops built later hear it too.
  const said = useRef(new Map<string, [string, string, string]>())
  const reduced = useMotionPreference()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let cancelled = false, frame = 0
    let unlisten = () => {}
    const measure = () => {
      const made = engine.current
      if (!made) return
      const sections = [...document.querySelectorAll<HTMLElement>('[data-stop]')].map(section => {
        const box = section.getBoundingClientRect()
        const top = box.top + window.scrollY
        const beats = [...section.querySelectorAll<HTMLElement>('[data-beat]')].map(beat => {
          const b = beat.getBoundingClientRect()
          return b.top + window.scrollY - top + b.height / 2
        })
        return { id: section.dataset.stop!, top, height: box.height, beats }
      })
      made.measure(sections, window.innerHeight)
    }
    const onScroll = () => engine.current?.scrollTo(window.scrollY)
    const onResize = () => { engine.current?.resize(); measure() }
    const observer = new ResizeObserver(measure)

    void (async () => {
      try {
        if (!document.createElement('canvas').getContext('webgl2')) throw new Error('no WebGL 2')
        const { Engine } = await import('../world/engine')
        if (cancelled) return
        const made = new Engine(el, window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        engine.current = made
        unlisten = made.listen((name, value) => listeners.current.forEach(listener => listener(name, value)))
        measure()
        made.scrollTo(window.scrollY, true)
        observer.observe(document.body)
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onResize)
        // The labels pinned to places in the world, moved every frame.
        const follow = () => {
          frame = requestAnimationFrame(follow)
          for (const f of followers.current) {
            const at = made.locate(f.id, f.name)
            f.at(at?.x ?? 0, at?.y ?? 0, !!at)
          }
        }
        follow()
        for (const [, load] of STOPS) {
          const station = await (await load()).default(made)
          if (cancelled) return
          made.add(station)
          for (const [id, name, value] of said.current.values()) if (id === station.id) made.set(id, name, value)
          measure()
          setReady(true)
        }
      } catch (error) {
        console.warn(`The world could not be drawn here. ${error instanceof Error ? error.message : ''}`)
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      unlisten()
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      engine.current?.dispose()
      engine.current = null
    }
  }, [])

  const bus = useMemo<Bus>(() => ({
    tell: (id, name, value) => {
      engine.current?.set(id, name, value)
      said.current.set(`${id}|${name}`, [id, name, value])
    },
    hear: listener => { listeners.current.add(listener); return () => { listeners.current.delete(listener) } },
    follow: (id, name, at) => { const f = { id, name, at }; followers.current.add(f); return () => { followers.current.delete(f) } },
    ready,
    failed,
  }), [ready, failed])

  return (
    <WorldContext.Provider value={bus}>
      <canvas ref={canvas} className={styles.world} data-ready={ready} data-reduced={reduced} aria-hidden="true" />
      {children}
    </WorldContext.Provider>
  )
}
