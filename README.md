# Portfolio

Omar Ibrahim's portfolio, built with Next.js and TypeScript. A short front page that follows a trail across a contour map, and separate pages for the longer version: work, projects, awards and life.

A small 3D Omar lives in the corner and answers questions about the work: see [docs/mini-omar.md](docs/mini-omar.md).

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- three.js (only for mini Omar, loaded on demand) and the Gemini API (his answers)

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Mini Omar's answers need a key in `.env.local`. Without it the site runs and he says he is offline.

```bash
GEMINI_API_KEY=...
```

To check a production build:

```bash
npm run lint
npm run build
npm run start
```

## Where things are

- `app/content.ts` — everything the site says: roles, projects, wins, tools, links
- `app/(site)/` — the pages, and the layout they share
- `app/components/site.module.css` — how all of them look; the colours and sizes are at the top of `app/globals.css`
- `app/components/mini/` and `app/api/ask/` — mini Omar, and the endpoint that answers for him
- `scripts/topo.mjs` — draws the contour map, `public/topo.svg`
- `scripts/` — also how his model was generated, rigged and fixed up

## License

MIT
