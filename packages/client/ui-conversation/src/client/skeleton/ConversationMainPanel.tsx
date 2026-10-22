import { useEffect, useState } from 'react'
import type { ConversationSlotProps } from '../contract/slots.ts'
import { conversationPhase } from '../contract/snapshot.ts'
import { ConversationWidthControls } from './ConversationWidthControls.tsx'
import css from './ConversationRoot.module.css'

const CONTENT_SLOTS = { widthControls: ConversationWidthControls }

/** How long a session the list has not proven blank may hide the composer
 *  while its open settles. An open that never settles (stalled history
 *  round-trip, a dead transport) must not leave the input area permanently
 *  invisible; the open keeps running and the snapshot flips the phase the
 *  moment it lands. */
const HISTORY_OPEN_SETTLE_TIMEOUT_MS = 10_000

/**
 * Render the existing main Conversation frame around the extracted content.
 * @param props - the original `main.conversation` Slot props.
 * @returns the unchanged root, Header, content, and width-control subtree.
 */
export function ConversationMainPanel(props: ConversationSlotProps) {
  const { sessionId, useSession, useSessions, useConversation, renderSlot, renderFactorySlot } = props
  const session = useSession(s => s)
  const conversation = useConversation(s => s)
  const shellPhase = session === undefined || conversation === undefined
    ? 'blank'
    : conversationPhase(session, conversation)
  const openState = session?.openState
  const summaryBlank = useSessions(s => sessionId === undefined ? undefined : s.byId[sessionId]?.blank)

  // While a session is still replaying (loading + blank) the hero/docked
  // choice is unknowable — render the composer hidden instead of flashing
  // the centered hero and snapping to the docked bar (or vice versa).
  // Exemption: a session the list summary already proves blank can only
  // land on the hero, so hiding would blank the column for the whole
  // history round-trip (the startup auto-selection flash) for nothing.
  // The exemption is deliberately open-state-wide, not loading-only: a
  // summary-blank session is the hero before its open starts (`cold`) and
  // after one fails (`error`) for the same reason — there is no history.
  // A restored continuable subagent waits for a Host summary to establish
  // parent availability. This keeps the composer
  // hidden instead of briefly rendering the parent-offline takeover.
  const parentAvailabilityPending = session?.subagent?.address.mode === 'continuable'
    && session.subagent.parentAvailable === undefined
  // A session the list summary has not proven blank hides the composer while
  // its open settles. Bounded: a stalled open (dead transport, a history
  // round-trip that never lands) must not keep the input area invisible
  // forever, so after the timeout the phase lands on a usable one and the
  // still-running open flips it again when it finally settles.
  const [historyOpenTimedOut, setHistoryOpenTimedOut] = useState(false)
  const historyOpening = sessionId !== undefined
    && shellPhase === 'blank'
    && (openState === 'loading' || openState === 'cold')
    && summaryBlank !== true
  useEffect(() => {
    if (!historyOpening) {
      setHistoryOpenTimedOut(false)
      return
    }
    // Reset per open attempt: a session that flips open→error→open again
    // (resync) restarts its bounded settling window.
    const timer = window.setTimeout(() => setHistoryOpenTimedOut(true), HISTORY_OPEN_SETTLE_TIMEOUT_MS)
    return () => { window.clearTimeout(timer) }
  }, [historyOpening, sessionId])
  const settling = historyOpening && !historyOpenTimedOut || parentAvailabilityPending
  // A failed open (openState='error') on a session the shell still counts as
  // blank is not the hero (there IS history) and not active (nothing rendered
  // yet): without an explicit phase the composer would sit in an empty
  // scrollport and look lost. Fall to the hero posture so the resident
  // composer stays visible and usable while the failure persists. The same
  // applies to an open that outlived its bounded settling window: the still-
  // running open flips the phase again when it finally lands.
  const hero = sessionId === undefined
    || (shellPhase === 'blank' && (
      openState === 'open'
      || summaryBlank === true
      || openState === 'error'
      || historyOpenTimedOut
    ))
  const phase = settling ? 'settling' : hero ? 'hero' : 'active'

  return (
    <div className={css.root} data-phase={phase}>
      {renderSlot('conversation.header', {})}
      {renderFactorySlot('conversation.content', {
        variant: 'main',
        phase,
        hero,
      }, {
        slots: CONTENT_SLOTS,
      })}
    </div>
  )
}
