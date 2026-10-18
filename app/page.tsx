import About from './components/voyage/stops/About'
import Home from './components/voyage/stops/Home'
import Projects from './components/voyage/stops/Projects'
import Voyage, { Beat, Stop, StopHead } from './components/voyage/Voyage'

// The portfolio as a voyage across a solar punk archipelago, sunrise to sunset: seven stops, drawn live in
// 3D behind the page, with the words on cards that pass by as you go. The magazine edition is at /almanac.
export default function Page() {
  return (
    <Voyage>
      <Home />
      <About />
      <Projects />
      {(['awards', 'skills', 'interests', 'contact'] as const).map(id => (
        <Stop key={id} id={id}>
          <Beat><StopHead id={id} title={id} /></Beat>
          <Beat side="right"><p>…</p></Beat>
        </Stop>
      ))}
    </Voyage>
  )
}
