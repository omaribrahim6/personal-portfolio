# Portfolio

Omar Ibrahim's portfolio, built with Next.js and TypeScript. It is a voyage across a solar punk archipelago, from sunrise to sunset: one 3D world, drawn live and inked like a comic, which a camera travels through as you scroll. There are seven stops, and at each one a rigged 3D Omar is doing something (walking the garden path of the story, pulling the levers on the projects, on the podium with a trophy, watering the plants of the skills, hiking, biking, coding on stage, cracking a vault, scoring a goal). The words ride past on cards. See [docs/voyage.md](docs/voyage.md).

The same content is also laid out as a magazine, the Omar Ibrahim Almanac, at `/almanac`: see [docs/solarpunk.md](docs/solarpunk.md).

A small 3D Omar leans out of a pod in the corner and answers questions about the work: see [docs/mini-omar.md](docs/mini-omar.md).

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- three.js, for the world, the drawings (toon shading and a hand-written ink pass, loaded once the page is up) and mini Omar
- Heliotrope, the display face, generated in code by `scripts/heliotrope.mjs`
- The Gemini API (mini Omar's answers)

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Mini Omar's answers need a key in `.env.local`. Without it the site runs and mini Omar says it is offline.

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
- `app/components/voyage/` — the voyage: the page shell, the cards for each stop, and the bridge to the world
- `app/components/world/` — the world: the engine, the stops (`stations/`), the rigged Omar and the poses, the statues, the 3D letters
- `app/components/toon/` — the model kit, the ink pass and the magazine's scenes
- `app/components/` — the magazine's sections, the running header and the shell
- `app/components/mini/` and `app/api/ask/` — mini Omar, and the endpoint that answers
- `app/fonts/` — Heliotrope
- `scripts/` — how Omar's model was generated, rigged and fixed up, and how the typeface is drawn

## License

MIT
