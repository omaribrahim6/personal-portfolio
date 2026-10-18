import About from './components/voyage/stops/About'
import Awards from './components/voyage/stops/Awards'
import Contact from './components/voyage/stops/Contact'
import Home from './components/voyage/stops/Home'
import Interests from './components/voyage/stops/Interests'
import Projects from './components/voyage/stops/Projects'
import Skills from './components/voyage/stops/Skills'
import Voyage from './components/voyage/Voyage'

// The portfolio as a voyage across a solar punk archipelago, sunrise to sunset: seven stops, drawn live in
// 3D behind the page, with the words on cards that pass by as you go. The magazine edition is at /almanac.
export default function Page() {
  return (
    <Voyage>
      <Home />
      <About />
      <Projects />
      <Awards />
      <Skills />
      <Interests />
      <Contact />
    </Voyage>
  )
}
