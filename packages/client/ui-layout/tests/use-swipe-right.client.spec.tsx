// @vitest-environment jsdom
/** Whole-surface right-swipe: opens once past the threshold; vertical scrolls,
 * leftward drags, text fields, and disabled state stay inert. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useSwipeRight } from '../src/client/use-swipe-right.ts'

afterEach(cleanup)

/** Dispatch a PointerEvent at the window with the given coordinates and type. */
function pointer(type: string, x: number, y: number, pointerType = 'touch'): void {
  const event = new PointerEvent(type, { clientX: x, clientY: y, pointerType, bubbles: true })
  window.dispatchEvent(event)
}

describe('useSwipeRight', () => {
  it('opens once when a drag travels right past the threshold from anywhere', () => {
    const onOpen = vi.fn()
    renderHook(() => useSwipeRight(onOpen, true, 70))
    act(() => {
      pointer('pointerdown', 200, 300)
      pointer('pointermove', 250, 305)
    })
    expect(onOpen).not.toHaveBeenCalled()
    act(() => { pointer('pointermove', 280, 306) })
    expect(onOpen).toHaveBeenCalledTimes(1)
    // The tracking arm is consumed; further movement does not re-open.
    act(() => { pointer('pointermove', 320, 310) })
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('lets a mostly-vertical scroll own the gesture', () => {
    const onOpen = vi.fn()
    renderHook(() => useSwipeRight(onOpen, true, 70))
    act(() => {
      pointer('pointerdown', 200, 300)
      pointer('pointermove', 200, 360)
      pointer('pointermove', 220, 400)
    })
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('ignores a leftward drag', () => {
    const onOpen = vi.fn()
    renderHook(() => useSwipeRight(onOpen, true, 70))
    act(() => {
      pointer('pointerdown', 200, 300)
      pointer('pointermove', 140, 302)
      pointer('pointermove', 100, 304)
    })
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('ignores a gesture that starts on a text field', () => {
    const onOpen = vi.fn()
    renderHook(() => useSwipeRight(onOpen, true, 70))
    const input = document.createElement('input')
    document.body.append(input)
    act(() => {
      input.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 300, pointerType: 'touch', bubbles: true }))
      pointer('pointermove', 200, 302)
    })
    expect(onOpen).not.toHaveBeenCalled()
    input.remove()
  })

  it('installs no listeners while disabled', () => {
    const onOpen = vi.fn()
    renderHook(() => useSwipeRight(onOpen, false, 70))
    act(() => {
      pointer('pointerdown', 200, 300)
      pointer('pointermove', 300, 305)
    })
    expect(onOpen).not.toHaveBeenCalled()
  })
})
