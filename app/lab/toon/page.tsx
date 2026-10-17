import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ToonLab from './ToonLab'

export const metadata: Metadata = { title: 'Diorama lab', robots: { index: false } }

// A bench for the drawn scenes, one at a time and as large as the window. Development only.
export default function Lab() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <ToonLab />
}
