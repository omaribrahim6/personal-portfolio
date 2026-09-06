# Pixel experience

Branch: `codex/3d-pixel-experience`

The existing yellow pixel alphabet becomes a physical object. Visitors can pull the lettering apart and rebuild it, connecting the interaction to Omar's developer and security auditor introduction. That visual language continues through interactive project sketches and the closing contact lettering.

## Preview

Run `npm install` and `npm run dev`, then open the local address printed by Next.js. The 3D hero is the only hero on this branch. Its original-comparison checkpoint remains in Git at `0af92f0`.

- Move the pointer over the lettering to change the viewing angle.
- Drag the Assemble / Disassemble slider, or focus it and use arrow keys.
- Select **Go on, break it** to scatter the blocks, then **Put it back** to rebuild.
- Pause stops ambient movement; the slider remains available.
- Each project has a labeled interactive illustration. Click, tap, or activate it with Enter/Space to unfold Clascade's lesson layers, trace Revenant's decision trail, transform QueryForge's example question, or scan RoadSense's road map. These are conceptual illustrations, not product screenshots or live product outputs.
- On wide screens, the left chapter rail follows the current section. The top progress line follows the page. Header links and a keyboard skip link provide direct access to the work.
- Move over the closing pixel lettering to lift the blocks. The heading is also an email link; keyboard focus gets a similar visual treatment.

## Implementation boundaries

The biography, project descriptions, awards, skills, and contact details are preserved. The hero is a separately loaded Three.js component, using one instanced mesh and procedural geometry with no downloaded models or textures. Project sketches use CSS perspective, SVG, and the existing Framer Motion dependency; the contact heading uses SVG. They do not add more WebGL contexts or continuous animation loops.

Hero rendering stops outside the viewport and in hidden tabs. Reduced-motion preferences disable the opening assembly and ambient motion, with immediate updates for explicit slider actions. While the scene loads, the same lettering appears as a faint blueprint of blocks that the cubes then assemble into. Unsupported WebGL or a lost graphics context shows that lettering as solid pixel blocks and disables the scene controls. GPU resources and event handlers are released on unmount. The page motion configuration respects reduced motion; project actions remain usable without animated transitions or pointer tilt.

## Next experiments worth comparing

1. A scroll transition where the name's blocks become the first project frame.
2. A project inspection view: rotate an object to reveal its implementation and security considerations.
3. An optional explorable environment, with a direct route to the readable portfolio.

This is a local prototype; it does not deploy or change the live site.

## The story, the wins, and the toolkit

The three sections between the projects and the closing lettering carry the same language: one interactive object per section, mono labels, dotted surfaces, and yellow blocks.

- **The story so far** plots every dated role on a ledger, one block per month from the first start date to the current month. Overlaps are visible as stacked rows, and the "peak load" figure is computed from the same dates. The ledger stays pinned on wide screens and follows whichever entry is at the reading line; hovering or clicking a row does the reverse. Filters narrow the list and dim the ledger rows that no longer apply. cumsa.ca has no dates, so it appears in the list but not on the ledger.
- **Wins** is a scoreboard split by what each win actually was: built it, broke it, or named. Each row carries a small glyph that resolves on hover, focus, or when a filter is active: a flag is raised for CTFs, scattered blocks assemble for hackathons, and the trophy block lifts onto its pedestal for the award. Hackathon rows link to the project they produced.
- **Skills & tools** gives every tool a receipt. Selecting or hovering a chip shows where on this page it was used, with links to the project, role, or win. Tools with nothing public to point at say so instead of pretending. The receipt panel is pinned beside the grid on wide screens and sticks to the bottom of the viewport on phones.

None of this adds a WebGL context or an animation loop. Everything is CSS transitions and the existing Framer Motion dependency, and it all goes still under reduced motion.
