'use client'

import { useEffect, useRef, useState } from 'react'
import { MiniStage, type Behavior, type Framing, type Light } from '../components/mini/stage'

const BEHAVIORS: Behavior[] = ['watch', 'listen', 'think', 'talk']
const FRAMINGS: Framing[] = ['bust', 'waist', 'full']
const LIGHTS: Light[] = ['night', 'dawn']
// Poses that stress the skin: what the cloth does when the arms go where they rarely will.
const POSES: Record<string, Parameters<MiniStage['hold']>[0]> = {
  free: null,
  'left up': { armL: [0, 0, 1.3] },
  'arms out': { armL: [0, 0, 1.2], armR: [0, 0, -1.2] },
  'hands up': { armL: [-1.1, 0, .25], foreL: [-.9, 0, 0], armR: [-1.1, 0, -.25], foreR: [-.9, 0, 0] },
}

/**
 * A bench for the character exactly as the site uses him: the same stage, framings and lighting.
 * His head follows the pointer. For screenshots: `?act=talk`, `?frame=full`, `?light=dawn`,
 * `?look=yaw,pitch` (radians), `?pose=arms%20out` and `?wave=1`.
 */
export default function ModelLab() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<MiniStage | null>(null)
  const [behavior, setBehavior] = useState<Behavior>('watch')
  const [framing, setFraming] = useState<Framing>('bust')
  const [light, setLight] = useState<Light>('night')
  const [status, setStatus] = useState('loading…')
  const [pose, setPose] = useState('free')

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const query = new URLSearchParams(window.location.search)
    const fixed = query.get('look')?.split(',').map(Number)
    const made = new MiniStage(el)
    stage.current = made
    const start = { act: query.get('act') as Behavior | null, frame: query.get('frame') as Framing | null, light: query.get('light') as Light | null }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the bench starts from whatever the address asks for
    if (start.act) setBehavior(start.act)
    if (start.frame) setFraming(start.frame)
    if (start.light) setLight(start.light)
    if (query.get('pose')) setPose(query.get('pose')!)
    made.resize()
    void made.ready.then(() => {
      setStatus('28,226 triangles · 23 bones')
      if (fixed) made.aim([fixed[1] ?? 0, fixed[0] ?? 0])
      if (query.get('wave')) made.wave()
      el.dataset.ready = 'true'
    }).catch(() => setStatus('could not load the model'))

    function onMove(event: PointerEvent) {
      if (fixed) return
      const box = el!.getBoundingClientRect()
      const reach = Math.max(380, box.width * .7)
      made.aim([
        Math.max(-.45, Math.min(.4, Math.atan2(event.clientY - (box.top + box.height * .3), reach) * .95)),
        Math.max(-.85, Math.min(.85, Math.atan2(event.clientX - (box.left + box.width / 2), reach) * 1.15)),
      ])
    }
    const observer = new ResizeObserver(() => made.resize())
    observer.observe(el)
    window.addEventListener('pointermove', onMove)
    return () => {
      observer.disconnect()
      window.removeEventListener('pointermove', onMove)
      made.dispose()
      stage.current = null
    }
  }, [])

  useEffect(() => { stage.current?.act(behavior) }, [behavior])
  useEffect(() => { stage.current?.light(light) }, [light])
  useEffect(() => { stage.current?.hold(POSES[pose] ?? null) }, [pose])
  useEffect(() => { stage.current?.frame(framing); stage.current?.resize() }, [framing])

  const group = <T extends string>(name: string, options: T[], value: T, set: (next: T) => void) => (
    <div className="label filters" role="group" aria-label={name}>
      {options.map(option => <button key={option} type="button" aria-pressed={value === option} onClick={() => set(option)}>{option}</button>)}
    </div>
  )

  return (
    <main style={{ position: 'fixed', inset: 0, background: light === 'dawn' ? '#d6d4f2' : '#15173f', color: light === 'dawn' ? '#14154a' : '#f2ecdb' }}>
      <canvas ref={canvas} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', left: '1.5rem', top: '1.2rem', display: 'grid', gap: '.2rem' }}>
        {group('Behaviour', BEHAVIORS, behavior, setBehavior)}
        {group('Framing', FRAMINGS, framing, setFraming)}
        {group('Light', LIGHTS, light, setLight)}
        {group('Pose', Object.keys(POSES), pose, setPose)}
        <div className="label filters"><button type="button" onClick={() => stage.current?.wave()}>wave</button></div>
      </div>
      <p className="label" style={{ position: 'absolute', left: '1.5rem', bottom: '1.4rem', opacity: .8 }}>
        mini omar · {status} · his head follows the pointer
      </p>
    </main>
  )
}
