// Everything the site says about Omar lives here. The components only decide how it is shown.

export const email = 'omarmgmi08@gmail.com'

export const links = {
  github: 'https://github.com/omaribrahim6',
  linkedin: 'https://www.linkedin.com/in/omar-ibrahim6/',
  resume: '/resume.pdf',
  email: `mailto:${email}`,
}

export const chapters = [
  { id: 'home', numeral: 'I', place: 'the ridge', label: 'Hello' },
  { id: 'about', numeral: 'II', place: 'the dunes', label: 'The story' },
  { id: 'projects', numeral: 'III', place: 'the arch', label: 'Selected work' },
  { id: 'awards', numeral: 'IV', place: 'the hill', label: 'Wins' },
  { id: 'skills', numeral: 'V', place: 'the field', label: 'The toolkit' },
  { id: 'interests', numeral: 'VI', place: 'the islands', label: 'Off the clock' },
  { id: 'contact', numeral: 'VII', place: 'the shore', label: 'Say hello' },
] as const

/* ---------------------------------------------------------------- the story */

export type Category = 'experience' | 'volunteer' | 'education'
export type Detail = string | { prefix?: string; linkText: string; href: string; suffix?: string }
export type Role = {
  id: string
  category: Category
  title: string
  organization: string
  label: string
  period?: string
  start?: string
  end?: string
  details: Detail[]
}

