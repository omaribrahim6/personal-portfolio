import type { CSSProperties } from 'react'
import styles from './Aerostat.module.css'

/**
 * An airborne wind turbine: a puffed white ring held up on a tether, the rotor turning inside it, a light
 * blinking on top. It rides the wind a little. Placed over a sky by `style` (left, top, width); the tether
 * runs down `tether` to wherever it is anchored.
 */
export default function Aerostat({ style, className = '', tether = '40svh', tint = 'day' }: { style?: CSSProperties; className?: string; tether?: string; tint?: 'day' | 'dawn' | 'dusk' }) {
  return (
    <span className={`${styles.aerostat} ${className}`} data-tint={tint} style={{ ...style, '--tether': tether } as CSSProperties} aria-hidden="true">
      <span className={styles.tether} />
      <svg viewBox="0 0 200 130" className={styles.craft}>
        <defs>
          <linearGradient id={`aero-lobe-${tint}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--lit)" />
            <stop offset=".55" stopColor="var(--mid)" />
            <stop offset="1" stopColor="var(--shade)" />
          </linearGradient>
        </defs>
        <g className={styles.ink}>
          <path className={styles.fin} d="M150 44C160 26 172 14 192 8 186 24 180 36 170 48Z" />
          <path className={styles.fin} d="M150 86C160 104 172 116 192 122 186 106 180 94 170 82Z" />
          {[[150, 38], [130, 44], [110, 48], [90, 50], [70, 51], [52, 51]].map(([x, ry]) => (
            <ellipse key={x} cx={x} cy="65" rx="17" ry={ry} fill={`url(#aero-lobe-${tint})`} />
          ))}
          <path className={styles.band} d="M100 15.5Q106 65 100 114.5" />
          <ellipse className={styles.mouth} cx="40" cy="65" rx="20" ry="50" />
          <ellipse className={styles.throat} cx="40" cy="65" rx="13" ry="38" />
          <g className={styles.rotor}>
            <path d="M40 65 34 30Q40 26 44 31Z" />
            <path d="M40 65 34 30Q40 26 44 31Z" transform="rotate(120 40 65)" />
            <path d="M40 65 34 30Q40 26 44 31Z" transform="rotate(240 40 65)" />
          </g>
          <circle className={styles.hub} cx="40" cy="65" r="4.5" />
          <ellipse className={styles.rim} cx="40" cy="65" rx="20" ry="50" />
        </g>
        <circle className={styles.beacon} cx="104" cy="14" r="3.6" />
      </svg>
    </span>
  )
}
