import Almanac from './components/Almanac'
import BackCover from './components/BackCover'
import Contents from './components/Contents'
import Cover from './components/Cover'
import Features from './components/Features'
import FieldNotes from './components/FieldNotes'
import Interests from './components/islands/Interests'
import Record from './components/Record'
import SeedBank from './components/SeedBank'

// The portfolio as one issue of a magazine: a cover, the contents, and a section for each part of the story,
// to a back cover with a coupon to clip. The illustrations are small 3D scenes, drawn live in ink.
export default function Home() {
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
