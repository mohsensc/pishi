import { scatterButterflies } from '../butterflies'
import { spawnEffect } from '../effects'
import { faceToward, setEmote } from '../ai/helpers/pose'
import { summonToProp } from '../ai/helpers/propVisit'
import { mindOf } from '../ai/helpers/queries'
import { archAway } from '../ai/helpers/reactions'
import { endBehavior } from '../ai/helpers/transitions'
import type { StepContext } from '../memory'
import { depthScale } from '../projection'
import type { CatState, PropState, Vec } from '../types'
import { distance } from '../vector'
import { BIRD_RETURN_SECONDS, scatterBirds } from './birdVisits'
import { openButterflyHouse } from './butterflyHouse'
import { shopItemMemoryOf } from './shopItemMemory'
import type { ShopPropKind } from './shopPropKinds'
import { SPRINKLER_REACH } from './sprinklerSpray'

export type ShopItemPoke = (prop: PropState, point: Vec, context: StepContext) => void

function lifted(prop: PropState, context: StepContext, height: number): number {
  return height * context.memory.sizeScale * depthScale(prop.position.y, context.world.height)
}

function idleCatsNear(prop: PropState, context: StepContext, reach: number): CatState[] {
  return context.world.cats
    .filter((cat) => {
      const mind = mindOf(cat, context)
      return !cat.hidden && !mind.leap && cat.height < 1 && !cat.heldBallId && Boolean(context.library.byId.get(cat.behavior)?.interruptible) && distance(cat.position, prop.position) < reach * context.memory.sizeScale
    })
    .sort((first, second) => distance(first.position, prop.position) - distance(second.position, prop.position))
}

function lookOver(prop: PropState, context: StepContext, reach: number): CatState[] {
  const lookers = idleCatsNear(prop, context, reach)
  lookers.forEach((cat) => {
    faceToward(cat, mindOf(cat, context), prop.position, 1.2)
    if (context.memory.random.chance(0.4)) setEmote(cat, 'curious')
  })
  return lookers
}

function invite(prop: PropState, context: StepContext, behaviorId: string, reach: number, chance: number, count = 1): void {
  idleCatsNear(prop, context, reach)
    .slice(0, count)
    .forEach((cat) => {
      if (!context.memory.random.chance(chance)) return
      summonToProp(cat, mindOf(cat, context), context, behaviorId, prop, false)
      setEmote(cat, 'playful')
    })
}

const splashFountain: ShopItemPoke = (prop, point, context) => {
  spawnEffect(context.world, 'splash', { x: (prop.position.x + point.x) / 2, y: prop.position.y }, lifted(prop, context, 16), prop.id, 0.9)
  spawnEffect(context.world, 'sparkle', prop.position, lifted(prop, context, 70), prop.id, 0.6)
  lookOver(prop, context, 320)
  invite(prop, context, 'drinkAtFountain', 420, 0.6)
}

const splashBirdbath: ShopItemPoke = (prop, _point, context) => {
  spawnEffect(context.world, 'splash', prop.position, lifted(prop, context, 40), prop.id, 0.6)
  if (!scatterBirds(context, prop)) shopItemMemoryOf(context.world).birdsBack.set(prop.id, context.world.time + BIRD_RETURN_SECONDS)
  lookOver(prop, context, 260)
}

const spinPinwheel: ShopItemPoke = (prop, _point, context) => {
  prop.agitation = 1
  spawnEffect(context.world, 'sparkle', prop.position, lifted(prop, context, 58), prop.id, 0.4)
  invite(prop, context, 'batPinwheel', 360, 0.55)
}

const boingSpringToy: ShopItemPoke = (prop, _point, context) => {
  spawnEffect(context.world, 'bounce', prop.position, lifted(prop, context, 36), prop.id, 0.6)
  invite(prop, context, 'batSpringToy', 420, 0.75)
}

const shakeFeeder: ShopItemPoke = (prop, _point, context) => {
  spawnEffect(context.world, 'crumbs', prop.position, lifted(prop, context, 70), prop.id, 0.8)
  if (!scatterBirds(context, prop)) shopItemMemoryOf(context.world).birdsBack.set(prop.id, context.world.time + BIRD_RETURN_SECONDS)
  lookOver(prop, context, 320)
}

const pushSwing: ShopItemPoke = (prop, _point, context) => {
  spawnEffect(context.world, 'bounce', prop.position, lifted(prop, context, 30), prop.id, 0.7)
  invite(prop, context, 'swingRide', 380, 0.4)
}

const knockButterflyHouse: ShopItemPoke = (prop, _point, context) => {
  openButterflyHouse(context, prop)
  spawnEffect(context.world, 'sparkle', prop.position, lifted(prop, context, 64), prop.id, 0.5)
  lookOver(prop, context, 260)
}

const burstSprinkler: ShopItemPoke = (prop, _point, context) => {
  spawnEffect(context.world, 'splash', prop.position, lifted(prop, context, 18), prop.id, 1.2)
  const reach = SPRINKLER_REACH * 1.3 * context.memory.sizeScale
  context.world.cats.forEach((cat) => {
    const mind = mindOf(cat, context)
    if (cat.hidden || mind.leap || cat.height > 3 || distance(cat.position, prop.position) > reach) return
    if (context.library.byId.get(cat.behavior)?.interruptible) endBehavior(cat, mind, context)
    archAway(cat, mind, prop.position, 0.6, 170)
    setEmote(cat, 'startled')
  })
}

const gustWindmill: ShopItemPoke = (prop, _point, context) => {
  prop.agitation = 1
  spawnEffect(context.world, 'leaves', prop.position, lifted(prop, context, 150), prop.id, 0.7)
  scatterButterflies(context.world, prop.position, 220 * context.memory.sizeScale)
  lookOver(prop, context, 340)
}

const puffBubbles: ShopItemPoke = (prop, _point, context) => {
  spawnEffect(context.world, 'bubbles', prop.position, lifted(prop, context, 34), prop.id, 1.4)
  invite(prop, context, 'chaseBubbles', 460, 0.8, 2)
}

export const shopItemPokeReactions: Record<ShopPropKind, ShopItemPoke> = {
  fountain: splashFountain,
  birdbath: splashBirdbath,
  pinwheel: spinPinwheel,
  springToy: boingSpringToy,
  birdFeeder: shakeFeeder,
  swing: pushSwing,
  butterflyHouse: knockButterflyHouse,
  sprinkler: burstSprinkler,
  windmill: gustWindmill,
  bubbleMachine: puffBubbles,
}
