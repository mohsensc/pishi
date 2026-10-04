import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import type { PropKind, ShopItemId, Vec, World } from '../game/types'
import type { DenyReason, PurchaseResult, ShopEntry } from '../game/economy/economyTypes'
import { priceOf, purchaseBlocker, tierProgress } from '../game/economy/pricing'
import { shopEntryOf } from '../game/economy/shopCatalog'
import { placementPreview } from '../game/shopItems/placeShopItem'
import { depthScale } from '../game/projection'
import { shopTabs } from '../components/ItemDrawer/itemCatalog'
import type { WorldActions } from './useWorld'

export interface ShopCellState {
  id: ShopItemId
  price: number
  blocker: DenyReason | null
  tierProgress: number
}

export interface GhostPreview {
  kind: PropKind
  valid: boolean
  position: Vec
  pointer: Vec
  exit: Vec | null
  radius: number
  scale: number
  worldHeight: number
}

export interface ShopHandle {
  cells: Record<string, ShopCellState>
  wallet: number
  stage: () => HTMLElement | null
  buy: (itemId: ShopItemId, clientPoint: Vec | null) => PurchaseResult | null
  preview: (itemId: ShopItemId, clientPoint: Vec) => GhostPreview | null
}

const shopItemIds = shopTabs.flatMap((tab) => tab.items)

export function propKindOf(entry: ShopEntry): PropKind | null {
  return entry.grant.type === 'prop' ? entry.grant.kind : null
}

function cellsOf(world: World): Record<string, ShopCellState> {
  return Object.fromEntries(
    shopItemIds.map((id) => {
      const entry = shopEntryOf(id)
      return [id, { id, price: priceOf(world, id), blocker: purchaseBlocker(world, id), tierProgress: tierProgress(world.economy.lifetimeEarned, entry.tier) }]
    }),
  )
}

export function useItemSpawner(stageRef: RefObject<HTMLElement | null>, actions: WorldActions, world: World): ShopHandle {
  const worldRef = useRef(world)
  useEffect(() => {
    worldRef.current = world
  }, [world])
  const cellsJson = JSON.stringify(cellsOf(world))
  const cells = useMemo(() => JSON.parse(cellsJson) as Record<string, ShopCellState>, [cellsJson])
  const toStage = useCallback(
    (clientPoint: Vec): Vec | null => {
      const stage = stageRef.current
      if (!stage) return null
      const bounds = stage.getBoundingClientRect()
      return { x: clientPoint.x - bounds.left, y: clientPoint.y - bounds.top }
    },
    [stageRef],
  )
  const buy = useCallback(
    (itemId: ShopItemId, clientPoint: Vec | null) => {
      const point = clientPoint ? toStage(clientPoint) : null
      if (clientPoint && !point) return null
      return actions.purchase(itemId, point)
    },
    [actions, toStage],
  )
  const preview = useCallback(
    (itemId: ShopItemId, clientPoint: Vec): GhostPreview | null => {
      const kind = propKindOf(shopEntryOf(itemId))
      const point = toStage(clientPoint)
      if (!kind || !point) return null
      const current = worldRef.current
      const placement = placementPreview(current, kind, point)
      const position = placement.valid ? placement.position : point
      return { kind, valid: placement.valid, position, pointer: point, exit: placement.exit, radius: placement.radius, scale: depthScale(position.y, current.height), worldHeight: current.height }
    },
    [toStage],
  )
  const stage = useCallback(() => stageRef.current, [stageRef])
  const wallet = world.economy.wallet
  return useMemo(() => ({ cells, wallet, stage, buy, preview }), [cells, wallet, stage, buy, preview])
}
