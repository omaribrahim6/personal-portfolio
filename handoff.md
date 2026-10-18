# Handoff: the solar punk voyage

Use this file to pick the work up in a local Claude Code session if the cloud session runs out. It covers the state of the branch, what was asked for, how the code is built, the conventions, and what is left to do, in order.

**To resume locally:**

```bash
git fetch origin solar-punk && git checkout solar-punk && git pull
npm install
npm run dev            # http://localhost:3000
```

Then start Claude Code in the repo and tell it: *"Read handoff.md and continue from 'What is left'."*

---

## 1. Where things stand

- **Branch:** `solar-punk`. Commit and push only to this branch. Do not open a PR unless the user asks for one.
- **v2** (`72c7d0a`) is the magazine edition, now at `/almanac`.
- **v3** (the commits after it) is the 3D voyage at `/`. All seven stops are built, have their cards, and have been checked in desktop and phone screenshots. Lint, `tsc` and `next build` pass. See `docs/voyage.md` for what each stop holds.

| Route | What it is | State |
| --- | --- | --- |
| `/` | **The voyage**: the portfolio as one trip across a solar punk archipelago, sunrise to sunset. A full-screen 3D world, a camera that moves on a rail as you scroll, and the content on cards that pass over it. | all 7 stops done |
| `/almanac` | The v2 magazine edition (cover, contents, field notes, features, record, seed bank, interests, back cover). | done, keep as is |
| `/lab/models` | Viewer for the outfit statues in `public/models/interests/*.glb`; `?one=<name>` shows one statue front and side on a 0.1 grid, for measuring part pivots. | dev tool |
| `/lab/rig` | Rig test bench: the rigged Omar and the outfit statues with skin weights transferred, run through every pose in `motion.ts`, plus the `FIT` table of scales/offsets per outfit. | dev tool |
| `/lab/toon` | Toon/ink renderer test page. | dev tool |
| `/card` | NFC landing page (older, unchanged). | done |

## 2. What the user asked for (in order)

1. **v1:** full solar punk restyle on a new branch, built from 12 reference images: a seventies retro-futurist magazine spread with stencil lettering and a brass plaque; comic-ink pod houses with round portholes; solar punk rooftops and isometric solar panels; Ghibli scenes with airborne wind turbines; overgrown robots; a treetop city; windmills; art nouveau drones; domes at sunset. Keep all the content and the 3 Omar models. Every element custom, full creative freedom (including the bottom-right mini Omar dock).
2. **v2 feedback:** "U copied the original website way too much... some of these SVGs look low quality / low effort, do better." → the magazine (`72c7d0a`).
3. **Current request (v3, this work):**
   > "this is really sick, what if we fully leaned into the 3D world, completely moving away from regular content to turning this into an experience of going through things, maybe even in the interests section its me (the 3d models) doing those activities and u can rig them / body part them to do that, and give that same level of experience/detail to each section, lets try it out, again u have full creative freedom. remember the reference images."

What that means in practice: every section is a **place you travel to**, with Omar (the rigged 3D model) in it doing something, and things you can interact with both on the cards and in the world. The interests stop is Omar actually doing each activity. Each stop should get as much detail as the best ones, and the reference images still set the look (white pods with brass portholes, glasshouses and geodesic domes, gardens spilling over terraces, airborne turbines on tethers, windmills, overgrown robots, art nouveau drones, a treetop village, sunset domes, comic ink lines, stencil lettering).

## 3. How it is built

### The page (DOM): `app/components/voyage/`

