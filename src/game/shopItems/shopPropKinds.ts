export type ShopPropKind =
  | 'fountain'
  | 'birdbath'
  | 'pinwheel'
  | 'springToy'
  | 'birdFeeder'
  | 'swing'
  | 'butterflyHouse'
  | 'sprinkler'
  | 'windmill'
  | 'bubbleMachine'

export const shopPropKinds: readonly ShopPropKind[] = ['fountain', 'birdbath', 'pinwheel', 'springToy', 'birdFeeder', 'swing', 'butterflyHouse', 'sprinkler', 'windmill', 'bubbleMachine']

export function isShopPropKind(kind: string): kind is ShopPropKind {
  return (shopPropKinds as readonly string[]).includes(kind)
}
