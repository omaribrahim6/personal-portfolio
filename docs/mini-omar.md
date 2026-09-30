# Mini Omar

Branch: `portfolio-dreamscape-mini-omar` (on top of `portfolio-dreamscape-claude-opus-5-5`)

A small low-poly Omar who can answer questions about the portfolio. The idea comes from Mamdani, the hackathon project with a small 3D guide in the corner of its dashboard.

- **In the corner, on every plate.** He leans out of a low coral moon at the bottom right. His head follows the pointer; left alone he looks around, blinks and breathes. Click him (or press Ctrl/Cmd + J) and the corner empties: the chat grows out of it, and he is standing behind the message box.
- **On the shore.** At the last plate, where the painted figure has been walking to all night, he is standing on the beach at full height instead, facing you, under "Let's talk". Clicking him there opens the same chat.
- **In the chat** he listens while you type, looks away while he thinks, and moves his mouth and hands while the answer streams in. Answers can end with a link to the part of the page they are about.

The chat is Mamdani's, carried over: the same floating card (440 by up to 740 pixels, 16 from the corner), the same parts (his face and name, new conversation and close, a greeting with suggested questions, him behind the message box, a stop button while he answers) and the same opening, a circle growing out of the corner while the parts rise into place. Only the colours are this site's. On a phone it is a smaller card, at most 480 pixels tall, with four suggestions instead of five.

## The model

He was generated from one drawing with the [Tripo API](https://developers.tripo3d.ai/en/docs) and rigged by its auto-rigger (23 Mixamo-named bones). `scripts/tripo.mjs` is the helper that did it:

```bash
node scripts/tripo.mjs balance
node scripts/tripo.mjs generate <image> omar      # image → textured mesh
node scripts/tripo.mjs rig <task_id> omar         # mesh → rigged .glb
```

Downloads land in `.data/tripo/`, which is not committed. It needs `TRIPO_API_KEY` in `.env.local`. Generating and rigging cost credits; nothing on the site calls Tripo.

What Tripo returns is one fused surface: robe, cape and body are a single skin, and the rigger bound cloth that hangs near an arm to that arm. Lifting a hand dragged the hem of the cape up with it. `scripts/bake-omar.mjs` fixes that offline and writes the model the site ships, `public/models/omar-rigged.glb`:

```bash
node scripts/bake-omar.mjs
```

1. It finds the forearms and hands (close to the bone, facing away from it, skin- or wrap-coloured in the texture, and joined to each other) and removes the triangles that weld them to the robe.
2. It gives the cloth back to the body. The sleeve still follows the upper arm, with "near" measured along the surface rather than through the air, and everything further out follows the spine.

`public/models/omar-bust.webp` is a still of him, used where the 3D one cannot be shown.

## On the page

`app/components/mini/`

- `stage.ts` is the only module that imports three.js, and it is loaded on demand a few seconds after the page, so nothing else waits for it. Tripo gives a skeleton and no face, so the face is made here: a jaw morph target sculpted from the mesh, a dark mouth that opens behind it, and eyelids painted over the texture in the shader. The rest is procedural: look, breathing, a shift of weight, a wave, and hands that move when he talks.
- `MiniOmar.tsx` is the corner, the beach and the chat. There is one canvas; it is moved between the corner, the beach and the chat, and reframed for each, rather than drawn three times.
- `/lab` (development only) is a bench for the model: behaviours, framings, lighting and a few poses that stress the skin.

He stays out of the way: on narrow screens he steps aside while the toolkit's receipt is pinned to the bottom edge, and the chat never takes focus away unless it was opened.

## The answers

`app/api/ask/`

- `route.ts` is a small streaming endpoint (server-sent events) in front of Gemini. The key stays on the server.
- `dossier.ts` builds what he knows from `app/content.ts`, the same module the page is rendered from, so he cannot drift from the site. He speaks as Omar in the first person, says so when something is not on the site instead of guessing, and declines anything that is not about the work.
- Limits, because the endpoint is public: questions are capped at 400 characters and answers at about 320 tokens, only the last 8 turns are sent, and there is a rate limit of 8 a minute and 40 an hour per visitor with a ceiling of 1,500 a day for everyone together. The limits are kept in memory, which is right for one container and would need a shared store for more.

Environment:

| Variable | |
| --- | --- |
| `GEMINI_API_KEY` | A Gemini API key or a Vertex AI express-mode key. Without one the site runs and he says he is offline. |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-3.5-flash-lite`. |
| `TRIPO_API_KEY` | Only for `scripts/tripo.mjs`. Never needed by the site. |

Locally these go in `.env.local`. In production `docker-compose.yml` passes `GEMINI_API_KEY` and `GEMINI_MODEL` from the `.env` beside it on the server into the container.

## Motion and access

- With `prefers-reduced-motion` he holds still: no wave, no wandering, no mouth movement. He still faces forward and the chat works the same.
- Without WebGL, or if the model fails to load, a picture of him sits in the corner and behind the message box, and the chat still works. On the shore the painted figure stays where it was.
- The corner and the beach are both real buttons with names. The chat is a labelled dialog; Escape closes it and returns focus to him; answers are announced as they arrive. On a touch screen opening it does not raise the keyboard.
- There is no voice. It is text only.