export const roles: Role[] = [
  {
    id: 'carleton', category: 'education', title: 'B.Eng. in Software Engineering', organization: 'Carleton University', label: 'Carleton',
    period: 'Sep 2024 — Apr 2028 (expected)', start: '2024-09', end: '2028-04',
    details: ['Relevant coursework: Data Structures, Digital Systems, Computer Architecture, Software Engineering'],
  },
  {
    id: 'journale', category: 'experience', title: 'Software Developer & Security Analyst', organization: 'Journale AI', label: 'Journale AI',
    period: 'Oct 2025 — Jan 2026 · Contract', start: '2025-10', end: '2026-01',
    details: [
      'Built a cloud AI dialogue system that plugs into game engines through custom SDKs',
      'Diagnosed backend and REST APIs to discover 6 critical flaws using Burp Suite, Postman, and cURL',
      'Fixed a Stripe integration flaw that bypassed payment and granted subscriptions, in under 5 hours',
      'Validated risks with the engineering team and recommended remediation under responsible disclosure',
    ],
  },
  {
    id: 'uomsa', category: 'experience', title: 'Software Developer Student', organization: 'uOttawa MSA', label: 'uOttawa MSA',
    period: 'Dec 2025 — Apr 2026', start: '2025-12', end: '2026-04',
    details: [
      'Built uomsa.ca in Next.js, eliminating the GoDaddy builder and cutting annual costs by $500',
      'Worked on an 8-developer Agile team building a library system supporting 1,000+ students across 5 organizations',
      'Built React components and shipped PostgreSQL migrations for the admin dashboard',
    ],
  },
  {
    id: 'ieee', category: 'experience', title: 'Technical Workshop Lead', organization: 'IEEE uOttawa Student Branch', label: 'IEEE uOttawa',
    period: 'Mar 2026', start: '2026-03', end: '2026-03',
    details: [
      'Delivered 4 technical workshops to 100+ students across a two-week series',
      'Taught Linux fundamentals, Docker, GitHub Actions CI/CD, AI/ML, and cybersecurity',
      'Built a lab environment of isolated per-student Docker containers with custom challenges',
    ],
  },
  {
    id: 'cuhacking', category: 'experience', title: 'Penetration Tester', organization: 'cuHacking', label: 'cuHacking',
    period: 'Mar 2026 — Apr 2026', start: '2026-03', end: '2026-04',
    details: ["Security testing across Canada's largest student-run hackathon platform (on-call)"],
  },
  {
    id: 'bearhacks', category: 'experience', title: 'Penetration Tester', organization: 'BearHacks', label: 'BearHacks',
    period: 'Apr 2026', start: '2026-04', end: '2026-04',
    details: ['Security testing for the event platform ahead of launch (remote, on-call)'],
  },
  {
    id: 'freelance', category: 'experience', title: 'Freelance Developer', organization: 'Independent', label: 'Freelance',
    period: 'Sep 2025 — Present', start: '2025-09', end: 'present',
    details: [
      'Design, deploy, and maintain containerized production websites for clients in Next.js, owning full-stack development, SEO, and infrastructure',
      'Manage Linux VPS environments including domains, SSL, firewall hardening, backups, and uptime monitoring',
      'Hosting 5+ sites and APIs over HTTPS, handling ~8,000 unique visitors and 300k requests monthly',
      { prefix: '(', linkText: 'contact', href: '#contact', suffix: ' me for a website)' },
    ],
  },
  {
    id: 'eof-lead', category: 'volunteer', title: 'Co-Founder & Co-President', organization: 'Empower Orphans Foundation', label: 'EOF · lead',
    period: 'Mar 2025 — Apr 2026', start: '2025-03', end: '2026-04',
    details: [
      'Lead a 20+ member team across marketing, events, and sponsorship divisions',
      'Organized fundraisers and collaborations with Islamic Relief for orphan care',
      'Oversee partnerships, finance tracking, and organizational strategy across Carleton and uOttawa',
    ],
  },
  {
    id: 'eof-web', category: 'volunteer', title: 'Web Developer', organization: 'Empower Orphans Foundation', label: 'EOF · web',
    period: 'Sep 2025 — Apr 2026', start: '2025-09', end: '2026-04',
    details: [
      'Built empowerorphans.com with Next.js, Supabase, and Tailwind CSS',
      'Shipped a secure admin dashboard and event-management system for real-time updates',
      'Deployed for cross-campus use across the Carleton and uOttawa chapters',
    ],
  },
  {
    id: 'redshifted', category: 'volunteer', title: 'Mentor & Judge', organization: 'Redshifted Catalyst Hackathon', label: 'Redshifted',
    period: 'Mar 2026', start: '2026-03', end: '2026-03',
    details: [
      'Mentored high school teams designing hardware for a space-survival challenge, taking them from idea to prototype to pitch in a few hours',
      'Mentored teams in C++ as they built everything from alien proximity detectors to remote-controlled rovers',
      'Sat on the judging panel for the advanced teams, evaluating their projects and final pitches',
      'Supported by Thales, CIRA, the uOttawa Faculty of Engineering, and ElevenLabs',
    ],
  },
  {
    id: 'cumsa', category: 'volunteer', title: 'Web Security', organization: 'CUMSA', label: 'CUMSA',
    details: ['Security audit, fixes, and authentication logic for cumsa.ca'],
  },
]

export const roleFilters: [Category | 'all', string][] = [
  ['all', 'everything'], ['experience', 'experience'], ['volunteer', 'volunteer'], ['education', 'education'],
]

/* ----------------------------------------------------------------- the work */

export type Project = {
  number: string
  title: string
  award: string
  description: string
  tags: string[]
  github?: string
  demo?: string
  demoLabel?: string
  devpost?: string
  /** The painted window beside each project: what it is called and what pressing it does. */
  window: { scene: 'signal' | 'cascade' | 'trail' | 'reflection'; caption: string; action: [string, string] }
}

