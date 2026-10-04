import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { findEconomyProblem, findHistoryProblem, previousParkOf, readEconomyMark } from '../../../shared/parkEconomyCheck.ts'
import { economyOf } from '../economy/economyState'
import { creditTokens } from '../economy/ledger'
import { grantLegacyMigration } from '../economy/migration'
import { purchase } from '../economy/purchase'
import { discardProp, refundPreviewOf } from '../economy/refund'
import type { ShopItemId } from '../economy/economyTypes'
import { erasePath, paintPath } from '../landscape/pathBuilding'
import { removeTree } from '../landscape/treeRemoval'
import { interactionContext } from '../engine'
import { createWorld } from '../world'
import { captureParkSave, serializeParkSave } from './captureParkSave'
import type { ParkIdentity } from './parkSaveTypes'
import { parseParkSaveText } from './parseParkSave'
import { createParkWorld } from './restoreParkWorld'

const identity: ParkIdentity = { owner: { first: 'Ada', last: 'Lovelace' }, seed: 11 }
const viewport = { width: 1440, height: 900 }

function playedWorld() {
  const world = createWorld({ ...viewport, catCount: 8, ballCount: 5, seed: identity.seed })
  grantLegacyMigration(world, 300)
  const bench = purchase(interactionContext(world), 'cushion', { point: null })
  assert.ok(bench.ok)
  return { world, cushionId: bench.holdingId as string }
}

function roundTrip(text: string) {
  const save = parseParkSaveText(text)
  assert.ok(save)
  return createParkWorld(viewport, identity, save)
}

describe('economy saves', () => {
  it('round-trips wallet, ledger and holdings without carrying the refund grace', () => {
    const { world, cushionId } = playedWorld()
    const text = serializeParkSave(captureParkSave(world, identity))
    assert.equal(findEconomyProblem(JSON.parse(text).sections), null)
    const restored = roundTrip(text)
    const economy = economyOf(restored)
    assert.equal(economy.wallet, 144)
    assert.equal(economy.lifetimeEarned, 150)
    assert.equal(economy.lifetimeSpent, 6)
    assert.equal(economy.holdings[cushionId]?.paid, 6)
    assert.ok(restored.props.some((prop) => prop.id === cushionId))
    assert.equal(refundPreviewOf(restored, cushionId), 3)
  })

  it('clamps a tampered wallet on load and the server check flags it', () => {
    const { world } = playedWorld()
    const save = captureParkSave(world, identity)
    const economy = save.sections.economy as Record<string, unknown>
    economy.wallet = 5000
    assert.equal(findEconomyProblem(save.sections), 'ledger')
    const restored = roundTrip(serializeParkSave(save))
    assert.equal(economyOf(restored).wallet, 144)
  })

  it('drops props that were never paid for', () => {
    const { world } = playedWorld()
    const save = captureParkSave(world, identity)
    const props = save.sections.props as Record<string, unknown>[]
    props.push({ ...props.find((prop) => prop.kind === 'cushion'), id: 'prop-free-fountain', kind: 'fountain' })
    const restored = roundTrip(serializeParkSave(save))
    assert.ok(!restored.props.some((prop) => prop.id === 'prop-free-fountain'))
  })

  it('migrates a legacy save to a fresh park with a small grant', () => {
    const legacy = {
      version: 1,
      updatedAt: 1000,
      owner: identity.owner,
      seed: identity.seed,
      viewport,
      sections: { world: { poppedCount: 900, dayTime: 0.4, progress: { points: 900, collarPoints: 3, collars: 1 } }, props: [{ id: 'prop-bench', kind: 'bench', position: { x: 500, y: 600 } }] },
    }
    const restored = roundTrip(JSON.stringify(legacy))
    const economy = economyOf(restored)
    assert.equal(economy.wallet, 150)
    assert.equal(economy.lifetimeEarned, 150)
    assert.deepEqual(economy.ownedTools, ['hand', 'treat', 'brush', 'wand', 'laser', 'catnip'])
    assert.equal(restored.progress.collars, 1)
    assert.ok(!restored.props.some((prop) => prop.kind === 'bench'))
  })

  it('treats an economy-less save from this version as a fresh park, not a migration', () => {
    const forged = { version: 3, updatedAt: 1000, owner: identity.owner, seed: identity.seed, viewport, sections: { world: { poppedCount: 900, progress: { points: 900, collars: 1 } } } }
    const economy = economyOf(roundTrip(JSON.stringify(forged)))
    assert.equal(economy.wallet, 0)
    assert.deepEqual(economy.ownedTools, ['hand'])
    assert.equal(economy.collarsBought, 0)
  })

  it('saves every legal play sequence in a shape the server accepts, with sunk spend that never shrinks', () => {
    const world = createWorld({ ...viewport, catCount: 8, ballCount: 5, seed: identity.seed })
    creditTokens(world, 4000, 'catch', null, null)
    const items: ShopItemId[] = ['rock', 'cushion', 'pinwheel', 'bench', 'sapling', 'fountain', 'toolTreat', 'toolWand', 'collar', 'careFish', 'toyMouse', 'treeCharges', 'pathGravel']
    let seed = 19
    const roll = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const now = 50_000_000
    let previousSections = captureParkSave(world, identity, now).sections
    for (let step = 0; step < 300; step += 1) {
      world.time += roll() * 8
      const context = interactionContext(world)
      const action = roll()
      if (action < 0.4) purchase(context, items[Math.floor(roll() * items.length)], { point: null })
      else if (action < 0.6) {
        const holdings = Object.keys(economyOf(world).holdings)
        if (holdings.length > 0) discardProp(context, holdings[Math.floor(roll() * holdings.length)])
      } else if (action < 0.75) {
        const trees = world.props.filter((prop) => prop.kind === 'tree')
        if (trees.length > 0) removeTree(context, trees[Math.floor(roll() * trees.length)].id)
      } else if (action < 0.9) paintPath(context, roll() < 0.5 ? 'gravel' : 'stone', [Math.floor(roll() * 500), Math.floor(roll() * 500)])
      else erasePath(context, [Math.floor(roll() * 500), Math.floor(roll() * 500)])
      const sections = captureParkSave(world, identity, now).sections
      assert.equal(findEconomyProblem(sections), null)
      const mark = readEconomyMark(sections)
      assert.ok(mark.ok)
      assert.equal(findHistoryProblem(previousParkOf(previousSections, now, now, now), mark.value, now, now), null)
      previousSections = sections
    }
    assert.ok(economyOf(world).lifetimeSpent > 1000)
  })
})
