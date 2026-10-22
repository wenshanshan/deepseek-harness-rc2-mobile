/**
 * Narrow-frame drawer affordance: one Logo in the conversation header's
 * leading seat (grid-column 1) that reopens the floating sidebar drawer.
 *
 * The frame hides the sidebar column entirely below the mobile breakpoint
 * (no rail), so the drawer needs a home the user can always reach. This
 * button lives in `conversation.header.leading`, beside the title, and only
 * renders while the viewport is narrow. While the drawer is open the frame's
 * scrim and panel cover the header (both are frame children above it), so
 * this control is naturally unreachable and needs no drawer-state input.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FishLogo, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the conversation header leading-seat declaration.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SidebarRootInjected } from './contract/slots.ts'
import css from './MobileDrawerLogo.module.css'

/** Mobile breakpoint in CSS px; mirrors ui-layout's SIDEBAR_AUTO_COLLAPSE. */
const MOBILE_BREAKPOINT = 1024

/** Full props of the conversation-header leading occupant. */
export type MobileDrawerLogoProps =
  PropsRuntime<'conversation.header.leading'>
  & InjectFace<SidebarRootInjected>
  & PropsLocale<'sidebar'>

/**
 * Render the narrow-frame drawer Logo button in the header's leading seat.
 * @param props - injected sidebar actions plus the sidebar locale seat.
 * @returns the Logo button, or null on wide viewports.
 */
export function MobileDrawerLogo({ toggleSidebar, t }: MobileDrawerLogoProps): ReactNode {
  const [narrow, setNarrow] = useState(() => (
    typeof window === 'undefined' ? false : window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
  ))
  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const sync = (): void => { setNarrow(media.matches) }
    sync()
    media.addEventListener('change', sync)
    return () => { media.removeEventListener('change', sync) }
  }, [])
  if (!narrow) return null
  return (
    <Tooltip label={t('toggle.open')} delayMs={500}>
      <button
        type="button"
        className={css.logoButton}
        aria-label={t('toggle.open')}
        data-mobile-drawer-logo
        onClick={() => { toggleSidebar() }}
      >
        <FishLogo size={22} />
      </button>
    </Tooltip>
  )
}
