import Hero from './components/Hero'
import Shore from './components/Shore'
import Story from './components/Story'
import Toolkit from './components/Toolkit'
import Wins from './components/Wins'
import Works from './components/Works'
import World from './components/World'

// One night's walk, dusk to dawn: six paintings under a single sky, and the portfolio written on the ground between them.
export default function Home() {
  return (
    <World>
      <main>
        <Hero />
        <Story />
        <Works />
        <Wins />
        <Toolkit />
        <Shore />
      </main>
    </World>
  )
}
