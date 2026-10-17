import type { CSSProperties, ReactNode } from 'react'
import { chapters } from '../content'
import Painting from './Painting'
import Sign from './Sign'
import SunDial, { dayAt } from './SunDial'
import Wanderer from './Wanderer'
import { GROUND, type SceneName } from './paint/scenes'
import styles from './Plate.module.css'

type PlateScene = keyof typeof GROUND
type Chapter = (typeof chapters)[number]['id']

/** The painted strip of land at the foot of a sky: the terrain, and the figure walking on it. */
export function Terrain({ scene, className = '' }: { scene: PlateScene; className?: string }) {
  return (
    <div className={`${styles.terrain} ${className}`} data-terrain={scene} data-scene={scene}>
      <Painting scene={scene as SceneName} className={styles.painting} />
      <Wanderer />
      {/* Where the 3D Omar stands once the walk is over. Filled in by MiniOmar; empty everywhere else. */}
      {scene === 'shore' && <span className={styles.stand} data-stand />}
    </div>
  )
}

/** The ground a chapter is written on: the same colour its painting ends in. */
export function Ground({ scene, tone = 'dark', className = '', children }: { scene: PlateScene; tone?: 'dark' | 'light'; className?: string; children?: ReactNode }) {
  return (
    <div className={`${styles.ground} ${className}`} data-tone={tone} data-ground={scene} style={{ '--ground': GROUND[scene] } as CSSProperties}>
      {children}
    </div>
  )
}

/** Where a chapter falls in the day: its hour on a small sundial, its number and its place. */
export function Stamp({ chapter, className = '' }: { chapter: Chapter; className?: string }) {
  const { hour, numeral, place } = chapters.find(each => each.id === chapter)!
  return (
    <p className={`label ${styles.stamp} ${className}`}>
      <SunDial at={dayAt(hour)} className={styles.dial} />
      <span>{hour}</span>
      <span>{numeral}</span>
      <span>{place}</span>
    </p>
  )
}

/**
 * The opening of a chapter. The ground of the previous chapter thins out into haze, the sky of that hour of
 * the day shows through behind the title, and the next landscape rises underneath it.
 */
export default function Plate({ index, chapter, scene, after, tone, kicker, title, titleId, href, tall, sky, children }: {
  index: number
  chapter: Chapter
  scene: PlateScene
  /** The plate above this one, whose ground dissolves into this sky. */
  after: PlateScene
  tone: 'dark' | 'light'
  kicker: string
  title: string
  titleId: string
  /** Makes the title itself a link. The last plate uses it: the heading is the way to write to Omar. */
  href?: string
  /** The landscape rises behind the title instead of stopping below it. */
  tall?: boolean
  /** Anything that lives in this plate's sky, like a turbine on a tether. */
  sky?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className={styles.plate} data-plate={index} data-tone={tone} data-tall={tall} style={{ '--ground': GROUND[scene] } as CSSProperties}>
      <Painting dissolveOf={GROUND[after]} className={styles.dissolve} />
      {sky}
      <div className={`measure ${styles.heading}`}>
        <Stamp chapter={chapter} />
        <h2 id={titleId}>{href ? <a href={href}><Sign text={title} /></a> : <Sign text={title} />}</h2>
        <p className={styles.kicker}>{kicker}</p>
        {children && <p className={styles.note}>{children}</p>}
      </div>
      <Terrain scene={scene} />
    </header>
  )
}
