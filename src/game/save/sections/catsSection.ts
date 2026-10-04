import { breedProfiles, type Personality } from '../../catalog'
import { careItemKinds } from '../../care/careCatalog'
import { createMind, type CatMind } from '../../memory'
import { needRecordOf, peekNeedRecord } from '../../needs/needState'
import { isOpenSpot, openSpot } from '../../spawning'
import type { CatBreed, CatCoat, CatCollar, CatState, CoatPattern, Vec, World } from '../../types'
import { memoryFor } from '../../engine'
import {
  captureFields,
  isRecord,
  readBoolean,
  readColor,
  readId,
  readIntegerIn,
  readList,
  readNullable,
  readNumberIn,
  readOneOf,
  readText,
  readUnit,
  readVec,
  restoreFields,
  type FieldReader,
  type FieldReaders,
} from '../fieldReaders'
import type { ParkSection, RestoreScene } from '../parkSaveTypes'

const maxSavedCats = 32
const catClearance = 20
const catSpacing = 50
const maxNeedSeconds = 900
const maxCollarAge = 1e9

const coatPatternTable: Record<CoatPattern, true> = { tuxedo: true, solid: true, spotted: true, bicolor: true }
const readBreed = readOneOf(Object.keys(breedProfiles) as CatBreed[])

const readSocks: FieldReader<CatCoat['whiteSocks']> = (raw) => {
  if (!Array.isArray(raw) || raw.length !== 4 || !raw.every((sock) => typeof sock === 'boolean')) return undefined
  return [raw[0], raw[1], raw[2], raw[3]]
}

export const catFields: FieldReaders<CatState> = {
  name: readText(40),
  facing: readOneOf([1, -1] as const),
  fullness: readUnit,
  affection: readUnit,
  need: readNullable(readOneOf(careItemKinds)),
  needUrge: readUnit,
  asleep: readBoolean,
  happiness: readUnit,
}

export const coatFields: FieldReaders<CatCoat> = {
  breed: readBreed,
  pattern: readOneOf(Object.keys(coatPatternTable) as CoatPattern[]),
  baseColor: readColor,
  patchColor: readColor,
  spotColor: readColor,
  eyeColor: readColor,
  fluffiness: readUnit,
  legLength: readNumberIn(0.2, 2),
  whiteBib: readUnit,
  whiteSocks: readSocks,
  whiteMuzzle: readBoolean,
  tailTip: readBoolean,
  earNotch: readBoolean,
  scale: readNumberIn(0.05, 5),
}

export const personalityFields: FieldReaders<Personality> = {
  maxSpeed: readNumberIn(40, 800),
  acceleration: readNumberIn(100, 4000),
  jumpPower: readNumberIn(0.2, 3),
  fleeRadius: readNumberIn(20, 400),
  laziness: readUnit,
  boldness: readUnit,
  zoominess: readUnit,
  curiosity: readUnit,
  climbLevels: readIntegerIn(0, 3),
  spookResistance: readUnit,
  seed: readUnit,
}

const readNeedSeconds = readNumberIn(0, maxNeedSeconds)
const readPatience = readNumberIn(5, maxNeedSeconds)
const readLastNeed = readNullable(readOneOf(careItemKinds))
const readCollarAge = readNumberIn(0, maxCollarAge)

function captureCollar(world: World, cat: CatState): Record<string, unknown> | null {
  if (!cat.collar) return null
  return { color: cat.collar.color, fittedAgo: Math.max(0, world.time - cat.collar.fittedAt) }
}

function restoreCollar(raw: unknown, scene: RestoreScene): CatCollar | null {
  if (!isRecord(raw)) return null
  const color = readColor(raw.color)
  if (!color) return null
  return { color, fittedAt: scene.world.time - (readCollarAge(raw.fittedAgo) ?? 0) }
}

function captureNeeds(world: World, cat: CatState): Record<string, unknown> | null {
  const record = peekNeedRecord(world, cat.id)
  if (!record) return null
  return {
    nextNeedIn: Math.max(0, record.nextNeedAt - world.time),
    patience: record.patience,
    napEndsIn: record.napEndsAt > 0 ? Math.max(0, record.napEndsAt - world.time) : 0,
    lastNeed: record.lastNeed,
  }
}

function captureCat(world: World, cat: CatState): Record<string, unknown> {
  const mind = memoryFor(world).minds.get(cat.id)
  return {
    ...captureFields(cat, catFields),
    id: cat.id,
    position: cat.position,
    coat: captureFields(cat.coat, coatFields),
    collar: captureCollar(world, cat),
    personality: mind ? captureFields(mind.personality, personalityFields) : null,
    needs: captureNeeds(world, cat),
  }
}

