'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Images, Pause, Play, X } from 'lucide-react'
import { interests, type Interest, type Photo } from '../../content'
import Plate, { Ground } from '../Plate'
import { useMotionPreference } from '../useMotionPreference'
import type { IslandStage, Outfit } from './stage'
import styles from './Interests.module.css'

// Off the clock: one floating island for each interest, and the camera flies between them. On the first
// island he changes outfit (hike, bike, paddle) with a spin. The islands move on by themselves while the
// section is in view, and stop while you are pointing at or tabbing through them, or if you pause them.
// Without WebGL, a picture of each one stands in.

const OUTFIT_TIME = 3400 // ms in each outfit on the first island
const ISLAND_TIME = 7500 // ms on every other island
const PRINTS = 4 // prints laid out at once; the rest are a click away
const TILT = [-5, 4, -2.5, 3]
const dwell = (interest: Interest) => interest.outfits ? interest.outfits.length * OUTFIT_TIME : ISLAND_TIME
const POSTERS: Record<string, string> = {
  hike: '/interests/posters/hike.webp', bike: '/interests/posters/bike.webp', paddle: '/interests/posters/paddle.webp',
  competing: '/interests/posters/podium.webp', games: '/interests/posters/games.webp', security: '/interests/posters/security.webp', soccer: '/interests/posters/soccer.webp',
}

