// @vitest-environment jsdom
import type { GlobalStandardProps } from '@deepseek-ai/dsh-client-ui-slots'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { allowAllAccess, bindSnapshotSelector, makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionStatusSnapshot } from '@deepseek-ai/dsh-client-ui-session/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { QuickPhrasesRow } from '../src/client/settings/QuickPhrasesRow.tsx'
import type { QuickPhrasesRowProps } from '../src/client/settings/QuickPhrasesRow.tsx'
import { QuickPhrasesStore } from '../src/client/quick-phrases.ts'
import { en } from '../src/client/locales.ts'

const useResource = (() => ({ status: 'none' as const, value: undefined, failure: undefined })) as GlobalStandardProps['useResource']

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function emptySessions() {
  return bindSnapshotSelector(createSnapshotStore<SessionListState>({
    ids: [], byId: {}, phase: 'ready', projectionsBySession: {},
  }))
}

function emptyWorkspaces() {
  return bindSnapshotSelector(createSnapshotStore<WorkspaceSnapshot>({
    items: [], archivedSessionIds: [], pinnedSessionIds: [], state: 'idle', phase: 'ready', error: null,
  }))
}

function noPendingInteraction() {
  return bindSnapshotSelector(createSnapshotStore<SessionStatusSnapshot>(new Map()))
}

function mount(store: QuickPhrasesStore) {
  const setQuickPhrases = vi.fn((phrases: readonly string[]) => { store.set(phrases) })
  const props: QuickPhrasesRowProps = {
    usePanelInfo: selector => selector({ activePanelId: null }),
    useSessions: emptySessions(),
    useSessionStatus: noPendingInteraction(),
    useSessionRetainInfo: () => undefined,
    useResource,
    useWorkspaces: emptyWorkspaces(),
    ...allowAllAccess,
    useQuickPhrases: bindSnapshotSelector(store.quickPhrases),
    setQuickPhrases,
    t: makeTranslate(en),
  }
  render(<QuickPhrasesRow {...props} />)
  return { store, setQuickPhrases }
}

describe('QuickPhrasesRow', () => {
  it('starts with no tags and the add control disabled until a phrase is typed', () => {
    mount(new QuickPhrasesStore(undefined))
    expect(screen.getByText('Quick phrases')).toBeDefined()
    expect(screen.queryAllByRole('button', { name: 'Remove quick phrase' })).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Add a quick phrase' }).hasAttribute('disabled')).toBe(true)
  })

  it('adds a trimmed phrase on Enter and shows it as a removable tag', () => {
    const b = mount(new QuickPhrasesStore(undefined))
    const input = screen.getByRole('textbox', { name: 'Type a quick phrase' })
    fireEvent.change(input, { target: { value: '  你好 ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(b.setQuickPhrases).toHaveBeenCalledWith(['你好'])
    expect(screen.getByText('你好')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Remove quick phrase' })).toBeDefined()
  })

  it('removes one phrase in place', () => {
    const store = new QuickPhrasesStore(undefined)
    store.set(['alpha', 'beta'])
    const b = mount(store)
    expect(screen.getAllByRole('button', { name: 'Remove quick phrase' })).toHaveLength(2)
    const firstRemove = screen.getAllByRole('button', { name: 'Remove quick phrase' })[0]
    if (firstRemove === undefined) throw new Error('expected two remove buttons')
    fireEvent.click(firstRemove)
    expect(b.setQuickPhrases).toHaveBeenCalledWith(['beta'])
  })

  it('follows later store changes', () => {
    const b = mount(new QuickPhrasesStore(undefined))
    act(() => { b.store.set(['alpha']) })
    expect(screen.getByText('alpha')).toBeDefined()
  })
})