function restorePersonality(raw: unknown, breed: CatBreed, current: Personality | undefined, scene: RestoreScene): Personality {
  const base: Personality =
    current && current.breed === breed ? { ...current } : { ...breedProfiles[breed], breed, seed: scene.memory.random.next() }
  const savedBreed = isRecord(raw) ? readBreed(raw.breed) : undefined
  if (savedBreed && savedBreed !== breed) return base
  return restoreFields(base, raw, personalityFields)
}

function placeCat(saved: Vec | undefined, scene: RestoreScene, placed: Vec[]): Vec {
  const mapped = saved ? scene.mapPoint(saved) : null
  if (mapped && isOpenSpot(scene.world.props, mapped, catClearance)) return mapped
  return openSpot(scene.world, scene.memory, catClearance, placed, catSpacing * scene.memory.sizeScale)
}

function settleCat(cat: CatState, position: Vec): void {
  cat.position = position
  cat.velocity = { x: 0, y: 0 }
  cat.acceleration = { x: 0, y: 0 }
  cat.height = 0
  cat.verticalSpeed = 0
  cat.hidden = false
  cat.propId = null
  cat.heldBallId = null
  cat.behavior = ''
  cat.emote = null
  cat.action = null
  cat.leapStyle = null
  cat.followUntil = null
  cat.launchedAt = null
  cat.landedAt = null
  cat.gaze = { x: position.x + 60 * cat.facing, y: position.y }
}

function restoreNeeds(raw: unknown, cat: CatState, scene: RestoreScene): void {
  if (!isRecord(raw)) return
  const record = needRecordOf(scene.context, cat)
  const now = scene.world.time
  record.nextNeedAt = now + (readNeedSeconds(raw.nextNeedIn) ?? record.nextNeedAt - now)
  record.patience = readPatience(raw.patience) ?? record.patience
  const napEndsIn = readNeedSeconds(raw.napEndsIn) ?? 0
  record.napEndsAt = cat.asleep && napEndsIn > 0 ? now + napEndsIn : 0
  record.lastNeed = readLastNeed(raw.lastNeed) ?? record.lastNeed
}

interface RestoredCat {
  cat: CatState
  mind: CatMind
  raw: Record<string, unknown>
}

function restoreCat(raw: unknown, index: number, freshCats: CatState[], scene: RestoreScene, usedIds: Set<string>, placed: Vec[]): RestoredCat | null {
  if (!isRecord(raw)) return null
  const id = readId(raw.id)
  if (!id || usedIds.has(id)) return null
  usedIds.add(id)
  const template = freshCats.find((candidate) => candidate.id === id) ?? freshCats[index % freshCats.length]
  const cat: CatState = { ...structuredClone(template), id }
  restoreFields(cat, raw, catFields)
  cat.collar = restoreCollar(raw.collar, scene)
  const coat = restoreFields({ ...cat.coat }, raw.coat, coatFields)
  cat.coat = { ...coat, scale: Math.min(5, Math.max(0.05, coat.scale * scene.catScaleRatio)) }
  const position = placeCat(readVec(raw.position), scene, placed)
  placed.push(position)
  settleCat(cat, position)
  const personality = restorePersonality(raw.personality, cat.coat.breed, scene.memory.minds.get(template.id)?.personality, scene)
  const mind = createMind(personality)
  mind.decisionTimer = scene.memory.random.range(0.2, 1.5)
  return { cat, mind, raw }
}

export const catsSection: ParkSection = {
  key: 'cats',
  capture: (world) => world.cats.map((cat) => captureCat(world, cat)),
  restore: (raw, scene) => {
    const freshCats = scene.world.cats
    if (freshCats.length === 0) return
    const usedIds = new Set<string>()
    const placed: Vec[] = []
    const restored = readList(raw, maxSavedCats).flatMap((entry, index) => restoreCat(entry, index, freshCats, scene, usedIds, placed) ?? [])
    if (restored.length === 0) return
    scene.memory.minds.clear()
    restored.forEach(({ cat, mind }) => scene.memory.minds.set(cat.id, mind))
    scene.world.cats = restored.map(({ cat }) => cat)
    restored.forEach(({ cat, raw: savedCat }) => restoreNeeds(savedCat.needs, cat, scene))
  },
}
