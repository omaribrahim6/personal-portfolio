import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { links } from '../content'
import Aerostat from './Aerostat'
import { Ground, Stamp, Terrain } from './Plate'
import Sign from './Sign'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section id="home" className={styles.hero} aria-labelledby="name">
      <div className={styles.stage} data-plate="0" data-tone="dark">
        <div className={styles.copy}>
          <p className={styles.hello}>hi, my name is</p>
          <h1 id="name" aria-label="Omar Ibrahim">
            <span aria-hidden="true"><span><Sign text="Omar" /></span></span>
            <span aria-hidden="true"><span><Sign text="Ibrahim" /></span></span>
          </h1>
          <p className={styles.lede}>
            A <strong>developer</strong> and <strong>security auditor</strong>.
          </p>
          <div className={styles.more}>
            <p>Software Engineering @ Carleton University. Currently looking for internships in software development and security.</p>
            <div className={styles.links}>
              <a className="go" data-panel data-down href="#projects">Explore my work <ArrowDown size={15} /></a>
              <a className="go" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={15} /></a>
              <a className="go" href={links.github} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={15} /></a>
              <a className="go" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={15} /></a>
            </div>
          </div>
        </div>

        <Aerostat tint="dawn" tether="46svh" className={styles.aerostat} />
        <Terrain scene="terraces" className={styles.terrain} />

        <div className={styles.caption}>
          <Stamp chapter="home" />
          <p className="label">45.38° N · 75.70° W · Ottawa</p>
        </div>
      </div>
      <Ground scene="terraces" className={styles.ground} />
    </section>
  )
}
