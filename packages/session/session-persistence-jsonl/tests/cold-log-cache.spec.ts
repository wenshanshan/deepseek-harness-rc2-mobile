/** coldLogCacheSize configuration and LRU reopen correctness. */

import { Context } from '@deepseek-ai/cordis'
import { SessionId, SessionSeq } from '@deepseek-ai/dsh-session'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { MessageId, freezeMessage } from '@deepseek-ai/dsh-llm'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import * as JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import { oneTurnLog } from '../../session-persistence/tests/contract.ts'

/** A stored header the backend accepts as an ordinary unseeded session. */
function header(id: string) {
  return {
    version: 4 as const,
    id: SessionId(id),
    createdAt: 1,
    isSeeded: false,
    delegationDepth: 0,
    cwd: '/tmp',
  }
}

/** A contiguous second batch so two sessions carry different log lengths. */
function secondTurnEvents(events: readonly SessionEvent[]): SessionEvent[] {
  const base = events.length
  return [
    { type: 'turn/start', seq: SessionSeq(base + 0), time: 10, data: { turn: 2 } },
    { type: 'user/message', seq: SessionSeq(base + 1), time: 11, data: freezeMessage({
      id: MessageId('second-user'),
      role: 'user',
      content: [{ type: 'text', text: 'again' }], source: { kind: 'user' },
    }), surfaceOp: 'append' },
    { type: 'turn/end', seq: SessionSeq(base + 2), time: 12, data: { turn: 2, reason: { kind: 'completed' } } },
  ]
}

async function mount(dir: string, coldLogCacheSize?: number) {
  const ctx = new Context()
  const fiber = await ctx.plugin(JsonlSessionPersistence, {
    root: dir,
    compression: 'none',
    ...(coldLogCacheSize === undefined ? {} : { coldLogCacheSize }),
  })
  return { ctx, dispose: async () => { await fiber.dispose() } }
}

async function seed(ctx: Context, id: string, events: readonly SessionEvent[]): Promise<void> {
  const handle = await ctx.sessionPersistence.create(header(id))
  try {
    await handle.append(events)
  } finally {
    await handle.close()
  }
}

async function readSeqs(ctx: Context, id: string): Promise<number[]> {
  const handle = await ctx.sessionPersistence.open(SessionId(id), 'read')
  try {
    return (await handle.read()).events.map(event => (event as SessionEvent).seq)
  } finally {
    await handle.close()
  }
}

const dirs: string[] = []
afterEach(async () => {
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true })
})

describe('session-persistence-jsonl coldLogCacheSize', () => {
  it('rejects a non-positive cache size at mount', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dsh-cold-cache-'))
    dirs.push(dir)
    const ctx = new Context()
    await expect(ctx.plugin(JsonlSessionPersistence, {
      root: dir,
      compression: 'none',
      coldLogCacheSize: 0,
    })).rejects.toThrow(/coldLogCacheSize/)
  })

  it('keeps closing and reopening sessions correct under a bounded cache', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dsh-cold-cache-'))
    dirs.push(dir)
    const { ctx, dispose } = await mount(dir, 1)
    const ids = ['a', 'b', 'c']
    for (const id of ids) await seed(ctx, id, oneTurnLog())
    for (const id of ids) expect(await readSeqs(ctx, id)).toEqual([0, 1, 2, 3, 4, 5])
    // Reopen in reverse order; each session keeps its own dense seq prefix.
    for (const id of [...ids].reverse()) expect(await readSeqs(ctx, id)).toEqual([0, 1, 2, 3, 4, 5])
    await dispose()
  })

  it('reconstructs a fully evicted longer log on a later reopen', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dsh-cold-cache-'))
    dirs.push(dir)
    const { ctx, dispose } = await mount(dir, 1)
    const long = [...oneTurnLog(), ...secondTurnEvents(oneTurnLog())]
    await seed(ctx, 'a', long)
    for (const id of ['b', 'c']) await seed(ctx, id, oneTurnLog())
    // Read a evicting it, churn b/c, then re-read a to force a full reparse.
    expect(await readSeqs(ctx, 'a')).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(await readSeqs(ctx, 'b')).toEqual([0, 1, 2, 3, 4, 5])
    expect(await readSeqs(ctx, 'c')).toEqual([0, 1, 2, 3, 4, 5])
    expect(await readSeqs(ctx, 'a')).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    await dispose()
  })

  it('defaults to the documented bound without a config key', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dsh-cold-cache-'))
    dirs.push(dir)
    const { ctx, dispose } = await mount(dir)
    await seed(ctx, 'a', oneTurnLog())
    expect(await readSeqs(ctx, 'a')).toEqual([0, 1, 2, 3, 4, 5])
    const snap = await ctx.sessionPersistence.stat(SessionId('a'))
    expect(snap).toBeDefined()
    expect(snap?.header.id).toBe('a')
    await dispose()
  })
})
