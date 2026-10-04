import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { findEconomyProblem, findHistoryProblem, previousParkOf, readEconomyMark, type EconomyMark } from '../../shared/parkEconomyCheck.ts'
import { parseParkName } from '../../shared/parkName.ts'
import { handleParkRequest } from './handleParkRequest.ts'
import { parkKeyOf } from './parkKey.ts'
import type { ParkStore } from './parkStoreTypes.ts'
import { createSqliteParkStore } from './sqliteParkStore.ts'

type EconomyFields = Record<string, unknown>

const baseLedger: EconomyFields = { wallet: 40, lifetimeEarned: 100, lifetimeSpent: 70, lifetimeRefunded: 10 }
const url = 'http://local/api/park?name=Ada%20Lovelace'

function economySections(fields: EconomyFields = {}): Record<string, unknown> {
  return { economy: { ...baseLedger, holdings: [], ...fields } }
}

function economyBody(updatedAt: number, fields: EconomyFields = {}, sections: Record<string, unknown> = economySections(fields)): string {
  return JSON.stringify({ version: 3, updatedAt, owner: { first: 'Ada', last: 'Lovelace' }, seed: 1, viewport: { width: 1, height: 1 }, sections })
}

function problemOf(fields: EconomyFields): string | null {
  return findEconomyProblem(economySections(fields))
}

function markOf(fields: EconomyFields): EconomyMark {
  const mark = readEconomyMark(economySections(fields))
  assert.ok(mark.ok)
  return mark.value
}

