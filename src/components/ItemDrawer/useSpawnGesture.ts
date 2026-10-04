import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { DRAG_START_DISTANCE } from '../../game/constants'
import { shopEntryOf } from '../../game/economy/shopCatalog'
import type { ShopItemId, Vec } from '../../game/types'
import type { GhostPreview, ShopHandle } from '../../hooks/useItemSpawner'

export type SpawnRequest = ShopHandle

export interface ShopGhost {
  itemId: ShopItemId
  client: Vec
  preview: GhostPreview | null
  overInterface: boolean
}

interface PressRecord {
  itemId: ShopItemId
  start: Vec
  pointerId: number
  dragging: boolean
}

const interfaceSelector = 'button, [data-ui]'
const deniedMs = 420

function isOverInterface(point: Vec, ignore: HTMLElement | null = null): boolean {
  if (ignore) ignore.style.pointerEvents = 'none'
  const element = document.elementFromPoint(point.x, point.y)
  if (ignore) ignore.style.pointerEvents = ''
  return element?.closest(interfaceSelector) != null
}

export function isPlacedItem(itemId: ShopItemId): boolean {
  return shopEntryOf(itemId).grant.type === 'prop'
}

export function useSpawnGesture(shop: ShopHandle, open: boolean) {
  const pressRef = useRef<PressRecord | null>(null)
  const overlayPressRef = useRef<number | null>(null)
  const [ghost, setGhost] = useState<ShopGhost | null>(null)
  const [placing, setPlacing] = useState<ShopItemId | null>(null)
  const [deniedId, setDeniedId] = useState<ShopItemId | null>(null)
  const [deniedAt, setDeniedAt] = useState(0)
  const denyTimerRef = useRef<number | null>(null)
  const shopRef = useRef(shop)

  useEffect(() => {
    shopRef.current = shop
  }, [shop])

  useEffect(
    () => () => {
      if (denyTimerRef.current !== null) window.clearTimeout(denyTimerRef.current)
    },
    [],
  )

  const deny = useCallback((itemId: ShopItemId) => {
    setDeniedId(itemId)
    setDeniedAt(performance.now())
    if (denyTimerRef.current !== null) window.clearTimeout(denyTimerRef.current)
    denyTimerRef.current = window.setTimeout(() => setDeniedId((current) => (current === itemId ? null : current)), deniedMs)
  }, [])

  const trackGhost = useCallback((itemId: ShopItemId, client: Vec, ignore: HTMLElement | null) => {
    const overInterface = isOverInterface(client, ignore)
    const preview = isPlacedItem(itemId) && !overInterface ? shopRef.current.preview(itemId, client) : null
    setGhost({ itemId, client, preview, overInterface })
  }, [])

  const stopPlacing = useCallback(() => {
    overlayPressRef.current = null
    setPlacing(null)
    setGhost(null)
  }, [])

  useEffect(() => {
    if (!placing) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stopPlacing()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [placing, stopPlacing])

  useEffect(() => {
    if (open || !placing) return
    const timer = window.setTimeout(stopPlacing, 0)
    return () => window.clearTimeout(timer)
  }, [open, placing, stopPlacing])

  const tryBuy = useCallback(
    (itemId: ShopItemId, client: Vec | null) => {
      const result = shopRef.current.buy(itemId, client)
      if (!result?.ok) deny(itemId)
      return Boolean(result?.ok)
    },
    [deny],
  )

  const finishPress = useCallback(() => {
    pressRef.current = null
    setGhost(null)
  }, [])

  const bindCell = useCallback(
    (itemId: ShopItemId) => ({
      onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
        if (event.button !== 0) return
        if (shopRef.current.cells[itemId]?.blocker) {
          deny(itemId)
          return
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        pressRef.current = { itemId, start: { x: event.clientX, y: event.clientY }, pointerId: event.pointerId, dragging: false }
      },
      onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
        const press = pressRef.current
        if (!press || press.pointerId !== event.pointerId) return
        const moved = Math.hypot(event.clientX - press.start.x, event.clientY - press.start.y)
        if (!press.dragging && moved < DRAG_START_DISTANCE) return
        press.dragging = true
        trackGhost(itemId, { x: event.clientX, y: event.clientY }, null)
      },
      onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
        const press = pressRef.current
        if (!press || press.pointerId !== event.pointerId) return
        const point = { x: event.clientX, y: event.clientY }
        finishPress()
        if (press.dragging) {
          if (!isOverInterface(point)) tryBuy(itemId, point)
          return
        }
        if (isPlacedItem(itemId)) {
          setPlacing(itemId)
          return
        }
        tryBuy(itemId, null)
      },
      onPointerCancel: finishPress,
    }),
    [deny, finishPress, trackGhost, tryBuy],
  )

  const overlayHandlers = {
    onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
      if (!placing) return
      const point = { x: event.clientX, y: event.clientY }
      if (isOverInterface(point, event.currentTarget)) {
        stopPlacing()
        return
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      overlayPressRef.current = event.pointerId
      trackGhost(placing, point, event.currentTarget)
    },
    onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
      if (placing) trackGhost(placing, { x: event.clientX, y: event.clientY }, event.currentTarget)
    },
    onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
      if (!placing || overlayPressRef.current !== event.pointerId) return
      overlayPressRef.current = null
      if (tryBuy(placing, { x: event.clientX, y: event.clientY })) stopPlacing()
    },
    onPointerLeave() {
      if (overlayPressRef.current === null) setGhost(null)
    },
  }

  return { ghost, placing, deniedId, deniedAt, bindCell, overlayHandlers, stopPlacing }
}
