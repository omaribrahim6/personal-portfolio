import PixelExperience from './components/PixelExperience'
import About from './components/About'
import Projects from './components/Projects'
import Awards from './components/Awards'
import Skills from './components/Skills'
import Contact from './components/Contact'
import Navigation from './components/Navigation'
import CursorFollower from './components/CursorFollower'
import BackToTop from './components/BackToTop'
import ExperienceShell from './components/ExperienceShell'

export default function Home() {
  return (
    <ExperienceShell>
      <CursorFollower />
      <Navigation />
      <BackToTop />
      <main className="relative z-10">
        <PixelExperience />
        <About />
        <Projects />
        <Awards />
        <Skills />
        <Contact />
      </main>
    </ExperienceShell>
  )
}
