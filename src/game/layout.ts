import { clampToBounds, createLawnMapper, lawnBounds, viewportScale } from './bounds'
import { CAT_TREE_LEVELS, CAT_TREE_PLATFORM_OFFSETS } from './constants'
import { depthScale } from './projection'
import type { Random } from './random'
import { clamp } from './vector'
import type { PropKind, PropState, Vec } from './types'
import { shopItemCanHide, shopItemRecipe, shopItemSolidHeight } from './shopItems/shopItemRecipes'
import { isShopPropKind } from './shopItems/shopPropKinds'

export interface PropRecipe {
  kind: PropKind
  radius: number
  solid: boolean
  perchHeight: number
  canStash: boolean
  topClearance: number
  gap: number
}

export function recipeFor(kind: PropKind, sizeScale: number, random: Random): PropRecipe {
  const scaled = (value: number) => value * sizeScale
  if (isShopPropKind(kind)) return shopItemRecipe(kind, sizeScale)
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
    canHide: hidingKinds.has(recipe.kind) || (isShopPropKind(recipe.kind) && shopItemCanHide(recipe.kind)),
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

export function propSolidHeight(prop: PropState): number {
  if (isShopPropKind(prop.kind)) return shopItemSolidHeight(prop.kind)
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

export function refitProps(props: PropState[], oldWidth: number, oldHeight: number, width: number, height: number, random: Random): PropState[] {
  const mapPoint = createLawnMapper(oldWidth, oldHeight, width, height)
  const bounds = lawnBounds(width, height)
  const sizeScale = viewportScale(width, height)
  const sizeRatio = sizeScale / viewportScale(oldWidth, oldHeight)
  return props.map((prop) => {
    const recipe = recipeFor(prop.kind, sizeScale, random)
    return {
      ...prop,
      position: clampToBounds(mapPoint(prop.position), bounds),
      tunnelExit: prop.tunnelExit ? clampToBounds(mapPoint(prop.tunnelExit), bounds) : null,
      radius: clamp(prop.radius * sizeRatio, recipe.radius * 0.5, recipe.radius * 2),
      perchHeight: recipe.perchHeight,
      occupantIds: [],
    }
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
