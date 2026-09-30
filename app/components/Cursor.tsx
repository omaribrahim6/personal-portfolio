'use client'

import { useEffect, useRef } from 'react'
import { useMotionPreference } from './useMotionPreference'
import styles from './Cursor.module.css'

// A small moon where the pointer is, and stars that come off it as it travels and fade behind.
// Only for a mouse or trackpad: on touch screens there is no pointer to draw, and with reduced motion the
// ordinary cursor stays. Text boxes keep their own cursor, so it is still clear where you will type.

type Star = { x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; spin: number; colour: string }

const COLOURS = ['#fff1dc', '#f6b455', '#f6866a', '#c9cffb']
const INTERACTIVE = 'a, button, summary, label, select, [role="button"], [role="tab"], [data-cursor="hover"]'

export default function Cursor() {
  const reduced = useMotionPreference()
  const moon = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduced) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const el = moon.current, layer = canvas.current
    const ctx = layer?.getContext('2d')
    if (!fine.matches || !el || !layer || !ctx) return

    const root = document.documentElement
    const stars: Star[] = []
    const at = { x: -100, y: -100, px: -100, py: -100, seen: false }
    let frame = 0, size = 1, carried = 0
    let width = 0, height = 0

    function resize() {
      size = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      layer!.width = width * size
      layer!.height = height * size
      ctx!.setTransform(size, 0, 0, size, 0, 0)
    }

    function spawn(x: number, y: number, now: number) {
      stars.push({
        x: x + (Math.random() - .5) * 6, y: y + (Math.random() - .5) * 6,
        vx: (Math.random() - .5) * 18, vy: 8 + Math.random() * 22,
        born: now, life: 750 + Math.random() * 800,
        size: 2.8 + Math.random() * 3.8, spin: (Math.random() - .5) * 2,
        colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      })
      if (stars.length > 90) stars.shift()
    }

    // A four-pointed star, thin enough to look like a glint.
    function draw(star: Star, age: number, now: number) {
      const t = age / star.life
      const twinkle = .6 + .4 * Math.sin(now / 70 + star.born)
      const r = star.size * (1 - t * .55) * twinkle
      ctx!.save()
      ctx!.translate(star.x, star.y)
      ctx!.rotate(star.spin * age / 400)
      ctx!.globalAlpha = (1 - t) * (1 - t) * .95
      ctx!.fillStyle = star.colour
      ctx!.shadowColor = 'rgba(11, 12, 40, .55)'
      ctx!.shadowBlur = 4
      ctx!.beginPath()
      ctx!.moveTo(0, -r * 1.7)
      ctx!.quadraticCurveTo(r * .22, -r * .22, r * 1.7, 0)
      ctx!.quadraticCurveTo(r * .22, r * .22, 0, r * 1.7)
      ctx!.quadraticCurveTo(-r * .22, r * .22, -r * 1.7, 0)
      ctx!.quadraticCurveTo(-r * .22, -r * .22, 0, -r * 1.7)
      ctx!.fill()
      ctx!.restore()
    }

    let last = 0
    function tick(now: number) {
      const dt = Math.min(.05, (now - last) / 1000 || 0)
      last = now
      ctx!.clearRect(0, 0, width, height)
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i], age = now - star.born
        if (age >= star.life) { stars.splice(i, 1); continue }
        star.x += star.vx * dt
        star.y += star.vy * dt
        star.vy += 14 * dt
        draw(star, age, now)
      }
      frame = stars.length ? requestAnimationFrame(tick) : 0
    }
    const wake = () => { if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick) } }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
      at.x = event.clientX
      at.y = event.clientY
      el!.style.transform = `translate3d(${at.x}px, ${at.y}px, 0) translate(-50%, -50%)`
      if (!at.seen) { at.seen = true; at.px = at.x; at.py = at.y; root.dataset.moon = 'on'; el!.dataset.here = 'true' }
      // One star for about every 14 pixels travelled, spread along the way so a fast flick is a line, not a dot.
      const dx = at.x - at.px, dy = at.y - at.py, distance = Math.hypot(dx, dy)
      carried += distance
      const now = performance.now()
      while (carried >= 14) {
        carried -= 14
        const t = distance ? 1 - carried / distance : 1
        spawn(at.px + dx * Math.min(1, t), at.py + dy * Math.min(1, t), now)
      }
      at.px = at.x
      at.py = at.y
      if (stars.length) wake()
      const target = event.target as Element | null
      el!.dataset.over = target?.closest?.(INTERACTIVE) ? 'true' : 'false'
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
    document.documentElement.addEventListener('pointerleave', onLeave)
    document.documentElement.addEventListener('pointerenter', onEnter)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.documentElement.removeEventListener('pointerenter', onEnter)
      delete root.dataset.moon
    }
  }, [reduced])

  return (
    <>
      <canvas ref={canvas} className={styles.trail} aria-hidden="true" />
      <div ref={moon} className={styles.moon} data-here="false" data-over="false" data-down="false" aria-hidden="true"><i /></div>
    </>
  )
}
