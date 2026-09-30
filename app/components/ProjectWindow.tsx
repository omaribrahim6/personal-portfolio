'use client'

import { useState } from 'react'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import type { Project } from '../content'
import Painting from './Painting'
import styles from './ProjectWindow.module.css'

// Each project is seen through an arch, like the opening in the hedge. The painting behind is still;
// what moves is drawn over it. These are pictures of the idea, not screenshots of the product.

function Signal() {
  // Where the neighbours are, up and down the street.
  const neighbours: [number, number][] = [[118, 352], [288, 344], [64, 408], [322, 410], [240, 396]]
  return (
    <svg viewBox="0 0 400 500" className={styles.signal}>
      <path className={styles.route} d="M14 494C78 474 56 412 150 392S240 346 204 318" pathLength="1" />
      {neighbours.map(([x, y], index) => (
        <g key={index} className={styles.neighbour} data-neighbour={index}>
          <circle cx={x} cy={y} r="9" /><circle cx={x} cy={y} r="3" />
        </g>
      ))}
      <circle className={styles.ping} cx="200" cy="306" r="26" />
      <circle className={styles.halo} cx="200" cy="306" r="15" />
      <circle className={styles.report} cx="200" cy="306" r="5.5" />
      <text x="200" y="262" textAnchor="middle">one report</text>
      <text x="222" y="452" textAnchor="middle">five neighbours: me too</text>
      <text x="222" y="470" textAnchor="middle">and a crew on the way.</text>
    </svg>
  )
}

function Cascade() {
  return (
    <svg viewBox="0 0 400 500" className={styles.cascade}>
      <defs>
        <linearGradient id="slab-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb199" /><stop offset="1" stopColor="#e5606a" />
        </linearGradient>
      </defs>
      <path className={styles.fall} d="M160 196V262" pathLength="1" />
      <path className={styles.fall} d="M226 282V348" pathLength="1" />
      <path className={styles.fall} d="M294 368V486" pathLength="1" />
      {/* Drawn bottom-up, so the top sheet of the closed deck is painted last. */}
      {[2, 1, 0].map(index => {
        return (
          <g key={index} className={styles.slab} data-slab={index}>
            <path d="M0 0 108 -24 176 0 68 24Z" fill="url(#slab-top)" />
            <path d="M0 0 68 24v15L0 15Z" fill="#a8466f" />
            <path d="M68 24 176 0v15L68 39Z" fill="#3a2150" />
            <g className={styles.pupils}>
              <path d="M70 -2v-9M84 1v-9M98 -4v-9" />
              <circle cx="70" cy="-13" r="2" /><circle cx="84" cy="-10" r="2" /><circle cx="98" cy="-15" r="2" />
            </g>
            <text x="12" y="34">0{index + 1}</text>
          </g>
        )
      })}
      <g className={styles.legend}>
        <text x="28" y="428">01 / source material</text>
        <text x="28" y="446">02 / shared exploration</text>
        <text x="28" y="464">03 / a new dimension</text>
      </g>
    </svg>
  )
}

function Trail() {
  const stars: [number, number][] = [[64, 110], [312, 78], [96, 270], [212, 50], [324, 262]]
  return (
    <svg viewBox="0 0 400 500" className={styles.trail}>
      <path className={styles.web} d="M64 110 196 180 312 78M196 180 324 262M64 110 96 270 196 180M196 180 212 50M96 270 324 262" />
      {stars.map(([x, y]) => <circle key={`${x}-${y}`} className={styles.star} cx={x} cy={y} r="3" />)}
      <path className={styles.trace} d="M64 110 196 180 324 262" pathLength="1" />
      <circle className={styles.hub} cx="196" cy="180" r="9" />
      <circle className={styles.star} cx="196" cy="180" r="3.4" />
      <text x="80" y="98">the conversation</text>
      <text x="214" y="176">the decision</text>
      <text x="324" y="292" textAnchor="middle">the reason why</text>
    </svg>
  )
}

function Reflection() {
  return (
    <span className={styles.reflection}>
      <span className={styles.question}><small>in / natural language</small>“How many ideas have we shipped?”</span>
      <span className={styles.mirror}>“How many ideas have we shipped?”</span>
      <span className={styles.query}>
        <code><b>SELECT</b> COUNT(*)<br /><b>FROM</b> ideas<br /><b>WHERE</b> shipped = <em>true</em>;</code>
        <small>out / SQL · words → something executable</small>
      </span>
    </span>
  )
}

const overlays = { signal: Signal, cascade: Cascade, trail: Trail, reflection: Reflection }

export default function ProjectWindow({ project, index }: { project: Project; index: number }) {
  const [open, setOpen] = useState(false)
  const { scene, caption, action } = project.window
  const Overlay = overlays[scene]

  return (
    <button type="button" className={styles.window} data-open={open} data-scene={scene}
      aria-label={`${action[open ? 1 : 0]} — ${project.title} interactive illustration`} aria-pressed={open} onClick={() => setOpen(!open)}>
      <span className={styles.arch}>
        <Painting scene={scene} className={styles.painting} />
        <span className={styles.overlay} aria-hidden="true"><Overlay /></span>
      </span>
      <span className={`label ${styles.caption}`} aria-hidden="true">
        <span>0{index + 1} / {caption}</span>
        <span className={styles.action}>{action[open ? 1 : 0]}{open ? <RotateCcw size={12} /> : <ArrowUpRight size={13} />}</span>
      </span>
    </button>
  )
}
