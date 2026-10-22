/** Busy-Enter preference stored in the Host user-settings document. */

import z from '@deepseek-ai/schemastery'

/** Settings namespace owned by the conversation plugin. */
export const CONVERSATION_SETTINGS_NAMESPACE = 'ui-conversation'

/** Field carrying the delivery mode for plain Enter while an agent is busy. */
export const BUSY_ENTER_FIELD = 'busyEnter'

/** Busy-Enter behaviors accepted at settings and input boundaries. */
export const BUSY_ENTER_BEHAVIORS = ['queue', 'steer'] as const

/** Configurable meaning of plain Enter while the addressed agent is busy. */
export type BusyEnterBehavior = typeof BUSY_ENTER_BEHAVIORS[number]

/** Default preserves Enter-as-Queue for running conversations. */
export const DEFAULT_BUSY_ENTER_BEHAVIOR: BusyEnterBehavior = 'queue'

/** Field carrying the user's ordered quick-phrase list. */
export const QUICK_PHRASES_FIELD = 'quickPhrases'

/** Default empty quick-phrase list (shows no tags). */
export const DEFAULT_QUICK_PHRASES: readonly string[] = []

/** Durable conversation section shared by the Host schema and the browser scope. */
export interface ConversationSettings {
  /** Delivery mode for plain Enter while the addressed agent is busy. */
  busyEnter: BusyEnterBehavior
  /** User-owned quick phrases shown above the composer, in order. */
  quickPhrases: readonly string[]
}

/** Durable conversation schema; also the wire envelope the browser scope validates against. */
export const ConversationSettingsFields = {
  [BUSY_ENTER_FIELD]: z.union([...BUSY_ENTER_BEHAVIORS]).default(DEFAULT_BUSY_ENTER_BEHAVIOR),
  [QUICK_PHRASES_FIELD]: z.array(z.string()).default([...DEFAULT_QUICK_PHRASES]),
}

/** Schema for shared configuration values. */
export const ConversationSettingsSchema = z.object(ConversationSettingsFields)
