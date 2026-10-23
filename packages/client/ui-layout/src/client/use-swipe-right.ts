/**
 * A whole-surface right-swipe detector for the narrow floating drawer. A touch
 * or pen gesture that starts anywhere on the page (outside a text field) and
 * whose first significant movement is horizontal-to-the-right opens the drawer
 * once past `thresholdPx`; a vertical scroll or any leftward movement locks
 * the gesture away instead, so ordinary list scrolling keeps working. The
 * start is intentionally not restricted to the viewport edge: mobile browsers
 * reserve an edge swipe for the OS "back" gesture, so the drawer affordance
 * lives on the whole surface. Listeners are passive — this hook observes, it
 * never prevents the native scroll.
 *
 * @param onOpen - invoked once when a qualifying swipe crosses the threshold.
 * @param enabled - when false the detector installs no listeners (drawer
 *   already open, or a wide frame where the sidebar owns a grid track).
 * @param thresholdPx - horizontal travel in CSS px that counts as "open".
 */
import { useEffect, useRef } from 'react'

/** Minimum travel before a touch locks into a right-swipe or is dropped. */
const AXIS_LOCK_PX = 10

/** A gesture that begins on a text entry belongs to the field, not the drawer. */
function startsInTextEntry(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true
  return target instanceof HTMLElement && target.isContentEditable
}

export function useSwipeRight(
  onOpen: () => void,
  enabled: boolean,
  thresholdPx = 70,
): void {
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen
  const startRef = useRef<{ x: number; y: number; locked: boolean } | null>(null)

  useEffect(() => {
    if (!enabled) return
    const down = (event: PointerEvent): void => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
      if (startsInTextEntry(event.target)) return
      startRef.current = { x: event.clientX, y: event.clientY, locked: false }
    }
    const move = (event: PointerEvent): void => {
      const start = startRef.current
      if (start === null) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (!start.locked) {
        const adx = Math.abs(dx)
        const ady = Math.abs(dy)
        // Wait for enough travel to judge direction, then lock only a
        // rightward, horizontal-leading movement; a vertical scroll or a
        // leftward drag wins this touch and ends the gesture.
        if (adx < AXIS_LOCK_PX && ady < AXIS_LOCK_PX) return
        if (!(dx > 0 && adx > ady)) {
          startRef.current = null
          return
        }
        start.locked = true
      }
      // Reverse direction or drift into a vertical scroll abandons the swipe.
      if (dx < 0 || Math.abs(dy) > AXIS_LOCK_PX * 4) {
        startRef.current = null
        return
      }
      if (dx >= thresholdPx) {
        startRef.current = null
        onOpenRef.current()
      }
    }
    const end = (): void => { startRef.current = null }
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', end, { passive: true })
    window.addEventListener('pointercancel', end, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [enabled, thresholdPx])
}
