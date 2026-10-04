import type { Vec, World } from '../types'
import type { TrayItemKind } from './careTypes'

export interface CareOffer {
  kind: TrayItemKind
  point: Vec
  updatedAt: number
}

const offerLifetime = 1.5
const offers = new WeakMap<World, CareOffer>()

export function setCareOffer(world: World, kind: TrayItemKind | null, point: Vec | null): void {
  if (!kind || !point) {
    offers.delete(world)
    return
  }
  offers.set(world, { kind, point: { x: point.x, y: point.y }, updatedAt: world.time })
}

export function careOfferOf(world: World): CareOffer | null {
  const offer = offers.get(world)
  if (!offer || world.time - offer.updatedAt > offerLifetime) return null
  return offer
}
