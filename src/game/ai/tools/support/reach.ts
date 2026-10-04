import type { CatMind, StepContext } from '../../../memory'
import type { CatState, LeapStyle } from '../../../types'
import { weightedPick } from '../../helpers/queries'

const pawReachByStyle: Record<LeapStyle, number> = {
  reach: 26,
  springUp: 16,
  twistReach: 22,
  doubleHop: 14,
  swat: 24,
  pounceHigh: 12,
}

const peakFactorByStyle: Record<LeapStyle, number> = {
  reach: 0.92,
  springUp: 1.1,
  twistReach: 0.96,
  doubleHop: 1,
  swat: 0.35,
  pounceHigh: 1.02,
}

export function bodyTop(cat: CatState): number {
  return 30 * cat.coat.scale
}

export function pawReach(cat: CatState, style: LeapStyle): number {
  return pawReachByStyle[style] * cat.coat.scale
}

export function grabRadius(cat: CatState): number {
  return 34 * cat.coat.scale
}

export function standingReach(cat: CatState): number {
  const stretch = cat.coat.breed === 'munchkin' ? 1.05 : 1.45
  return bodyTop(cat) * stretch + 18 * cat.coat.scale
}

export function maxPeak(cat: CatState, mind: CatMind, style: LeapStyle): number {
  const breedFactor = cat.coat.breed === 'munchkin' ? 0.62 : cat.coat.breed === 'persian' ? 0.8 : 1
  return (60 + 110 * mind.personality.jumpPower) * breedFactor * peakFactorByStyle[style] * cat.coat.scale
}

export function reachableHeight(cat: CatState, mind: CatMind, style: LeapStyle): number {
  return maxPeak(cat, mind, style) + bodyTop(cat) + pawReach(cat, style)
}

export function chooseLeapStyle(cat: CatState, mind: CatMind, context: StepContext, lowTarget: boolean): LeapStyle {
  const { boldness, zoominess } = mind.personality
  const byBreed: Record<CatState['coat']['breed'], [LeapStyle, number][]> = {
    egyptianMau: [['springUp', 3], ['twistReach', 2], ['pounceHigh', 2], ['reach', 1]],
    munchkin: [['doubleHop', 4], ['swat', 2], ['reach', 1], ['pounceHigh', 1]],
    persian: [['swat', 4], ['reach', 2], ['springUp', 0.5]],
    tuxedo: [['reach', 2], ['springUp', 2], ['twistReach', 1.5], ['pounceHigh', 1.5], ['swat', 1], ['doubleHop', 0.5]],
  }
  const options = byBreed[cat.coat.breed].map(([style, weight]): [LeapStyle, number] => {
    if (style === 'pounceHigh') return [style, weight * (0.6 + boldness)]
    if (style === 'springUp') return [style, weight * (0.6 + zoominess)]
    if (style === 'swat') return [style, weight * (lowTarget ? 2.5 : 0.4)]
    return [style, weight]
  })
  return weightedPick(context, options) ?? 'reach'
}
