'use client'

import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const preference = window.matchMedia(query)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

function getSnapshot() { return window.matchMedia(query).matches }
function getServerSnapshot() { return true }

// The installed Motion hook samples this preference only on mount. Subscribe
// directly so changing the OS/browser setting takes effect without a reload.
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
