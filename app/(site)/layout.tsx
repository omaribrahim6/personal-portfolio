import type { ReactNode } from 'react'
import MiniOmar from '../components/mini/MiniOmar'

// The page, and the small Omar in the corner.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <MiniOmar />
    </>
  )
}
