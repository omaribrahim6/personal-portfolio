import { ArrowDown } from 'lucide-react'
import { chapters } from '../content'
import Sign from './Sign'
import styles from './Contents.module.css'

// The contents page, with a letter from the editor beside it: who he is and what the issue holds.
export default function Contents() {
  return (
    <section id="contents" className={styles.contents} aria-labelledby="contents-title">
      <div className="measure">
        <p className={`label ${styles.folio}`}><span>In this issue</span><i /><span>pp. 02 – 03</span></p>
        <div className={styles.grid}>
          <div className={styles.editor}>
            <h2 id="contents-title" className={styles.title}><Sign text="Contents" /></h2>
            <figure className={styles.portrait}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a small still of the 3D model */}
              <img src="/models/omar-bust.webp" alt="The small 3D Omar, smiling, in a purple scarf." width={432} height={528} />
              <figcaption className="label">The editor, in miniature</figcaption>
            </figure>
            <div className={styles.letter}>
              <p className="label">From the editor</p>
              <p className={styles.first}>Hi, I’m Omar: a <strong>developer</strong> and <strong>security auditor</strong>, studying Software Engineering at Carleton University, and looking for internships in software development and security.</p>
              <p>This issue is everything I have built, broken and won so far, set out as a magazine. Every drawing in it is drawn live in your browser as you read, and the small me in the corner will answer questions about any of it.</p>
              <p className={styles.signed}>— Omar</p>
            </div>
          </div>

          <ol className={styles.list}>
            {chapters.slice(1).map(chapter => (
              <li key={chapter.id}>
                <a href={`#${chapter.id}`}>
                  <span className={styles.page}>{String(chapter.page).padStart(2, '0')}</span>
                  <span className={styles.what}>
                    <span className="label">{chapter.numeral} · {chapter.section}</span>
                    <b>{chapter.label}</b>
                    <span className={styles.dek}>{chapter.dek}</span>
                  </span>
                  <ArrowDown className={styles.arrow} size={18} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
