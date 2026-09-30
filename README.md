# Portfolio

Omar Ibrahim's portfolio, built with Next.js and TypeScript. The page is one night's walk from dusk to dawn: six painted landscapes under a single sky, with the portfolio written on the ground between them. See [docs/dreamscape.md](docs/dreamscape.md) for the concept and how it is built.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- WebGL (a hand-written shader for the sky) and 2D canvas (the painted terrain)

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To check a production build:

```bash
npm run lint
npm run build
npm run start
```

## Where things are

- `app/content.ts` — everything the site says: roles, projects, wins, tools, links
- `app/components/sky/` — the sky shader and what it looks like over each chapter
- `app/components/paint/` — the painted landscapes
- `app/components/` — one component per chapter, plus the shell that ties scrolling to the sky

## License

MIT
