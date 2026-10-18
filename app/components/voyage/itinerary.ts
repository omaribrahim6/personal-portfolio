import { roles } from '../../content'

// The stops of the voyage, in order. Each is a section of the page and a place in the world.
export const STOPS = [
  { id: 'home', name: 'Arrival' },
  { id: 'about', name: 'The garden path' },
  { id: 'projects', name: 'The workshops' },
  { id: 'awards', name: 'The station' },
  { id: 'skills', name: 'The glasshouse' },
  { id: 'interests', name: 'Five islands' },
  { id: 'contact', name: 'The pier' },
] as const

const monthIndex = (ym: string) => { const [y, m] = ym.split('-').map(Number); return y * 12 + m - 1 }
/** The roles in the order the garden path passes them: oldest first, the one without dates at the end. */
export const walkOrder = [...roles].sort((a, b) => (a.start ? monthIndex(a.start) : 1e6) - (b.start ? monthIndex(b.start) : 1e6))
