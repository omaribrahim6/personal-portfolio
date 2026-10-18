'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react'
import { interests, type Photo } from '../../../content'
import { Beat, Stop, StopHead } from '../Voyage'
import { useWorld } from '../World'
import styles from './stops.module.css'

// Five islands: a card for each thing Omar does off the clock, while in the world Omar does it. The outdoors
// island has three (on foot, on two wheels, on the water). Each card has its photos as prints; open one and
// it comes up large.

type Card = { key: string; kicker: string; title: string; body: string; figure?: string; links?: { label: string; href: string }[]; photos: Photo[]; action?: 'vault' }

// The outdoors island is told in three parts, its one paragraph shared out between them.
const outdoors = interests.find(each => each.id === 'outdoors')!
const CARDS: Card[] = [
  { key: 'hike', kicker: 'The outdoors · on foot', title: 'Up the mountain', body: 'When the laptop closes I go outside. I hike, up whatever has a view at the top.', photos: outdoors.photos.filter(p => p.with === 'hike') },
  { key: 'bike', kicker: 'The outdoors · on two wheels', title: 'Down the other side', body: 'I ride trails on a mountain bike.', photos: outdoors.photos.filter(p => p.with === 'bike') },
  { key: 'paddle', kicker: 'The outdoors · on the water', title: 'Round the lagoon', body: 'And I get out on the water, on a paddleboard or in a kayak.', photos: outdoors.photos.filter(p => p.with === 'paddle') },
  ...interests.filter(each => each.id !== 'outdoors').map(each => ({
    key: each.id, kicker: each.kicker, title: each.title, body: each.body, figure: each.figure, links: each.links, photos: each.photos,
    action: each.id === 'security' ? 'vault' as const : undefined,
  })),
]

export default function Interests() {
  const world = useWorld()
  const [cracked, setCracked] = useState(false)
  const [looking, setLooking] = useState<{ card: number; photo: number } | null>(null)
  const sheet = useRef<HTMLDialogElement>(null)

  useEffect(() => { world.tell('interests', 'vault', cracked ? 'open' : 'closed') }, [world, cracked])
  useEffect(() => { if (looking) sheet.current?.showModal() }, [looking])

  const photos = looking ? CARDS[looking.card].photos : []
  const step = (by: number) => setLooking(l => l && { ...l, photo: (l.photo + by + photos.length) % photos.length })

  return (
    <Stop id="interests">
      <Beat>
        <StopHead id="interests" title="Five islands">
          Off the clock, in the golden hour. On every island, there I am, doing the thing: up a mountain, on a stage, in a game, at a vault, on the pitch.
        </StopHead>
        <p className={`label ${styles.legend}`}>{CARDS.length} scenes · {CARDS.reduce((n, c) => n + c.photos.length, 0)} photos</p>
      </Beat>
      {CARDS.map((card, i) => (
        <Beat key={card.key} side={[1, 3, 5, 7].includes(i + 1) ? 'right' : 'left'}>
          <div className={styles.interest} data-interest={card.key}>
            <p className={`label ${styles.interestKicker}`}><span>Island Nº {String(Math.min(5, i < 3 ? 1 : i - 1)).padStart(2, '0')}</span><i /><span>{card.kicker}</span></p>
            <h3 id={`interest-${card.key}`} className={styles.interestTitle}>{card.title}</h3>
            {card.figure && <p className={styles.figure}>{card.figure}</p>}
            <p className={styles.body}>{card.body}</p>
            {card.photos.length > 0 && (
              <ul className={styles.prints} aria-label={`Photos: ${card.title}`}>
                {card.photos.slice(0, 6).map((photo, k) => (
                  <li key={photo.src} style={{ ['--tilt' as string]: `${(k % 2 ? 1 : -1) * (1.5 + (k % 3))}deg` }}>
                    <button type="button" onClick={() => setLooking({ card: i, photo: k })} aria-label={`Open photo: ${photo.alt}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.src} alt="" loading="lazy" style={{ aspectRatio: photo.ratio }} />
                      {photo.caption && <span>{photo.caption}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.links}>
              {card.action === 'vault' && (
                <button type="button" className={styles.lever} aria-pressed={cracked} onClick={() => setCracked(c => !c)}>
                  <span className={styles.track} aria-hidden="true"><i /></span>{cracked ? 'Close the vault' : 'Crack the vault'}
                </button>
              )}
              {card.links?.map(link => (
                <a key={link.href} className="btn" data-tone="paper" data-size="small" href={link.href} {...(link.href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                  {link.label}<ArrowUpRight size={12} />
                </a>
              ))}
            </div>
          </div>
        </Beat>
      ))}

      <dialog ref={sheet} className={styles.viewer} aria-label="Photo" onClose={() => setLooking(null)} onClick={event => { if (event.target === sheet.current) sheet.current.close() }}>
        {looking && photos[looking.photo] && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={photos[looking.photo].src} src={photos[looking.photo].src.replace(/\.webp$/, '.full.webp')} alt={photos[looking.photo].alt} />
            <figcaption>
              <span className="label">{looking.photo + 1} / {photos.length}</span>
              {photos[looking.photo].caption ?? photos[looking.photo].alt}
            </figcaption>
            <div className={styles.viewerControls}>
              {photos.length > 1 && <button type="button" aria-label="Previous photo" onClick={() => step(-1)}><ArrowLeft size={16} /></button>}
              {photos.length > 1 && <button type="button" aria-label="Next photo" onClick={() => step(1)}><ArrowRight size={16} /></button>}
              <button type="button" aria-label="Close" onClick={() => sheet.current?.close()}><X size={16} /></button>
            </div>
          </figure>
        )}
      </dialog>
    </Stop>
  )
}
