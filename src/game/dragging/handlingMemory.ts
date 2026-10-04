import type { Vec, World } from '../types'

export interface PropMotion {
  velocity: Vec
  settleTarget: Vec | null
  liftSpeed: number
  tiltSpeed: number
  carried: boolean
  landed: boolean
}

interface HandlingMemory {
  propMotions: Map<string, PropMotion>
  ballCatching: boolean
  guardedBallId: string | null
  offeredBalls: Map<string, number>
}

const handlingMemories = new WeakMap<World, HandlingMemory>()

export function handlingOf(world: World): HandlingMemory {
  let memory = handlingMemories.get(world)
  if (!memory) {
    memory = { propMotions: new Map(), ballCatching: false, guardedBallId: null, offeredBalls: new Map() }
    handlingMemories.set(world, memory)
  }
  return memory
}

export function propMotionOf(world: World, propId: string): PropMotion {
  const motions = handlingOf(world).propMotions
  let motion = motions.get(propId)
  if (!motion) {
    motion = { velocity: { x: 0, y: 0 }, settleTarget: null, liftSpeed: 0, tiltSpeed: 0, carried: false, landed: true }
    motions.set(propId, motion)
  }
  return motion
}

export function setBallCatching(world: World, enabled: boolean): void {
  handlingOf(world).ballCatching = enabled
}

export function guardBall(world: World, ballId: string | null): void {
  handlingOf(world).guardedBallId = ballId
}

export function offerBall(world: World, ballId: string, seconds: number): void {
  handlingOf(world).offeredBalls.set(ballId, world.time + seconds)
}

export function isBallOffered(world: World, ballId: string): boolean {
  const until = handlingOf(world).offeredBalls.get(ballId)
  return until !== undefined && world.time < until
}

export function forgetOffer(world: World, ballId: string): void {
  handlingOf(world).offeredBalls.delete(ballId)
}