- `itinerary.ts`: `STOPS` (id + place name) for the 7 stops and `walkOrder` (roles oldest first). It is a plain module, not `'use client'`, because server components import it.
- `Voyage.tsx`: the page shell, with `Stop` (a `<section data-stop={id}>`), `Beat` (`data-beat`, one screen and a quarter of scroll with a card in it; props `side` `'left' | 'right' | 'center'`, `id`, `wide`, `className`), `StopHead` (folio + title + dek), `Route` (the transit-map line of stops on the left), `Bar` (top bar), `Fallback`, `Onward`.
- `World.tsx`: one fixed full-window canvas plus the `Engine`. The stops are built one after another, nearest first, from the `STOPS` loader array at the top of the file (**register each new station there**). It measures `[data-stop]` and `[data-beat]` positions and passes them to the engine. It provides a context bus through `useWorld()`:
  - `tell(id, name, value)`: a card tells a stop something (pull a lever, pick a filter). What has been said is replayed to stops that finish building later.
  - `hear(listener)`: hear clicks in the world (`station.pick` returns `{name, value}`).
  - `follow(id, name, at)`: get the on-screen position of a named anchor every frame (for pinned labels and notes).
- `stops/*.tsx`: the cards for each stop (`Home`, `About`, `Projects` so far), styled by `stops/stops.module.css`. Card ids are used for screenshots and links (`story-${id}`, `project-${i}`, and so on).
- `app/page.tsx`: composes `<Voyage>` with the stop components. **It still has placeholder `Stop`s for `awards`, `skills`, `interests` and `contact`**; replace each one as its stop is built.

### The world (WebGL): `app/components/world/`

- `engine.ts`: the `Engine` class. Its methods are `listen`, `add(station)`, `set(id, name, value)`, `measure(sections, vh)`, `scrollTo(y, jump)`, `locate(id, name)`, `beat(id)`, `progress(id)`, `resize`, `hovering`, `dispose`. It owns one renderer, the camera, the sea, the clouds, the sky dome (`sky.ts`) and the toon/ink post pass.
  - **Camera rail:** each station has `keys: Key[]`, where `Key = { at?, beat?, eye, look, fov?, hold?, card?: 'left'|'right'|'none' }`. `beat: n` pins the key to the n-th `[data-beat]` of that section. `hold` (in screens) makes the camera dwell there. `card` shifts the view with `setViewOffset` so the subject sits beside the card. The path is a Catmull-Rom through the keys, with smoothstep holds.
  - **Light:** each station has a `Palette` (sky bands, sun direction, colour and size, key light, hemisphere, fill, water, cloud, fog). The engine blends palettes as you travel, which is what makes the time of day: MORNING (arrival) → DAY (garden) → NOON (workshops) → AFTERNOON (station) → … → sunset (pier).
  - **Culling:** a station only draws and updates when `centre.distanceTo(camera) < radius + 150`. On tall screens the camera pulls back by `(1.2/aspect)^.9`.
  - `Station` interface: `{ id, group, centre, radius, keys, light, update?(t, dt, local, near, beat), set?(name, value), anchors?, pickable?, pick?(object) }`. `local` is progress through the section (0–1) and `beat` is a fractional beat cursor, so you can move things between cards.
- `puppet.ts`: the rigged Omar. `puppet(outfit?)` returns a `Puppet` with `root`, `mesh`, `pose(pose)` and `where(joint, out)`. An outfit (`{ url, scale?, offset? }`) is one of the static Tripo statues in `public/models/interests/`. Its skin weights are transferred from the rigged model by nearest vertex, so the statue moves with Omar's skeleton. Joints: `hips, spine, chest, neck, head, shoulderL/R, armL/R, foreL/R, handL/R, thighL/R, shinL/R, footL/R`; a pose may also set `lift` (moves the hips up or down) and `shift`.
- `motion.ts`: poses as functions of time: `idle, walk(phase, arms), STRIDE, wave, point(t, aim), cheer, sit(t, drop), perch, kick(u), water, type, skate, blend(a, b, t)`.
  - **Sign conventions** (worked out by hand, keep them): a limb swings forward with **negative x**; knees and elbows bend with **positive x** on the lower bone; the right arm raises with **negative z** and the left arm with **positive z**; the spine leans forward with **positive x**.
  - **Outfits tear at big arm raises.** With an outfit, keep arm motion moderate (walk and kick are fine; a full overhead cheer is not).
  - The fits per outfit (scale, offset) are in `app/lab/rig` `FIT`: hike 1/.92, soccer 1/(1.17·1.04), paddle 1/1.15, bike 1/1.15, podium 1, games 1, security 1/1.02.
