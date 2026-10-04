import { MAX_PURCHASED_PROPS, MAX_TREES } from '../../economy/economyConstants'
import { createPropState, recipeFor } from '../../layout'
import type { PropKind, PropState, Vec } from '../../types'
import { clamp } from '../../vector'
import { captureFields, highestSerial, isRecord, readId, readIntegerIn, readList, readNumberIn, readOneOf, readUnit, readVec, restoreFields, type FieldReaders } from '../fieldReaders'
import type { ParkSection, RestoreScene } from '../parkSaveTypes'

const propKindTable: Record<PropKind, true> = {
  catTree: true,
  cardboardBox: true,
  tunnel: true,
  bench: true,
  bush: true,
  tree: true,
  rock: true,
  flowerBed: true,
  pond: true,
  picnicBlanket: true,
  yarnBasket: true,
  scratchingPost: true,
  foodBowl: true,
  lamppost: true,
  feedingStation: true,
  cushion: true,
  fountain: true,
  birdbath: true,
  pinwheel: true,
  springToy: true,
  birdFeeder: true,
  swing: true,
  butterflyHouse: true,
  sprinkler: true,
  windmill: true,
  bubbleMachine: true,
}

const maxSavedProps = MAX_PURCHASED_PROPS + MAX_TREES + 1
const readPropKind = readOneOf(Object.keys(propKindTable) as PropKind[])
const readRadius = readNumberIn(1, 2000)
const tunnelLength = 150

export const propFields: FieldReaders<PropState> = {
  variant: readIntegerIn(0, 7),
  foodLevel: readUnit,
}

function restoreTunnelExit(raw: unknown, position: Vec, scene: RestoreScene): Vec {
  const exit = readVec(raw)
  return exit ? scene.mapPoint(exit) : scene.mapPoint({ x: position.x + tunnelLength * scene.memory.sizeScale, y: position.y })
}

function restoreProp(raw: unknown, scene: RestoreScene, usedIds: Set<string>): PropState | null {
  if (!isRecord(raw)) return null
  const kind = readPropKind(raw.kind)
  const id = readId(raw.id)
  const savedPosition = readVec(raw.position)
  if (!kind || !id || !savedPosition || usedIds.has(id)) return null
  usedIds.add(id)
  const recipe = recipeFor(kind, scene.memory.sizeScale, scene.memory.random)
  const savedRadius = readRadius(raw.radius)
  const radius = savedRadius === undefined ? recipe.radius : clamp(savedRadius * scene.sizeRatio, recipe.radius * 0.5, recipe.radius * 2)
  const position = scene.mapPoint(savedPosition)
  const exit = kind === 'tunnel' ? restoreTunnelExit(raw.tunnelExit, savedPosition, scene) : null
  return restoreFields(createPropState(id, { ...recipe, radius }, position, exit, 0), raw, propFields)
}

export const propsSection: ParkSection = {
  key: 'props',
  capture: (world) =>
    world.props.map((prop) => ({
      id: prop.id,
      kind: prop.kind,
      position: prop.position,
      tunnelExit: prop.tunnelExit,
      radius: prop.radius,
      ...captureFields(prop, propFields),
    })),
  restore: (raw, scene) => {
    const usedIds = new Set<string>()
    const props = readList(raw, maxSavedProps).flatMap((entry) => restoreProp(entry, scene, usedIds) ?? [])
    if (props.length === 0) return
    scene.world.props = props
    scene.memory.popSerial = Math.max(scene.memory.popSerial, highestSerial([...usedIds], /-spawned-(\d+)$/))
  },
}
