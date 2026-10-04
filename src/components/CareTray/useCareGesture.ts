import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { DRAG_START_DISTANCE } from '../../game/constants'
import type { TrayItemKind, Vec } from '../../game/types'
import type { CarePresenter } from '../../hooks/useCarePresenter'
import { isOverDiscardZone } from '../../hooks/dragGesture/pressTargets'

export interface TrayEntry {
  id: string
  kind: TrayItemKind
}

export interface CareGhost {
  itemId: string
  kind: TrayItemKind
  position: Vec
  overCat: boolean
  overTrash: boolean
  dragging: boolean
}

interface PressRecord {
  item: TrayEntry
  start: Vec
  pointerId: number
  dragging: boolean
}

interface CareGestureOptions {
  presenter: CarePresenter
  entries: TrayEntry[]
  onDiscard: (item: TrayEntry) => boolean
  onDragChange: (dragging: boolean) => void
}

const traySelector = '[data-care-tray]'
const interfaceSelector = 'button, [data-ui]'

function isOverInterface(point: Vec): boolean {
  const element = document.elementFromPoint(point.x, point.y)
  return element?.closest(interfaceSelector) != null
}

function pointOf(event: { clientX: number; clientY: number }): Vec {
  return { x: event.clientX, y: event.clientY }
}

export function useCareGesture({ presenter, entries, onDiscard, onDragChange }: CareGestureOptions) {
  const pressRef = useRef<PressRecord | null>(null)
  const [ghost, setGhost] = useState<CareGhost | null>(null)
  const [armedId, setArmedId] = useState<string | null>(null)
  const [deniedId, setDeniedId] = useState<string | null>(null)
  const denyTimerRef = useRef<number | null>(null)
  const armedItem = entries.find((item) => item.id === armedId) ?? null

  const deny = useCallback((id: string) => {
    setDeniedId(id)
    if (denyTimerRef.current !== null) window.clearTimeout(denyTimerRef.current)
    denyTimerRef.current = window.setTimeout(() => setDeniedId((current) => (current === id ? null : current)), 420)
  }, [])

  const disarm = useCallback(() => {
    setArmedId(null)
    setGhost(null)
    presenter.probe(null)
  }, [presenter])

  const endDrag = useCallback(() => {
    setGhost(null)
    presenter.probe(null)
    onDragChange(false)
  }, [onDragChange, presenter])

  useEffect(
    () => () => {
      if (denyTimerRef.current !== null) window.clearTimeout(denyTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!armedItem) return
    const handleDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(traySelector)) return
      const point = pointOf(event)
      if (!target?.closest(interfaceSelector) && presenter.probe(point, armedItem.kind)) {
        event.stopPropagation()
        event.preventDefault()
        if (!presenter.present(armedItem.kind, point)) deny(armedItem.id)
      }
      disarm()
    }
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const point = pointOf(event)
      setGhost({ itemId: armedItem.id, kind: armedItem.kind, position: point, overCat: presenter.probe(point, armedItem.kind) !== null, overTrash: false, dragging: false })
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') disarm()
    }
    window.addEventListener('pointerdown', handleDown, true)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('pointerdown', handleDown, true)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('keydown', handleKey)
    }
  }, [armedItem, deny, disarm, presenter])

  const bindItem = useCallback(
    (item: TrayEntry) => ({
      onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
        if (event.button !== 0) return
        event.stopPropagation()
        event.currentTarget.setPointerCapture(event.pointerId)
        pressRef.current = { item, start: pointOf(event), pointerId: event.pointerId, dragging: false }
      },
      onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
        const press = pressRef.current
        if (!press || press.pointerId !== event.pointerId) return
        const point = pointOf(event)
        if (!press.dragging && Math.hypot(point.x - press.start.x, point.y - press.start.y) < DRAG_START_DISTANCE) return
        if (!press.dragging) onDragChange(true)
        press.dragging = true
        setArmedId(null)
        const overTrash = isOverDiscardZone(point.x, point.y)
        const overCat = !overTrash && presenter.probe(point, item.kind) !== null
        if (overTrash) presenter.probe(null)
        setGhost({ itemId: item.id, kind: item.kind, position: point, overCat, overTrash, dragging: true })
      },
      onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
        const press = pressRef.current
        if (!press || press.pointerId !== event.pointerId) return
        pressRef.current = null
        const point = pointOf(event)
        if (press.dragging) {
          endDrag()
          if (isOverDiscardZone(point.x, point.y)) {
            if (!onDiscard(item)) deny(item.id)
            return
          }
          if (isOverInterface(point)) return
          if (!presenter.present(item.kind, point)) deny(item.id)
          return
        }
        setArmedId((current) => (current === item.id ? null : item.id))
      },
      onPointerCancel() {
        const press = pressRef.current
        pressRef.current = null
        if (press?.dragging) endDrag()
        else {
          setGhost(null)
          presenter.probe(null)
        }
      },
    }),
    [deny, endDrag, onDiscard, onDragChange, presenter],
  )

  return { ghost, armedId: armedItem?.id ?? null, deniedId, bindItem }
}