- `letters.ts`: `word(text, { size, depth, color, line, tracking })` → `{ group, width }`. These are 3D extruded Heliotrope letters with the inline hairline, built from `glyphs.json`, which `node scripts/glyphs.mjs` exports from the font.
- `props.ts`: `FONTS`; `board({...})`, a canvas texture for signs; `plaque`; `signpost`; `bench`; `arch`; `windmill(h)` → `{ group, sails }`; `robot(size, seed)` → `{ group, eye }`; `Bundle` (merges parts into one mesh per colour); `drone()`, the art nouveau mail drone; `treetops(seed)`, the treetop village.
- `statue.ts`: `statue(url, parts)` loads a seated or crouched outfit statue (which cannot be skinned) and splits it into parts by where each triangle sits. `ball(name, centre, radius, pivot)` makes a part. Each part is a group at its pivot, so turning the group turns the part (heads, the vault dial, the bike wheels). `lift(material)` brightens the statues' dark textures to sit with the toon colours.
- `stations/`:
  - `arrival.ts` (home, MORNING): the cover town, the 3D name on a ridge, Omar waving.
  - `garden.ts` (about, DAY): a garden path with a signpost per role, colour-coded by category. Omar **walks** along it as you scroll, driven by the beat cursor (the stride phase advances with distance walked). There is a robot, a windmill and pods.
  - `workshops.ts` (projects, NOON): four islets in a channel, each with its project's working model (`toon/scenes/{signal,cascade,trail,reflection}.ts` → `model()`), a jetty, a brass lever and an Omar who throws it. The levers are pickable in the world and on the cards; `set('project-i', 'open'|'closed')`.
  - `station.ts` (awards, AFTERNOON): the solar tram stop. It has a split-flap board on a canvas (`set('filter')`, `set('chosen')`), a tram, a podium with a trophy and confetti, a wind farm with one mark per win, and mail drones.
  - `glasshouse.ts` (skills, GOLDEN): a geodesic dome with beds and plants. Each skill is one plant (it blooms once per receipt, and is pickable). `set('skill', name)` shows its seed tag. Omar walks the beds with a watering can. There is also a gardener robot, butterflies, and a sunken giant robot offshore.
  - `islands.ts` (interests, GOLDEN_HOUR): five islands. Hike (outfit puppet on a trail, out and back), bike (statue, spinning wheel parts), paddle (statue on a lagoon loop), competing (podium statue, scoreboard canvas, spotlights), games (statue on bricks, and the plain puppet longboarding a hairpin road), security (vault statue, dial part, `set('vault', 'open')` spills gold), soccer (outfit puppet with a run-up, kick, goal and net bulge). Cable cars join the islands.
  - `pier.ts` (contact, SUNSET): the pier, lanterns, the post office pod, and Omar perched on the end (up and waving on the last card). The drone flies the letter off when `set('send', n)`. A domed city stands on the horizon.

### Shared drawing kit: `app/components/toon/`

