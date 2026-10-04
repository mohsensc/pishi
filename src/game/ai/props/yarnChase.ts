import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { lockPose, setEmote } from '../helpers/pose'
import { besideSolid, sideToward } from '../helpers/propSpots'
import { bumpAgitation, commit, enterPhase, hasProp, isPropBusy, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { findProp } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { chaseYarn, launchYarn } from './yarnPlay'

export const yarnChaseBehavior: Behavior = {
  id: 'yarnChase',
  intent: 'play',
  interruptible: true,
  minDuration: 8,
  maxDuration: 13,
  weight: (cat, mind, context) => (hasProp(cat, context, ['yarnBasket'], 650, (basket) => !isPropBusy(context, basket, cat.id)) ? 0.06 + mind.personality.zoominess * 0.1 : 0),
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['yarnBasket'], 650, (basket) => !isPropBusy(context, basket, cat.id))?.id ?? null
  },
  update(cat, mind, context) {
    if (mind.phase === 'chase') return chaseYarn(cat, mind, context)
    const basket = findProp(context, mind.propTargetId)
    if (!basket) return quit(cat, mind, context)
    if (mind.phase === 'start') enterPhase(mind, 'go')
    const side = sideToward(basket, cat.position)
    if (mind.phase === 'go') {
      const velocity = travel(cat, mind, context, besideSolid(basket, cat, context, side), 0.5)
      if (velocity) return velocity
      lockPose(mind, 'bat', 0.35)
      enterPhase(mind, 'tug')
      return brake(cat)
    }
    if (mind.phaseTimer < 0.5) return brake(cat)
    const random = context.memory.random
    const start = { x: basket.position.x + side * (basket.radius + 8), y: basket.position.y + 4 }
    launchYarn(mind, context, start, { x: side * random.range(0.6, 1), y: random.range(-0.6, 0.8) }, random.range(150, 220))
    spawnEffect(context.world, 'yarn', start, 4, basket.id, 1)
    bumpAgitation(basket, 0.7)
    setEmote(cat, 'playful')
    enterPhase(mind, 'chase')
    commit(mind)
    cat.intentTimer = Math.max(cat.intentTimer, 6)
    return brake(cat)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
