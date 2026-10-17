import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { awards, competitions, email, links, projects, skillGroups } from '../content'
import Sign from './Sign'
import Diorama from './toon/Diorama'
import styles from './Cover.module.css'

const tools = skillGroups.flatMap(group => group.skills)
const checked = tools.filter(skill => skill.receipts?.length).length
const wins = competitions.length

/** Bars for the barcode, worked out from his address so they are the same on every visit. */
const bars = [...email].flatMap((char, index) => {
  const code = char.charCodeAt(0) + index * 7
  return [1 + (code % 3), 1 + ((code >> 2) % 2)]
})

// The cover: the name across the top as a masthead, the island town drawn live underneath it, and the lines
// a magazine prints down the side to say what is inside. Every number on it is counted from the content.
export default function Cover() {
  return (
    <section id="home" className={styles.cover} aria-labelledby="name">
      <Diorama scene="cover" className={styles.art} />

      <div className={styles.sheet}>
        <p className={`label ${styles.dateline}`}>
          <span><b>Issue Nº 01</b> · The Omar Ibrahim Almanac</span>
          <span className={styles.middle}>Software &amp; security · built, broken &amp; won</span>
          <span>Ottawa · 45.38° N 75.70° W</span>
        </p>

        <h1 id="name" className={styles.masthead} aria-label="Omar Ibrahim">
          <span aria-hidden="true"><Sign text="Omar" /></span>{' '}
          <span aria-hidden="true"><Sign text="Ibrahim" /></span>
        </h1>

        <p className={styles.deck}>
          hi, my name is Omar. <span>A <em>developer</em> and <em>security auditor</em>, studying Software Engineering at Carleton University.</span>
        </p>

        <ul className={styles.lines} aria-label="In this issue">
          <li>
            <a href="#projects">
              <b className={styles.big}>{projects.length} features</b>
              <span>{projects.map(project => project.title).join(', ').replace(/, ([^,]*)$/, ' & $1')}, and a toy in each</span>
            </a>
          </li>
          <li>
            <a href="#awards">
              <b className={styles.big}>{wins} for {wins}</b>
              <span>Every hackathon and CTF I entered ended in a win or a placing</span>
            </a>
          </li>
          <li>
            <a href="#skills">
              <b className={styles.big}>{checked} / {tools.length}</b>
              <span>tools in the seed bank, with receipts</span>
            </a>
          </li>
        </ul>

        {/* The sticker on the front: the one thing he would want a recruiter to see first. */}
        <a className={styles.burst} href={links.resume} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <path d={starburst(100, 100, 96, 80, 22)} />
          </svg>
          <span>
            <small className="label">Now open to</small>
            <b>Internships</b>
            <small className="label">software dev &amp; security</small>
            <i className="label">résumé <ArrowUpRight size={10} /></i>
          </span>
        </a>

        <div className={styles.actions}>
          <a className="btn" data-down href="#contents">Read the issue<ArrowDown size={14} /></a>
          <a className="btn" data-tone="paper" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé<ArrowUpRight size={14} /></a>
          <a className="btn" data-tone="paper" href={links.github} target="_blank" rel="noopener noreferrer">GitHub<ArrowUpRight size={14} /></a>
          <a className="btn" data-tone="paper" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<ArrowUpRight size={14} /></a>
        </div>

        <div className={styles.barcode} aria-hidden="true">
          <span className={styles.bars}>{bars.map((width, index) => <i key={index} style={{ width: `${width}px`, opacity: index % 2 ? 0 : 1 }} />)}</span>
          <span className="label">{awards.length} wins · {projects.length} builds · free</span>
        </div>
      </div>
    </section>
  )
}

/** A starburst: `points` spikes between two radii, with every other spike a little shorter. */
function starburst(cx: number, cy: number, outer: number, inner: number, points: number) {
  const out: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const a = i / (points * 2) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 ? inner : outer * (i % 4 ? .97 : 1)
    out.push(`${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`)
  }
  return `M${out.join('L')}Z`
}
