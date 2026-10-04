import { spawnEffect } from './effects'
import { scatterButterflies, spawnButterflies } from './butterflies'
import { hopInPlace } from './ai/helpers/leap'
import { faceToward, setEmote } from './ai/helpers/pose'
import { summonToProp } from './ai/helpers/propVisit'
import { popOut } from './ai/helpers/hiding'
import { mindOf, settleOnGround } from './ai/helpers/queries'
import { archAway, startleHop } from './ai/helpers/reactions'
import { beginBehavior, endBehavior } from './ai/helpers/transitions'
import { launchYarn } from './ai/props/yarnPlay'
import { hidingHeightOf } from './layout'
import type { StepContext } from './memory'
import { isInPond, pondReach } from './physics'
import { depthScale } from './projection'
import { add, closestOnSegment, distance, lerpVec, normalize, scale, subtract } from './vector'
import type { CatState, PropKind, PropState, Vec } from './types'

type PokeReaction = (prop: PropState, point: Vec, context: StepContext) => void

const bowlBehaviorId = 'eatFromBowl'

function scaled(context: StepContext, value: number): number {
  return value * context.memory.sizeScale
}

function drawScale(prop: PropState, context: StepContext): number {
  return depthScale(prop.position.y, context.world.height)
}

function isAvailable(cat: CatState, context: StepContext): boolean {
  const mind = mindOf(cat, context)
  const behavior = context.library.byId.get(cat.behavior)
  return !cat.hidden && !mind.leap && cat.height < 1 && !cat.heldBallId && Boolean(behavior?.interruptible) && cat.intent !== 'celebrate'
}

function nearbyAvailable(point: Vec, context: StepContext, radius: number): CatState[] {
  return context.world.cats
    .filter((cat) => isAvailable(cat, context) && distance(cat.position, point) < radius)
    .sort((first, second) => distance(first.position, point) - distance(second.position, point))
}

function groundUsers(prop: PropState, context: StepContext): CatState[] {
  return context.world.cats.filter((cat) => {
    const mind = mindOf(cat, context)
    return !cat.hidden && !mind.leap && cat.height <= 3 && cat.propId !== prop.id && mind.propTargetId === prop.id && cat.intent !== 'celebrate'
  })
}

function startleUsers(prop: PropState, context: StepContext, drift = 26): void {
  groundUsers(prop, context).forEach((cat) => {
    const mind = mindOf(cat, context)
    endBehavior(cat, mind, context)
    startleHop(cat, mind, context, prop.position, drift)
  })
}

function lookOver(prop: PropState, context: StepContext, radius: number, emoteChance: number): CatState[] {
  const lookers = nearbyAvailable(prop.position, context, radius)
  lookers.forEach((cat) => {
    faceToward(cat, mindOf(cat, context), prop.position, 1.4)
    if (context.memory.random.chance(emoteChance)) setEmote(cat, 'curious')
  })
  return lookers
}

function summonHungry(prop: PropState, context: StepContext, behaviorId: string, count: number): void {
  const candidates = nearbyAvailable(prop.position, context, scaled(context, 620))
    .sort((first, second) => first.fullness - second.fullness)
    .slice(0, count)
  candidates.forEach((cat) => {
    summonToProp(cat, mindOf(cat, context), context, behaviorId, prop)
    setEmote(cat, 'love')
  })
}

const shakeTree: PokeReaction = (prop, _point, context) => {
  const canopy = hidingHeightOf(prop, context.world.height)
  const spread = prop.radius * 1.5 * drawScale(prop, context)
  spawnEffect(context.world, 'leaves', prop.position, canopy, prop.id, 1)
  spawnEffect(context.world, 'leaves', { x: prop.position.x - spread, y: prop.position.y + 2 }, canopy * 0.85, prop.id, 0.7)
  spawnEffect(context.world, 'leaves', { x: prop.position.x + spread, y: prop.position.y + 2 }, canopy * 0.85, prop.id, 0.7)
  scatterButterflies(context.world, prop.position, scaled(context, 240))
  startleUsers(prop, context, 34)
}

const wobbleCatTree: PokeReaction = (prop, _point, context) => {
  spawnEffect(context.world, 'bounce', prop.position, prop.perchHeight * drawScale(prop, context), prop.id, 0.8)
  groundUsers(prop, context).forEach((cat) => {
    const mind = mindOf(cat, context)
    setEmote(cat, 'playful')
    hopInPlace(cat, mind, context, 26 * mind.personality.jumpPower, 0.36, 'bat', 'none')
  })
}

const bounceProp: PokeReaction = (prop, _point, context) => {
  spawnEffect(context.world, 'bounce', prop.position, prop.perchHeight * drawScale(prop, context), prop.id, 0.8)
  startleUsers(prop, context)
}

const crinkleTunnel: PokeReaction = (prop, point, context) => {
  const spot = prop.tunnelExit ? closestOnSegment(point, prop.position, prop.tunnelExit) : prop.position
  spawnEffect(context.world, 'bounce', spot, prop.radius, prop.id, 0.7)
  startleUsers(prop, context)
}

const rustleBush: PokeReaction = (prop, _point, context) => {
  spawnEffect(context.world, 'leaves', prop.position, prop.radius * 0.9, prop.id, 0.9)
  scatterButterflies(context.world, prop.position, scaled(context, 140))
  startleUsers(prop, context)
}

function splashPoint(pond: PropState, point: Vec): Vec {
  return pondReach(pond, point) < 0.85 ? point : lerpVec(pond.position, point, 0.55 / Math.max(0.85, pondReach(pond, point)))
}