export default function Interests() {
  const reduced = useMotionPreference()
  const [active, setActive] = useState(0)
  const [outfit, setOutfit] = useState<Outfit>('hike')
  const [playing, setPlaying] = useState(true)
  const [ready, setReady] = useState(false)
  const [flat, setFlat] = useState(false)
  const [pointing, setPointing] = useState(false)
  const [looking, setLooking] = useState<number | null>(null)

  const stage = useRef<IslandStage | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const section = useRef<HTMLDivElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDialogElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const elapsed = useRef(0)
  const held = useRef(false)
  const near = useRef(false)
  const state = useRef({ active, outfit })
  useEffect(() => { state.current = { active, outfit } }, [active, outfit])

  const interest = interests[active]
  const autoplay = playing && !reduced

  // Three.js and the first model are fetched only once the islands are close.
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let cancelled = false, started = false
    const begin = async () => {
      started = true
      try {
        if (!document.createElement('canvas').getContext('webgl2')) throw new Error('This browser has no WebGL 2.')
        const { IslandStage } = await import('./stage')
        if (cancelled) return
        const created = new IslandStage(el, reduced)
        stage.current = created
        created.resize()
        created.go(state.current.active)
        created.dress(state.current.outfit)
        await created.ready
        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) setFlat(true)
      }
    }
    const approach = new IntersectionObserver(entries => {
      near.current = entries.some(entry => entry.isIntersecting)
      if (near.current && !started) void begin()
    }, { rootMargin: '60% 0px' })
    approach.observe(el)
    const resize = new ResizeObserver(() => stage.current?.resize())
    resize.observe(el)
    return () => {
      cancelled = true
      approach.disconnect()
      resize.disconnect()
      stage.current?.dispose()
      stage.current = null
    }
  }, [reduced])

  useEffect(() => { stage.current?.go(active) }, [active])
  useEffect(() => { stage.current?.dress(outfit) }, [outfit])

  const select = useCallback((index: number) => {
    elapsed.current = 0
    setActive(index)
    const outfits = interests[index].outfits
    if (outfits) setOutfit(outfits[0].id)
  }, [])

  const wear = useCallback((next: Outfit) => {
    const outfits = interests[0].outfits!
    // Your pick holds for as long as an outfit would have, then the walk carries on from there.
    elapsed.current = outfits.findIndex(o => o.id === next) * OUTFIT_TIME
    setOutfit(next)
  }, [])

  // The clock that moves things on. It only runs while you can see the islands and are not using them.
  useEffect(() => {
    if (!autoplay) {
      tabs.current.forEach(tab => tab?.style.setProperty('--p', '0'))
      return
    }
    let raf = 0, last = performance.now(), seen = false
    const visible = new IntersectionObserver(entries => { seen = entries.some(entry => entry.isIntersecting) }, { threshold: .25 })
    if (section.current) visible.observe(section.current)
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = now - last
      last = now
      if (!seen || held.current || sheet.current?.open || document.hidden) return
      const { active, outfit } = state.current
      const here = interests[active]
      elapsed.current += dt
      tabs.current[active]?.style.setProperty('--p', String(Math.min(1, elapsed.current / dwell(here))))
      if (here.outfits) {
        const due = here.outfits[Math.min(here.outfits.length - 1, Math.floor(elapsed.current / OUTFIT_TIME))].id
        if (due !== outfit) setOutfit(due)
      }
      if (elapsed.current >= dwell(here)) {
        tabs.current[active]?.style.setProperty('--p', '0')
        select((active + 1) % interests.length)
      }
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); visible.disconnect() }
  }, [autoplay, select])

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    const to = event.key === 'Home' ? 0 : event.key === 'End' ? interests.length - 1 : step ? (index + step + interests.length) % interests.length : -1
    if (to < 0) return
    event.preventDefault()
    select(to)
    tabs.current[to]?.focus()
  }

  // Pointing at him: the moon cursor grows, and a click changes his outfit or makes him hop.
  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const over = !!stage.current?.hits(event.clientX, event.clientY)
    if (over !== pointing) setPointing(over)
  }
  function onClick(event: MouseEvent<HTMLCanvasElement>) {
    if (!stage.current?.hits(event.clientX, event.clientY)) return
    const outfits = interest.outfits
    if (outfits) wear(outfits[(outfits.findIndex(o => o.id === outfit) + 1) % outfits.length].id)
    else stage.current.poke()
  }

  const poster = POSTERS[interest.outfits ? outfit : interest.id]
  // Every photo for this island opens in the viewer; the prints are the first few, for the outfit he has on.
  const photos = interest.photos.length ? interest.photos : process.env.NODE_ENV === 'development' ? placeholders(interest) : []
  const pool = interest.outfits ? photos.filter(photo => photo.with === outfit) : photos
  const shown = pool.slice(0, PRINTS)
  const hidden = photos.filter(photo => !shown.includes(photo))

  function open(photo: Photo | undefined) {
    if (!photo?.src) return
    setLooking(photos.indexOf(photo))
    sheet.current?.showModal()
  }

  return (
    <section id="interests" aria-labelledby="interests-title">
      <Plate index={5} scene="islands" after="field" tone="light" numeral="VI" place="the islands" kicker="five islands" title="Off the clock" titleId="interests-title">
        What I do when I am not shipping something. Each island is one of them.
      </Plate>

      <Ground scene="islands" className={styles.ground}>
        <div ref={section} className={`measure ${styles.body}`}>
          <div className={styles.top}>
            <div className={styles.tabs} role="tablist" aria-label="Interests">
              {interests.map((each, index) => (
                <button key={each.id} ref={el => { tabs.current[index] = el }} id={`interest-tab-${each.id}`} type="button" role="tab"
                  className={styles.tab} aria-selected={index === active} aria-controls="interest-panel" tabIndex={index === active ? 0 : -1}
                  onClick={() => select(index)} onKeyDown={event => onTabKey(event, index)}>
                  <span className="label">{String(index + 1).padStart(2, '0')}</span>
                  {each.title}
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
            {!reduced && (
              <button type="button" className={`label ${styles.play}`} onClick={() => setPlaying(!playing)} aria-pressed={!playing}>
                {playing ? <Pause size={12} /> : <Play size={12} />}<span>{playing ? 'Pause' : 'Play'}</span>
              </button>
            )}
          </div>

          <div ref={view} className={styles.view}
            onPointerEnter={() => { held.current = true }} onPointerLeave={() => { held.current = false }}
            onFocus={event => { if (event.target.matches(':focus-visible')) held.current = true }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) held.current = false }}>
            <div className={styles.scene} data-ready={ready} data-flat={flat}>
              <div className={styles.frame}>
                <canvas ref={canvas} className={styles.canvas} aria-hidden="true" data-cursor={pointing ? 'hover' : undefined}
                  onPointerMove={onPointerMove} onPointerLeave={() => setPointing(false)} onClick={onClick} />
                {flat && poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.poster} src={poster} alt="" />
                )}
              </div>
              <div className={styles.prints}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {shown.map((photo, index) => (
                    <motion.figure key={`${interest.id}-${photo.src || photo.alt}`} className={styles.print} data-slot={index}
                      style={{ '--ratio': photo.ratio } as CSSProperties}
                      initial={{ opacity: 0, y: -24, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: TILT[index % TILT.length] }}
                      exit={{ opacity: 0, y: 18 }} transition={{ duration: .5, delay: index * .08, ease: [.2, .8, .2, 1] }}>
                      {photo.src ? (
                        <button type="button" onClick={() => open(photo)} aria-label={`Open the photo: ${photo.alt}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.src} alt="" loading="lazy" />
                        </button>
                      ) : <span className={styles.missing}>{photo.alt}</span>}
                      {photo.caption && <figcaption>{photo.caption}</figcaption>}
                    </motion.figure>
                  ))}
                  {hidden.some(photo => photo.src) && (
                    <motion.button key={`${interest.id}-more`} type="button" className={`label ${styles.more}`} onClick={() => open(hidden[0])}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Images size={14} />all {photos.length} photos
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div id="interest-panel" role="tabpanel" aria-labelledby={`interest-tab-${interest.id}`} className={styles.panel}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={interest.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .35 }}>
                  <p className={`label ${styles.kicker}`}>{interest.kicker}</p>
                  {interest.figure && <p className={styles.figure}>{interest.figure}</p>}
                  <h3>{interest.title}</h3>
                  <p className={styles.words}>{interest.body}</p>
                  {interest.outfits && (
                    <div className={`label filters ${styles.outfits}`} role="group" aria-label="What he is dressed for">
                      {interest.outfits.map(each => (
                        <button key={each.id} type="button" aria-pressed={outfit === each.id} onClick={() => wear(each.id)}>{each.label}</button>
                      ))}
                    </div>
                  )}
                  {!!interest.links?.length && (
                    <p className={styles.links}>
                      {interest.links.map(link => (
                        <a key={link.href} className="go" href={link.href} {...(link.href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                          {link.label}<ArrowUpRight size={13} />
                        </a>
                      ))}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Ground>

      {/* A photo opened large, with the rest of this island's either side of it. */}
      <dialog ref={sheet} className={styles.sheet} aria-label="Photos" onClose={() => setLooking(null)}
        onClick={event => { if (event.target === event.currentTarget) sheet.current?.close() }}
        onKeyDown={event => {
          if (looking === null) return
          if (event.key === 'ArrowRight') setLooking((looking + 1) % photos.length)
          if (event.key === 'ArrowLeft') setLooking((looking + photos.length - 1) % photos.length)
        }}>
        {looking !== null && photos[looking] && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={photos[looking].src} src={photos[looking].src.replace(/\.webp$/, '.full.webp')} alt={photos[looking].alt} />
            <figcaption>
              <span>{photos[looking].caption ?? photos[looking].alt}</span>
              <span className={`label ${styles.sheetNav}`}>
                {photos.length > 1 && <>
                  <button type="button" onClick={() => setLooking((looking + photos.length - 1) % photos.length)} aria-label="Previous photo"><ArrowLeft size={15} /></button>
                  {looking + 1} / {photos.length}
                  <button type="button" onClick={() => setLooking((looking + 1) % photos.length)} aria-label="Next photo"><ArrowRight size={15} /></button>
                </>}
                <button type="button" onClick={() => sheet.current?.close()} aria-label="Close"><X size={16} /></button>
              </span>
            </figcaption>
          </figure>
        )}
      </dialog>
    </section>
  )
}

/** While the real photos are on their way, empty frames show where they will go. Development only. */
function placeholders(interest: Interest): Photo[] {
  if (interest.outfits) return interest.outfits.map(each => ({ src: '', ratio: .8, alt: `photo · ${each.label.toLowerCase()}`, with: each.id }))
  return [1, 2].map(n => ({ src: '', ratio: .8, alt: `photo ${n} · ${interest.title.toLowerCase()}` }))
}
