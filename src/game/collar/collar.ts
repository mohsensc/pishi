import { setEmote, faceToward, lockPose } from '../ai/helpers/pose'
import { mindOf } from '../ai/helpers/queries'
import { beginBehavior } from '../ai/helpers/transitions'
import { raiseAffection } from '../ai/tools/support/affection'
import { spawnEffect } from '../effects'
import { interactionContext } from '../engine'
import { adjustHappiness } from '../happiness/happiness'
import { COLLAR_HAPPINESS } from '../happiness/happinessCatalog'
import { wakeFully } from '../needs/sleepControl'
import { takeCollar } from '../progress/progress'
import { hashString } from '../random'
import type { CatBreed, CatState, Vec, World } from '../types'
import { personalityForBreed, previewBreedCoat } from './breedCoat'
import { CAT_NAME_MAX_LENGTH, collarColors, collarSitSeconds, greetAffection } from './collarCatalog'

function findCat(world: World, catId: string): CatState | undefined {
  return world.cats.find((candidate) => candidate.id === catId)
}

export function canWearCollar(cat: CatState | undefined): cat is CatState {
  return cat !== undefined && !cat.hidden && !cat.collar
}

export function fitCollar(world: World, catId: string): boolean {
  const cat = findCat(world, catId)
  if (!canWearCollar(cat) || !takeCollar(world)) return false
  const context = interactionContext(world)
  const mind = mindOf(cat, context)
  cat.collar = { color: collarColors[hashString(cat.id) % collarColors.length], fittedAt: world.time }
  if (cat.asleep) wakeFully(cat, context)
  adjustHappiness(cat, COLLAR_HAPPINESS)
  setEmote(cat, 'love')
  spawnEffect(world, 'sparkle', cat.position, cat.height + 30 * cat.coat.scale, null, 1)
  spawnEffect(world, 'hearts', cat.position, cat.height + 40 * cat.coat.scale, null, 0.8)
  if (!mind.leap && cat.height <= 1 && !cat.propId) {
    beginBehavior(cat, mind, context, 'sitIdle', { duration: collarSitSeconds, urgency: 4 })
    lockPose(mind, 'purr', 1.2)
  }
  return true
}

export function renameCat(world: World, catId: string, name: string, breed: CatBreed): boolean {
  const cat = findCat(world, catId)
  if (!cat?.collar) return false
  const trimmed = name.trim().slice(0, CAT_NAME_MAX_LENGTH)
  if (trimmed) cat.name = trimmed
  if (breed === cat.coat.breed) return true
  const context = interactionContext(world)
  cat.coat = previewBreedCoat(cat, breed)
  mindOf(cat, context).personality = personalityForBreed(cat, breed)
  spawnEffect(world, 'sparkle', cat.position, cat.height + 26 * cat.coat.scale, null, 1)
  return true
}

export function greetCollaredCat(world: World, catId: string, point: Vec): boolean {
  const cat = findCat(world, catId)
  if (!cat?.collar || cat.hidden || cat.asleep || cat.heldBallId) return false
  const context = interactionContext(world)
  const mind = mindOf(cat, context)
  if (mind.pokeCooldown > 0) return true
  mind.pokeCooldown = 0.6
  faceToward(cat, mind, point, 1)
  setEmote(cat, 'love')
  raiseAffection(cat, greetAffection)
  if (!mind.leap && cat.height <= 1) lockPose(mind, 'purr', 0.8)
  return true
}
