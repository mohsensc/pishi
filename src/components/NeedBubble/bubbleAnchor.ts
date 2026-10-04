import { CAT_BODY_LENGTH } from '../../game/constants'
import { depthScale, toScreen } from '../../game/projection'
import type { CatPose, CatState } from '../../game/types'

export interface BubbleAnchor {
  x: number
  y: number
  headTop: number
  headForward: number
  headDrop: number
  pixelsPerUnit: number
}

const rigBodyLength = 60
const defaultHeadTop = 64
const backOffset = 6
const sleepingHeadForward = 34
const sleepingHeadDrop = 24
const headTopByPose: Partial<Record<CatPose, number>> = {
  sleep: 32,
  loaf: 46,
  bellyUp: 30,
  flop: 32,
  eat: 44,
  crouch: 46,
  stalk: 48,
  sniff: 46,
  pounce: 46,
  purr: 52,
  knead: 52,
  groom: 54,
  stretch: 50,
  dangle: 78,
}

export function bubbleAnchorOf(cat: CatState, worldHeight: number): BubbleAnchor {
  const pixelsPerUnit = (CAT_BODY_LENGTH / rigBodyLength) * cat.coat.scale * depthScale(cat.position.y, worldHeight)
  const body = toScreen(cat.position, cat.height)
  return {
    x: body.x - cat.facing * backOffset * pixelsPerUnit,
    y: body.y,
    headTop: (headTopByPose[cat.pose] ?? defaultHeadTop) * pixelsPerUnit,
    headForward: cat.facing * (backOffset + sleepingHeadForward) * pixelsPerUnit,
    headDrop: sleepingHeadDrop * pixelsPerUnit,
    pixelsPerUnit,
  }
}
