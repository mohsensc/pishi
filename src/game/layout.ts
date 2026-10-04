import { createLawnMapper, lawnBounds, lawnTopEdge, viewportScale } from './bounds'
import { CAT_TREE_LEVELS, CAT_TREE_PLATFORM_OFFSETS } from './constants'
import { horizontalGapToParkPath } from './parkPath'
import { depthScale } from './projection'
import { createRandom, type Random } from './random'
import { distance, lerpVec } from './vector'
import type { PropKind, PropState, Vec } from './types'
import { isOccluding, tallColumnOf, type Footprint, type PlacedFootprint } from './layoutOcclusion'

export interface PropRecipe {
  kind: PropKind
  radius: number
  solid: boolean
  perchHeight: number
  canStash: boolean
  topClearance: number
  gap: number
}

const essentialKinds = new Set<PropKind>(['catTree', 'cardboardBox', 'tunnel', 'pond'])

export function recipeFor(kind: PropKind, sizeScale: number, random: Random): PropRecipe {
  const scaled = (value: number) => value * sizeScale
  switch (kind) {
    case 'catTree':
      return { kind, radius: scaled(38), solid: true, perchHeight: Math.max(100, scaled(135)), canStash: false, topClearance: Math.max(100, scaled(135)) + 20, gap: scaled(40) }
    case 'cardboardBox':
      return { kind, radius: scaled(28), solid: true, perchHeight: scaled(30), canStash: true, topClearance: 30, gap: scaled(34) }
    case 'tunnel':
      return { kind, radius: scaled(20), solid: false, perchHeight: 0, canStash: false, topClearance: 20, gap: scaled(34) }
    case 'bench':
      return { kind, radius: scaled(44), solid: true, perchHeight: scaled(34), canStash: false, topClearance: 40, gap: scaled(34) }
    case 'bush':
      return { kind, radius: scaled(random.range(26, 38)), solid: true, perchHeight: 0, canStash: false, topClearance: 40, gap: scaled(28) }
    case 'tree':
      return { kind, radius: scaled(20), solid: true, perchHeight: 0, canStash: false, topClearance: scaled(190), gap: scaled(90) }
    case 'rock':
      return { kind, radius: scaled(random.range(13, 22)), solid: true, perchHeight: scaled(18), canStash: false, topClearance: 20, gap: scaled(26) }
    case 'flowerBed':
      return { kind, radius: scaled(random.range(30, 40)), solid: false, perchHeight: 0, canStash: false, topClearance: 10, gap: scaled(20) }
    case 'pond':
      return { kind, radius: scaled(78), solid: false, perchHeight: 0, canStash: false, topClearance: 30, gap: scaled(40) }
    case 'picnicBlanket':
      return { kind, radius: scaled(56), solid: false, perchHeight: 0, canStash: false, topClearance: 10, gap: scaled(24) }
    case 'yarnBasket':
      return { kind, radius: scaled(16), solid: true, perchHeight: 0, canStash: false, topClearance: 20, gap: scaled(24) }
    case 'scratchingPost':
      return { kind, radius: scaled(12), solid: true, perchHeight: 0, canStash: false, topClearance: 70, gap: scaled(26) }
    case 'foodBowl':
      return { kind, radius: scaled(11), solid: false, perchHeight: 0, canStash: false, topClearance: 10, gap: scaled(18) }
    case 'lamppost':
      return { kind, radius: scaled(8), solid: true, perchHeight: 0, canStash: false, topClearance: scaled(150), gap: scaled(30) }
    case 'feedingStation':
      return { kind, radius: scaled(40), solid: true, perchHeight: 0, canStash: false, topClearance: 20, gap: scaled(40) }
    case 'cushion':
      return { kind, radius: scaled(30), solid: false, perchHeight: 0, canStash: false, topClearance: 10, gap: scaled(20) }
  }
}

const hidingKinds = new Set<PropKind>(['cardboardBox', 'tunnel', 'bush', 'tree'])

