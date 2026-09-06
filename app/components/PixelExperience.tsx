'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { ArrowDown, ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react'
import Hero from './Hero'
import styles from './PixelExperience.module.css'

const PixelScene = dynamic(() => import('./PixelScene'), { ssr: false })

export default function PixelExperience() {
  const [classic, setClassic] = useState(false)
  const [scatter, setScatter] = useState(0)
  const [paused, setPaused] = useState(false)
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'unavailable'>('loading')

  function updateScatter(value: number) {
    setScatter(value)
  }

  function togglePause() {
    setPaused(!paused)
  }

  return (
    <div className={styles.experiment}>
      <header className={styles.header}>
        <a href="#" className={styles.monogram} aria-label="Omar Ibrahim, home">oi<span>.</span></a>
        <span className={styles.edition}>a little experiment in dimension</span>
        <div className={styles.viewSwitch} role="group" aria-label="Hero version">
          <button aria-pressed={!classic} onClick={() => { if (classic) { setClassic(false); setSceneState('loading') } }}>3D experiment</button>
          <button aria-pressed={classic} onClick={() => setClassic(true)}>Original</button>
        </div>
      </header>

      {classic ? <Hero /> : (
        <section className={styles.hero} aria-labelledby="spatial-name">
          <div className={styles.intro}>
            <p>hi, my name is</p>
            <span><i /> open to internships</span>
          </div>

          <div className={styles.stage}>
            <h1 id="spatial-name" aria-label="Omar Ibrahim" className={sceneState === 'ready' ? styles.srOnly : styles.fallback}>OMAR<br />IBRAHIM</h1>
            <div className={styles.canvas} aria-hidden="true">
              <PixelScene scatter={scatter} paused={paused} onStateChange={setSceneState} />
            </div>
            <div className={styles.stageAnnotation} aria-hidden="true"><span>BUILD.</span><span>BREAK.</span><span>REPEAT.</span></div>
            <span className={styles.coordinate} aria-hidden="true">01 / a work in progress</span>
          </div>

          <div className={styles.workbench}>
            <div className={styles.explodeControl}>
              <label htmlFor="pixel-scatter">Assemble</label>
              <input id="pixel-scatter" type="range" min="0" max="100" value={scatter}
                aria-label="Disassemble the 3D lettering" aria-valuetext={`${scatter}% disassembled`}
                disabled={sceneState !== 'ready'} onChange={event => updateScatter(Number(event.target.value))} />
              <span>Disassemble</span>
            </div>
            <div className={styles.actions}>
              <button className={styles.breakButton} disabled={sceneState !== 'ready'} onClick={() => updateScatter(scatter > 0 ? 0 : 100)}>
                {scatter > 0 ? <><RotateCcw size={14} /> Put it back</> : <>Go on, break it <ArrowUpRight size={15} /></>}
              </button>
              <button className={styles.pauseButton} disabled={sceneState !== 'ready'} onClick={togglePause} aria-label={paused ? 'Resume ambient motion' : 'Pause ambient motion'} aria-pressed={paused}>
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </div>
          </div>

          <div className={styles.description}>
            <p>A <strong>developer</strong> and <strong>security auditor</strong> — I build things, then try to break them before someone else does.</p>
            <div>
              <p>Software Engineering @ Carleton University. Currently looking for internships in software development and security.</p>
              <div className={styles.links}>
                <a href="#projects">Explore my work <ArrowDown size={15} /></a>
                <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">Résumé <ArrowUpRight size={15} /></a>
                <a className={styles.mobileSocial} href="https://github.com/omaribrahim6" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={15} /></a>
                <a className={styles.mobileSocial} href="https://www.linkedin.com/in/omar-ibrahim6/" target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={15} /></a>
              </div>
            </div>
          </div>

          <footer className={styles.footer}>
            <a href="#about">The story continues <ArrowDown size={13} /></a>
            <span role="status">{sceneState === 'unavailable' ? 'Static view · 3D unavailable on this browser' : sceneState === 'loading' ? 'Preparing the pixels' : 'Pull things apart. Put them back.'}</span>
          </footer>
        </section>
      )}
    </div>
  )
}
