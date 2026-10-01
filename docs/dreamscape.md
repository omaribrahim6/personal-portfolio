# Dreamscape

Branch: `portfolio-dreamscape-claude-opus-5-5`

The portfolio is one night's walk, from dusk to dawn. There are seven paintings ("plates") under a single sky, and the portfolio is written on the ground between them. One small figure appears in every painting and takes a few steps as each one scrolls past.

| Plate | Place | What it holds | Sky |
| --- | --- | --- | --- |
| I | the ridge | name, introduction, links | night, a thunderhead lit from below |
| II | the dunes | the story so far: experience, volunteering, education | deep night, the moon high |
| III | the arch | selected work | first light over the sea |
| IV | the hill | wins | pale morning, a blue cloud bank |
| V | the field | skills and tools, with receipts | the same morning, further on |
| VI | the islands | interests, off the clock | high over a sea of cloud, the sun getting up |
| VII | the shore | contact | dawn |

## How it is built

**The sky** (`app/components/sky/`) is one fixed WebGL canvas with a hand-written fragment shader. There is no 3D library. Clouds are unions of spheres, about a hundred per cloud. Testing all of them for every pixel of every frame was too slow on integrated graphics, and written out in GLSL they took Direct3D several seconds to compile on a first visit, so the spheres never reach the GPU. A small worker (`shape.worker.ts`) draws each cloud's shape once into an image holding a surface normal, a contact shadow and a coverage value per texel. The shader only lights that image, drifts it slightly and adds grain. The thunderhead is the one exception: for the first 2.6 seconds the worker redraws it part-grown, every lobe swelling out of the one it sits on, so the cloud rises from behind the ridge. `keys.ts` describes the sky over each plate; scrolling blends between neighbours, so the cloud sails off, the moon climbs and the sky pales without a cut.

**The terrain** (`app/components/paint/`) is painted procedurally onto 2D canvases: smooth landforms first, then thousands of small dabs, which is where the stippled grain comes from. Each canvas is painted once, when it comes near the viewport, and again only if its box changes size. Scrolling never triggers any drawing. Everything is seeded, so every visitor gets the same paintings. The marks along the crest of the hill in plate IV are drawn from the wins list: one per win.

**The scroll** is handled in one place (`World.tsx`), once per frame: which sky to show, where the figure stands, whether the header is over something light or dark, and which chapter is open.

**The islands** (`app/components/islands/`) are the one chapter with its own 3D scene: a floating island for each interest, and a camera that flies between them. Omar stands on each one as a static Tripo model (no rig), baked for the web by `scripts/bake-interests.mjs`: turned to face the camera, stood on the ground, sized so his face is the same in every model, quantized and given a WebP texture, about 500 KB each. On the first island he changes outfit (hiking, biking, paddleboarding) with a spin: four turns in just over a second, faint copies trailing behind him, a column of stars and a flash, and the model swapped at full speed, when he is only a blur. A pool opens under him when he takes the board out. The islands move on by themselves while they are in view, and stop while you point at or tab through them, or if you pause them. Like the small Omar, three.js is only loaded when the chapter comes near. Photos for each interest go in `public/interests/` and are listed in `app/content.ts`; until there are some, the islands stand on their own (development builds show empty frames where they will go).

**The content** lives in `app/content.ts`. Components only decide how it is shown.

## What carries over from the previous site

Everything the old page said is still here: the introduction, all eleven roles, the featured projects (four: Mamdani took RoadSense's place, which stays among the wins), the wins (eight now), thirty-six tools and their receipts, and the contact details. The interactive ideas carry over in new forms:

- The month-by-month ledger is now **the range**: one dune per role, as wide as the months it lasted, the oldest furthest away. It follows the entry being read; selecting a dune jumps to its entry. Filters still narrow the list.
- Each project still has something to play with, now seen through an arch like the opening in the hedge. Press it to light up the street behind Mamdani's one report, unfold Clascade's lesson into a cascade, trace Revenant's decision through the stars or watch the pool turn QueryForge's question into a query. They are pictures of the idea, not screenshots of the product.
- Wins are still split into built it, broke it and named, each with a mark that resolves on hover, focus or when a filter is on.
- Every tool still has a receipt pointing at where on the page it was used. Tools with nothing public to point at say so.

## Motion, performance, access

- `prefers-reduced-motion` is respected throughout. The sky becomes a still that only changes with scroll position, the thunderhead is drawn fully grown, the figure stands in place, the islands do not move on by themselves or spin, and transitions are instant.
- The sky stops drawing whenever no plate is on screen or the tab is hidden, idles at about 30 frames a second when nothing is moving, and lowers its own resolution if a device cannot keep up.
- Without WebGL the sky is a plain gradient of the same colours. The paintings, which are 2D canvas, still appear, and on the islands a picture of each one stands in for the 3D scene.
- All text is real text. Canvases are decorative and hidden from assistive technology. There is a skip link, the header adapts its colour to what is behind it, and every interactive piece works from the keyboard.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.
