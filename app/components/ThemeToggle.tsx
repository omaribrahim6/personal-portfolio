'use client'

import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import styles from './site.module.css'

// The page follows the system's light or dark setting until the visitor picks one. Their pick is kept in
// localStorage under 'theme' and put back on <html> by the script in the root layout, before anything paints.

const THEME_KEY = 'theme'
const dark = '(prefers-color-scheme: dark)'

function current(): 'light' | 'dark' {
  const chosen = document.documentElement.dataset.theme
  if (chosen === 'light' || chosen === 'dark') return chosen
  return matchMedia(dark).matches ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  const chosen = new MutationObserver(onChange)
  chosen.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const system = matchMedia(dark)
  system.addEventListener('change', onChange)
  return () => {
    chosen.disconnect()
    system.removeEventListener('change', onChange)
  }
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, current, () => null)
  const next = theme === 'dark' ? 'light' : 'dark'

  function flip() {
    const to = current() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = to
    try { localStorage.setItem(THEME_KEY, to) } catch {}
  }

  // Both icons are drawn and the stylesheet shows the right one, so it is right before React has loaded too.
  return (
    <button type="button" className={styles.theme} onClick={flip} aria-label={theme ? `Switch to ${next} mode` : 'Switch colour mode'}>
      <Moon size={18} aria-hidden="true" data-show="light" />
      <Sun size={18} aria-hidden="true" data-show="dark" />
    </button>
  )
}
