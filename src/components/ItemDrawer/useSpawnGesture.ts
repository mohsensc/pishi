import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { DRAG_START_DISTANCE } from '../../game/constants'
import type { SpawnableItem, Vec } from '../../game/types'
import type { DrawerEntry } from './itemCatalog'

export type SpawnRequest = (item: SpawnableItem, clientPoint: Vec | null) => boolean

export interface SpawnGhost {
  entry: DrawerEntry
  position: Vec
}

interface PressRecord {
  entry: DrawerEntry
  start: Vec
  pointerId: number
  dragging: boolean
}

const interfaceSelector = 'button, [data-ui]'

function isOverInterface(point: Vec): boolean {
  const element = document.elementFromPoint(point.x, point.y)
  return element?.closest(interfaceSelector) != null
}

export function useSpawnGesture(onSpawn: SpawnRequest) {
  const pressRef = useRef<PressRecord | null>(null)
  const [ghost, setGhost] = useState<SpawnGhost | null>(null)
  const [deniedKey, setDeniedKey] = useState<string | null>(null)
  const denyTimerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (denyTimerRef.current !== null) window.clearTimeout(denyTimerRef.current)
    },
    [],
  )

  const finish = useCallback(() => {
    pressRef.current = null
    setGhost(null)
  }, [])

  const deny = useCallback((key: string) => {
    setDeniedKey(key)
    if (denyTimerRef.current !== null) window.clearTimeout(denyTimerRef.current)
    denyTimerRef.current = window.setTimeout(() => setDeniedKey((current) => (current === key ? null : current)), 420)
  }, [])

  const bindEntry = useCallback(
    (entry: DrawerEntry) => ({
      onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
        if (event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        pressRef.current = { entry, start: { x: event.clientX, y: event.clientY }, pointerId: event.pointerId, dragging: false }
      },
      onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
        const press = pressRef.current
        if (!press || press.pointerId !== event.pointerId) return
        const moved = Math.hypot(event.clientX - press.start.x, event.clientY - press.start.y)
        if (!press.dragging && moved < DRAG_START_DISTANCE) return
        press.dragging = true
        setGhost({ entry, position: { x: event.clientX, y: event.clientY } })
      },
      onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
        const press = pressRef.current
        if (!press || press.pointerId !== event.pointerId) return
        const point = { x: event.clientX, y: event.clientY }
        const accepted = press.dragging ? !isOverInterface(point) && onSpawn(entry.item, point) : onSpawn(entry.item, null)
        const cancelledOverDock = press.dragging && isOverInterface(point)
        if (!accepted && !cancelledOverDock) deny(entry.key)
        finish()
      },
      onPointerCancel: finish,
    }),
    [deny, finish, onSpawn],
  )

  return { ghost, deniedKey, bindEntry }
}
