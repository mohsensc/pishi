import type { CatchKind } from '../care/careTypes'
import type { StepContext } from '../memory'
import type { World } from '../types'
import { catchTokens } from './economyConstants'
import { economyOf } from './economyState'
import type { MintResult } from './economyTypes'
import { creditTokens } from './ledger'

const supplyBalls = new WeakMap<World, Set<string>>()

function supplyOf(world: World): Set<string> {
  let balls = supplyBalls.get(world)
  if (!balls) {
    balls = new Set()
    supplyBalls.set(world, balls)
  }
  return balls
}

export function registerSupplyBall(world: World, ballId: string): void {
  supplyOf(world).add(ballId)
}

export function isSupplyBall(world: World, ballId: string): boolean {
  return supplyOf(world).has(ballId)
}

export function forgetSupplyBall(world: World, ballId: string): void {
  supplyOf(world).delete(ballId)
}

export function mintCatchTokens(context: StepContext, catchKind: CatchKind, ballId: string): MintResult {
  const { world } = context
  const ball = world.balls.find((candidate) => candidate.id === ballId)
  const supply = supplyOf(world)
  if (!ball || ball.kind !== 'tennis' || !supply.has(ballId)) return { minted: 0, wallet: economyOf(world).wallet, ballId }
  supply.delete(ballId)
  const minted = creditTokens(world, catchTokens[catchKind], catchKind === 'stolen' ? 'steal' : 'catch', null, ball.position)
  return { minted, wallet: economyOf(world).wallet, ballId }
}

export function pruneSupplyBalls(world: World): void {
  const supply = supplyOf(world)
  if (supply.size <= world.balls.length) return
  const live = new Set(world.balls.map((ball) => ball.id))
  supply.forEach((ballId) => {
    if (!live.has(ballId)) supply.delete(ballId)
  })
}
