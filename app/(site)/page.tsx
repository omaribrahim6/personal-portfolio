import Islands from '../components/Islands'
import ThemeToggle from '../components/ThemeToggle'
import { awards, links, projects, roles, type Role } from '../content'
import styles from '../components/site.module.css'

// Anything still going comes first; the rest are newest first. School is in the line under the name.
const now = new Date().toISOString().slice(0, 7)
const current = (role: Role) => role.end === 'present' || (role.end ?? '') > now
const work = roles
  .filter(role => role.category !== 'education')
  .sort((a, b) => Number(current(b)) - Number(current(a)) || (b.start ?? '').localeCompare(a.start ?? ''))

const out = { target: '_blank', rel: 'noopener noreferrer' }

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div>
          <h1>Omar Ibrahim</h1>
          <p className={styles.role}>Software engineering student at Carleton. I build things, then try to break them.</p>
        </div>
        <ThemeToggle />
      </header>

      <nav id="contact" className={styles.links} aria-label="Contact">
        <a href={links.github} {...out}>GitHub</a>
        <a href={links.linkedin} {...out}>LinkedIn</a>
        <a href={links.email}>Email</a>
        <a href={links.resume} {...out}>Résumé</a>
      </nav>

      <section id="projects" className={styles.section} aria-labelledby="projects-title">
        <h2 id="projects-title" className={styles.label}>Projects</h2>
        <ul className={styles.rows}>
          {projects.map((project, index) => {
            const to = [
              project.demo && { label: project.demoLabel ?? 'Demo', href: project.demo },
              project.github && { label: 'GitHub', href: project.github },
              project.devpost && { label: 'Devpost', href: project.devpost },
            ].filter(link => !!link)
            return (
              <li key={project.title} id={`project-${index}`}>
                <h3>{project.title}</h3>
                <div>
                  <p>{project.line}</p>
                  <p className={styles.meta}>
                    <span>{project.award.replace(' — ', ', ')}</span>
                    {to.map(link => <a key={link.label} href={link.href} {...out}>{link.label}</a>)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section id="wins" className={styles.section} aria-labelledby="wins-title">
        <h2 id="wins-title" className={styles.label}>Wins</h2>
        {/* One row that scrolls sideways, so the list stays short. */}
        <div className={styles.wins} role="region" aria-labelledby="wins-title" tabIndex={0}>
          <ul>
            {awards.map(award => (
              <li key={`${award.event}-${award.result}`}>
                <time>{award.date}</time>
                <b>{award.result.replace(' — ', ', ')}</b>
                <span>{award.event}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="experience" className={styles.section} aria-labelledby="experience-title">
        <h2 id="experience-title" className={styles.label}>Experience</h2>
        <ul className={styles.rows}>
          {work.map(role => (
            <li key={role.id} id={`story-${role.id}`}>
              <time>{role.period?.replace(' · Contract', '')}</time>
              <h3>{role.title}, <em>{role.organization}</em></h3>
            </li>
          ))}
        </ul>
      </section>

      <Islands />
    </div>
  )
}
