import { useState, type RefObject } from 'react'
import type { PointerState, Vec } from '../game/types'
import { useAnimationFrame } from './useAnimationFrame'

export interface PointerSnapshot {
  position: Vec
  velocity: Vec
  active: boolean
}

function sameSnapshot(first: PointerSnapshot, second: PointerSnapshot): boolean {
  return (
    first.active === second.active &&
    first.position.x === second.position.x &&
    first.position.y === second.position.y &&
    first.velocity.x === second.velocity.x &&
    first.velocity.y === second.velocity.y
  )
}

export function usePointerSnapshot(pointerRef: RefObject<PointerState>, enabled: boolean): PointerSnapshot {
  const [snapshot, setSnapshot] = useState<PointerSnapshot>({ position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, active: false })
  useAnimationFrame(() => {
    const pointer = pointerRef.current
    const next = { position: { ...pointer.position }, velocity: { ...pointer.velocity }, active: pointer.active }
    setSnapshot((previous) => (sameSnapshot(previous, next) ? previous : next))
  }, enabled)
  return snapshot
}
