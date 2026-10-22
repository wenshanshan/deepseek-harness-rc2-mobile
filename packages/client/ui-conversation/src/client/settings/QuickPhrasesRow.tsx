/** General Settings row for the composer's quick-phrase tags. */

import { useState } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconPlusOutlineRegular, IconCloseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './QuickPhrasesRow.module.css'

/** Registration-side quick-phrase face. */
export interface QuickPhrasesRowInjected {
  hooks: {
    /** Persisted ordered quick-phrase list. */
    quickPhrases: SnapshotStore<readonly string[]>
  }
  /** Replace the whole ordered list (durable write). */
  setQuickPhrases: (phrases: readonly string[]) => void
}

/** Full Settings-row props. */
export type QuickPhrasesRowProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'conversation'>
  & InjectFace<QuickPhrasesRowInjected>

/**
 * Render the ordered quick-phrase list editor: add a phrase, remove one, or
 * reorder by removing and re-adding. The list is trimmed of blank entries and
 * kept in order.
 * @param props - composed Settings slot props.
 * @returns the preference row.
 */
export function QuickPhrasesRow({ useQuickPhrases, setQuickPhrases, t }: QuickPhrasesRowProps) {
  const phrases = useQuickPhrases(value => value)
  const [draft, setDraft] = useState('')

  const add = (): void => {
    const text = draft.trim()
    if (text === '') return
    setQuickPhrases([...phrases, text])
    setDraft('')
  }

  const removeAt = (index: number): void => {
    setQuickPhrases(phrases.filter((_phrase, at) => at !== index))
  }

  return (
    <div className={css.row}>
      <div className={css.text}>
        <div className={css.title}>{t('settings.quick.title')}</div>
        <div className={css.desc}>{t('settings.quick.description')}</div>
      </div>
      <div className={css.tags}>
        {phrases.map((phrase, index) => (
          <span key={`${index}:${phrase}`} className={css.tag}>
            <span className={css.tagText}>{phrase}</span>
            <button
              type="button"
              className={css.remove}
              aria-label={t('settings.quick.remove')}
              onClick={() => { removeAt(index) }}
            >
              <IconCloseOutlineRegular size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className={css.addRow}>
        <input
          className={css.input}
          type="text"
          value={draft}
          placeholder={t('settings.quick.placeholder')}
          aria-label={t('settings.quick.placeholder')}
          onChange={(event) => { setDraft(event.target.value) }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
        />
        <button
          type="button"
          className={css.add}
          aria-label={t('settings.quick.add')}
          disabled={draft.trim() === ''}
          onClick={add}
        >
          <IconPlusOutlineRegular size={14} />
        </button>
      </div>
    </div>
  )
}
