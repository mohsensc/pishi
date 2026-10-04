import type { CatMind, StepContext } from '../../memory'
import { add, normalize, scale, subtract } from '../../vector'
import type { CatState, Vec } from '../../types'
import { releaseBall } from './ball'
import { startLeap } from './leap'
import { dismount } from './perch'
import { lockPose, setEmote } from './pose'
import { catCenter, mindOf, randomTimer } from './queries'
import { cursorDistance } from './threat'
import { beginCarry, beginChase, beginFlee } from './transitions'

export function startleHop(cat: CatState, mind: CatMind, context: StepContext, source: Vec, drift = 18): void {
  const away = normalize(subtract(cat.position, source))
  startLeap(cat, mind, context, add(cat.position, scale(away, drift)), cat.height, 34 + 16 * mind.personality.jumpPower, 0.42, 'startle', 'startle')
  setEmote(cat, 'startled')
}

export function archAway(cat: CatState, mind: CatMind, source: Vec, duration = 0.6, speed = 120): void {
  const away = normalize(subtract(cat.position, source))
  lockPose(mind, 'arch', duration)
  cat.velocity = scale({ x: away.x, y: away.y * 0.5 }, speed)
  cat.facing = source.x >= cat.position.x ? 1 : -1
  mind.facingHold = duration
}

export function startleCat(cat: CatState, context: StepContext, source: Vec): void {
  const mind = mindOf(cat, context)
  const random = context.memory.random
  if (cat.hidden || mind.leap || cat.intent === 'celebrate') return
  if (random.next() < mind.personality.spookResistance * 0.8) return
  if (cat.intent === 'perch' || cat.height > 1) {
    if (random.chance(0.35)) dismount(cat, mind, context, 'ground')
    return
  }
  if (random.chance(0.5)) {
    startleHop(cat, mind, context, source)
  } else {
    archAway(cat, mind, source)
    setEmote(cat, 'startled')
  }
  if (cat.intent === 'napping') mind.napCooldown = 10
  if (!cat.heldBallId && random.chance(1 - mind.personality.boldness)) beginFlee(cat, mind, context, 1.3)
  else if (cat.heldBallId) beginCarry(cat, mind, context, randomTimer(context, 3, 6), 0.4)
}

export function checkFumble(cat: CatState, mind: CatMind, context: StepContext): void {
  if (!cat.heldBallId || cat.hidden || cat.height > 24 || mind.fumbleCooldown > 0 || !context.pointer.active) return
  const reach = (26 + (context.pointer.pressed ? 12 : 0)) * cat.coat.scale
  if (cursorDistance(cat, context) > reach) return
  mind.fumbleCooldown = 1.4
  const random = context.memory.random
  if (!random.chance(0.42 - mind.personality.boldness * 0.22)) return
  const away = normalize(subtract(catCenter(cat), context.pointer.position))
  const sideways = { x: random.range(-50, 50), y: random.range(-30, 30) }
  const released = releaseBall(cat, mind, context, add(scale(away, 60), sideways), 520, 0.2)
  lockPose(mind, 'startle', 0.35)
  setEmote(cat, 'startled')
  if (released) beginChase(cat, mind, context, released, 1.15)
}
