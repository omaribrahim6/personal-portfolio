'use client'

import { motion, useSpring } from 'framer-motion'
import { useState, type PointerEvent } from 'react'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import styles from './ProjectArtifact.module.css'
import { useMotionPreference } from './useMotionPreference'

const labels = [
  ['Unfold the lesson', 'Fold the lesson'],
  ['Trace the decision', 'Reset the trail'],
  ['Turn words into a query', 'Back to the question'],
  ['Scan the road', 'Reset the scan'],
]

function Lesson() {
  return (
    <div className={styles.lesson}>
      <div className={`${styles.sheet} ${styles.sheetBack}`}><span>01 / source material</span><div className={styles.sourceLines}><i /><i /><i /><i /></div></div>
      <div className={`${styles.sheet} ${styles.sheetMiddle}`}><span>02 / shared exploration</span><div className={styles.orbit}><i /><i /><b /></div></div>
      <div className={`${styles.sheet} ${styles.sheetFront}`}><span>03 / a new dimension</span><div className={styles.lessonBlocks}>{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div></div>
    </div>
  )
}

function Memory() {
  return (
    <div className={styles.memory}>
      <svg viewBox="0 0 360 230" fill="none">
        <g className={styles.graphBase}>
          <path d="M50 60 170 110 298 45M170 110 290 177M50 60 85 185 170 110M170 110 184 28M85 185 290 177" />
          {[[50,60],[298,45],[85,185],[184,28],[290,177]].map(([x,y]) => <rect key={x} x={x - 4} y={y - 4} width="8" height="8" />)}
        </g>
        <path className={styles.trace} d="M50 60 170 110 290 177" pathLength="1" />
        <rect className={styles.core} x="151" y="91" width="38" height="38" rx="4" />
        <path d="m163 110 5 5 10-11" stroke="#1a1a1a" strokeWidth="2" />
      </svg>
      <span className={styles.memorySource}>the conversation</span>
      <span className={styles.memoryDecision}>the decision</span>
      <span className={styles.memoryAnswer}>the reason why</span>
    </div>
  )
}

function Query() {
  return (
    <div className={styles.query}>
      <div className={styles.queryInput}><span>IN / NATURAL LANGUAGE</span><p>“How many ideas<br />have we shipped?”</p><i /></div>
      <div className={styles.queryOutput}><span>OUT / SQL</span><code><b>SELECT</b> COUNT(*)<br /><b>FROM</b> ideas<br /><b>WHERE</b> shipped = <em>true</em>;</code><small>words → something executable</small></div>
      <span className={styles.querySymbol} aria-hidden="true">&gt;_</span>
    </div>
  )
}

function Road() {
  return (
    <div className={styles.road}>
      <svg viewBox="0 0 360 240" fill="none">
        <g className={styles.mapBlocks}>
          <path d="M22 25h74v51H22zM113 25h56v51h-56zM190 25h145v51H190zM22 96h74v56H22zM113 96h120v56H113zM254 96h81v56h-81zM22 174h145v43H22zM188 174h47v43h-47zM254 174h81v43h-81z" />
        </g>
        <path className={styles.mapRoute} d="M11 86h168v76h164" pathLength="1" />
        <path className={styles.mapRouteLit} d="M11 86h168v76h164" pathLength="1" />
        <g className={styles.detections}>
          <rect x="65" y="76" width="21" height="20" rx="2" /><rect x="168" y="118" width="22" height="20" rx="2" /><rect x="276" y="151" width="22" height="22" rx="2" />
          <circle cx="75.5" cy="86" r="2" /><circle cx="179" cy="128" r="2" /><circle cx="287" cy="162" r="2" />
        </g>
      </svg>
      <span className={styles.scanBeam} />
      <span className={styles.roadLabel}>from a drive<br />to a clearer picture.</span>
    </div>
  )
}

export default function ProjectArtifact({ index, title }: { index: number; title: string }) {
  const [expanded, setExpanded] = useState(false)
  const reduced = useMotionPreference()
  const rotateX = useSpring(0, { stiffness: 150, damping: 22 })
  const rotateY = useSpring(0, { stiffness: 150, damping: 22 })

  function move(event: PointerEvent<HTMLButtonElement>) {
    if (reduced || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    rotateY.set(((event.clientX - bounds.left) / bounds.width - .5) * 14)
    rotateX.set(-((event.clientY - bounds.top) / bounds.height - .5) * 10)
  }
  function reset() { rotateX.set(0); rotateY.set(0) }

  return (
    <button type="button" className={styles.artifact} data-expanded={expanded} data-project={index}
      aria-label={`${labels[index][expanded ? 1 : 0]} — ${title} interactive illustration`} aria-pressed={expanded}
      onClick={() => setExpanded(!expanded)} onPointerMove={move} onPointerLeave={reset} onBlur={reset}>
      <span className={styles.overline}><span>0{index + 1} / {['learning in layers', 'nothing lost in the thread', 'a question becomes a query', 'seeing the road differently'][index]}</span><span>interactive sketch</span></span>
      <motion.div className={styles.object} style={{ rotateX: reduced ? 0 : rotateX, rotateY: reduced ? 0 : rotateY }} aria-hidden="true">
        {[<Lesson key="lesson" />, <Memory key="memory" />, <Query key="query" />, <Road key="road" />][index]}
      </motion.div>
      <span className={styles.artifactFooter}><span>{labels[index][expanded ? 1 : 0]}</span>{expanded ? <RotateCcw size={14} /> : <ArrowUpRight size={15} />}</span>
    </button>
  )
}
