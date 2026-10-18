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
- **Last finished commit:** `72c7d0a` (v2, the magazine edition, now at `/almanac`).
- **WIP commit on top of it:** the 3D voyage, partly built (stops 1–3 work, stop 4 is written but not yet checked, stops 5–7 are placeholders). It was committed half-done so it could move to a local session. **`npm run build` has not been run on it yet**, but `npx tsc --noEmit -p .` passes.

| Route | What it is | State |
| --- | --- | --- |
| `/` | **The voyage**: the portfolio as one trip across a solar punk archipelago, sunrise to sunset. A full-screen 3D world, a camera that moves on a rail as you scroll, and the content on cards that pass over it. | stops 1–3 done, 4 in progress, 5–7 placeholders |
| `/almanac` | The v2 magazine edition (cover, contents, field notes, features, record, seed bank, interests, back cover). | done, keep as is |
| `/lab/models` | Viewer for the outfit statues in `public/models/interests/*.glb`. | dev tool |
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
- `props.ts`: `FONTS`; `board({...})`, a canvas texture for signs; `plaque`; `signpost`; `bench`; `arch`; `windmill(h)` → `{ group, sails }`; `robot(size, seed)` → `{ group, eye }`.
- `stations/`:
  - `arrival.ts` (home, MORNING): the cover town, the 3D name on a ridge, Omar waving.
  - `garden.ts` (about, DAY): a garden path with a signpost per role, colour-coded by category. Omar **walks** along it as you scroll, driven by the beat cursor (the stride phase advances with distance walked). There is a robot, a windmill and pods.
  - `workshops.ts` (projects, NOON): four islets in a channel, each with its project's working model (`toon/scenes/{signal,cascade,trail,reflection}.ts` → `model()`), a jetty, a brass lever and an Omar who throws it. The levers are pickable in the world and on the cards; `set('project-i', 'open'|'closed')`.
  - `station.ts` (awards, AFTERNOON): **written, not yet registered or checked; see "What is left".**

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

## 6. What is left, in order

### A. Stop 4, "The station" (awards): finish

`app/components/world/stations/station.ts` exists. It has the AFTERNOON palette; ORIGIN (-22, 0, -262); a split-flap departures board drawn on a canvas (`show(list, chosen)`, `tick(t)`, rows riffle when they change); a solar tram that pulls in and out with scroll progress; a platform under a curved roof of solar ribs and panels; rails on piers out over the sea; planters; a podium where Omar `cheer`s with a trophy that follows `where('handR')`; InstancedMesh confetti every 4 s; and behind the station a "farm" with one mark per award (a turbine for *built*, a flag for *broke*, a sun for *named*), lit by the active filter. `set('filter', mode | 'all')`, `set('chosen', index)`. Keys: beat 0 is an overview, beat 1 is close on the board and podium (hold .9).

1. Register it in `World.tsx` `STOPS`: `['awards', () => import('../world/stations/station')]`. It is `export default async function station(): Promise<Station>` and takes no engine argument.
2. Write `stops/Awards.tsx`: `StopHead` "The station" (id `awards-title`); filter switches → `tell('awards', 'filter', mode)` using `awardFilters`; the list of wins as buttons → `tell('awards', 'chosen', String(awards.indexOf(win)))`; a ticket card for the selected win (result, event, date, mode, link).
3. Replace the `awards` placeholder in `app/page.tsx`, then screenshot and iterate. Things to check: tram timing, the board is readable, Omar and the trophy are framed beside the card, confetti, filter lighting.

### B. Stop 5, "The glasshouse" (skills)

A geodesic glasshouse (`kit.ts` has the dome builder) with a raised bed per `skillGroups` group and a plant per skill. A skill with `receipts` gets blooms, one per receipt. Omar walks between the beds watering (the `water()` pose plus a can in `handR`). Selecting a skill on the card highlights its plant (it glows or grows a little) and the camera favours that bed. Cards: seed packets per group and a library index card for the selected skill listing its receipts (links). `tell('skills', 'skill', name)`. Give the palette a late-afternoon tint.

### C. Stop 6, "Five islands" (interests): Omar doing each activity

The centrepiece of the request. Five floating or sea islands, one per `interests` id, each with an outfit puppet (`puppet({ url: '/models/interests/<id>.glb', ...FIT })`) doing the activity:

- **outdoors:** three small scenes on one island, or the camera moving through all three:
  - *hiking* up a switchback trail (hike outfit, `walk`, the puppet moved along the trail);
  - *biking* downhill (the bike statue is rigid; add spinning overlay wheels and a bob);
  - *paddleboarding* on a toon board in a lagoon (paddle outfit, strokes from chest and arms, the board rocking).
- **competing:** a hackathon stage (podium statue, `type` at a laptop, head turns, banners, confetti on a win).
- **games:** the games statue, plus a "Downhill" road where the rigged Omar longboards (`skate`).
- **security:** crouched at a vault (security statue), the dial turning, then the door opens to gold light.
- **soccer:** soccer outfit, `kick(u)`, the ball arcing into a goal net that ripples.

Each island's activity should run while its beat is near (as in workshops, where only islands within 1.5 beats move). Cards: kicker, title, body, links and photos from `interests[i].photos`, with a photo viewer dialog. Existing reference: `app/components/islands/` (the magazine's interests islands) and `public/interests/*` (the photos).

### D. Stop 7, "The pier" (contact), at sunset

A sunset palette with domes on the skyline (from the references). Omar `perch`es on the end of the pier with lanterns coming on. An art nouveau mail drone flies in to take the message. Card: a reply coupon (subject builder → `mailto:` with the subject filled in, a copy-email button, links), and a colophon.

### E. Between the stops, and shipping

- **Scenery along the route** from the references: a treetop village, art nouveau drones crossing, an overgrown robot half in the sea, airborne turbines on tethers, sunset domes. These should be cheap (instanced, low detail) and placed between station centres.
- Remove all placeholders in `page.tsx`.
- Check the mini Omar dock still works over the voyage. Check reduced motion (the camera should jump, not glide) and the no-WebGL `Fallback` (the cards must still read).
- Docs: add the voyage to `README.md` and `docs/solarpunk.md` (the voyage at `/`, the magazine at `/almanac`).
- `npm run lint`, `npx tsc --noEmit -p .`, `npm run build`; screenshots at desktop and phone sizes.
- Commit and push to `origin solar-punk`, then report to the user with screenshots.

## 7. Conventions

- **Code style:** comments are short prose in plain English that say what a thing *is* in the world ("The jetty at the front, and on it the lever and him."), not what the code does line by line. Names are short words (`isle`, `made`, `reach`, `shown`). There are no semicolons, single quotes, and two-space indent. Match the files around you.
- **Commit messages** end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01NU7LbaSg3uQVc3cKwHsFdv
  ```
  (a local session will supply its own attribution; follow it). Do not put model names anywhere else (code, docs, PRs).
- Large `.glb` and photo assets are already committed in `public/`. `.data/` is git-ignored (Tripo downloads, screenshots).
