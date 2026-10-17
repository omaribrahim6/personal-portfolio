'use client'

import { useEffect, useRef } from 'react'
import { useMotionPreference } from './useMotionPreference'
import styles from './Cursor.module.css'

// A pen where the pointer is: a brass-banded fountain pen nib, its point on the spot. As it moves it draws
// a line in the same ink as the drawings, thick where it goes slowly and thin where it is flicked, which
// dries and fades behind it. Over anything that can be pressed the nib turns and a ring of ink spreads under
// it. Only for a mouse or trackpad: touch screens have no pointer to draw, and with reduced motion the
// ordinary cursor stays. Text boxes keep their own cursor, so it is still clear where you will type.

type Dot = { x: number; y: number; w: number; t: number }

const INTERACTIVE = 'a, button, summary, label, select, [role="button"], [role="tab"], [data-cursor="hover"]'
const LIFE = 520 // ms before a stretch of line has faded

export default function Cursor() {
  const reduced = useMotionPreference()
  const pen = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduced) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const el = pen.current, layer = canvas.current
    const ctx = layer?.getContext('2d')
    if (!fine.matches || !el || !layer || !ctx) return

    const root = document.documentElement
    const dots: Dot[] = []
    const at = { x: -100, y: -100, seen: false, w: 2.4 }
    let frame = 0, size = 1, width = 0, height = 0

    function resize() {
      size = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      layer!.width = width * size
      layer!.height = height * size
      ctx!.setTransform(size, 0, 0, size, 0, 0)
    }

    function tick(now: number) {
      ctx!.clearRect(0, 0, width, height)
      while (dots.length && now - dots[0].t > LIFE) dots.shift()
      // The line as a run of short strokes, each as wide as the pen was at that moment, fading with age.
      ctx!.lineCap = 'round'
      ctx!.strokeStyle = '#16241d'
      for (let i = 1; i < dots.length; i++) {
        const a = dots[i - 1], b = dots[i]
        const age = (now - b.t) / LIFE
        ctx!.globalAlpha = Math.max(0, 1 - age) * .85
        ctx!.lineWidth = b.w * (1 - age * .6)
        ctx!.beginPath()
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.stroke()
      }
      ctx!.globalAlpha = 1
      frame = dots.length > 1 ? requestAnimationFrame(tick) : 0
    }
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick) }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
      const x = event.clientX, y = event.clientY
      el!.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (!at.seen) { at.seen = true; root.dataset.pen = 'on'; el!.dataset.here = 'true'; at.x = x; at.y = y }
      // Slow is thick, fast is thin, and the width eases between them like a real nib.
      const speed = Math.hypot(x - at.x, y - at.y)
      const target = Math.max(.8, 3.4 - speed * .07)
      at.w += (target - at.w) * .35
      at.x = x
      at.y = y
      dots.push({ x, y, w: at.w, t: performance.now() })
      if (dots.length > 90) dots.shift()
      wake()
      const over = (event.target as Element | null)?.closest?.(INTERACTIVE)
      el!.dataset.over = over ? 'true' : 'false'
    }
    const onLeave = () => { el!.dataset.here = 'false' }
    const onEnter = () => { if (at.seen) el!.dataset.here = 'true' }
    const onDown = () => { el!.dataset.down = 'true' }
    const onUp = () => { el!.dataset.down = 'false' }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    root.addEventListener('pointerleave', onLeave)
    root.addEventListener('pointerenter', onEnter)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      root.removeEventListener('pointerleave', onLeave)
      root.removeEventListener('pointerenter', onEnter)
      delete root.dataset.pen
    }
  }, [reduced])

  return (
    <>
      <canvas ref={canvas} className={styles.trail} aria-hidden="true" />
      <div ref={pen} className={styles.pen} data-here="false" data-over="false" data-down="false" aria-hidden="true">
        <i className={styles.blot} />
        <svg viewBox="0 0 32 32" className={styles.nib}>
          {/* The nib, its point at the bottom left corner: a slit, a breather hole, a brass band. */}
          <path className={styles.body} d="M1.5 30.5 4 21.5 19 6.5 25.5 13 10.5 28Z" />
          <path className={styles.band} d="M19 6.5 22.5 3 29 9.5 25.5 13Z" />
          <path className={styles.slit} d="M1.5 30.5 12.5 19.5" />
          <circle className={styles.hole} cx="14.2" cy="17.8" r="1.7" />
        </svg>
      </div>
    </>
  )
}
