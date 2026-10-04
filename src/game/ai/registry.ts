import type { CatMind, StepContext } from '../memory'
import type { CatState } from '../types'
import type { Behavior, BehaviorLibrary } from './behavior'
import { careBehaviors } from './care'
import { coreBehaviors } from './core'
import { dragBehaviors } from './drag'
import { isNight } from './helpers/playSteering'
import { motionBehaviors } from './motion'
import { needBehaviors } from './needs'
import { playBehaviors } from './play'
import { propBehaviors } from './props'
import { shopItemBehaviors, shopItemCalmBehaviorIds } from './shopItems'
import { socialBehaviors } from './social'
import { toolBehaviors } from './tools'
import { lazinessFactor, playfulnessFactor } from '../happiness/happiness'

const allBehaviors: Behavior[] = [
  ...coreBehaviors,
  ...playBehaviors,
  ...propBehaviors,
  ...toolBehaviors,
  ...dragBehaviors,
  ...socialBehaviors,
  ...motionBehaviors,
  ...careBehaviors,
  ...needBehaviors,
  ...shopItemBehaviors,
]

const calmBehaviorIds = new Set([
  'sitIdle',
  'napping',
  'circleSettle',
  'loafInSun',
  'watchBirds',
  'slowBlink',
  'groomSelf',
  'syncStare',
  'stretchYawn',
  'dustBath',
  'cuddlePile',
  'mutualGrooming',
  'kneadGrass',
  'benchNap',
  'shadeNap',
  'benchBackPerch',
  'rockSurvey',
  'tunnelPeek',
  'fishWatch',
  'yarnBasketSit',
  'lampLounge',
  'restByProp',
  'postMealGroom',
  ...shopItemCalmBehaviorIds,
])
const daytimeCalmFactor = 0.32
const defaultRecencyPenalty = 0.85
const recencyMemorySeconds = 30
const fallbackIdleId = 'sitIdle'
const fallbackCarryId = 'carryBall'

function recencyFactor(behavior: Behavior, mind: CatMind, now: number): number {
  const strength = behavior.recencyPenalty ?? defaultRecencyPenalty
  if (strength <= 0) return 1
  let useCount = 0
  let latest = Number.NEGATIVE_INFINITY
  mind.recentBehaviors.forEach((record) => {
    if (record.id !== behavior.id) return
    useCount += 1
    latest = Math.max(latest, record.startedAt)
  })
  if (useCount === 0) return 1
  const freshness = Math.exp(-(now - latest) / recencyMemorySeconds)
  const repetition = Math.pow(1 - strength * 0.35, useCount - 1)
  return Math.max(0.02, (1 - strength * freshness) * repetition)
}

function crowdFactor(behavior: Behavior, cat: CatState, context: StepContext): number {
  const strength = behavior.recencyPenalty ?? defaultRecencyPenalty
  if (strength <= 0) return 1
  const others = context.world.cats.reduce((count, other) => (other.id !== cat.id && other.behavior === behavior.id ? count + 1 : count), 0)
  return 1 / (1 + others * strength * 1.5)
}

function energyFactor(behavior: Behavior, context: StepContext): number {
  if (!calmBehaviorIds.has(behavior.id) || isNight(context)) return 1
  return daytimeCalmFactor
}

const playfulIntents = new Set(['play', 'chaseBall', 'chaseButterfly', 'teaseCursor', 'socialize', 'tunnelRun'])
const restfulIntents = new Set(['napping', 'hide'])

function moodFactor(behavior: Behavior, cat: CatState): number {
  if (playfulIntents.has(behavior.intent)) return playfulnessFactor(cat)
  if (restfulIntents.has(behavior.intent) || calmBehaviorIds.has(behavior.id)) return lazinessFactor(cat)
  return 1
}

function matchesBallState(behavior: Behavior, cat: CatState): boolean {
  return Boolean(behavior.withBall) === Boolean(cat.heldBallId)
}

function selectionWeight(behavior: Behavior, cat: CatState, mind: CatMind, context: StepContext): number {
  if (!matchesBallState(behavior, cat)) return 0
  const base = behavior.weight(cat, mind, context)
  if (!(base > 0)) return 0
  return base * recencyFactor(behavior, mind, context.world.time) * crowdFactor(behavior, cat, context) * energyFactor(behavior, context) * moodFactor(behavior, cat)
}

function createBehaviorLibrary(behaviors: Behavior[]): BehaviorLibrary {
  const byId = new Map(behaviors.map((behavior) => [behavior.id, behavior]))
  const fallback = (cat: CatState): Behavior => {
    const behavior = byId.get(cat.heldBallId ? fallbackCarryId : fallbackIdleId)
    if (!behavior) throw new Error('missing fallback behavior')
    return behavior
  }
  return {
    all: behaviors,
    byId,
    chooseNext(cat, mind, context) {
      const weighted = behaviors.map((behavior): [Behavior, number] => [behavior, selectionWeight(behavior, cat, mind, context)])
      const total = weighted.reduce((sum, [, weight]) => sum + weight, 0)
      if (total <= 0) return fallback(cat)
      let roll = context.memory.random.next() * total
      for (const [behavior, weight] of weighted) {
        if (weight <= 0) continue
        roll -= weight
        if (roll <= 0) return behavior
      }
      return weighted.filter(([, weight]) => weight > 0).at(-1)?.[0] ?? fallback(cat)
    },
    chooseUrgent(cat, mind, context, overridesOnly) {
      let best: { behavior: Behavior; urgency: number } | null = null
      behaviors.forEach((behavior) => {
        if (!behavior.urgency || behavior.id === cat.behavior || (overridesOnly && !behavior.overridesCommitment)) return
        const urgency = behavior.urgency(cat, mind, context)
        if (urgency > 0 && (!best || urgency > best.urgency)) best = { behavior, urgency }
      })
      return best
    },
  }
}

export const behaviorLibrary = createBehaviorLibrary(allBehaviors)
