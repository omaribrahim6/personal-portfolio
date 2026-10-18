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
    const side = new URLSearchParams(location.search).get('side')
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
