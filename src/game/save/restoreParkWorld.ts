import { catSizeScale, clampToBounds, createLawnMapper, lawnBounds, viewportScale } from '../bounds'
import { BALL_COUNT, CAT_COUNT } from '../constants'
import { idleContext, memoryFor } from '../engine'
import { deliverBallsToCats, spawnBalls, startInitialBehaviors } from '../spawning'
import type { World } from '../types'
import { createWorld } from '../world'
import { parkSections } from './parkSections'
import { reconcileEconomy } from '../economy/reconcileEconomy'
import { grantLegacyMigration } from '../economy/migration'
import { isLegacySave, legacyPointsOf } from './legacyPoints'
import type { ParkIdentity, ParkSave, RestoreScene } from './parkSaveTypes'

interface ParkViewport {
  width: number
  height: number
}

function createRestoreScene(world: World, save: ParkSave): RestoreScene {
  const memory = memoryFor(world)
  const bounds = lawnBounds(world.width, world.height)
  const lawnMapper = createLawnMapper(save.viewport.width, save.viewport.height, world.width, world.height)
  return {
    world,
    memory,
    context: idleContext(world, memory),
    save,
    mapPoint: (point) => clampToBounds(lawnMapper(point), bounds),
    sizeRatio: viewportScale(world.width, world.height) / viewportScale(save.viewport.width, save.viewport.height),
    catScaleRatio: catSizeScale(world.width, world.height) / catSizeScale(save.viewport.width, save.viewport.height),
  }
}

function settleRestoredWorld({ world, memory, context }: RestoreScene): void {
  startInitialBehaviors(context)
  world.balls = [...spawnBalls(world, memory, BALL_COUNT, true), ...world.balls]
  deliverBallsToCats(context)
  world.effects = []
}

const legacySkippedSections = new Set(['props', 'landscape'])

export function applyParkSave(world: World, save: ParkSave): void {
  const scene = createRestoreScene(world, save)
  const legacy = isLegacySave(save)
  world.balls = []
  parkSections.forEach((section) => {
    if (!(section.key in save.sections) || (legacy && legacySkippedSections.has(section.key))) return
    try {
      section.restore(save.sections[section.key], scene)
    } catch (error) {
      console.warn(`park section ${section.key} could not be restored`, error)
    }
  })
  if (legacy) grantLegacyMigration(world, legacyPointsOf(save))
  reconcileEconomy(world)
  settleRestoredWorld(scene)
}

export function createParkWorld(viewport: ParkViewport, identity: ParkIdentity, save: ParkSave | null): World {
  const world = createWorld({ width: viewport.width, height: viewport.height, catCount: CAT_COUNT, ballCount: BALL_COUNT, seed: identity.seed })
  if (save) applyParkSave(world, save)
  return world
}
