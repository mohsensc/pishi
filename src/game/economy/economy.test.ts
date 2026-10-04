import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifyCatch, forgetBallHolder, trackBallHolders } from '../care/catchTracking'
import { tapBall } from '../dragging'
import { interactionContext } from '../engine'
import { erasePath, paintPath } from '../landscape/pathBuilding'
import { removeTree } from '../landscape/treeRemoval'
import { isPoppable } from '../pointer'
import { spawnLooseToy } from '../spawning'
import type { World } from '../types'
import { popBall } from '../upkeep'
import { createWorld } from '../world'
import { economyOf } from './economyState'
import { grantLegacyMigration } from './migration'
import { isSupplyBall, mintCatchTokens } from './minting'
import { priceOf } from './pricing'
import { purchase } from './purchase'
import { reconcileEconomy } from './reconcileEconomy'
import { discardProp, refundPreviewOf } from './refund'
import { nextGoalOf, tierStandingOf } from './shopGoals'

function freshWorld(): World {
  return createWorld({ width: 1440, height: 900, catCount: 8, ballCount: 5, seed: 11 })
}

function fundedWorld(points = 300): World {
  const world = freshWorld()
  grantLegacyMigration(world, points)
  return world
}

function assertLedger(world: World): void {
  const economy = economyOf(world)
  assert.ok(Number.isInteger(economy.wallet) && economy.wallet >= 0)
  assert.ok(economy.lifetimeRefunded <= economy.lifetimeSpent)
  assert.ok(economy.wallet <= economy.lifetimeEarned - economy.lifetimeSpent + economy.lifetimeRefunded)
}

function looseSupplyBall(world: World) {
  const ball = world.balls.find((candidate) => candidate.kind === 'tennis' && isSupplyBall(world, candidate.id))
  assert.ok(ball, 'expected a supply ball')
  world.cats.forEach((cat) => {
    if (cat.heldBallId === ball.id) cat.heldBallId = null
  })
  ball.status = 'loose'
  ball.holderId = null
  ball.height = 0
  assert.ok(isPoppable(ball))
  return ball
}

describe('fresh park economy', () => {
  it('starts empty: no tokens, only the hand, trees and the station', () => {
    const world = freshWorld()
    const economy = economyOf(world)
    assert.equal(economy.wallet, 0)
    assert.deepEqual(economy.ownedTools, ['hand'])
    assert.ok(world.props.some((prop) => prop.kind === 'feedingStation'))
    assert.ok(world.props.filter((prop) => prop.kind === 'tree').length > 10)
    assert.ok(world.props.every((prop) => prop.kind === 'tree' || prop.kind === 'feedingStation'))
  })
})

describe('minting', () => {
  it('mints once per supply ball and never on a second pop', () => {
    const world = freshWorld()
    const context = interactionContext(world)
    const ball = looseSupplyBall(world)
    popBall(context, ball)
    assert.equal(economyOf(world).wallet, 1)
    assert.equal(tapBall(world, ball.id), false)
    assert.equal(mintCatchTokens(context, 'stolen', ball.id).minted, 0)
    assert.equal(economyOf(world).wallet, 1)
    assert.equal(economyOf(world).lifetimeEarned, 1)
  })

  it('never mints for bought toys or balls outside the supply', () => {
    const world = freshWorld()
    const context = interactionContext(world)
    const toyId = spawnLooseToy(world, 'tennis', { x: 700, y: 600 })
    assert.ok(toyId)
    const toy = world.balls.find((candidate) => candidate.id === toyId)
    assert.ok(toy)
    toy.status = 'loose'
    popBall(context, toy)
    assert.equal(economyOf(world).wallet, 0)
    assert.equal(world.care.meter, 0)
  })

  it('pays a steal only after the cat held the ball long enough', () => {
    const world = freshWorld()
    const ball = looseSupplyBall(world)
    const cat = world.cats[0]
    ball.status = 'held'
    ball.holderId = cat.id
    trackBallHolders(world)
    world.time += 0.2
    trackBallHolders(world)
    ball.status = 'loose'
    ball.holderId = null
    assert.equal(classifyCatch(world, ball), 'loose')
    ball.status = 'held'
    ball.holderId = cat.id
    for (let step = 0; step < 15; step += 1) {
      world.time += 1 / 30
      trackBallHolders(world)
    }
    ball.status = 'loose'
    ball.holderId = null
    world.time += 0.5
    assert.equal(classifyCatch(world, ball), 'stolen')
    forgetBallHolder(world, ball.id)
    assert.equal(classifyCatch(world, ball), 'loose')
  })
})

