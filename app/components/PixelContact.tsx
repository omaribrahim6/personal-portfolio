'use client'

import { useEffect, useRef, type PointerEvent } from 'react'
import { useMotionPreference } from './useMotionPreference'
import { PIXEL_FONT } from './pixelFont'
import styles from './PixelContact.module.css'

const pixels: { x: number; y: number }[] = []
let offset = 0
for (const letter of "LET'S TALK") {
  ;(PIXEL_FONT[letter] ?? []).forEach((line, y) => line.forEach((filled, x) => {
    if (filled) pixels.push({ x: offset + x - (letter === "'" ? 1 : 0), y })
  }))
  offset += letter === "'" ? 3 : letter === ' ' ? 4 : 6
}

export default function PixelContact({ email }: { email: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const frame = useRef(0)
  const reduced = useMotionPreference()

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function lift(position: number) {
    svg.current?.querySelectorAll<SVGGElement>('g').forEach((cell, index) => {
      const distance = Math.abs(pixels[index].x - position)
      const strength = Math.max(0, 1 - distance / 7)
      cell.style.transform = `translateY(${-strength * strength * 1.2}px)`
    })
  }
  function move(event: PointerEvent<HTMLAnchorElement>) {
    if (reduced || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = (event.clientX - bounds.left) / bounds.width * 55
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => lift(position))
  }
  function reset() {
    cancelAnimationFrame(frame.current)
    svg.current?.querySelectorAll<SVGGElement>('g').forEach(cell => { cell.style.transform = '' })
  }

  return (
    <h2 className={styles.heading}>
      <a href={`mailto:${email}`} aria-label="Let's talk — email Omar" onPointerMove={move} onPointerLeave={reset}
        onFocus={() => { if (!reduced) lift(29) }} onBlur={reset}>
        <span className={styles.label}>LET&apos;S TALK</span>
        <svg ref={svg} viewBox="-1 -2 57 11" aria-hidden="true">
          {pixels.map(({ x, y }, index) => (
            <g key={index} className={styles.pixel}>
              <rect x={x + .17} y={y + .2} width=".84" height=".84" rx=".06" fill="#8b7426" />
              <rect x={x} y={y} width=".84" height=".84" rx=".06" fill="#efd04b" />
              <path d={`M${x + .06} ${y + .06}h.72`} stroke="#ffe89a" strokeWidth=".05" />
            </g>
          ))}
        </svg>
      </a>
    </h2>
  )
}
