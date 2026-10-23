// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { GlobalStandardProps, InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import { allowAllAccess, makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { MobileDrawerLogo, type MobileDrawerLogoProps } from '../src/client/MobileDrawerLogo.tsx'
import type { SidebarRootInjected } from '../src/client/contract/slots.ts'
import { en } from '../src/client/locales.ts'

const t: MobileDrawerLogoProps['t'] = makeTranslate(en)

// The component's props type carries the sidebar inject face and the global
// standard seat, but the Logo reads only the viewport media query (and
// toggleSidebar on click): every stub member exists only to satisfy the type,
// and consuming one is a test failure.
const unused = (): never => { throw new Error('not consumed by the drawer Logo') }
const standard: InjectFace<SidebarRootInjected> & GlobalStandardProps = {
  startSession: unused, selectPanel: unused, toggleSidebar: unused,
  usePanels: unused, useShortcuts: unused,
  useSessions: unused, useSessionStatus: unused, useSessionRetainInfo: unused,
  usePanelInfo: unused, useResource: unused, useWorkspaces: unused,
  ...allowAllAccess,
}

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
    render(<MobileDrawerLogo {...standard} toggleSidebar={toggleSidebar} t={t} />)
    const button = screen.getByRole('button', { name: en['toggle.open'] })
    expect(button).toBeTruthy()
    fireEvent.click(button)
    expect(toggleSidebar).toHaveBeenCalledOnce()
  })

  it('renders nothing on wide viewports', () => {
    stubViewport(false)
    render(<MobileDrawerLogo {...standard} toggleSidebar={vi.fn()} t={t} />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
