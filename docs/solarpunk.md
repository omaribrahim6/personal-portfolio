# Solar punk

Branch: `solar-punk`

The portfolio is one issue of a magazine: **The Omar Ibrahim Almanac**. It has a cover with his name as the masthead, a contents page with a letter from the editor, a section for each part of the story, and a back cover with a coupon to clip. It is printed on cream stock in green-black ink, with spot colours from solar punk (sun yellow, coral, sea, cobalt, leaf, brass).

Every illustration is a small 3D scene of a solar punk island town, drawn live in the browser and inked like a comic: white pods with round brass portholes, glasshouses, terraces with gardens spilling over every lip, wind turbines and an airborne one on a tether, a cable car, waterfalls, boats. The look comes from seventies retro-futurist magazine art and the solar punk illustration it inspired.

| Section | Page | What it holds | Drawn as |
| --- | --- | --- | --- |
| Cover | 1 | name, introduction, links, cover lines | the island in the morning, full bleed |
| Contents | 2–3 | letter from the editor, contents | |
| I · Field notes | 4 | experience, volunteering, education | a sun wheel: one ring per role, as long as it ran |
| II · Features | 12 | four projects | a working model for each, with a lever |
| III · The record | 30 | wins | a split-flap departures board, and a ticket |
| IV · Seed bank | 36 | skills and tools, with receipts | a cabinet of drawers, seed packets, a library index card |
| V · Off the clock | 42 | interests | five floating islands in a travel poster |
| Back cover | 50 | contact | the island in the evening, and a reply coupon |

## The type

**Heliotrope** (`app/fonts/`, made by `scripts/heliotrope.mjs`) is the display face, drawn for this site after the lettering on a retro-futurist expo poster: capitals only, one heavy monoline stroke, wide, with big rounded bends, flat ends with their corners just softened, and stencil gaps wherever a bar would meet a stem. Every letter is a skeleton of a few polylines with a fillet radius at each corner; the script works the outline out exactly and writes three WOFF files with opentype.js:

- `heliotrope.woff`, the solid letters;
- `heliotrope-line.woff`, a hairline down the middle of every stroke on the same metrics. `<Sign>` lays it over the solid in a second colour, so titles read like lit signs with an inline;
- `heliotrope-light.woff`, the same skeletons drawn thin, for page numbers and the numbers in the notes.

```bash
node scripts/heliotrope.mjs
```

Alongside it: Unbounded for titles inside a section, Instrument Sans for reading, Instrument Serif italic for standfirsts and asides, and Martian Mono for folios, captions, counts and receipts.

## The drawings

Everything drawn on the page goes through `app/components/toon/`:

- **`kit.ts`** is the model kit: toon materials (two tones, a warm sun and a cool sky in the shadows), and builders for pods with portholes, garden towers, geodesic glasshouses, solar panels and arrays, wind and airborne turbines, tethers and cable cars, trees, cypresses, palms, hedges and ivy, tiers of land, the sea with ripples and foam, waterfalls, clouds (shaded the way animation paints them), boats, people, lamps, birds and the sky dome.
- **`ink.ts`** is the ink. Each scene is drawn twice: in colour (with its depth) and as the direction each surface faces. A last pass draws a line wherever the depth steps (measured in one over the distance, so a tilted floor makes no line and only a real step does) or the facing turns sharply. The lines boil a few times a second, like redrawn frames, the deepest shadows are hatched, lines fade into the haze with everything else, and the whole picture is laid on paper. Water, glass, glows and lines are left out of the facing pass.
- **`gallery.ts`** draws every picture on the page with one WebGL renderer nobody sees. Each picture is a plain 2D canvas; while it is on screen its scene is inked and copied across, and nothing is drawn while it is scrolled away. One context, however many pictures.
- **`Diorama.tsx`** puts a scene on the page, loads it only once the page is up, passes the pointer to it (each camera swings a little) and tells the page where named places in the scene are, so notes can be pinned to them.
- **`scenes/`**: `cover.ts` (the island town, in a morning and an evening light), and one working model per project: `signal.ts` (Mamdani: a street, a pothole, an inspector, the neighbours' pins, the town hall's screen and a crew cart), `cascade.ts` (Clascade: a deck of slides that unfolds into terraces the class walks onto), `trail.ts` (Revenant: a lighthouse whose beam finds one bottle in a foggy sea, which rises and unrolls the reason) and `reflection.ts` (QueryForge: a solar forge, run by a llama, that turns letter blocks into database barrels under a glass dome).

The islands (`app/components/islands/`) and the small Omar (`app/components/mini/`) have their own renderers, because they load their own models, but they draw through the same ink.

`/lab/toon?scene=cover` (development only) shows one scene at a time, as large as the window: `&state=open` pulls its lever, `&w=960&h=720` fixes the size.

## The pieces

- **The running header** is the folio line across the top of a magazine page: the almanac's mark (his initials on a sun), the sections, and the page number, which rolls on like a counter as you read. It stays out of the way on the cover. On small screens the sections fold into a contents sheet.
- **Buttons** are printed: a flat colour, an ink outline and a hard ink shadow, as if the plates were out of register. The arrow sits on a little sun that puts out its rays when pointed at.
- **Filters** are index tabs cut into the edge of a notebook; on the record they are enamel switches with a lamp.
- **The cover** has a dateline strip, the masthead, a deck, cover lines on paper tags (every number counted from the content), a starburst sticker and a barcode.
- **Field notes**: the sun wheel follows the note being read; each note has a rubber date stamp and leaves for bullets.
- **Features**: each project is a spread, with the model on a cutting-mat plate, notes pinned to it, a lever to run it, a rosette for the prize, a standfirst, a drop cap and specimen tags.
- **The record** flips letter by letter when a filter changes, and the chosen row prints as a ticket.
- **The seed bank**: packets that have been planted somewhere on these pages have sprouted; the index card lists where.
- **The back cover**: ticking the coupon's boxes writes the subject line of the email it opens. The colophon says what the issue is set in.
- **The cursor** is a pen nib that draws a fading line in the same ink as the drawings, thick when slow and thin when quick.
- **Mini Omar** leans out of the porthole of a 3D pod in the corner. See [mini-omar.md](mini-omar.md).

## Motion, performance, access

- `prefers-reduced-motion` is respected throughout: every drawing becomes a still (drawn once, and again only if it changes), the lines stop boiling, levers jump straight to their end, the board changes without riffling, the islands do not move on by themselves, and transitions are instant.
- Drawings are only drawn while on screen; the renderer's resolution is capped per picture.
- Without WebGL each drawing's place keeps a flat colour of the same scene, and the page reads without it.
- All text is real text, including the display face. The hairline copy of each sign is hidden from assistive technology, so titles are read once. Canvases and decorations are hidden too. Every interactive piece works from the keyboard, the board's rows say themselves in full, and there is a skip link.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.
