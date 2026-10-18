# The voyage

Branch: `solar-punk`

At `/` the portfolio is a trip, not a page. One 3D world fills the window: a solar punk archipelago, drawn live and inked like a comic. As you scroll, a camera travels from island to island, from sunrise to sunset, and the words ride past on cards. There are seven stops. At each one Omar (the rigged 3D model) is there doing something, and the things on the cards can be worked in the world too. The magazine edition of the same content is at `/almanac` (see [solarpunk.md](solarpunk.md)).

| Stop | Section | Light | What is there | What Omar does |
| --- | --- | --- | --- | --- |
| 1 · Arrival | home | morning | the cover town, the name standing on a ridge in 3D Heliotrope letters | waves |
| 2 · The garden path | about | day | a path the length of a garden island, a signpost for every role (coloured by kind), arches of vines, a windmill, a robot asleep under the meadow | walks the path as you read, stopping at each post |
| 3 · The workshops | projects | noon | four islets, each with its project's working model, a jetty and a brass lever; a treetop village across the channel | throws the lever (pull it on the card or in the world) and points at what it set going |
| 4 · The station | awards | afternoon | a solar tram stop: a split-flap board of every win, solar trees, a tram that comes and goes, a wind farm with a turbine for every build, a flag for every CTF and a sun for the award; mail drones overhead | stands on the podium with the trophy, under confetti |
| 5 · The glasshouse | skills | late afternoon | a geodesic dome with a bed for each group of skills, a plant per skill that flowers once per receipt, hanging baskets, a gardener robot, butterflies, an airborne turbine on a tether, a giant robot sunk offshore | walks bed to bed with a watering can; the picked skill's plant stands up and its seed tag swings down |
| 6 · Five islands | interests | golden hour | a mountain, a hackathon stage, a toy-brick island with a mountain road, a vault in a cliff, a football pitch, joined by cable cars | hikes up the mountain, bikes down it, paddleboards the lagoon, sits on the podium coding, builds a game while (in the game) longboarding down it, cracks a vault, and scores |
| 7 · The pier | contact | sunset | a pier with lanterns and string lights out to a round platform, the post office pod, boats, fireflies, a city of glass domes on the horizon, the art nouveau mail drone | sits on the end with legs over the water; on the last card gets up, turns round and waves; send a letter and the drone flies it off into the sunset |

## How it is built

- **The page** (`app/components/voyage/`) is ordinary HTML over a fixed canvas. Each stop is a `<section data-stop>`, each card a `[data-beat]`. `World.tsx` measures them and tells the engine where each one is in the scroll. Cards talk to the world through `useWorld()`: `tell(stop, name, value)` to change something (a filter, a lever, a skill), `hear()` for clicks in the world, and `follow()` to pin labels to places in it.
- **The engine** (`app/components/world/engine.ts`) has one renderer, one camera and one sea. Each stop is a `Station`: a group of things, a palette of light, camera keys pinned to its cards, and an `update` each frame. The camera runs a Catmull-Rom rail through every key and holds at each card. Between stops the light blends from one palette to the next, which is the time of day. A stop is only drawn and updated when the camera is near it.
- **Omar** (`puppet.ts`, `motion.ts`) is the rigged model, posed joint by joint: walk, wave, point, cheer, sit, perch, kick, water, type, skate. The outfit statues (hiking, football) are dressed onto the same skeleton by giving each vertex the skin weights of the nearest point on the rigged model.
- **The statues that cannot bend** (`statue.ts`) are seated or crouched sculptures: on the bike, on the podium, on the bricks, at the vault. They are taken apart instead. Every triangle is given to a part by where it sits (the head, the dial, each wheel), and each part turns on its own pivot.
- **The words in the world** are drawn on canvases (the departures board, the seed tags, the scoreboard, the terminal, the banner) or extruded from Heliotrope's own outlines (`letters.ts`, `glyphs.json`).
- **The ink** is the same pass as the magazine's drawings (`app/components/toon/ink.ts`).

## Motion, access, fallbacks

- With `prefers-reduced-motion`, the camera cuts from card to card instead of gliding, the world's clock stands still (every scene is a still), the lines stop boiling, and the board and screens show their final state.
- Without WebGL 2 the page says so at the top, links the magazine edition, and every card still reads.
- All the words are on the cards as real text; the canvas is hidden from assistive technology. Everything that can be done in the world can also be done from a card, with the keyboard.

## Working on it

```bash
npm run dev
node scripts/walk.mjs shot 1440 900 home-title awards-title interest-games   # screenshots of cards, in .data/shots/
```

- `/lab/rig?outfits=hike,soccer&pose=walk` shows the outfits posed on the skeleton.
- `/lab/models?one=security` shows one statue front and side on a grid a tenth of a unit apart, which is how the parts' pivots were measured.
