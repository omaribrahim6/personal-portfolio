import type { Metadata } from 'next'
import Almanac from '../components/Almanac'
import BackCover from '../components/BackCover'
import Contents from '../components/Contents'
import Cover from '../components/Cover'
import Features from '../components/Features'
import FieldNotes from '../components/FieldNotes'
import Interests from '../components/islands/Interests'
import Record from '../components/Record'
import SeedBank from '../components/SeedBank'

export const metadata: Metadata = {
  title: 'The Omar Ibrahim Almanac — Developer & Security Auditor',
  alternates: { canonical: '/almanac' },
}

// The reading edition: the same portfolio as one issue of a magazine, for anyone who would rather read than
// travel, and for browsers that cannot draw the voyage.
export default function AlmanacEdition() {
  return (
    <Almanac>
      <main>
        <Cover />
        <Contents />
        <FieldNotes />
        <Features />
        <Record />
        <SeedBank />
        <Interests />
        <BackCover />
      </main>
    </Almanac>
  )
}