const splashPond: PokeReaction = (prop, point, context) => {
  const splash = splashPoint(prop, point)
  spawnEffect(context.world, 'splash', splash, 0, prop.id, 1)
  context.world.balls.forEach((ball) => {
    if (ball.status !== 'loose' || !isInPond([prop], ball.position, 1.05)) return
    const away = normalize(subtract(ball.position, splash))
    ball.velocity = add(ball.velocity, scale(away.x === 0 && away.y === 0 ? { x: 1, y: 0 } : away, scaled(context, 110)))
  })
  context.world.cats.forEach((cat) => {
    const mind = mindOf(cat, context)
    if (cat.hidden || mind.leap || cat.height > 3 || distance(cat.position, splash) > prop.radius * 1.9) return
    if (mind.propTargetId === prop.id || context.library.byId.get(cat.behavior)?.interruptible) endBehavior(cat, mind, context)
    archAway(cat, mind, splash, 0.7, 150)
    setEmote(cat, 'startled')
  })
}

const toggleLamp: PokeReaction = (prop, _point, context) => {
  prop.lit = !prop.lit
  spawnEffect(context.world, 'sparkle', prop.position, scaled(context, 150) * drawScale(prop, context), prop.id, prop.lit ? 1 : 0.4)
  const lookers = lookOver(prop, context, scaled(context, 340), 0.7)
  const curious = lookers.find((cat) => context.memory.random.chance(mindOf(cat, context).personality.curiosity * 0.7))
  if (prop.lit && curious) summonToProp(curious, mindOf(curious, context), context, 'lampLounge', prop, false)
}

const rollYarn: PokeReaction = (prop, _point, context) => {
  const random = context.memory.random
  const angle = random.range(0.15, Math.PI - 0.15)
  const direction = { x: Math.cos(angle), y: Math.sin(angle) * 0.7 }
  const start = add(prop.position, scale(direction, prop.radius + 8))
  const landing = settleOnGround(add(prop.position, scale(direction, scaled(context, random.range(70, 120)))), context, 8)
  spawnEffect(context.world, 'yarn', landing, 4, prop.id, 1)
  nearbyAvailable(prop.position, context, scaled(context, 460))
    .slice(0, random.integer(1, 2))
    .forEach((cat) => {
      const mind = mindOf(cat, context)
      beginBehavior(cat, mind, context, 'yarnPounce')
      launchYarn(mind, context, start, direction, random.range(160, 220))
      setEmote(cat, 'playful')
    })
}

const rattleBowl: PokeReaction = (prop, _point, context) => {
  spawnEffect(context.world, 'kibble', prop.position, 6, prop.id, 1)
  summonHungry(prop, context, bowlBehaviorId, context.memory.random.integer(1, 3))
}

const noticeStation: PokeReaction = (prop, _point, context) => {
  lookOver(prop, context, scaled(context, 300), 0.4)
}

const wobblePost: PokeReaction = (prop, _point, context) => {
  spawnEffect(context.world, 'bounce', prop.position, scaled(context, 40), prop.id, 0.6)
  const scratcher = nearbyAvailable(prop.position, context, scaled(context, 420)).find((cat) => mindOf(cat, context).propTargetId !== prop.id)
  if (scratcher) summonToProp(scratcher, mindOf(scratcher, context), context, 'postScratch', prop, false)
}

const puffFlowers: PokeReaction = (prop, _point, context) => {
  spawnEffect(context.world, 'petals', prop.position, 8, prop.id, 1)
  scatterButterflies(context.world, prop.position, scaled(context, 200))
  spawnButterflies(context.world, prop.position, context.memory.random.integer(1, 2), context.memory.random)
  lookOver(prop, context, scaled(context, 220), 0.5)
}

const bounceRock: PokeReaction = (prop, _point, context) => {
  spawnEffect(context.world, 'dust', prop.position, 2, prop.id, 0.8)
  spawnEffect(context.world, 'bounce', prop.position, prop.radius, prop.id, 0.5)
  const climber = nearbyAvailable(prop.position, context, scaled(context, 320))[0]
  if (climber && context.memory.random.chance(0.6)) summonToProp(climber, mindOf(climber, context), context, 'rockSurvey', prop, false)
}

const rippleBlanket: PokeReaction = (prop, point, context) => {
  spawnEffect(context.world, 'dust', point, 0, prop.id, 0.35)
  startleUsers(prop, context, 14)
  const roller = nearbyAvailable(prop.position, context, scaled(context, 360))[0]
  if (roller && context.memory.random.chance(0.65)) summonToProp(roller, mindOf(roller, context), context, 'blanketRoll', prop, false)
}

const fluffCushion: PokeReaction = (prop, point, context) => {
  spawnEffect(context.world, 'dust', point, 2, prop.id, 0.3)
  spawnEffect(context.world, 'bounce', prop.position, 6, prop.id, 0.45)
  startleUsers(prop, context, 12)
}

export const pokeReactions: Record<PropKind, PokeReaction> = {
  tree: shakeTree,
  catTree: wobbleCatTree,
  cardboardBox: bounceProp,
  bench: bounceProp,
  tunnel: crinkleTunnel,
  bush: rustleBush,
  pond: splashPond,
  lamppost: toggleLamp,
  yarnBasket: rollYarn,
  foodBowl: rattleBowl,
  feedingStation: noticeStation,
  scratchingPost: wobblePost,
  flowerBed: puffFlowers,
  rock: bounceRock,
  picnicBlanket: rippleBlanket,
  cushion: fluffCushion,
}

export function evictOccupants(prop: PropState, context: StepContext): number {
  const occupants = context.world.cats.filter((cat) => cat.propId === prop.id || mindOf(cat, context).perch?.propId === prop.id)
  occupants.forEach((cat) => popOut(cat, prop, context))
  return occupants.length
}