export const projects: Project[] = [
  {
    number: '00',
    title: 'Mamdani',
    award: 'Hack the Hill III — Best Use of Gemini API',
    description: 'Point your phone at a pothole and talk to Mamdani, a 3D inspector who looks at the problem, asks what he needs to and files the report himself. Reports of the same problem collapse into one work order, neighbours back it up in a public feed, and the city sees it seconds later on a live dashboard: ranked, mapped and routed to a crew. Built with a team of four.',
    tags: ['Next.js', 'React', 'Gemini', 'Vertex AI', 'PostgreSQL', 'Tiger Data', 'Tripo'],
    github: 'https://github.com/omaribrahim6/mamdani',
    devpost: 'https://devpost.com/software/hi-kwzyut',
    window: { scene: 'signal', caption: 'heard by the whole street', action: ['File the report', 'Clear the street'] },
  },
  {
    number: '01',
    title: 'Clascade',
    award: 'cuHacking 2026 — Best Use of Gemini',
    description: 'Teachers upload the slide deck they already have and Clascade turns it into a collaborative 3D lesson the whole class moves through together in the browser. The teacher controls every phase from their own screen so no student can rush ahead, every generated fact is grounded in cited sources, and every scene is age-checked before students ever see it.',
    tags: ['Next.js', 'TypeScript', '3D / WebGL', 'RAG', 'EdTech'],
    demo: 'https://clascade-page.vercel.app/',
    demoLabel: 'Case Study & Demos',
    devpost: 'https://devpost.com/software/clascade',
    window: { scene: 'cascade', caption: 'learning in layers', action: ['Unfold the lesson', 'Fold the lesson'] },
  },
  {
    number: '02',
    title: 'Revenant',
    award: 'GenAI Genesis 2026 — Winner, Moorcheh.ai Track',
    description: 'Won Canada\'s largest AI hackathon against 1,000+ hackers. Every company slowly loses its memory — the reasoning behind engineering decisions gets buried in Slack threads and pull requests. Revenant captures that reasoning as it happens, so two years later a developer can ask "why did we pick Postgres?" and get the original discussion back. Built in 36 hours.',
    tags: ['Next.js', 'FastAPI', 'Python', 'PostgreSQL', 'Redis', 'RAG', 'Docker'],
    devpost: 'https://devpost.com/software/revenent',
    window: { scene: 'trail', caption: 'nothing lost in the thread', action: ['Trace the decision', 'Reset the trail'] },
  },
  {
    number: '03',
    title: 'QueryForge',
    award: 'MindBridge AI Challenge',
    description: 'A natural-language-to-SQL agent that lets anyone query a database in plain English. Hit 98% accuracy across 172 test cases, including trick questions written specifically to break it. Runs entirely on CPU through Ollama with no external API, so data never leaves the machine and inference costs nothing.',
    tags: ['Python', 'DuckDB', 'Ollama', 'SQL', 'Local LLM'],
    github: 'https://github.com/omaribrahim6/QueryForge',
    window: { scene: 'reflection', caption: 'a question becomes a query', action: ['Turn words into a query', 'Back to the question'] },
  },
]

/* ----------------------------------------------------------------- the wins */

export type Mode = 'built' | 'broke' | 'named'
export type Award = {
  result: string
  event: string
  detail: string
  date: string
  mode: Mode
  project?: { label: string; href: string }
}

export const modes: Record<Mode, string> = { built: 'built it', broke: 'broke it', named: 'named' }

export const awards: Award[] = [
  {
    result: 'Winner', event: 'Hack the Hill III', date: 'Sep 2026', mode: 'built',
    detail: 'Built Mamdani with a team of four — a 3D inspector residents talk to, who turns a photo of a pothole into a work order the city can act on.',
    project: { label: 'see the build · Mamdani', href: '#project-0' },
  },
  {
    result: 'Winner', event: 'cuHacking 2026', date: 'Jul 2026', mode: 'built',
    detail: 'Built Clascade with a team of four — turning teachers’ existing slide decks into collaborative 3D lessons.',
    project: { label: 'see the build · Clascade', href: '#project-1' },
  },
  {
    result: 'Engineer of the Year', event: 'IEEE uOttawa Student Branch', date: 'Apr 2026', mode: 'named',
    detail: 'Awarded at WIPS 2026.',
  },
  {
    result: '1st Place', event: 'uOttawa Cybersecurity Club CTF', date: 'Apr 2026', mode: 'broke',
    detail: 'Won as a team and posted the highest individual score in the room, across web, crypto, and reverse engineering.',
  },
  {
    result: 'Most Flags Found', event: 'BSides Ottawa Meetup CTF', date: 'Apr 2026', mode: 'broke',
    detail: 'Orchestrated parallel AI sub-agents across the challenge board and led the field at ~4000 points, before an unconstrained agent spent ~1000 of them on hints. Finished 5th with the most flags found.',
  },
  {
    result: 'Winner — Moorcheh.ai Track', event: 'GenAI Genesis 2026', date: 'Mar 2026', mode: 'built',
    detail: 'Canada’s largest AI hackathon. Built Revenant in 36 hours against 1,000+ hackers at the University of Toronto.',
    project: { label: 'see the build · Revenant', href: '#project-2' },
  },
  {
    result: '1st Place', event: 'IEEE uOttawa × Hack The Box CTF', date: 'Feb 2026', mode: 'broke',
    detail: 'Team finished with 64 of 67 flags. 2nd individually at 40.',
  },
  {
    result: '2nd Place', event: 'Hack the Future Hackathon', date: 'Feb 2026', mode: 'built',
    detail: 'Built RoadSense, an AI road-damage detection system, with a team of four.',
    project: { label: 'see the code · RoadSense', href: 'https://github.com/omaribrahim6/roadsense' },
  },
]

