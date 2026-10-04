export interface PriceRule {
  price: number
  step: number
}

const placedStep = 0.2

export const shopPriceRules = {
  cushion: { price: 6, step: placedStep },
  rock: { price: 5, step: placedStep },
  cardboardBox: { price: 8, step: placedStep },
  flowerBed: { price: 10, step: placedStep },
  foodBowl: { price: 18, step: placedStep },
  yarnBasket: { price: 22, step: placedStep },
  scratchingPost: { price: 25, step: placedStep },
  sapling: { price: 12, step: 0.1 },
  bush: { price: 30, step: placedStep },
  picnicBlanket: { price: 45, step: placedStep },
  bench: { price: 90, step: placedStep },
  lamppost: { price: 100, step: placedStep },
  tunnel: { price: 140, step: placedStep },
  catTree: { price: 450, step: 0.3 },
  birdbath: { price: 80, step: placedStep },
  pond: { price: 700, step: 0.5 },
  fountain: { price: 900, step: 0.5 },
  pinwheel: { price: 15, step: placedStep },
  springToy: { price: 60, step: placedStep },
  birdFeeder: { price: 180, step: placedStep },
  swing: { price: 260, step: 0.3 },
  butterflyHouse: { price: 320, step: 0.4 },
  sprinkler: { price: 650, step: 0.4 },
  windmill: { price: 1100, step: 0.5 },
  bubbleMachine: { price: 1400, step: 0.5 },
  toyMouse: { price: 4, step: 0 },
  toolTreat: { price: 12, step: 0 },
  toolBrush: { price: 50, step: 0 },
  toolWand: { price: 120, step: 0 },
  toolLaser: { price: 300, step: 0 },
  toolCatnip: { price: 500, step: 0 },
  careFish: { price: 3, step: 0 },
  careMilk: { price: 3, step: 0 },
  careYarn: { price: 4, step: 0 },
  careBrush: { price: 4, step: 0 },
  careTreat: { price: 8, step: 0 },
  collar: { price: 800, step: 0.75 },
  treeCharges: { price: 1, step: 0 },
  pathGravel: { price: 1, step: 0 },
  pathStone: { price: 1, step: 0 },
} satisfies Record<string, PriceRule>

export type PricedItemId = keyof typeof shopPriceRules

export const toolPriceItems = {
  treat: 'toolTreat',
  brush: 'toolBrush',
  wand: 'toolWand',
  laser: 'toolLaser',
  catnip: 'toolCatnip',
} satisfies Record<string, PricedItemId>

export type PricedTool = keyof typeof toolPriceItems

export const legacyToolPoints: Record<PricedTool, number> = {
  treat: 2,
  brush: 6,
  wand: 10,
  laser: 16,
  catnip: 24,
}

export const TREE_CHARGES_PER_PACK = 3
export const GRAVEL_TILES_PER_PACK = 4
export const STONE_TILES_PER_PACK = 2

export function isPricedItem(id: unknown): id is PricedItemId {
  return typeof id === 'string' && Object.hasOwn(shopPriceRules, id)
}

export function isPricedTool(tool: unknown): tool is PricedTool {
  return typeof tool === 'string' && Object.hasOwn(toolPriceItems, tool)
}

export function priceAt(rule: PriceRule, owned: number): number {
  return Math.max(1, Math.round(rule.price * (1 + rule.step * Math.max(0, owned))))
}

export function priceOfItem(id: PricedItemId, owned: number): number {
  return priceAt(shopPriceRules[id], owned)
}
