'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { NAME_PIXELS as pixels } from './pixelFont'

type Props = {
  scatter: number
  paused: boolean
  onStateChange: (state: 'ready' | 'unavailable') => void
}

// Deterministic destinations avoid a different composition on every render.
const noise = (index: number, seed: number) => {
  const n = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453
  return n - Math.floor(n)
}

export default function PixelScene({ scatter, paused, onStateChange }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const controls = useRef({ scatter, paused })
  const invalidate = useRef<(() => void) | null>(null)

  useEffect(() => {
    controls.current = { scatter, paused }
    invalidate.current?.()
  }, [scatter, paused])

  useEffect(() => {
    const element = host.current
    if (!element) return

    let renderer: THREE.WebGLRenderer
    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power' })
      if (!context) {
        onStateChange('unavailable')
        return
      }
      renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      onStateChange('unavailable')
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x1a1a1a, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    element.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-25, 25, 12, -12, .1, 200)
    camera.position.set(0, 0, 65)
    const group = new THREE.Group()
    scene.add(group)

    const geometry = new RoundedBoxGeometry(.87, .87, 1.15, 2, .055)
    const material = new THREE.MeshStandardMaterial({ color: 0xffcf16, roughness: .32, metalness: .28 })
    const cubes = new THREE.InstancedMesh(geometry, material, pixels.length)
    cubes.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    // The cubes can travel beyond their assembled bounding volume.
    cubes.frustumCulled = false
    group.add(cubes)

    scene.add(new THREE.AmbientLight(0xfff2d0, 1.25))
    const key = new THREE.DirectionalLight(0xfff5dc, 3.8)
    key.position.set(-15, 24, 28)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffbb32, 2)
    rim.position.set(20, -10, -8)
    scene.add(rim)

    const dummy = new THREE.Object3D()
    const destinations = pixels.map((p, i) => ({
      x: p.x * .35 + (noise(i, 1) - .5) * 40,
      y: (noise(i, 2) - .5) * 19,
      z: (noise(i, 3) - .5) * 18,
      rx: (noise(i, 4) - .5) * 7,
      ry: (noise(i, 5) - .5) * 7,
    }))
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = motionPreference.matches
    let currentScatter = reduced ? controls.current.scatter / 100 : .7
    let pointerX = 0
    let pointerY = 0
    let frame = 0
    let visible = true
    let disposed = false
    let contextLost = false
    let previousTime = 0
    let elapsed = 0
    let rotationX = .16
    let rotationY = -.13

    function schedule() {
      if (!frame && visible && !document.hidden && !disposed && !contextLost) frame = requestAnimationFrame(render)
    }

    function render(time: number) {
      frame = 0
      const dt = previousTime ? Math.min((time - previousTime) / 1000, .05) : 1 / 60
      previousTime = time
      const moving = !reduced && !controls.current.paused
      if (moving) elapsed += dt
      const targetScatter = controls.current.scatter / 100
      const easing = reduced ? 1 : 1 - Math.exp(-dt * 5)
      currentScatter += (targetScatter - currentScatter) * easing
      if (Math.abs(currentScatter - targetScatter) < .0005) currentScatter = targetScatter
      const targetX = .16 + (moving ? pointerY * .09 : 0)
      const targetY = -.13 + (moving ? pointerX * .15 : 0)
      rotationX += (targetX - rotationX) * easing
      rotationY += (targetY - rotationY) * easing
      group.rotation.set(rotationX, rotationY, -.018)

      pixels.forEach((pixel, i) => {
        const dest = destinations[i]
        const amount = currentScatter
        const drift = moving ? Math.sin(elapsed * .7 + i * .13) * .045 : 0
        dummy.position.set(
          THREE.MathUtils.lerp(pixel.x, dest.x, amount),
          THREE.MathUtils.lerp(pixel.y, dest.y, amount) + drift,
          dest.z * amount + (moving ? Math.sin(elapsed * .5 + i * .2) * .12 : 0)
        )
        dummy.rotation.set(dest.rx * amount, dest.ry * amount, amount * Math.sin(i) * 2)
        dummy.updateMatrix()
        cubes.setMatrixAt(i, dummy.matrix)
      })
      cubes.instanceMatrix.needsUpdate = true
      renderer.render(scene, camera)
      if (moving || currentScatter !== targetScatter || Math.abs(rotationX - targetX) > .0001 || Math.abs(rotationY - targetY) > .0001) schedule()
    }

    function resize() {
      const { width, height } = element!.getBoundingClientRect()
      if (!width || !height) return
      const aspect = width / height
      const halfWidth = Math.max(24, 10.8 * aspect)
      camera.left = -halfWidth
      camera.right = halfWidth
      camera.top = halfWidth / aspect
      camera.bottom = -halfWidth / aspect
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      schedule()
    }

    function pointerMove(event: PointerEvent) {
      if (event.pointerType === 'touch') return
      const rect = element!.getBoundingClientRect()
      pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2
      pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2
      schedule()
    }
    function pointerLeave() { pointerX = 0; pointerY = 0; schedule() }
    function visibilityChange() {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0 }
      else { previousTime = 0; schedule() }
    }
    function preferenceChange() { reduced = motionPreference.matches; schedule() }
    function loseContext(event: Event) {
      event.preventDefault()
      contextLost = true
      cancelAnimationFrame(frame)
      frame = 0
      renderer.domElement.style.visibility = 'hidden'
      onStateChange('unavailable')
    }
    function restoreContext() {
      contextLost = false
      renderer.domElement.style.visibility = 'visible'
      onStateChange('ready')
      schedule()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(element)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) { previousTime = 0; schedule() }
      else { cancelAnimationFrame(frame); frame = 0 }
    })
    intersectionObserver.observe(element)
    element.addEventListener('pointermove', pointerMove)
    element.addEventListener('pointerleave', pointerLeave)
    document.addEventListener('visibilitychange', visibilityChange)
    motionPreference.addEventListener('change', preferenceChange)
    renderer.domElement.addEventListener('webglcontextlost', loseContext)
    renderer.domElement.addEventListener('webglcontextrestored', restoreContext)
    invalidate.current = schedule
    resize()
    onStateChange('ready')

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      invalidate.current = null
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      element.removeEventListener('pointermove', pointerMove)
      element.removeEventListener('pointerleave', pointerLeave)
      document.removeEventListener('visibilitychange', visibilityChange)
      motionPreference.removeEventListener('change', preferenceChange)
      renderer.domElement.removeEventListener('webglcontextlost', loseContext)
      renderer.domElement.removeEventListener('webglcontextrestored', restoreContext)
      geometry.dispose()
      material.dispose()
      cubes.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [onStateChange])

  return <div ref={host} style={{ width: '100%', height: '100%' }} />
}
