# Solar punk

Branch: `solar-punk`

The portfolio is one day in a solar punk valley, from sunrise to sunset. Seven paintings ("plates") sit under a single sky, each at its own hour, and the portfolio is written on the ground between them. One small figure in a sun hat, with a panel on their pack, appears in every painting and takes a few steps as each one scrolls past. The look comes from seventies retro-futurism and the solar punk illustration it inspired: white pods with round brass portholes, glasshouses, terraces, wind turbines and inflatable ones on tethers, panels over the crops, vines over everything.

| Plate | Hour | Place | What it holds | Ground |
| --- | --- | --- | --- | --- |
| I | 06:10 | the terraces | name, introduction, links | forest green |
| II | 08:30 | the gardens | the story so far: experience, volunteering, education | paper |
| III | 10:45 | the glasshouse | selected work | glasshouse teal |
| IV | 12:20 | the wind farm | wins | lake blue |
| V | 14:05 | the sunflowers | skills and tools, with receipts | field green |
| VI | 16:30 | the sky islands | interests, off the clock | pale sky |
| VII | 18:40 | the shore | contact | sand |

## The type

**Heliotrope** (`app/fonts/`, made by `scripts/heliotrope.mjs`) is the display face, drawn for this site after the lettering on a retro-futurist expo poster: capitals only, one heavy monoline stroke, wide, with big rounded bends, flat ends with their corners just softened, and stencil gaps wherever a bar would meet a stem. Every letter is a skeleton of a few polylines with a fillet radius at each corner; the script works the outline out exactly (straight edges stay straight, each bend is a pair of concentric arcs written as cubics) and writes three WOFF files with opentype.js:

- `heliotrope.woff`, the solid letters;
- `heliotrope-line.woff`, a hairline down the middle of every stroke on the same metrics. `<Sign>` lays it over the solid in a second colour, so titles read like lit signs with an inline;
- `heliotrope-light.woff`, the same skeletons drawn thin, for the name on the plaque.

```bash
node scripts/heliotrope.mjs
```

Lower case maps onto the capitals, so headings stay mixed case in the page and are read normally. Alongside it: Unbounded for titles inside a chapter, Instrument Sans for reading, Instrument Serif italic for asides, and Martian Mono for captions, counts and receipts.

## How it is built

**The sky** (`app/components/sky/`) is one fixed WebGL canvas with a hand-written fragment shader and no 3D library. `keys.ts` describes the sky at each hour: the gradient, the sun (its place, size and halo; a slow turn of rays is drawn round it), and two clouds with their own colours for that light. Scrolling blends between neighbours, so the sun climbs over the top and comes down again and the light warms without a cut. Clouds are unions of spheres, about a hundred per cloud; a small worker (`shape.worker.ts`) draws each cloud's shape once into an image holding a surface normal, a contact shadow and a coverage value per texel, and the shader only lights that image, drifts it slightly and adds grain. The cumulus over the terraces grows out of the hill in the first 2.6 seconds.

**The terrain** (`app/components/paint/`) is painted procedurally onto 2D canvases: smooth landforms first, then thousands of small dabs for the stippled grain. `core.ts` is the toolkit: hills, terraces with stone lips, cloud shadows, foliage, cypresses, palms, sunflowers and wildflowers, solar panels in perspective, wind turbines, airborne turbines on tethers, glass domes, pods with brass portholes and vines, lamps and parasols. Each canvas is painted once, when it comes near the viewport, and again only if its box changes size; scrolling never triggers any drawing. Everything is seeded, so every visitor gets the same paintings. The marks along the crest of the wind farm are drawn from the wins list: a turbine for each thing built, a flag for each thing broken into, a sun for the one that was given.

**The scroll** is handled in one place (`World.tsx`), once per frame: which sky to show, where the figure stands, whether the header is over something light or dark, which chapter is open, and how far the sun on the header's sundial has crossed the sky.

**The islands** (`app/components/islands/`) are the one chapter with its own 3D scene: a floating island of meadow and sandstone for each interest, airborne turbines on tethers over two of them and panels on two more, and a camera that flies between them. Omar stands on each one as a static Tripo model, baked for the web by `scripts/bake-interests.mjs`. On the first island he changes outfit (hiking, biking, paddleboarding) with a spin. Like the small Omar, three.js is only loaded when the chapter comes near.

**The content** lives in `app/content.ts`, including each chapter's hour and place. Components only decide how it is shown.

## The pieces

- **The header** is a lacquered plaque in a brass frame with the name on it, and a sundial whose sun crosses the sky as you read down the page. The chapter links sit in a glass capsule, each with its hour. On a phone the index is the day as a timetable, one stop per chapter.
- **Links** are capsules with a round cell at the head that holds the arrow; on the way in the cell charges and a glint runs across. The most important one is a solar panel in a brass frame.
- **Filters** are switches on a console, with a lamp that lights when one is on.
- **Shelves** of cards are moved by brass portholes, and how far along you are is a battery charging, one cell per card.
- **The story**: one planted bed per role, as long as the months it lasted, the oldest furthest away, with a sprout for every month on the bed being read. The entries are seed packets.
- **The work**: each project is seen through an arched window of the glasshouse. Press it and the casements swing open and the picture behind comes to life (pictures of the idea, not screenshots). Awards hang on ribbons, tools on tags.
- **The wins** are embroidered patches; the mark on each spins up, runs up its pole or puts out its rays.
- **The toolkit** is the sunflower field: tools with something to show for themselves open when you come to them, the others stay green buds. The receipt is a co-op receipt on thermal paper, torn in zigzags, with dotted leaders out to where each tool turns up and a barcode at the foot.
- **The islands** are stops on an airship route; the photos are prints held up with washi tape.
- **Contact** is a postcard with an airmail border, a stamp with the sun on it and the postmark of the hour; copying the address is a brass seal.
- **The cursor** is a small sun that sheds leaves, petals and pollen as it travels; its rays come out over anything that can be pressed.
- **Mini Omar** leans out of the porthole of a pod in the corner. See [mini-omar.md](mini-omar.md).

## Motion, performance, access

- `prefers-reduced-motion` is respected throughout. The sky becomes a still that only changes with scroll position, the cumulus is drawn fully grown, the figure stands in place, the turbines hold still, the islands do not move on by themselves or spin, and transitions are instant.
- The sky stops drawing whenever no plate is on screen or the tab is hidden, idles at about 30 frames a second when nothing is moving, and lowers its own resolution if a device cannot keep up.
- Without WebGL the sky is a plain gradient of the same colours. The paintings, which are 2D canvas, still appear, and on the islands a picture of each one stands in for the 3D scene.
- All text is real text, including the display face. The hairline copy of each sign is hidden from assistive technology, so titles are read once. Canvases and decorations are hidden too. There is a skip link, the header adapts its colour to what is behind it, and every interactive piece works from the keyboard.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.
