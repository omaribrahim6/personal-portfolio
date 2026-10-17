# Portfolio

Omar Ibrahim's portfolio, built with Next.js and TypeScript. It is laid out as one issue of a solar punk magazine, the Omar Ibrahim Almanac: a cover, a contents page, a section for each part of the story and a back cover with a coupon to clip. Every illustration is a small 3D scene drawn live and inked like a comic. See [docs/solarpunk.md](docs/solarpunk.md) for the concept and how it is built.

A small 3D Omar leans out of a pod in the corner and answers questions about the work: see [docs/mini-omar.md](docs/mini-omar.md).

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- three.js, for the drawings (toon shading and a hand-written ink pass, loaded once the page is up), the islands and mini Omar
- Heliotrope, the display face, generated in code by `scripts/heliotrope.mjs`
- The Gemini API (mini Omar's answers)

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

- `app/content.ts` — everything the site says: roles, projects, wins, tools, links, and each section's page
- `app/components/toon/` — the drawings: the model kit, the ink pass, the shared renderer and the scenes
- `app/components/` — one component per section, plus the running header and the shell
- `app/components/mini/` and `app/api/ask/` — mini Omar, and the endpoint that answers for him
- `app/fonts/` — Heliotrope
- `scripts/` — how his model was generated, rigged and fixed up, and how the typeface is drawn

## License

MIT
