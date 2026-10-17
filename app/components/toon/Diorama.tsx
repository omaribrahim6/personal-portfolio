'use client'

import { useEffect, useRef, useState } from 'react'
import { useMotionPreference } from '../useMotionPreference'
import type { Diorama as Scene, Hung } from './gallery'

// A drawn picture on the page. The scene and the renderer load only once the page is up, and the scene is
// drawn only while it is on screen. Until then (and wherever WebGL is missing) the canvas is simply empty, so
// whatever sits behind it has to read on its own.

const load = {
  cover: () => import('./scenes/cover'),
  evening: () => import('./scenes/cover').then(module => ({ default: () => module.default('evening') })),
  signal: () => import('./scenes/signal'),
  cascade: () => import('./scenes/cascade'),
  trail: () => import('./scenes/trail'),
  reflection: () => import('./scenes/reflection'),
} satisfies Record<string, () => Promise<{ default: () => Scene }>>

export type SceneName = keyof typeof load

export default function Diorama({ scene, state, className, onAnchors }: {
  scene: SceneName
  state?: string
  className?: string
  /** Called every frame with where the scene's anchors are, as fractions of the canvas. */
  onAnchors?: (anchors: Record<string, { x: number; y: number }>) => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const live = useRef<{ scene: Scene; hung: Hung } | null>(null)
  const reduced = useMotionPreference()
  const [ready, setReady] = useState(false)
  const stateRef = useRef(state)
  const anchorsRef = useRef(onAnchors)
  const reducedRef = useRef(reduced)
  useEffect(() => { stateRef.current = state; anchorsRef.current = onAnchors; reducedRef.current = reduced })

  useEffect(() => {
    let cancelled = false
    let frame = 0
    const el = canvas.current
    if (!el) return
    void Promise.all([import('./gallery'), load[scene]()]).then(([gallery, module]) => {
      if (cancelled) return
      const made = module.default()
      if (stateRef.current !== undefined) made.set?.(stateRef.current)
      const hung = gallery.hang(el, made, { still: reducedRef.current })
      live.current = { scene: made, hung }
      setReady(gallery.supported())
      if (made.anchors) {
        const names = Object.keys(made.anchors)
        const follow = () => {
          frame = requestAnimationFrame(follow)
          const report = anchorsRef.current
          if (!report) return
          const box = el.getBoundingClientRect()
          if (box.bottom < 0 || box.top > window.innerHeight) return
          const out: Record<string, { x: number; y: number }> = {}
          for (const name of names) { const at = gallery.locate(made, name); if (at) out[name] = at }
          report(out)
        }
        follow()
      }
    })

    function onMove(event: PointerEvent) {
      const box = el!.getBoundingClientRect()
      if (box.bottom < 0 || box.top > window.innerHeight) return
      const x = (event.clientX - box.left) / box.width * 2 - 1
      const y = 1 - (event.clientY - box.top) / box.height * 2
      live.current?.scene.pointer?.(Math.max(-1.5, Math.min(1.5, x)), Math.max(-1.5, Math.min(1.5, y)))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      live.current?.hung.remove()
      live.current = null
    }
  }, [scene])

  useEffect(() => { live.current?.hung.still(reduced) }, [reduced])
  useEffect(() => {
    if (state === undefined || !live.current) return
    live.current.scene.set?.(state)
    live.current.hung.redraw()
  }, [state])

  return <canvas ref={canvas} className={className} data-ready={ready} aria-hidden="true" />
}
