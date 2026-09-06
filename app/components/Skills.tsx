'use client'

import { useState, type PointerEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import styles from './Skills.module.css'

type Receipt = { label: string; note: string; href: string }
type Skill = { name: string; receipts?: Receipt[] }
type Group = { title: string; skills: Skill[] }

// Every receipt points at something else on this page. Nothing here is claimed without a place to check it.
const r = {
  clascade: { label: 'Clascade', note: 'project · cuHacking 2026', href: '#project-0' },
  revenant: { label: 'Revenant', note: 'project · GenAI Genesis', href: '#project-1' },
  queryforge: { label: 'QueryForge', note: 'project · MindBridge challenge', href: '#project-2' },
  roadsense: { label: 'RoadSense', note: 'project · Hack the Future', href: '#project-3' },
  journale: { label: 'Journale AI', note: 'contract · developer & security analyst', href: '#story-journale' },
  uomsa: { label: 'uomsa.ca', note: 'uOttawa MSA', href: '#story-uomsa' },
  ieee: { label: 'IEEE workshops', note: '4 sessions · 100+ students', href: '#story-ieee' },
  cuhacking: { label: 'cuHacking', note: 'penetration testing', href: '#story-cuhacking' },
  bearhacks: { label: 'BearHacks', note: 'penetration testing', href: '#story-bearhacks' },
  freelance: { label: 'Client sites', note: 'freelance · 5+ in production', href: '#story-freelance' },
  eof: { label: 'empowerorphans.com', note: 'Empower Orphans Foundation', href: '#story-eof-web' },
  cumsa: { label: 'cumsa.ca', note: 'security audit & auth', href: '#story-cumsa' },
  redshifted: { label: 'Redshifted Catalyst Hackathon', note: 'mentor & judge · high school hardware teams', href: '#story-redshifted' },
  ctf: { label: 'Three CTF finishes', note: 'wins', href: '#awards' },
  bsides: { label: 'BSides Ottawa CTF', note: 'AI sub-agents on the board', href: '#awards' },
  site: { label: 'This site', note: 'you’re looking at it', href: '#home' },
}

const groups: Group[] = [
  {
    title: 'Languages',
    skills: [
      { name: 'Python', receipts: [r.queryforge, r.roadsense, r.revenant] },
      { name: 'TypeScript', receipts: [r.clascade, r.site] },
      { name: 'JavaScript', receipts: [r.uomsa, r.eof, r.freelance] },
      { name: 'C++', receipts: [r.redshifted] },
      { name: 'Java' },
      { name: 'SQL', receipts: [r.queryforge, r.uomsa] },
      { name: 'Bash', receipts: [r.freelance, r.ieee] },
    ],
  },
  {
    title: 'AI & Machine Learning',
    skills: [
      { name: 'Computer Vision', receipts: [r.roadsense] },
      { name: 'YOLOv8', receipts: [r.roadsense] },
      { name: 'OpenCV', receipts: [r.roadsense] },
      { name: 'Ollama', receipts: [r.queryforge] },
      { name: 'RAG', receipts: [r.clascade, r.revenant] },
      { name: 'Agentic AI', receipts: [r.queryforge, r.bsides] },
      { name: 'LLM Integration', receipts: [r.journale, r.clascade, r.revenant] },
      { name: 'Prompt Engineering', receipts: [r.queryforge] },
    ],
  },
  {
    title: 'Frameworks & Libraries',
    skills: [
      { name: 'Next.js', receipts: [r.clascade, r.roadsense, r.revenant, r.uomsa, r.eof, r.freelance, r.site] },
      { name: 'React', receipts: [r.uomsa, r.site] },
      { name: 'Node.js' },
      { name: 'FastAPI', receipts: [r.revenant] },
      { name: 'Tailwind CSS', receipts: [r.eof, r.site] },
      { name: 'Framer Motion', receipts: [r.site] },
    ],
  },
  {
    title: 'Infrastructure & DevOps',
    skills: [
      { name: 'Linux', receipts: [r.freelance, r.ieee] },
      { name: 'Docker', receipts: [r.revenant, r.ieee, r.freelance] },
      { name: 'Nginx' },
      { name: 'CI/CD', receipts: [r.ieee] },
      { name: 'GitHub Actions', receipts: [r.ieee] },
      { name: 'PostgreSQL', receipts: [r.revenant, r.uomsa] },
      { name: 'Redis', receipts: [r.revenant] },
      { name: 'Supabase', receipts: [r.roadsense, r.eof] },
      { name: 'Cloudflare' },
    ],
  },
  {
    title: 'Security',
    skills: [
      { name: 'Penetration Testing', receipts: [r.journale, r.cuhacking, r.bearhacks] },
      { name: 'Burp Suite', receipts: [r.journale] },
      { name: 'Kali Linux' },
      { name: 'Web Security', receipts: [r.journale, r.cumsa] },
      { name: 'Secure Coding', receipts: [r.eof] },
      { name: 'CTF', receipts: [r.ctf] },
    ],
  },
]

const all = groups.flatMap(group => group.skills.map(skill => ({ ...skill, group: group.title })))
const withReceipts = all.filter(skill => skill.receipts?.length).length

export default function Skills() {
  const [selected, setSelected] = useState('Next.js')
  const [preview, setPreview] = useState<string | null>(null)
  const current = all.find(skill => skill.name === (preview ?? selected)) ?? all[0]

  function enter(event: PointerEvent<HTMLButtonElement>, name: string) {
    if (event.pointerType !== 'touch') setPreview(name)
  }

  return (
    <section id="skills" className={styles.section} aria-labelledby="skills-title">
      <div className={styles.container}>
        <div className={styles.heading}>
          <div><p className={styles.kicker}>with receipts</p><h2 id="skills-title"><span>{'//'}</span> skills &amp; tools</h2></div>
          <p>technologies I work with<br /><span>Pick a tool. The receipt shows where on this page I actually used it.</span></p>
        </div>

        <div className={styles.body}>
          <div>
            <div className={styles.groups}>
              {groups.map(group => (
                <div key={group.title} className={styles.group}>
                  <h3>{group.title}</h3>
                  <div className={styles.chips} onPointerLeave={() => setPreview(null)}>
                    {group.skills.map(skill => (
                      <button key={skill.name} type="button" className={styles.chip} data-has={!!skill.receipts?.length}
                        aria-pressed={selected === skill.name} onClick={() => setSelected(skill.name)}
                        onPointerEnter={event => enter(event, skill.name)}>
                        <i aria-hidden="true" />{skill.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.note}>
              <strong>Always learning.</strong> Most of what I know came from shipping under a deadline — hackathons, CTFs, and production sites people actually depend on. Currently going deeper on agentic AI systems and offensive security.
            </p>
          </div>

          <aside className={styles.receipt} aria-live="polite" aria-label="Where this tool was used">
            <div className={styles.overline}><span>receipt</span><span>{current.group}</span></div>
            <h3>{current.name}</h3>
            {current.receipts?.length ? (
              <>
                <p className={styles.lead}>seen in</p>
                <ul className={styles.receipts}>
                  {current.receipts.map(receipt => (
                    <li key={receipt.href + receipt.label}>
                      <a href={receipt.href}>{receipt.label}<ArrowUpRight size={13} /></a>
                      <span>{receipt.note}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={styles.none}>Nothing public to point at yet. Coursework and side work so far — ask me about it.</p>
            )}
            <p className={styles.receiptFoot}>{withReceipts} of {all.length} tools point at something you can check.</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
