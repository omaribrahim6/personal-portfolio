# Pixel experience — experiment 01

Branch: `codex/3d-pixel-experience`

The existing yellow pixel alphabet becomes a physical object. Visitors can pull the lettering apart and rebuild it, connecting the interaction to Omar's developer and security auditor introduction. The existing portfolio sections follow immediately below.

## Preview

Run `npm install` and `npm run dev`, then open the local address printed by Next.js. The header switches between **3D experiment** and **Original** without navigating away. The original hero and the 3D scene share the same pixel alphabet.

- Move the pointer over the lettering to change the viewing angle.
- Drag the Assemble / Disassemble slider, or focus it and use arrow keys.
- Select **Go on, break it** to scatter the blocks, then **Put it back** to rebuild.
- Pause stops ambient movement; the slider remains available.

## Implementation boundaries

The experiment changes the hero only. The biography, projects, awards, skills, and contact content are preserved. The 3D scene is a separately loaded Three.js component, using one instanced mesh and procedural geometry with no downloaded models or textures.

Rendering stops outside the viewport and in hidden tabs. Reduced-motion preferences disable the opening assembly and ambient motion, with immediate updates for explicit slider actions. Unsupported WebGL or a lost graphics context shows readable HTML lettering and disables the scene controls. GPU resources and event handlers are released when switching to the original.

## Next experiments worth comparing

1. A scroll transition where the name's blocks become the first project frame.
2. A project inspection view: rotate an object to reveal its implementation and security considerations.
3. An optional explorable environment, with a direct route to the readable portfolio.

Keep each concept independently comparable before extending 3D throughout the page. This first experiment is a local prototype; it does not deploy or change the live site.
