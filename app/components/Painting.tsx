'use client'

import { useEffect, useRef } from 'react'
import { dissolve, scenes, type SceneName } from './paint/scenes'

/**
 * A canvas that paints one scene, once, at the size it is laid out at. It waits until it is near the
 * viewport, and repaints only if its box really changes, so scrolling never triggers any drawing.
 */
export default function Painting({ scene, dissolveOf, className }: { scene?: SceneName; dissolveOf?: string; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let near = false, painted = '', timer = 0

    function paint() {
      const W = el!.clientWidth, H = el!.clientHeight
      if (!near || !W || !H || painted === `${W}x${H}`) return
      painted = `${W}x${H}`
      // Sharp on dense screens, but never an unreasonable number of pixels.
      const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (W * H)))
      el!.width = Math.round(W * ratio)
      el!.height = Math.round(H * ratio)
      const ctx = el!.getContext('2d')
      if (!ctx) return
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (dissolveOf) dissolve(dissolveOf)(ctx, W, H)
      else if (scene) scenes[scene].paint(ctx, W, H)
      el!.dataset.painted = 'true'
    }

    const approach = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { near = true; paint() }
    }, { rootMargin: '120% 0px' })
    approach.observe(el)
    const resize = new ResizeObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(paint, 140)
    })
    resize.observe(el)

    return () => {
      window.clearTimeout(timer)
      approach.disconnect()
      resize.disconnect()
    }
  }, [scene, dissolveOf])

  return <canvas ref={canvas} className={className} aria-hidden="true" />
}