export const awardFilters: [Mode | 'all', string][] = [
  ['all', 'everything'], ['built', 'built it'], ['broke', 'broke it'], ['named', 'named'],
]

/** Every hackathon and CTF on the list, and how many of them ended in a win or a placing (all of them). */
export const competitions = awards.filter(award => award.mode !== 'named')

/* ------------------------------------------------------------- the interests */

export type Photo = {
  /** The print. The same name with .full.webp is the one opened large. Made by scripts/photos.mjs. */
  src: string
  alt: string
  /** A few words written on the print. */
  caption?: string
  /** Width over height. */
  ratio: number
  /** Which outfit it belongs with, where there are several. */
  with?: string
}
export type Interest = {
  id: 'outdoors' | 'competing' | 'games' | 'soccer'
  title: string
  kicker: string
  /** Set large, above the words. */
  figure?: string
  body: string
  /** Where one island holds several things, he changes into each in turn. */
  outfits?: { id: 'hike' | 'bike' | 'paddle'; label: string }[]
  links?: { label: string; href: string }[]
  photos: Photo[]
}

// Photos live in public/interests/<island>/, put there by scripts/photos.mjs. A handful per island at most.
export const interests: Interest[] = [
  {
    id: 'outdoors',
    title: 'The outdoors',
    kicker: 'on foot, on two wheels, on the water',
    body: 'When the laptop closes I go outside. I hike, I ride trails on a mountain bike, and I get out on the water on a paddleboard or in a kayak.',
    outfits: [{ id: 'hike', label: 'Hiking' }, { id: 'bike', label: 'Biking' }, { id: 'paddle', label: 'Paddleboarding' }],
    photos: [
      { src: '/interests/outdoors/summit.webp', ratio: 3 / 4, with: 'hike', caption: 'at the lookout', alt: 'Me smiling on a granite ledge with forested mountains rolling away behind me.' },
      { src: '/interests/outdoors/mountain.webp', ratio: 3 / 4, with: 'hike', caption: 'with a walking stick', alt: 'Me standing on a dirt clearing holding a wooden walking stick, a big forested mountain behind me.' },
      { src: '/interests/outdoors/via-ferrata.webp', ratio: 4 / 3, with: 'hike', caption: 'via ferrata', alt: 'Me in a climbing helmet and harness, clipped to the cable on a rock ledge, arms out over a valley of autumn forest.' },
      { src: '/interests/outdoors/summit-ridge.webp', ratio: 4 / 3, with: 'hike', caption: 'on top', alt: 'Me standing on a bare summit in a black and white jacket, ridges fading into haze behind me.' },
      { src: '/interests/outdoors/summit-rest.webp', ratio: 3 / 4, with: 'hike', caption: 'catching my breath', alt: 'Me sitting on a boulder near the top, looking out over the valley below.' },
      { src: '/interests/outdoors/trailhead.webp', ratio: 3 / 4, with: 'hike', caption: 'heading in', alt: 'Two friends walking ahead of me down a rocky trail toward a mountain, under a big sky.' },
      { src: '/interests/outdoors/valley.webp', ratio: 3 / 4, with: 'hike', caption: 'the view from up there', alt: 'Layers of blue mountain ridges fading into haze beyond a steep valley.' },
      { src: '/interests/outdoors/trail.webp', ratio: 3 / 4, with: 'bike', caption: 'down the trail', alt: 'My handlebars, riding fast down a dirt trail through a tunnel of green trees.' },
      { src: '/interests/outdoors/bike-lake.webp', ratio: 3 / 4, with: 'bike', caption: 'a stop by the water', alt: 'My mountain bike leaning on a bench at the edge of a wide lake.' },
      { src: '/interests/outdoors/trail-2.webp', ratio: 3 / 4, with: 'bike', caption: 'same trail, later', alt: 'My handlebars on a forest trail, long shadows across the dirt.' },
      { src: '/interests/outdoors/paddleboard.webp', ratio: 3 / 4, with: 'paddle', caption: 'out at sunset', alt: 'The nose of my paddleboard on the water at sunset, my shoes strapped to the deck.' },
      { src: '/interests/outdoors/paddle-blue.webp', ratio: 3 / 4, with: 'paddle', caption: 'choppy day', alt: 'A blue paddleboard on choppy water, heading for a tree-lined shore.' },
      { src: '/interests/outdoors/kayak.webp', ratio: 3 / 4, with: 'paddle', caption: 'in the kayak', alt: 'From my kayak, a friend paddling ahead toward the sun breaking under the clouds.' },
      { src: '/interests/outdoors/board-shore.webp', ratio: 3 / 4, with: 'paddle', caption: 'before heading out', alt: 'My paddleboard on a rocky shore, a wide calm river beyond it.' },
      { src: '/interests/outdoors/paddle-orange.webp', ratio: 3 / 4, with: 'paddle', alt: 'Looking down the nose of an orange and red board, a wooden paddle across it.' },
    ],
  },
  {
    id: 'competing',
    title: 'Competing',
    kicker: 'hackathons and CTFs',
    figure: `${competitions.length} for ${competitions.length}`,
    body: `${competitions.length} hackathons and CTFs, and I came away with something from every one of them: a first place, a track win, or the most flags on the board. Give me a clock, a problem and a room full of people trying to get there first.`,
    links: [{ label: 'See the wins', href: '#awards' }],
    photos: [
      { src: '/interests/competing/hack-the-hill.webp', ratio: 4 / 3, caption: 'Hack the Hill · Mamdani', alt: 'My team of four at our table with Mamdani running on every laptop, holding team number 45.' },
      { src: '/interests/competing/genai-genesis.webp', ratio: 4 / 3, caption: 'GenAI Genesis · track win', alt: 'My team of four holding our prize keyboards in front of the GenAI Genesis 2026 banner.' },
      { src: '/interests/competing/astralis.webp', ratio: 3 / 2, caption: 'uOttawa CTF · 1st', alt: 'Team Astralis, six of us, in front of the projected team page: 1st place, 1700 points.' },
      { src: '/interests/competing/uocybersec-scoreboard.webp', ratio: 4 / 3, caption: 'the final scoreboard', alt: 'The uOttawa Cybersecurity Club CTF scoreboard on my laptop, Astralis first with 1700.' },
      { src: '/interests/competing/whiteboard.webp', ratio: 4 / 3, caption: 'planning Mamdani', alt: 'Me at a whiteboard sketching the Mamdani pipeline: input, Gemini, a Postgres database and the city dashboard.' },
      { src: '/interests/competing/northstorm.webp', ratio: 4 / 3, caption: 'BSides meetup CTF', alt: 'The BSides Ottawa meetup CTF scoreboard on my laptop, one line climbing far above the rest.' },
      { src: '/interests/competing/log4shell-range.webp', ratio: 3 / 4, caption: 'Log4Shell, on a cyber range', alt: 'A workstation on a red-lit cyber range, with a diagram of the Log4Shell attack on the wall screen.' },
      { src: '/interests/competing/hack-the-future.webp', ratio: 4 / 3, caption: 'Hack the Future · 2nd', alt: 'Everyone at the Hack the Future hackathon, run by the uOttawa and Carleton MSAs, in front of the title slide.' },
      { src: '/interests/competing/builder-sundays.webp', ratio: 3 / 4, caption: 'QueryForge, mid-build', alt: 'My laptop and iPad on a table at Shopify Builder Sundays, with code on one screen and the QueryForge architecture on the other.' },
      { src: '/interests/competing/clascade-build.webp', ratio: 3 / 4, caption: 'build day', alt: 'My laptop open at a table with friends working across from me.' },
      { src: '/interests/competing/redshifted-mentor.webp', ratio: 3 / 4, caption: 'mentor at Redshifted', alt: 'My mentor badge from the Redshifted Catalyst hackathon on a blue lanyard.' },
    ],
  },
  {
    id: 'games',
    title: 'Games & security',
    kicker: 'building games, breaking systems',
    body: 'I build games on Roblox. Downhill is out now: a longboard, a mountain pass, and gravity. The other half is security: penetration testing for cuHacking, BearHacks and Journale AI, and a CTF whenever there is one.',
    links: [{ label: 'Play Downhill on Roblox', href: 'https://www.roblox.com/games/81999621480692/Downhill' }],
    photos: [
      { src: '/interests/games/downhill-art.webp', ratio: 767 / 432, caption: 'Downhill', alt: 'Key art for Downhill: a rider in a white helmet carving a mountain road at sunset, sparks flying from his glove.' },
      { src: '/interests/games/downhill-title.webp', ratio: 768 / 319, caption: 'the title screen', alt: 'The Downhill title screen in game: a rider on a longboard at the top of an empty mountain road, with the menu beside him.' },
    ],
  },
  {
    id: 'soccer',
    title: 'Soccer',
    kicker: 'Liverpool, always',
    body: 'I play weekly with my friends. My favourite team is Liverpool.',
    photos: [
      { src: '/interests/soccer/super-league.webp', ratio: 9 / 16, caption: 'on the ball', alt: 'Me in a dark shirt about to strike the ball in a game on turf, a goal behind me.' },
      { src: '/interests/soccer/match.webp', ratio: 3 / 4, caption: 'from the stands', alt: 'A professional match at a stadium at golden hour, the keeper picking up the ball in front of goal.' },
    ],
  },
]

