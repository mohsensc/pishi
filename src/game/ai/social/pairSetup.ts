import type { CatMind, StepContext } from '../../memory'
import { clampToBounds } from '../../bounds'
import { lerpVec } from '../../vector'
import type { CatState, Vec } from '../../types'
import { sizeScaled } from '../helpers/playSteering'
import { bodyLength } from '../helpers/queries'
import { partnerReach, socialSetup, type SocialFrame } from '../play/shared/partners'

export interface PairFrame {
  frame: SocialFrame
  partner: CatState
  meet: Vec
  game: Record<string, number>
}

export function pairUp(cat: CatState, mind: CatMind, context: StepContext, behaviorId: string): PairFrame | null {
  const frame = socialSetup(cat, mind, context, behaviorId, sizeScaled(context, partnerReach), 1)
  if (!frame) return null
  const partner = frame.isLeader ? frame.partners[0] : frame.leader
  if (!partner) return null
  if (frame.isLeader && !mind.scratchPoints.meet) mind.scratchPoints.meet = lerpVec(cat.position, partner.position, 0.5)
  const meet = frame.leaderMind.scratchPoints.meet
  if (!meet) return null
  return { frame, partner, meet, game: frame.leaderMind.scratchNumbers }
}

export function sideSpot(cat: CatState, pair: PairFrame, context: StepContext, spacing: number): Vec {
  const side = pair.frame.isLeader ? (cat.position.x <= pair.partner.position.x ? -1 : 1) : pair.frame.leader.position.x <= cat.position.x ? 1 : -1
  return clampToBounds({ x: pair.meet.x + side * bodyLength(cat) * spacing, y: pair.meet.y }, context.bounds)
}
