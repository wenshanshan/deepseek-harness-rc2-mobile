/**
 * The Session Header archive action: a compact, titlebar-adjacent icon button
 * (the `conversation.session.header.utilities` seat) that archives or restores
 * the open Session. It is the same behavior the sidebar row's archive
 * action provides — running-work refusal opens the stop-and-archive
 * confirmation and a success raises the undo notice — reused verbatim through
 * the shared `archiveInjected` share, so the entry in the header and the entry
 * in the sidebar stay one behavior.
 *
 * The button reads its own row's archived membership through the injected
 * `useArchived` hook and matches the header's other icon-only controls: the
 * 28px round target the clock and the more-operations button use, distinguished
 * by an archive/unarchive glyph for assistive tech.
 */
import type { ReactNode } from 'react'
import {
  Button, IconArchiveOutlineRegular, IconUnarchiveOutlineRegular, Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ArchiveSessionInjected } from '../contract/slots.ts'
import css from './ArchiveSessionHeaderButton.module.css'

/** Owner share of the session header utilities seat plus the archive share. */
export type ArchiveSessionHeaderProps =
  PropsRuntime<'conversation.session.header.utilities'>
  & PropsLocale<'workspace'>
  & InjectFace<ArchiveSessionInjected>

/**
 * Render the open Session's archive toggle in the Session header utility row.
 * @param props - the header's Session scope, the locale seat, and the archive share.
 * @returns the compact archive button and its tooltip.
 */
export function ArchiveSessionHeaderButton({
  sessionId, useArchived, archiveSession, unarchiveSession, t,
}: ArchiveSessionHeaderProps): ReactNode {
  const archived = useArchived(set => set.has(sessionId))
  const label = t(archived ? 'actions.unarchive' : 'actions.archive')
  return (
    <Tooltip label={label} side="bottom" align="end" delayMs={500} portal>
      <Button
        size="sm"
        className={css.archiveButton}
        aria-label={label}
        onClick={() => { (archived ? unarchiveSession : archiveSession)(sessionId) }}
      >
        {archived ? <IconUnarchiveOutlineRegular size={15} /> : <IconArchiveOutlineRegular size={15} />}
      </Button>
    </Tooltip>
  )
}
