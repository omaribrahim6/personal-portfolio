import { bank, shapeOf, thunderhead } from './clouds'

// Cloud shapes are drawn here, off the main thread, so the page stays free to hydrate and animate
// while the thunderhead grows. The pixels are handed back without being copied.

export type ShapeRequest = { which: 0 | 1; size: number; bloom: number }
export type ShapeReply = ShapeRequest & { data: Uint8Array; width: number; height: number }

addEventListener('message', (event: MessageEvent<ShapeRequest>) => {
  const { which, size, bloom } = event.data
  const image = shapeOf(which ? bank : thunderhead, size, bloom)
  const reply: ShapeReply = { which, size, bloom, ...image }
  ;(postMessage as unknown as (message: ShapeReply, transfer: Transferable[]) => void)(reply, [image.data.buffer])
})
