// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { MobileDrawerLogo, type MobileDrawerLogoProps } from '../src/client/MobileDrawerLogo.tsx'
import { en } from '../src/client/locales.ts'

const t: MobileDrawerLogoProps['t'] = makeTranslate(en)

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Stub matchMedia for the drawer Logo's breakpoint gate. */
function stubViewport(narrow: boolean): void {
  const matches = narrow
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  })))
}

describe('MobileDrawerLogo', () => {
  it('renders the Logo affordance on narrow viewports and opens the drawer', () => {
    stubViewport(true)
    const toggleSidebar = vi.fn()
    render(<MobileDrawerLogo toggleSidebar={toggleSidebar} t={t} />)
    const button = screen.getByRole('button', { name: en['toggle.open'] })
    expect(button).toBeTruthy()
    fireEvent.click(button)
    expect(toggleSidebar).toHaveBeenCalledOnce()
  })

  it('renders nothing on wide viewports', () => {
    stubViewport(false)
    render(<MobileDrawerLogo toggleSidebar={vi.fn()} t={t} />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