/* --------------------------------------------------------------- the toolkit */

export type Receipt = { label: string; note: string; href: string }
export type Skill = { name: string; receipts?: Receipt[] }
export type SkillGroup = { title: string; skills: Skill[] }

// Every receipt points at something else on this page. Nothing here is claimed without a place to check it.
const r = {
  mamdani: { label: 'Mamdani', note: 'project · Hack the Hill III', href: '#project-0' },
  clascade: { label: 'Clascade', note: 'project · cuHacking 2026', href: '#project-1' },
  revenant: { label: 'Revenant', note: 'project · GenAI Genesis', href: '#project-2' },
  queryforge: { label: 'QueryForge', note: 'project · MindBridge challenge', href: '#project-3' },
  roadsense: { label: 'RoadSense', note: '2nd place · Hack the Future', href: '#awards' },
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

export const skillGroups: SkillGroup[] = [
  {
    title: 'Languages',
    skills: [
      { name: 'Python', receipts: [r.queryforge, r.roadsense, r.revenant] },
      { name: 'TypeScript', receipts: [r.mamdani, r.clascade, r.site] },
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
      { name: 'LLM Integration', receipts: [r.mamdani, r.journale, r.clascade, r.revenant] },
      { name: 'Prompt Engineering', receipts: [r.queryforge] },
    ],
  },
  {
    title: 'Frameworks & Libraries',
    skills: [
      { name: 'Next.js', receipts: [r.mamdani, r.clascade, r.roadsense, r.revenant, r.uomsa, r.eof, r.freelance, r.site] },
      { name: 'React', receipts: [r.mamdani, r.uomsa, r.site] },
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
