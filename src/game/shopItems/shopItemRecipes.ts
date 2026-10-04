import type { PropRecipe } from '../layout'
import type { ShopPropKind } from './shopPropKinds'

interface ShopItemShape {
  radius: number
  solid: boolean
  perchHeight: number
  topClearance: number
  gap: number
  solidHeight: number
  canHide: boolean
}

const shopItemShapes: Record<ShopPropKind, ShopItemShape> = {
  fountain: { radius: 46, solid: true, perchHeight: 26, topClearance: 70, gap: 40, solidHeight: 28, canHide: false },
  birdbath: { radius: 18, solid: true, perchHeight: 0, topClearance: 50, gap: 28, solidHeight: 46, canHide: false },
  pinwheel: { radius: 9, solid: true, perchHeight: 0, topClearance: 60, gap: 22, solidHeight: 60, canHide: false },
  springToy: { radius: 12, solid: false, perchHeight: 0, topClearance: 50, gap: 22, solidHeight: 0, canHide: false },
  birdFeeder: { radius: 14, solid: true, perchHeight: 0, topClearance: 110, gap: 30, solidHeight: 110, canHide: false },
  swing: { radius: 40, solid: true, perchHeight: 30, topClearance: 120, gap: 36, solidHeight: 30, canHide: false },
  butterflyHouse: { radius: 16, solid: true, perchHeight: 0, topClearance: 90, gap: 30, solidHeight: 90, canHide: false },
  sprinkler: { radius: 12, solid: false, perchHeight: 0, topClearance: 20, gap: 60, solidHeight: 0, canHide: false },
  windmill: { radius: 30, solid: true, perchHeight: 0, topClearance: 190, gap: 44, solidHeight: 400, canHide: false },
  bubbleMachine: { radius: 16, solid: true, perchHeight: 20, topClearance: 40, gap: 30, solidHeight: 22, canHide: false },
}

export function shopItemRecipe(kind: ShopPropKind, sizeScale: number): PropRecipe {
  const shape = shopItemShapes[kind]
  return {
    kind,
    radius: shape.radius * sizeScale,
    solid: shape.solid,
    perchHeight: shape.perchHeight * sizeScale,
    canStash: false,
    topClearance: shape.topClearance,
    gap: shape.gap * sizeScale,
  }
}

export function shopItemSolidHeight(kind: ShopPropKind): number {
  return shopItemShapes[kind].solidHeight
}

export function shopItemCanHide(kind: ShopPropKind): boolean {
  return shopItemShapes[kind].canHide
}
