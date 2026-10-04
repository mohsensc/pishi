import { setAction, setEmote } from '../ai/helpers/pose'
import { mindOf } from '../ai/helpers/queries'
import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { CatState } from '../types'
import { adjustHappiness, happinessOf, isHappy, isUnhappy } from './happiness'
import {
  ASLEEP_WAITING_DECAY_PER_SECOND,
  engagedBehaviorIds,
  HAPPINESS_BASELINE,
  HAPPINESS_DRIFT_PER_SECOND,
  HAPPY_EMOTE_RATE,
  PLAY_HAPPINESS_PER_SECOND,
  UNHAPPY_EMOTE_RATE,
  WAITING_DECAY_PER_SECOND,
} from './happinessCatalog'

const restfulPoses = new Set(['sit', 'loaf', 'purr', 'groom', 'knead'])

function happinessDelta(cat: CatState, seconds: number): number {
  if (engagedBehaviorIds.has(cat.behavior)) return PLAY_HAPPINESS_PER_SECOND * seconds
  if (cat.need && cat.asleep) return -ASLEEP_WAITING_DECAY_PER_SECOND * seconds
  if (cat.need) return -WAITING_DECAY_PER_SECOND * Math.max(0, (cat.needUrge ?? 0) - 0.3) * seconds
  const gap = HAPPINESS_BASELINE - happinessOf(cat)
  return Math.sign(gap) * Math.min(Math.abs(gap), HAPPINESS_DRIFT_PER_SECOND * seconds)
}

function showMood(cat: CatState, context: StepContext): void {
  if (cat.asleep || cat.emote || cat.hidden) return
  const mind = mindOf(cat, context)
  if (mind.leap || cat.height > 1) return
  const random = context.memory.random
  if (isHappy(cat) && random.chance(context.dt * HAPPY_EMOTE_RATE)) {
    setEmote(cat, 'love')
    spawnEffect(context.world, 'hearts', cat.position, cat.height + 34 * cat.coat.scale, null, 0.5)
    if (restfulPoses.has(cat.pose)) setAction(cat, 'purr')
    return
  }
  if (isUnhappy(cat) && random.chance(context.dt * UNHAPPY_EMOTE_RATE)) setEmote(cat, 'annoyed')
}

export function stepHappiness(context: StepContext): void {
  context.world.cats.forEach((cat) => {
    if (cat.hidden) return
    adjustHappiness(cat, happinessDelta(cat, context.dt))
    showMood(cat, context)
  })
}