describe('purchases and refunds', () => {
  it('denies without funds and charges nothing', () => {
    const world = freshWorld()
    const result = purchase(interactionContext(world), 'rock', { point: { x: 720, y: 560 } })
    assert.equal(result.ok, false)
    assert.equal(result.ok ? null : result.reason, 'insufficientFunds')
    assert.equal(economyOf(world).wallet, 0)
    assert.ok(world.props.every((prop) => prop.kind !== 'rock'))
    assert.equal(economyOf(world).lastDenied?.reason, 'insufficientFunds')
  })

  it('charges the listed price, escalates copies and throttles same-frame buys', () => {
    const world = fundedWorld()
    const context = interactionContext(world)
    assert.equal(economyOf(world).wallet, 150)
    const first = purchase(context, 'rock', { point: null })
    assert.ok(first.ok)
    assert.equal(economyOf(world).wallet, 145)
    const throttled = purchase(context, 'rock', { point: null })
    assert.equal(throttled.ok, false)
    world.time += 1
    assert.equal(priceOf(world, 'rock'), 6)
    assert.ok(purchase(interactionContext(world), 'rock', { point: null }).ok)
    assert.equal(economyOf(world).wallet, 139)
    assertLedger(world)
  })

  it('refunds in full during grace, half after, and only once', () => {
    const world = fundedWorld()
    const bought = purchase(interactionContext(world), 'cardboardBox', { point: null })
    assert.ok(bought.ok && bought.holdingId)
    const boxId = bought.holdingId
    assert.equal(refundPreviewOf(world, boxId), 8)
    world.time += 11
    assert.equal(refundPreviewOf(world, boxId), 4)
    const walletBefore = economyOf(world).wallet
    const refunded = discardProp(interactionContext(world), boxId)
    assert.ok(refunded.ok)
    assert.equal(economyOf(world).wallet - walletBefore, 4)
    assert.equal(discardProp(interactionContext(world), boxId).ok, false)
    assert.equal(economyOf(world).lifetimeEarned, 150)
    assertLedger(world)

    world.time += 1
    const again = purchase(interactionContext(world), 'cardboardBox', { point: null })
    assert.ok(again.ok && again.holdingId)
    const beforeGrace = economyOf(world).wallet
    assert.ok(discardProp(interactionContext(world), again.holdingId).ok)
    assert.equal(economyOf(world).wallet, beforeGrace + 8)
  })

  it('refuses to trash trees and the feeding station', () => {
    const world = fundedWorld()
    const tree = world.props.find((prop) => prop.kind === 'tree')
    const station = world.props.find((prop) => prop.kind === 'feedingStation')
    assert.ok(tree && station)
    assert.equal(discardProp(interactionContext(world), tree.id).ok, false)
    assert.equal(discardProp(interactionContext(world), station.id).ok, false)
    assert.equal(refundPreviewOf(world, tree.id), null)
    assert.equal(economyOf(world).wallet, 150)
  })

  it('locks tiers by lifetime earnings, not by wallet', () => {
    const world = fundedWorld()
    const bench = purchase(interactionContext(world), 'bench', { point: null })
    assert.equal(bench.ok ? null : bench.reason, 'tierLocked')
    assert.equal(tierStandingOf(150).tier, 1)
    assert.equal(tierStandingOf(250).tier, 2)
  })

  it('sells tools once and never refunds them', () => {
    const world = fundedWorld()
    economyOf(world).ownedTools = ['hand']
    assert.ok(purchase(interactionContext(world), 'toolTreat').ok)
    assert.ok(economyOf(world).ownedTools.includes('treat'))
    world.time += 1
    const again = purchase(interactionContext(world), 'toolTreat')
    assert.equal(again.ok ? null : again.reason, 'alreadyOwned')
    assert.equal(economyOf(world).wallet, 138)
  })

  it('points at the cheapest goal out of reach', () => {
    const world = freshWorld()
    assert.equal(nextGoalOf(world)?.itemId, 'rock')
  })

  it('never lets random buy and refund sequences profit', () => {
    const world = fundedWorld(1000)
    const items = ['rock', 'cushion', 'cardboardBox', 'flowerBed', 'pinwheel', 'careFish', 'toyMouse'] as const
    let seed = 7
    const roll = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let step = 0; step < 400; step += 1) {
      world.time += roll() * 6
      const context = interactionContext(world)
      if (roll() < 0.55) purchase(context, items[Math.floor(roll() * items.length)], { point: null })
      else {
        const holdings = Object.keys(economyOf(world).holdings)
        if (holdings.length > 0) discardProp(context, holdings[Math.floor(roll() * holdings.length)])
      }
      assertLedger(world)
      assert.ok(economyOf(world).wallet <= 150)
    }
  })
})

