import type { CSSProperties, ReactNode } from 'react'
import Painting from './Painting'
import Wanderer from './Wanderer'
import { GROUND, type SceneName } from './paint/scenes'
import styles from './Plate.module.css'

type PlateScene = keyof typeof GROUND

/** The painted strip of land at the foot of a sky: the terrain, and the figure walking on it. */
export function Terrain({ scene, className = '' }: { scene: PlateScene; className?: string }) {
  return (
    <div className={`${styles.terrain} ${className}`} data-terrain={scene} data-scene={scene}>
      <Painting scene={scene as SceneName} className={styles.painting} />
      <Wanderer />
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

/**
 * The opening of a chapter. The ground of the previous chapter thins out into mist, the sky shows
 * through behind the title, and the next landscape rises underneath it.
 */
export default function Plate({ index, scene, after, tone, numeral, place, kicker, title, titleId, href, tall, children }: {
  index: number
  scene: PlateScene
  /** The plate above this one, whose ground dissolves into this sky. */
  after: PlateScene
  tone: 'dark' | 'light'
  numeral: string
  place: string
  kicker: string
  title: string
  titleId: string
  /** Makes the title itself a link. The last plate uses it: the heading is the way to write to Omar. */
  href?: string
  /** The landscape rises behind the title instead of stopping below it. */
  tall?: boolean
  children?: ReactNode
}) {
  return (
    <header className={styles.plate} data-plate={index} data-tone={tone} data-tall={tall} style={{ '--ground': GROUND[scene] } as CSSProperties}>
      <Painting dissolveOf={GROUND[after]} className={styles.dissolve} />
      <div className={`measure ${styles.heading}`}>
        <p className={`label ${styles.mark}`}><span>Plate {numeral}</span><span>{place}</span></p>
        <h2 id={titleId}>{href ? <a href={href}>{title}</a> : title}</h2>
        <p className={styles.kicker}>{kicker}</p>
        {children && <p className={styles.note}>{children}</p>}
      </div>
      <Terrain scene={scene} />
    </header>
  )
}