export function createPropState(id: string, recipe: PropRecipe, position: Vec, exit: Vec | null, variant: number): PropState {
  return {
    id,
    kind: recipe.kind,
    position,
    radius: recipe.radius,
    solid: recipe.solid,
    perchHeight: recipe.perchHeight,
    canStash: recipe.canStash,
    variant,
    occupantIds: [],
    tunnelExit: exit,
    canHide: hidingKinds.has(recipe.kind),
    agitation: 0,
    pokedAt: null,
    lit: false,
    foodLevel: 1,
    lift: 0,
    tilt: 0,
    droppedAt: null,
    spawnedAt: null,
  }
}

function feedingStationFootprint(width: number, height: number, sizeScale: number, random: Random): { recipe: PropRecipe; position: Vec } {
  const recipe = recipeFor('feedingStation', sizeScale, random)
  const bounds = lawnBounds(width, height, 8)
  const position = { x: bounds.right - recipe.radius * 1.2, y: bounds.bottom - recipe.radius * 0.75 }
  return { recipe, position }
}

function layoutPlan(width: number, height: number): PropKind[] {
  const compact = width < 700 || width * height < 520000
  const roomy = width * height > 1300000
  if (compact) {
    return [
      'pond', 'catTree', 'catTree', 'tunnel', 'tree', 'cardboardBox', 'cardboardBox', 'cardboardBox',
      'bench', 'picnicBlanket', 'bush', 'bush', 'bush', 'flowerBed', 'rock', 'rock', 'yarnBasket',
      'scratchingPost', 'foodBowl', 'lamppost',
    ]
  }
  return [
    'pond', 'catTree', 'catTree', 'catTree', 'tunnel', 'tunnel', 'tree', 'tree', 'cardboardBox', 'cardboardBox',
    'cardboardBox', 'cardboardBox', 'bench', 'bench', 'picnicBlanket', 'bush', 'bush', 'bush', 'bush', 'bush',
    ...(roomy ? (['bush', 'rock'] as PropKind[]) : []),
    'flowerBed', 'flowerBed', 'flowerBed', 'rock', 'rock', 'rock', 'yarnBasket', 'scratchingPost', 'scratchingPost',
    'foodBowl', 'foodBowl', 'lamppost',
  ]
}

function footprintOf(recipe: PropRecipe, position: Vec, exit: Vec | null): Footprint {
  if (exit) {
    return {
      center: lerpVec(position, exit, 0.5),
      radius: distance(position, exit) / 2 + recipe.radius,
    }
  }
  return { center: position, radius: recipe.radius }
}

