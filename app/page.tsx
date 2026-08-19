import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Awards from './components/Awards'
import Skills from './components/Skills'
import Contact from './components/Contact'
import Navigation from './components/Navigation'
import CursorFollower from './components/CursorFollower'
import BackToTop from './components/BackToTop'

export default function Home() {
  return (
    <>
      <CursorFollower />
      <Navigation />
      <BackToTop />
      <main className="relative z-10">
        <Hero />
        <About />
        <Projects />
        <Awards />
        <Skills />
        <Contact />
      </main>
    </>
  )
}

