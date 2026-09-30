// Shared, mutable state between the scroll handler and the sky's render loop.
// Kept outside React on purpose: it changes every frame and nothing should re-render because of it.
export const world = {
  /** Which plate the sky should be painting, as a float. 0 is the ridge at night, 5 is the shore at dawn. */
  chapter: 0,
  /** False while every sky window is scrolled away, so the shader can stop drawing. */
  skyVisible: true,
  /** Pointer position, -1..1 on both axes. Only used for a very small parallax. */
  pointer: [0, 0] as [number, number],
}