export function createPropLayout(width: number, height: number, seed: number): PropState[] {
  const random = createRandom(seed ^ 0x5bd1e995)
  const sizeScale = viewportScale(width, height)
  const bounds = lawnBounds(width, height, 8)
  const lawnHeight = bounds.bottom - bounds.top
  const openAreas: Footprint[] = [
    { center: { x: width * 0.5, y: bounds.top + lawnHeight * 0.55 }, radius: Math.min(width, lawnHeight) * 0.13 },
    { center: { x: width * 0.24, y: bounds.top + lawnHeight * 0.78 }, radius: Math.min(width, lawnHeight) * 0.09 },
    { center: { x: width * 0.78, y: bounds.top + lawnHeight * 0.3 }, radius: Math.min(width, lawnHeight) * 0.09 },
  ]
  const station = feedingStationFootprint(width, height, sizeScale, random)
  const placed: PlacedFootprint[] = [{ footprint: { center: station.position, radius: station.recipe.radius }, gap: station.recipe.gap, column: null }]
  const props: PropState[] = [createPropState('prop-feedingStation', station.recipe, station.position, null, 0)]

  layoutPlan(width, height).forEach((kind, index) => {
    const recipe = recipeFor(kind, sizeScale, random)
    const tunnelLength = kind === 'tunnel' ? 150 * sizeScale : 0
    for (let attempt = 0; attempt < 140; attempt += 1) {
      const relax = attempt > 90 ? 0.6 : 1
      const top = Math.max(bounds.top + recipe.radius * 0.6, lawnTopEdge(height) + recipe.topClearance)
      const minX = bounds.left + recipe.radius
      const maxX = bounds.right - recipe.radius - tunnelLength
      const minY = top
      const maxY = bounds.bottom - recipe.radius * 0.6
      if (maxX <= minX || maxY <= minY) return
      const position = { x: random.range(minX, maxX), y: random.range(minY, maxY) }
      const exit = kind === 'tunnel' ? { x: position.x + tunnelLength, y: Math.min(maxY, Math.max(minY, position.y + random.range(-0.25, 0.25) * tunnelLength)) } : null
      const footprint = footprintOf(recipe, position, exit)
      const collides = placed.some(
        (other) => distance(other.footprint.center, footprint.center) < other.footprint.radius + footprint.radius + Math.max(other.gap, recipe.gap) * relax,
      )
      if (collides) continue
      const column = tallColumnOf(kind, position, sizeScale)
      const hidden = placed.some((other) => isOccluding(other.column, footprint) || isOccluding(column, other.footprint))
      if (hidden && attempt < 120) continue
      const pathClearance = kind === 'tree' ? recipe.radius * 3 : kind === 'catTree' ? recipe.radius * 1.7 : recipe.radius * 1.25
      const pathProbes = exit ? [position, exit, footprint.center] : [position]
      const onPath = pathProbes.some((probe) => horizontalGapToParkPath(probe, width, height, lawnTopEdge(height)) < pathClearance + 10)
      if (onPath && (attempt < 130 || !essentialKinds.has(kind))) continue
      const blocksOpenArea =
        recipe.radius > 14 && openAreas.some((area) => distance(area.center, footprint.center) < area.radius + footprint.radius * 0.8)
      if (blocksOpenArea && attempt < 120) continue
      placed.push({ footprint, gap: recipe.gap, column })
      props.push(createPropState(`prop-${kind}-${index}`, recipe, position, exit, random.integer(0, 2)))
      return
    }
  })
  return props
}

export function propSolidHeight(prop: PropState): number {
  switch (prop.kind) {
    case 'catTree':
      return prop.perchHeight
    case 'cardboardBox':
      return 34
    case 'bench':
      return 38
    case 'bush':
      return 44
    case 'tree':
      return 400
    case 'rock':
      return 20
    case 'yarnBasket':
      return 22
    case 'scratchingPost':
      return 72
    case 'lamppost':
      return 400
    case 'feedingStation':
      return 18
    default:
      return 0
  }
}

export function rescaleProps(props: PropState[], oldWidth: number, oldHeight: number, width: number, height: number): void {
  const mapPoint = createLawnMapper(oldWidth, oldHeight, width, height)
  props.forEach((prop) => {
    prop.position = mapPoint(prop.position)
    if (prop.tunnelExit) prop.tunnelExit = mapPoint(prop.tunnelExit)
  })
}

interface PerchLevel {
  offsetX: number
  height: number
}

function unscaledPerchLevelsOf(prop: PropState): PerchLevel[] {
  switch (prop.kind) {
    case 'catTree':
      return CAT_TREE_LEVELS.map((ratio, index) => ({ offsetX: CAT_TREE_PLATFORM_OFFSETS[index] * prop.radius, height: prop.perchHeight * ratio }))
    case 'bench':
      return [
        { offsetX: -prop.radius * 0.45, height: prop.perchHeight },
        { offsetX: prop.radius * 0.45, height: prop.perchHeight },
      ]
    case 'cardboardBox':
      return [{ offsetX: 0, height: prop.perchHeight }]
    case 'rock':
      return prop.variant % 2 === 1
        ? [{ offsetX: -prop.radius * 0.35, height: prop.radius * 1.02 }]
        : [{ offsetX: 0, height: prop.radius * 1.18 }]
    default:
      return []
  }
}

export function perchLevelsOf(prop: PropState, worldHeight: number): PerchLevel[] {
  const drawScale = depthScale(prop.position.y, worldHeight)
  return unscaledPerchLevelsOf(prop).map((level) => ({ offsetX: level.offsetX * drawScale, height: level.height * drawScale }))
}

export function hidingHeightOf(prop: PropState, worldHeight: number): number {
  if (prop.kind !== 'tree') return 0
  return prop.radius * 5.4 * depthScale(prop.position.y, worldHeight)
}
