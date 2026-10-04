import { CAT_POKE_COOLDOWN } from './constants'
import { spawnEffect } from './effects'
import { dropHeldBall, ejectStashesIn } from './ai/helpers/ball'
import { popOut } from './ai/helpers/hiding'
import { hopInPlace, startLeap } from './ai/helpers/leap'
import { dismount } from './ai/helpers/perch'
import { faceToward, lockPose, setEmote } from './ai/helpers/pose'
import { catsWithin, findProp, mindOf } from './ai/helpers/queries'
import { archAway, startleHop } from './ai/helpers/reactions'
import { beginBehavior, beginFlee } from './ai/helpers/transitions'
import type { CatMind, StepContext } from './memory'
import { evictOccupants, pokeReactions } from './pokeReactions'
import { add, clamp, distance, normalize, scale, subtract } from './vector'
import type { CatState, Vec, World } from './types'
import { interactionContext } from './engine'
import { pokeSleeper } from './needs/sleepControl'

type CatReaction = 'headbutt' | 'hiss' | 'roll' | 'hop'

export function pokeProp(world: World, propId: string, point: Vec): void {
  const context = interactionContext(world)
  const prop = findProp(context, propId)
  if (!prop) return
  prop.agitation = 1
  prop.pokedAt = world.time
  evictOccupants(prop, context)
  ejectStashesIn(prop, context)
  pokeReactions[prop.kind](prop, point, context)
}

function reactionFor(cat: CatState, mind: CatMind, context: StepContext): CatReaction {
  const personality = mind.personality
  const random = context.memory.random
  if (cat.affection > 0.62 && random.chance(0.4 + cat.affection * 0.4)) return 'headbutt'
  if (cat.coat.breed === 'persian' || random.chance(personality.spookResistance * 0.5)) return 'hiss'
  if (random.chance(personality.zoominess * personality.boldness * 1.4)) return 'roll'
  return 'hop'
}

function adjustAffection(cat: CatState, amount: number): void {
  cat.affection = clamp(cat.affection + amount, 0, 1)
}

function reactToPoke(cat: CatState, mind: CatMind, context: StepContext, point: Vec): void {
  const reaction = reactionFor(cat, mind, context)
  if (reaction === 'headbutt') {
    const toward = normalize(subtract(point, cat.position))
    startLeap(cat, mind, context, add(cat.position, scale(toward, 12)), 0, 8, 0.26, 'hop', 'none')
    lockPose(mind, 'purr', 1)
    setEmote(cat, 'love')
    adjustAffection(cat, 0.03)
    beginBehavior(cat, mind, context, 'sitIdle', { duration: 1.8 })
    return
  }
  if (reaction === 'hiss') {
    archAway(cat, mind, point, 0.7, 70)
    setEmote(cat, 'annoyed')
    adjustAffection(cat, -0.02)
    beginBehavior(cat, mind, context, 'sitIdle', { duration: 1.6 })
    return
  }
  if (reaction === 'roll') {
    faceToward(cat, mind, point, 1)
    beginBehavior(cat, mind, context, 'sitIdle', { duration: 1.6 })
    lockPose(mind, 'bellyUp', 1.1)
    setEmote(cat, 'playful')
    return
  }
  startleHop(cat, mind, context, point)
  adjustAffection(cat, -0.01)
  if (context.memory.random.chance(1 - mind.personality.boldness)) beginFlee(cat, mind, context, 1.2)
}

export function pokeCat(world: World, catId: string, point: Vec): void {
  const context = interactionContext(world)
  const cat = world.cats.find((candidate) => candidate.id === catId)
  if (!cat) return
  const mind = mindOf(cat, context)
  if (mind.pokeCooldown > 0) return
  mind.pokeCooldown = CAT_POKE_COOLDOWN
  if (cat.hidden) {
    const prop = findProp(context, cat.propId)
    if (prop) popOut(cat, prop, context)
    return
  }
  if (pokeSleeper(cat, context, point)) return
  dropHeldBall(cat, mind, context, point)
  spawnEffect(world, 'furTuft', cat.position, cat.height + 18 * cat.coat.scale, null, 0.6)
  if (mind.leap) return
  if (cat.height > 1 || cat.propId) {
    const prop = findProp(context, cat.propId ?? mind.perch?.propId ?? null)
    if (prop) popOut(cat, prop, context)
    else dismount(cat, mind, context, 'ground')
    setEmote(cat, 'startled')
    return
  }
  reactToPoke(cat, mind, context, point)
}

export function pokeGround(world: World, point: Vec): void {
  const context = interactionContext(world)
  spawnEffect(world, 'dust', point, 0, null, 0.6)
  const radius = 220 * context.memory.sizeScale
  catsWithin(point, context, radius).forEach((cat) => {
    const mind = mindOf(cat, context)
    const behavior = context.library.byId.get(cat.behavior)
    if (mind.leap || cat.height > 1 || !behavior?.interruptible) return
    if (distance(cat.position, point) < 40 * context.memory.sizeScale) {
      hopInPlace(cat, mind, context, 20, 0.3, 'startle', 'startle')
      setEmote(cat, 'startled')
      return
    }
    if (!cat.heldBallId && context.memory.random.chance(mind.personality.curiosity * 0.7)) {
      beginBehavior(cat, mind, context, 'investigateSpot')
      mind.scratchPoints.spot = { x: point.x, y: point.y }
      return
    }
    faceToward(cat, mind, point, 1.2)
    setEmote(cat, 'curious')
  })
}
