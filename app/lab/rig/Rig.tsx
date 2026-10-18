'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { load, Puppet, type Pose } from '../../components/world/puppet'

/**
 * `?overlay=hike` shows the rigged model and an outfit statue overlapped, to line them up.
 * `?outfits=hike,soccer&pose=walk` dresses and poses them. `&side=1` from the side.
 */
const POSES: Record<string, Pose> = {
  rest: {},
  walk: { thighL: [-.5, 0, 0], shinL: [.3, 0, 0], thighR: [.45, 0, 0], shinR: [.5, 0, 0], armL: [.4, 0, 0], armR: [-.4, 0, 0] },
  kick: { thighR: [-1.1, 0, 0], shinR: [.2, 0, 0], thighL: [.15, 0, 0], armL: [-.6, 0, .6], armR: [.5, 0, -.4], chest: [.15, 0, 0] },
  arms: { armL: [0, 0, 1.2], armR: [0, 0, -1.2], foreL: [0, -.8, 0], foreR: [0, .8, 0] },
  t1: { thighL: [-.7, 0, 0], armR: [-.7, 0, 0] },
  t2: { armR: [0, 0, -1.2], foreR: [0, 0, -.8], armL: [0, 0, .5] },
  t3: { spine: [.3, 0, 0], head: [0, .6, 0], shinL: [.8, 0, 0] },
  crouch: { lift: -.18, thighL: [-1.2, 0, 0], shinL: [1.6, 0, 0], thighR: [-1.2, 0, 0], shinR: [1.6, 0, 0], chest: [.3, 0, 0] },
}
const FIT: Record<string, { scale: number; offset?: [number, number, number] }> = {
  hike: { scale: 1 / .92 }, soccer: { scale: 1 / 1.17 * 1.04 }, paddle: { scale: 1 / 1.15 }, bike: { scale: 1 / 1.15 },
  podium: { scale: 1 }, games: { scale: 1 }, security: { scale: 1 / 1.02 },
}

export default function Rig() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current!
    const q = new URLSearchParams(location.search)
    const renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true })
    renderer.setSize(el.clientWidth, el.clientHeight, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#e8e2d0')
    scene.add(new THREE.HemisphereLight('#ffffff', '#887766', 2.2))
    const key = new THREE.DirectionalLight('#ffffff', 1.6)
    key.position.set(2, 3, 4)
    scene.add(key)
    const aspect = el.clientWidth / el.clientHeight
    const camera = new THREE.OrthographicCamera(-.75 * aspect, .75 * aspect, 1.25, -.25, .1, 50)
    const side = q.get('side')
    camera.position.set(side ? 10 : 0, 0, side ? 0 : 10)
    camera.lookAt(0, 0, 0)
    void (async () => {
      const rigged = await load('/models/omar-rigged.glb')
      const overlay = q.get('overlay')
      if (overlay) {
        const plain = new Puppet(rigged)
        plain.root.position.x = -.4
        const both = new Puppet(rigged)
        both.mesh.material = new THREE.MeshBasicMaterial({ color: '#2f60c8', wireframe: true, transparent: true, opacity: .25 })
        both.root.position.x = .4
        const statue = (await load(`/models/interests/${overlay}.glb`)).scene.clone()
        statue.scale.setScalar(FIT[overlay].scale)
        statue.position.set(.4 + (FIT[overlay].offset?.[0] ?? 0), FIT[overlay].offset?.[1] ?? 0, FIT[overlay].offset?.[2] ?? 0)
        scene.add(plain.root, both.root, statue)
      } else {
        const outfits = (q.get('outfits') ?? 'hike').split(',')
        const pose = POSES[q.get('pose') ?? 'walk']
        for (const [i, name] of outfits.entries()) {
          const gltf = name === 'plain' ? null : await load(`/models/interests/${name}.glb`)
          const p = new Puppet(rigged, gltf ? { gltf, scale: FIT[name].scale, offset: FIT[name].offset } : undefined)
          p.root.position.x = (i - (outfits.length - 1) / 2) * .8
          scene.add(p.root)
          p.root.updateMatrixWorld(true)
          p.pose(pose)
        }
      }
      renderer.render(scene, camera)
      el.dataset.ready = 'true'
    })()
    return () => renderer.dispose()
  }, [])
  return <canvas ref={canvas} style={{ width: '100vw', height: '100vh', display: 'block' }} />
}
