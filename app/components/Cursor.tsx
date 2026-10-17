'use client'

import { useEffect, useRef } from 'react'
import { useMotionPreference } from './useMotionPreference'
import styles from './Cursor.module.css'

// A small sun where the pointer is. As it travels it sheds leaves, petals and pollen, which drift down,
// sway and turn over as they fall, and fade. Its rays come out over anything that can be pressed.
// Only for a mouse or trackpad: on touch screens there is no pointer to draw, and with reduced motion the
// ordinary cursor stays. Text boxes keep their own cursor, so it is still clear where you will type.

type Kind = 'leaf' | 'petal' | 'pollen'
type Bit = { kind: Kind; x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; spin: number; turn: number; sway: number; colour: string }

const LEAVES = ['#7fb35c', '#a6d36e', '#5d9a4a', '#c6e26c']
const PETALS = ['#ffd84a', '#f7b638', '#ef8fa3', '#fff4e0']
const INTERACTIVE = 'a, button, summary, label, select, [role="button"], [role="tab"], [data-cursor="hover"]'

export default function Cursor() {
  const reduced = useMotionPreference()
  const sun = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduced) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const el = sun.current, layer = canvas.current
    const ctx = layer?.getContext('2d')
    if (!fine.matches || !el || !layer || !ctx) return

    const root = document.documentElement
    const bits: Bit[] = []
    const at = { x: -100, y: -100, px: -100, py: -100, seen: false }
    let frame = 0, size = 1, carried = 0, count = 0
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
      // Mostly pollen and petals, a leaf every so often.
      const roll = count++ % 5
      const kind: Kind = roll === 0 ? 'leaf' : roll % 2 ? 'pollen' : 'petal'
      const palette = kind === 'leaf' ? LEAVES : PETALS
      bits.push({
        kind, x: x + (Math.random() - .5) * 8, y: y + (Math.random() - .5) * 8,
        vx: (Math.random() - .5) * 26, vy: 6 + Math.random() * 18,
        born: now, life: kind === 'pollen' ? 700 + Math.random() * 600 : 1100 + Math.random() * 900,
        size: kind === 'leaf' ? 5 + Math.random() * 3.5 : kind === 'petal' ? 3.2 + Math.random() * 2.4 : 1.2 + Math.random() * 1.3,
        spin: Math.random() * 6.28, turn: (Math.random() - .5) * 5, sway: Math.random() * 6.28,
        colour: kind === 'pollen' ? '#ffe27a' : palette[Math.floor(Math.random() * palette.length)],
      })
      if (bits.length > 80) bits.shift()
    }

    function draw(bit: Bit, age: number) {
      const t = age / bit.life
      ctx!.save()
      ctx!.translate(bit.x, bit.y)
      ctx!.rotate(bit.spin)
      ctx!.globalAlpha = Math.min(1, (1 - t) * 1.4) * .95
      ctx!.fillStyle = bit.colour
      ctx!.shadowColor = 'rgba(16, 38, 28, .35)'
      ctx!.shadowBlur = 3
      const r = bit.size
      ctx!.beginPath()
      if (bit.kind === 'pollen') {
        ctx!.shadowColor = 'rgba(255, 210, 90, .8)'
        ctx!.shadowBlur = 6
        ctx!.arc(0, 0, r, 0, 6.2832)
        ctx!.fill()
      } else {
        // Seen turning over as it falls: its width swings through zero and back.
        const flip = Math.cos(bit.spin * 1.7 + age / 160)
        ctx!.scale(1, .35 + .65 * Math.abs(flip))
        if (bit.kind === 'leaf') {
          ctx!.moveTo(-r, 0)
          ctx!.quadraticCurveTo(0, -r * .9, r, 0)
          ctx!.quadraticCurveTo(0, r * .9, -r, 0)
          ctx!.fill()
          ctx!.shadowBlur = 0
          ctx!.strokeStyle = 'rgba(30, 70, 40, .55)'
          ctx!.lineWidth = .7
          ctx!.beginPath()
          ctx!.moveTo(-r * .8, 0)
          ctx!.lineTo(r * .85, 0)
          ctx!.stroke()
        } else {
          ctx!.moveTo(0, -r)
          ctx!.bezierCurveTo(r * .9, -r * .7, r * .7, r * .8, 0, r)
          ctx!.bezierCurveTo(-r * .7, r * .8, -r * .9, -r * .7, 0, -r)
          ctx!.fill()
        }
      }
      ctx!.restore()
    }

    let last = 0
    function tick(now: number) {
      const dt = Math.min(.05, (now - last) / 1000 || 0)
      last = now
      ctx!.clearRect(0, 0, width, height)
      for (let i = bits.length - 1; i >= 0; i--) {
        const bit = bits[i], age = now - bit.born
        if (age >= bit.life) { bits.splice(i, 1); continue }
        bit.sway += dt * 3
        bit.x += (bit.vx + Math.sin(bit.sway) * 14) * dt
        bit.y += bit.vy * dt
        bit.vx *= 1 - dt * 1.5
        bit.vy += (bit.kind === 'pollen' ? -4 : 22) * dt
        bit.spin += bit.turn * dt
        draw(bit, age)
      }
      frame = bits.length ? requestAnimationFrame(tick) : 0
    }
    const wake = () => { if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick) } }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
      at.x = event.clientX
      at.y = event.clientY
      el!.style.transform = `translate3d(${at.x}px, ${at.y}px, 0) translate(-50%, -50%)`
      if (!at.seen) { at.seen = true; at.px = at.x; at.py = at.y; root.dataset.sun = 'on'; el!.dataset.here = 'true' }
      // One bit for about every 16 pixels travelled, spread along the way so a fast flick is a line, not a heap.
      const dx = at.x - at.px, dy = at.y - at.py, distance = Math.hypot(dx, dy)
      carried += distance
      const now = performance.now()
      while (carried >= 16) {
        carried -= 16
        const t = distance ? 1 - carried / distance : 1
        spawn(at.px + dx * Math.min(1, t), at.py + dy * Math.min(1, t), now)
      }
      at.px = at.x
      at.py = at.y
      if (bits.length) wake()
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
      delete root.dataset.sun
    }
  }, [reduced])

  return (
    <>
      <canvas ref={canvas} className={styles.trail} aria-hidden="true" />
      <div ref={sun} className={styles.sun} data-here="false" data-over="false" data-down="false" aria-hidden="true"><b /><i /></div>
    </>
  )
}