async function withStore(run: (openStore: () => Promise<ParkStore>, store: ParkStore) => Promise<void>): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), 'park-economy-'))
  try {
    const store = createSqliteParkStore(join(directory, 'parks.sqlite'))
    await run(async () => store, store)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

describe('park economy check', () => {
  it('accepts a consistent ledger and requires an economy section', () => {
    assert.equal(problemOf({}), null)
    assert.equal(findEconomyProblem({}), 'economy')
    assert.equal(findEconomyProblem({ world: { progress: { points: 900 } } }), 'economy')
  })

  it('rejects broken or fractional ledgers', () => {
    assert.equal(problemOf({ wallet: 41 }), 'ledger')
    assert.equal(problemOf({ lifetimeRefunded: 80 }), 'ledger')
    assert.equal(problemOf({ wallet: 1.5 }), 'wallet')
    assert.equal(problemOf({ lifetimeEarned: -1 }), 'lifetime')
  })

  it('rejects holdings that cost more than was spent or less than the shop price', () => {
    assert.equal(problemOf({ holdings: [{ id: 'prop-a', itemId: 'bench', paid: 90 }] }), 'committed')
    assert.equal(problemOf({ holdings: [{ id: 'prop-a', itemId: 'fountain', paid: 1 }] }), 'holdings')
    assert.equal(problemOf({ holdings: [{ id: 'prop-a', itemId: 'cushion', paid: 6 }, { id: 'prop-b', itemId: 'cushion', paid: 6 }] }), 'holdings')
    assert.equal(problemOf({ holdings: [{ id: 'prop-a', itemId: 'cushion', paid: 6 }, { id: 'prop-b', itemId: 'cushion', paid: 7 }] }), null)
    assert.equal(problemOf({ holdings: [{ id: 'prop-a', itemId: 'gold', paid: 6 }] }), 'holdings')
  })

  it('counts tools, collars, tree charges and path tiles against what was spent', () => {
    assert.equal(problemOf({ ownedTools: ['hand', 'treat', 'brush'] }), 'committed')
    assert.equal(problemOf({ ownedTools: ['hand', 'treat'] }), null)
    assert.equal(problemOf({ ownedTools: ['hand', 'treat', 'brush'], grantedTools: ['brush'] }), null)
    assert.equal(problemOf({ collarsBought: 1 }), 'committed')
    assert.equal(problemOf({ collarsBought: 1, grantedCollars: 1 }), null)
    assert.equal(problemOf({ treeChargesBought: 30_000, treeCharges: 30_000 }), 'committed')
    assert.equal(problemOf({ treeChargesBought: 180 }), null)
    assert.equal(problemOf({ pathBought: { gravel: 5000, stone: 0 } }), 'committed')
    assert.equal(problemOf({ pathBought: { gravel: 240, stone: 0 } }), null)
  })

  it('never lets free grants appear on a new park or grow later', () => {
    const now = 10_000_000
    assert.equal(findHistoryProblem(null, markOf({ ownedTools: ['hand', 'catnip'], grantedTools: ['catnip'] }), now, now), 'grants')
    const previous = previousParkOf(economySections({ ownedTools: ['hand', 'treat'], grantedTools: ['treat'] }), now, now, now)
    assert.equal(findHistoryProblem(previous, markOf({ ownedTools: ['hand', 'treat'], grantedTools: ['treat'] }), now, now), null)
    assert.equal(findHistoryProblem(previous, markOf({ ownedTools: ['hand', 'treat', 'brush'], grantedTools: ['treat', 'brush'] }), now, now), 'grants')
  })

  it('lets a legacy park keep only the grants its old points earned', () => {
    const now = 10_000_000
    const legacy = { world: { progress: { points: 7, collars: 1 } }, cats: [{ collar: { color: 1 } }, { collar: null }] }
    const previous = previousParkOf(legacy, undefined, now - 1000, now)
    const fair = markOf({ wallet: 3, lifetimeEarned: 3, lifetimeSpent: 0, lifetimeRefunded: 0, ownedTools: ['hand', 'treat', 'brush'], grantedTools: ['treat', 'brush'], collarsBought: 2, grantedCollars: 2 })
    assert.equal(findHistoryProblem(previous, fair, now, now), null)
    const greedy = markOf({ wallet: 3, lifetimeEarned: 3, lifetimeSpent: 0, lifetimeRefunded: 0, ownedTools: ['hand', 'wand'], grantedTools: ['wand'] })
    assert.equal(findHistoryProblem(previous, greedy, now, now), 'grants')
  })

  it('never lets the spend sunk into consumables and refund losses shrink', () => {
    const now = 10_000_000
    const previous = previousParkOf(economySections({ wallet: 30, lifetimeSpent: 70, lifetimeRefunded: 0 }), now, now, now)
    assert.equal(findHistoryProblem(previous, markOf({ wallet: 30, lifetimeSpent: 70, lifetimeRefunded: 0 }), now, now), null)
    assert.equal(findHistoryProblem(previous, markOf({ wallet: 100, lifetimeSpent: 70, lifetimeRefunded: 70 }), now, now), 'sunk')
  })

  it('caps earnings on a first save and measures growth from the server clock', () => {
    const now = 10_000_000
    assert.equal(findHistoryProblem(null, markOf({ lifetimeEarned: 210, wallet: 150 }), now, now), null)
    assert.equal(findHistoryProblem(null, markOf({ lifetimeEarned: 5000, wallet: 4940 }), now, now), 'growth')
    assert.equal(findHistoryProblem(null, markOf({}), now + 600_000, now), 'future')
    const backdated = previousParkOf(economySections(), now - 1000, 1, now)
    assert.equal(findHistoryProblem(backdated, markOf({ lifetimeEarned: 163, wallet: 103 }), now, now), null)
    assert.equal(findHistoryProblem(backdated, markOf({ lifetimeEarned: 5000, wallet: 4940 }), now, now), 'growth')
    const longAgo = previousParkOf(economySections(), now - 86_400_000, now - 86_400_000, now)
    assert.equal(findHistoryProblem(longAgo, markOf({ lifetimeEarned: 5000, wallet: 4940 }), now, now), null)
    assert.equal(findHistoryProblem(longAgo, markOf({ lifetimeEarned: 90_000, wallet: 89_940 }), now, now), 'growth')
  })
})

describe('park economy over the API', () => {
  it('returns 422 for impossible wallets, runaway earnings and legacy-format writes', async () => {
    await withStore(async (openStore, store) => {
      const now = 5_000_000
      const put = async (body: string, at = now) => {
        const response = await handleParkRequest(new Request(url, { method: 'PUT', body }), openStore, at)
        return { status: response.status, problem: (JSON.parse(await response.text()) as { problem?: string }).problem }
      }
      assert.equal((await put(economyBody(1))).status, 200)
      const stored = await store.read(parkKeyOf(parseParkName('Ada Lovelace') ?? ''))
      assert.equal(JSON.parse(stored?.body ?? '{}').receivedAt, now)
      assert.deepEqual(await put(economyBody(2, { wallet: 999 })), { status: 422, problem: 'ledger' })
      assert.deepEqual(await put(economyBody(3, { lifetimeEarned: 5000, wallet: 40 })), { status: 422, problem: 'growth' })
      assert.deepEqual(await put(economyBody(4, {}, { world: { progress: { points: 900 } } })), { status: 422, problem: 'economy' })
      assert.deepEqual(await put(economyBody(5, { ownedTools: ['hand', 'catnip'] })), { status: 422, problem: 'committed' })
      assert.equal((await put(economyBody(6, { lifetimeEarned: 3000 }), now + 1_200_000)).status, 200)
      assert.deepEqual(await put(economyBody(now + 3_600_000)), { status: 422, problem: 'future' })
    })
  })
})
