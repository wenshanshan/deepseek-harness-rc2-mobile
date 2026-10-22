/**
 * User-owned quick phrases shared by the composer bar and the General settings
 * row. One live store backed by the Host user-settings document, so both
 * surfaces read the same ordered list and any edit lands through the same
 * durable write.
 */

import {
  createSnapshotStore, type SnapshotStore,
} from '@deepseek-ai/dsh-client-store'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ConversationSettings } from '../submission-settings.ts'
import { DEFAULT_QUICK_PHRASES, QUICK_PHRASES_FIELD } from '../submission-settings.ts'

/** Whether two phrase lists hold the same text in the same order. */
function phrasesEqual(left: readonly string[], right: readonly string[]): boolean {
  return left === right
    || (left.length === right.length && left.every((phrase, index) => phrase === right[index]))
}

/**
 * Live quick-phrase list shared by the composer bar and its Settings row.
 * Durable writes go through the Host configuration form; absence of one keeps
 * the scope default (empty).
 */
export class QuickPhrasesStore {
  /** Reactive ordered phrase list for the composer tags and the editor. */
  readonly quickPhrases: SnapshotStore<readonly string[]> = createSnapshotStore<readonly string[]>([...DEFAULT_QUICK_PHRASES])
  private readonly host: ConfigForm<ConversationSettings> | undefined
  private readonly unsubscribe: (() => void) | undefined

  /**
   * @param host - shared configuration form; omitted keeps the scope default.
   */
  constructor(host: ConfigForm<ConversationSettings> | undefined) {
    this.host = host
    if (host !== undefined) {
      this.unsubscribe = host.subscribe(() => { this.adopt(host) })
      this.adopt(host)
    }
  }

  /** Release the preference subscription. */
  dispose(): void { this.unsubscribe?.() }

  /**
   * Replace the whole ordered list; the live value publishes before the
   * durable write starts.
   * @param phrases - ordered, non-blank phrase texts.
   */
  set(phrases: readonly string[]): void {
    const next: readonly string[] = Object.freeze([...phrases])
    if (!phrasesEqual(this.quickPhrases.getSnapshot(), next)) this.quickPhrases.set(next)
    void this.host?.set(QUICK_PHRASES_FIELD, [...next])
  }

  /** Adopt the scope's accepted durable list without writing it back. */
  private adopt(host: ConfigForm<ConversationSettings>): void {
    const value = host.getSnapshot().value?.quickPhrases
    if (value === undefined) return
    const next = Object.freeze([...value])
    if (!phrasesEqual(this.quickPhrases.getSnapshot(), next)) this.quickPhrases.set(next)
  }
}
