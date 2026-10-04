import { setEmote } from './ai/helpers/pose'
import { FOLLOW_DURATION, TREAT_BAG_SHAKE_LIFETIME } from './constants'
import type { Vec, World } from './types'

export function summonCat(world: World, catId: string, point: Vec): void {
  const cat = world.cats.find((candidate) => candidate.id === catId)
  if (!cat || cat.hidden) return
  cat.followUntil = world.time + FOLLOW_DURATION
  cat.gaze = { x: point.x, y: point.y }
  setEmote(cat, 'love')
}

export function shakeTreatBag(world: World, point: Vec): void {
  world.treatBagShake = { position: { x: point.x, y: point.y }, time: world.time }
}

export function stepCalls(world: World): void {
  if (world.treatBagShake && world.time - world.treatBagShake.time > TREAT_BAG_SHAKE_LIFETIME) world.treatBagShake = null
  world.cats.forEach((cat) => {
    if (cat.followUntil !== null && world.time > cat.followUntil) cat.followUntil = null
  })
}
