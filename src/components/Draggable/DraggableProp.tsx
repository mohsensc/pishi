import type { ReactNode } from 'react'
import type { PropState } from '../../game/types'
import { depthScale } from '../../game/projection'
import Draggable from './Draggable'

interface DraggablePropProps {
  prop: PropState
  worldHeight: number
  time: number
  discarding: boolean
  children: ReactNode
}

function pivotOf(prop: PropState): { x: number; y: number } {
  if (!prop.tunnelExit) return prop.position
  return { x: (prop.position.x + prop.tunnelExit.x) / 2, y: (prop.position.y + prop.tunnelExit.y) / 2 }
}

function footprintWidth(prop: PropState, worldHeight: number): number {
  const span = prop.tunnelExit ? Math.hypot(prop.tunnelExit.x - prop.position.x, prop.tunnelExit.y - prop.position.y) + prop.radius * 2 : prop.radius * 2.3
  return span * depthScale(prop.position.y, worldHeight)
}

export default function DraggableProp({ prop, worldHeight, time, discarding, children }: DraggablePropProps) {
  const pivot = pivotOf(prop)
  return (
    <Draggable
      x={pivot.x}
      y={pivot.y}
      depth={pivot.y}
      footprint={footprintWidth(prop, worldHeight)}
      lift={prop.lift}
      tilt={prop.tilt}
      droppedAt={prop.droppedAt}
      time={time}
      discarding={discarding}>
      {children}
    </Draggable>
  )
}
