import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { DRAG_START_DISTANCE } from '../../game/constants'
import type { CareItem, CareItemKind, Vec } from '../../game/types'
import type { CarePresenter } from '../../hooks/useCarePresenter'

export interface CareGhost {
  itemId: string
  kind: CareItemKind
  position: Vec
  overCat: boolean
  dragging: boolean
}

interface PressRecord {
  item: CareItem
  start: Vec
  pointerId: number
  dragging: boolean
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

export function useCareGesture(presenter: CarePresenter, inventory: CareItem[]) {
  const pressRef = useRef<PressRecord | null>(null)
  const [ghost, setGhost] = useState<CareGhost | null>(null)
  const [armedId, setArmedId] = useState<string | null>(null)
  const [deniedId, setDeniedId] = useState<string | null>(null)
  const denyTimerRef = useRef<number | null>(null)
  const armedItem = inventory.find((item) => item.id === armedId) ?? null

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
      if (!target?.closest(interfaceSelector) && presenter.probe(point)) {
        event.stopPropagation()
        event.preventDefault()
        if (!presenter.present(armedItem.kind, point)) deny(armedItem.id)
      }
      disarm()
    }
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const point = pointOf(event)
      setGhost({ itemId: armedItem.id, kind: armedItem.kind, position: point, overCat: presenter.probe(point) !== null, dragging: false })
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
    (item: CareItem) => ({
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
        press.dragging = true
        setArmedId(null)
        setGhost({ itemId: item.id, kind: item.kind, position: point, overCat: presenter.probe(point) !== null, dragging: true })
      },
      onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
        const press = pressRef.current
        if (!press || press.pointerId !== event.pointerId) return
        pressRef.current = null
        const point = pointOf(event)
        if (press.dragging) {
          setGhost(null)
          if (isOverInterface(point)) {
            presenter.probe(null)
            return
          }
          if (!presenter.present(item.kind, point)) deny(item.id)
          return
        }
        setArmedId((current) => (current === item.id ? null : item.id))
      },
      onPointerCancel() {
        pressRef.current = null
        setGhost(null)
        presenter.probe(null)
      },
    }),
    [deny, presenter],
  )

  return { ghost, armedId: armedItem?.id ?? null, deniedId, bindItem }
}
