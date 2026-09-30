import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ModelLab from './ModelLab'

export const metadata: Metadata = { title: 'Model lab', robots: { index: false } }

// A bench for looking at the generated character before he goes anywhere near the site.
// Development only: the production build answers 404 here.
export default function Lab() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <ModelLab />
}
