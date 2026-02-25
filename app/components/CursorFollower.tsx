'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function CursorFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', updateMousePosition)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
      window.removeEventListener('mouseover', handleMouseOver)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  if (isMobile) return null

  return (
    <>
      {/* Main cursor dot - instant follow, no delay */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          transform: `translate(${mousePosition.x - 8}px, ${mousePosition.y - 8}px) scale(${isHovering ? 1.5 : 1})`,
          transition: 'transform 0.05s ease-out',
        }}
      >
        <div className="w-4 h-4 bg-accent-yellow rounded-full" />
      </div>

      {/* Outer glow ring - very slight trail effect */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          scale: isHovering ? 1.8 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 800,
          damping: 35,
          mass: 0.2,
        }}
      >
        <div className="w-10 h-10 border-2 border-accent-yellow rounded-full opacity-30" />
      </motion.div>
    </>
  )
}

