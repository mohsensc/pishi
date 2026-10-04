import type { CatMind, StepContext } from '../../../memory'
import { distance } from '../../../vector'
import type { CatIntent, CatState } from '../../../types'
import { mindOf } from '../../helpers/queries'
import { farBallShield } from './shield'
import { beginBehavior } from '../../helpers/transitions'

export const partnerReach = 440

const casualIntents = new Set<CatIntent>(['wander', 'explore', 'play'])

export function isCasuallyAvailable(other: CatState, context: StepContext): boolean {
  if (other.hidden || other.heldBallId || other.height > 1 || other.propId) return false
  if (!casualIntents.has(other.intent)) return false
  const mind = mindOf(other, context)
  if (mind.leap || mind.perch || mind.poseLock || (mind.behaviorUrgency > farBallShield && mind.scratchNumbers.commitShield !== 1)) return false
  if (mind.scratchIds.leader || mind.scratchIds.partner) return false
  const behavior = context.library.byId.get(other.behavior)
  return Boolean(behavior?.interruptible) && mind.behaviorElapsed > 0.5
}

function availablePartners(cat: CatState, context: StepContext, radius: number): CatState[] {
  return context.world.cats
    .filter((other) => other.id !== cat.id && isCasuallyAvailable(other, context) && distance(other.position, cat.position) < radius)
    .sort((first, second) => distance(first.position, cat.position) - distance(second.position, cat.position))
}

export function hasPartnerNearby(cat: CatState, context: StepContext, radius: number, count = 1): boolean {
  return availablePartners(cat, context, radius).length >= count
}

function recruitPartners(cat: CatState, mind: CatMind, context: StepContext, behaviorId: string, radius: number, maxCount: number): CatState[] {
  const recruits = availablePartners(cat, context, radius).slice(0, maxCount)
  recruits.forEach((recruit, index) => {
    const recruitMind = mindOf(recruit, context)
    beginBehavior(recruit, recruitMind, context, behaviorId, { duration: cat.intentTimer + 1 })
    recruitMind.scratchIds.leader = cat.id
    recruitMind.scratchNumbers.rank = index + 1
  })
  recruits.forEach((recruit, index) => {
    mind.scratchIds[`partner${index}`] = recruit.id
  })
  if (recruits.length > 0) mind.scratchIds.partner = recruits[0].id
  mind.scratchNumbers.partnerCount = recruits.length
  return recruits
}

export function isFollower(mind: CatMind): boolean {
  return Boolean(mind.scratchIds.leader)
}

function linkedCat(cat: CatState, mind: CatMind, context: StepContext, key: string): CatState | undefined {
  const id = mind.scratchIds[key]
  if (!id) return undefined
  const other = context.world.cats.find((candidate) => candidate.id === id)
  if (!other || other.hidden || other.behavior !== cat.behavior) return undefined
  const otherMind = mindOf(other, context)
  const linkedBack = otherMind.scratchIds.leader === cat.id || otherMind.scratchIds.leader === mind.scratchIds.leader || other.id === mind.scratchIds.leader
  return linkedBack ? other : undefined
}

function leaderOf(cat: CatState, mind: CatMind, context: StepContext): CatState | undefined {
  return linkedCat(cat, mind, context, 'leader')
}

function partnersOf(cat: CatState, mind: CatMind, context: StepContext): CatState[] {
  const count = mind.scratchNumbers.partnerCount ?? 0
  const partners: CatState[] = []
  for (let index = 0; index < count; index += 1) {
    const partner = linkedCat(cat, mind, context, `partner${index}`)
    if (partner) partners.push(partner)
  }
  return partners
}

export interface SocialFrame {
  leader: CatState
  leaderMind: CatMind
  partners: CatState[]
  rank: number
  isLeader: boolean
}

export function socialSetup(cat: CatState, mind: CatMind, context: StepContext, behaviorId: string, radius: number, maxCount: number): SocialFrame | null {
  if (isFollower(mind)) {
    const leader = leaderOf(cat, mind, context)
    if (!leader) return null
    const leaderMind = mindOf(leader, context)
    return { leader, leaderMind, partners: partnersOf(leader, leaderMind, context), rank: mind.scratchNumbers.rank ?? 1, isLeader: false }
  }
  if (mind.scratchNumbers.recruited === undefined) {
    mind.scratchNumbers.recruited = 1
    recruitPartners(cat, mind, context, behaviorId, radius, maxCount)
  }
  const partners = partnersOf(cat, mind, context)
  if (partners.length === 0) return null
  return { leader: cat, leaderMind: mind, partners, rank: 0, isLeader: true }
}

export function catAtRank(frame: SocialFrame, rank: number): CatState | undefined {
  if (rank === 0) return frame.leader
  const id = frame.leaderMind.scratchIds[`partner${rank - 1}`]
  return frame.partners.find((partner) => partner.id === id)
}