- `kit.ts`: toon materials (`toon(color)`), the palette `C`, and builders: pods with portholes, glasshouses and geodesic domes, solar panels, turbines and airborne turbines, trees, cypresses, flowers, scatter, tiers of land, sea, waterfalls, clouds, boats, people, lamps, birds, `light`, `plain`, `rng`.
- `ink.ts`: the comic ink post pass. Edges come from depth (measured as inverse distance, so only real steps make lines) and from normals. The lines boil, deep shadows are hatched, lines fade in fog, and everything sits on paper. Objects on layer 1 (`plain`) are left out of the normal pass. `userData.inkNormal` swaps in a material for the normal pass.
- `scenes/`: the dioramas used by `/almanac` and reused by the voyage (`cover.ts` exports `town(time)`; the project scenes export `model()`, and trail's is `model(camera, alone)`).

### Other pieces

- `app/content.ts` is the single source of content: `roles`, `projects`, `awards` (+ `modes`, `awardFilters`), `interests` (ids `outdoors | competing | games | security | soccer`; outdoors has the outfits hike, bike and paddle), `skillGroups` (with `receipts`), `email`, `links`.
- `app/components/mini/`: the mini Omar chat dock (bottom right, every page). The API route `app/api/ask` uses Gemini: `GEMINI_API_KEY` (plus optional `GEMINI_MODEL` and `GEMINI_VERTEX`) in `.env.local`. Without a key the antenna lamp is grey and the chat says so.
- `scripts/tripo.mjs` / `bake-*.mjs` generate and bake the models (they need `TRIPO_API_KEY` and cost credits; the site never calls Tripo).
- `docs/solarpunk.md` describes the **magazine** (v2) and needs a voyage section; `docs/mini-omar.md` covers the chat.

## 4. Gotchas already hit

- **This Next.js (16.3, App Router, Turbopack) differs from the training data.** Read `node_modules/next/dist/docs/` before using a Next API (see `AGENTS.md`).
- Any file named `route.ts` under `app/` becomes a Route Handler. That is why the stop list is `itinerary.ts`. If types go stale after a rename, delete `.next/dev/types`.
- A constant exported from a `'use client'` module reaches a server component as a client reference (`STOPS.slice is not a function`). Keep shared data in plain modules.
- three r185: `ShapePath.toShapes()` takes no arguments.
- Model builders typed with zero parameters break when called with `(camera, alone)`. Type the `ISLES.build` signature explicitly.
- The `World` bus must be memoised (`useMemo([ready, failed])`), or every render rebuilds it.
- Scatter and flowers in `kit.ts` scale with their radius, so small plantings need hand-placed shrubs.
- The first frame in headless SwiftShader is slow because the shaders compile. Wait about 40 s (`FIRST=40000`) before judging a blank hero.
- Route labels on the left show only on hover or focus; when always shown they overlap the cards.

## 5. Checking your work

```bash
npx tsc --noEmit -p .
npm run lint
npm run build
# screenshots, with the dev server running (needs Playwright: npx playwright install chromium)
FIRST=40000 WAIT=7000 node scripts/walk.mjs st 1440 900 home-title story-<roleId> project-0 awards-title
FIRST=40000 WAIT=7000 node scripts/walk.mjs m 390 844 home-title project-0     # phone
# without a GPU: SOFT=1 ...   ·   shots land in .data/shots/
```

Look at every stop on a desktop and a phone screenshot. Judge the ink lines, the framing beside the card, and Omar actually being visible and doing something.

## 6. What is left

Everything the user asked for is built. What remains is polish, roughly in order of value:

1. **Get the user's reaction** to the voyage and act on it. They have given direct feedback twice before (v1 "copied the original too much", v2 "this is really sick").
2. **Performance on real phones.** Each stop is only drawn when the camera is near it, but the interests stop (`islands.ts`) holds five islands and six models at once. If it stutters, split it into two stations, or hide islands more than about 1.6 beats away (each `update` already skips them).
3. **The vault cliff** (`islands.ts`, security) is stacked `tier`s with boulders and pines. It still reads a little like a layer cake and could be a proper rock face.
4. **Between stops:** the treetop village (workshops), the mail drones (station, pier), the sunken robot (glasshouse) and the cable cars (interests) are there. Airborne turbines and boats could also be placed in the empty sea the camera crosses between stations.
5. **Mobile cards** sit along the bottom and cover the lower part of the world. The camera keys could take a phone-specific `look` offset if a subject ends up under a card.
6. **`docs/solarpunk.md`** still describes the magazine; `docs/voyage.md` describes the voyage. Keep both current.

## 7. Conventions

- **Code style:** comments are short prose in plain English that say what a thing *is* in the world ("The jetty at the front, and on it the lever and Omar."), not what the code does line by line. Names are short words (`isle`, `made`, `reach`, `shown`). There are no semicolons, single quotes, and two-space indent. Match the files around you.
- **Commit messages** end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01NU7LbaSg3uQVc3cKwHsFdv
  ```
  (a local session will supply its own attribution; follow it). Do not put model names anywhere else (code, docs, PRs).
- Large `.glb` and photo assets are already committed in `public/`. `.data/` is git-ignored (Tripo downloads, screenshots).