describe('landscape spending', () => {
  it('fells three trees per token', () => {
    const world = fundedWorld()
    const trees = world.props.filter((prop) => prop.kind === 'tree').slice(0, 4)
    trees.slice(0, 3).forEach((tree) => assert.ok(removeTree(interactionContext(world), tree.id).ok))
    assert.equal(economyOf(world).wallet, 149)
    assert.ok(removeTree(interactionContext(world), trees[3].id).ok)
    assert.equal(economyOf(world).wallet, 148)
    assert.equal(economyOf(world).treeCharges, 2)
  })

  it('lays four gravel tiles per token and recycles erased tiles', () => {
    const world = fundedWorld()
    const painted = paintPath(interactionContext(world), 'gravel', [0, 1, 2, 3, 4])
    assert.equal(painted.painted.length, 5)
    assert.equal(economyOf(world).wallet, 148)
    erasePath(interactionContext(world), [0, 1])
    assert.equal(economyOf(world).pathStock.gravel, 5)
    paintPath(interactionContext(world), 'gravel', [10, 11, 12, 13, 14])
    assert.equal(economyOf(world).wallet, 148)
  })
})

describe('reconcile', () => {
  it('clamps a tampered ledger and strips unpaid goods', () => {
    const world = fundedWorld()
    const bought = purchase(interactionContext(world), 'cushion', { point: null })
    assert.ok(bought.ok && bought.holdingId)
    const economy = economyOf(world)
    economy.wallet = 90_000
    economy.ownedTools = ['hand', 'laser', 'laser', 'rocket' as never]
    economy.treeCharges = 50
    economy.holdings = { ...economy.holdings, ghost: { itemId: 'bench', paid: 90, placedAt: 0 } }
    const rogue = { ...world.props.find((prop) => prop.id === bought.holdingId)!, id: 'prop-rogue' }
    world.props = [...world.props, rogue]
    world.cats[0].collar = { color: '#d2463a', fittedAt: 0 }
    reconcileEconomy(world)
    assertLedger(world)
    assert.equal(economy.wallet, 144)
    assert.deepEqual(economy.ownedTools, ['hand', 'laser'])
    assert.equal(economy.treeCharges, 0)
    assert.equal(economy.holdings.ghost, undefined)
    assert.ok(!world.props.some((prop) => prop.id === 'prop-rogue'))
    assert.equal(world.cats[0].collar, null)
  })

  it('drops goods whose holdings claim more than was ever spent', () => {
    const world = fundedWorld()
    const bought = purchase(interactionContext(world), 'cushion', { point: null })
    assert.ok(bought.ok && bought.holdingId)
    economyOf(world).holdings[bought.holdingId].paid = 5000
    reconcileEconomy(world)
    assert.equal(economyOf(world).holdings[bought.holdingId], undefined)
    assert.ok(!world.props.some((prop) => prop.id === bought.holdingId))
  })

  it('drops goods bought below the shop price', () => {
    const world = fundedWorld()
    const context = interactionContext(world)
    const first = purchase(context, 'cushion', { point: null })
    world.time += 1
    const second = purchase(context, 'cushion', { point: null })
    assert.ok(first.ok && first.holdingId && second.ok && second.holdingId)
    economyOf(world).holdings[second.holdingId].paid = 1
    reconcileEconomy(world)
    assert.equal(economyOf(world).holdings[first.holdingId], undefined)
    assert.equal(economyOf(world).holdings[second.holdingId], undefined)
  })

  it('strips tools, collars, charges and tiles nobody paid for', () => {
    const world = fundedWorld(0)
    const economy = economyOf(world)
    economy.ownedTools = ['hand', 'treat', 'brush', 'wand', 'laser', 'catnip']
    economy.collarsBought = 3
    economy.treeChargesBought = 3000
    economy.treeCharges = 3000
    economy.pathBought = { gravel: 400, stone: 0 }
    economy.pathStock = { gravel: 400, stone: 0 }
    reconcileEconomy(world)
    assert.deepEqual(economy.ownedTools, ['hand'])
    assert.equal(economy.collarsBought, 0)
    assert.equal(economy.treeCharges, 0)
    assert.equal(economy.pathStock.gravel, 0)
  })

  it('keeps migration grants free while still charging for later buys', () => {
    const world = fundedWorld(300)
    const economy = economyOf(world)
    assert.deepEqual(economy.grantedTools, ['treat', 'brush', 'wand', 'laser', 'catnip'])
    reconcileEconomy(world)
    assert.deepEqual(economy.ownedTools, ['hand', 'treat', 'brush', 'wand', 'laser', 'catnip'])
  })
})
