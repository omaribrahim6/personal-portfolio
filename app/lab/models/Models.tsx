'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const NAMES = ['hike', 'bike', 'paddle', 'podium', 'games', 'security', 'soccer']

/** `?side=1` turns them all a quarter turn. */
export default function Models() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current!
    const renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true })
    renderer.setSize(el.clientWidth, el.clientHeight, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#e8e2d0')
    scene.add(new THREE.HemisphereLight('#ffffff', '#887766', 2.2))
    const key = new THREE.DirectionalLight('#ffffff', 1.6)
    key.position.set(2, 3, 4)
    scene.add(key)
    const params = new URLSearchParams(location.search)
    const side = params.get('side')
    // `?one=<name>` shows one model, front and side, on a grid a tenth of a unit apart, for measuring.
    const one = params.get('one')
    if (one) {
      const front = new THREE.OrthographicCamera(-.65, .65, 1.2, -.1, .1, 50)
      front.position.set(0, 0, 10)
      const flank = front.clone()
      flank.position.set(10, 0, 0)
      flank.lookAt(0, 0, 0)
      for (const axis of ['z', 'x'] as const) {
        const grid = new THREE.GridHelper(2.4, 24, '#c0392b', '#9b9384')
        if (axis === 'z') grid.rotation.x = Math.PI / 2
        else grid.rotation.z = Math.PI / 2
        grid.layers.set(axis === 'z' ? 1 : 2)
        scene.add(grid)
      }
      front.layers.enable(1)
      flank.layers.enable(2)
      new GLTFLoader().load(`/models/interests/${one}.glb`, gltf => {
        scene.add(gltf.scene)
        const w = el.width / 2
        renderer.setScissorTest(true)
        for (const [i, camera] of [front, flank].entries()) {
          renderer.setViewport(i * w, 0, w, el.height)
          renderer.setScissor(i * w, 0, w, el.height)
          renderer.render(scene, camera)
        }
        el.dataset.ready = 'true'
      })
      return () => renderer.dispose()
    }
    const camera = new THREE.OrthographicCamera(-4.2, 4.2, 1.35, -.25, .1, 50)
    camera.position.set(0, .55, 10)
    const loader = new GLTFLoader()
    const all = ['/models/omar-rigged.glb', ...NAMES.map(n => `/models/interests/${n}.glb`)]
    let done = 0
    all.forEach((url, i) => loader.load(url, gltf => {
      const m = gltf.scene
      m.position.x = -3.7 + i * 1.06
      if (i === 0) m.rotation.y = -Math.PI / 2
      if (side) m.rotation.y += Math.PI / 2
      scene.add(m)
      if (++done === all.length) { renderer.render(scene, camera); el.dataset.ready = 'true' }
    }))
    return () => renderer.dispose()
  }, [])
  return <canvas ref={canvas} style={{ width: '100vw', height: '100vh', display: 'block' }} />
}
