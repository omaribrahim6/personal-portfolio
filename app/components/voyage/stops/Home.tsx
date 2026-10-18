import { ArrowUpRight } from 'lucide-react'
import { links } from '../../../content'
import Sign from '../../Sign'
import { STOPS } from '../itinerary'
import { Beat, Onward, Stop } from '../Voyage'
import styles from './stops.module.css'

// Arrival: a boarding pass for the voyage, with his name on it, and the route for the day.
export default function Home() {
  return (
    <Stop id="home">
      <Beat side="left" className={styles.first}>
        <div className={styles.pass}>
          <p className={`label ${styles.passHead}`}><span>Boarding pass</span><span>Nº 001 · sunrise</span></p>
          <p className={styles.hello}>hi, my name is</p>
          <h1 id="home-title" className={styles.name}><Sign text="Omar Ibrahim" /></h1>
          <p className={styles.lede}>A <strong>developer</strong> and <strong>security auditor</strong>, studying Software Engineering at Carleton University.</p>
          <dl className={`label ${styles.fields}`}>
            <div><dt>Guide</dt><dd>Omar, in person (small)</dd></div>
            <div><dt>Looking for</dt><dd>Internships · software &amp; security</dd></div>
            <div><dt>Stops</dt><dd>{STOPS.length}, sunrise to sunset</dd></div>
            <div><dt>From</dt><dd>Ottawa · 45.38° N</dd></div>
          </dl>
          <div className={styles.links}>
            <a className="btn" href={links.resume} target="_blank" rel="noopener noreferrer">Résumé<ArrowUpRight size={14} /></a>
            <a className="btn" data-tone="paper" href={links.github} target="_blank" rel="noopener noreferrer">GitHub<ArrowUpRight size={14} /></a>
            <a className="btn" data-tone="paper" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<ArrowUpRight size={14} /></a>
          </div>
          <Onward>Scroll to set off</Onward>
        </div>
      </Beat>
      <Beat side="right">
        <p className={`label ${styles.kicker}`}>Today’s route</p>
        <ol className={styles.route}>
          {STOPS.slice(1).map((stop, i) => (
            <li key={stop.id}><a href={`#${stop.id}`}><b>{i + 2}</b><span>{stop.name}</span><i /></a></li>
          ))}
        </ol>
        <p className={styles.note}>Every stop is drawn live as you go. Pull the levers, pick things up, and if you would rather read than travel, the <a className="vine" href="/almanac">magazine edition</a> has it all on paper.</p>
      </Beat>
    </Stop>
  )
}
