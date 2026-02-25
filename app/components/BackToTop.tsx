'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling past the hero section (roughly viewport height)
      if (window.scrollY > window.innerHeight * 0.8) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-dark-secondary hover:bg-accent-yellow text-light-primary hover:text-dark-primary transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-accent-yellow/50 group"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform duration-300" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
