import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { links } from '../content'
import { Ground, Terrain } from './Plate'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section id="home" className={styles.hero} aria-labelledby="name">
      <div className={styles.stage} data-plate="0" data-tone="dark">
        <div className={styles.copy}>
          <p className={styles.hello}>hi, my name is</p>
          <h1 id="name" aria-label="Omar Ibrahim">
            <span aria-hidden="true"><span>Omar</span></span>
            <span aria-hidden="true"><span>Ibrahim</span></span>
          </h1>
          <p className={styles.lede}>
            A <strong>developer</strong> and <strong>security auditor</strong>.
          </p>
          <div className={styles.more}>
            <p>Software Engineering @ Carleton University. Currently looking for internships in software development and security.</p>
            <div className={styles.links}>
              <a className="go" data-down href="#projects">Explore my work <ArrowDown size={15} /></a>
              <a className="go" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={15} /></a>
              <a className="go" href={links.github} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={15} /></a>
              <a className="go" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={15} /></a>
            </div>
          </div>
        </div>

        <Terrain scene="ridge" className={styles.terrain} />

        <p className={`label ${styles.caption}`}>
          <span>Plate I</span><span>the ridge</span>
        </p>
      </div>
      <Ground scene="ridge" className={styles.ground} />
    </section>
  )
}
