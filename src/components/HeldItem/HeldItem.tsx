import type { RefObject } from 'react'
import { usePointerSnapshot } from '../../hooks/usePointerSnapshot'
import { depthScale } from '../../game/projection'
import { WAND_STRING_LENGTH } from '../../game/tools/toolConstants'
import type { HeldToyState, PointerState } from '../../game/types'
import Brush from './Brush'
import CatnipPinch from './CatnipPinch'
import FishTreat from './FishTreat'
import WandLine from './WandLine'
import styles from './HeldItem.module.css'

interface HeldItemProps {
  heldToy: HeldToyState | null
  worldHeight: number
  pointerRef: RefObject<PointerState>
}

function tensionOf(toy: HeldToyState): number {
  if (!toy.grabbedByCatId) return 0
  return Math.min(1, 0.4 + Math.max(0, toy.tugProgress) * 0.6)
}

export default function HeldItem({ heldToy, worldHeight, pointerRef }: HeldItemProps) {
  const pointer = usePointerSnapshot(pointerRef, heldToy !== null)
  if (!heldToy) return null
  const screen = { x: heldToy.position.x, y: heldToy.position.y - heldToy.height }
  const size = depthScale(heldToy.position.y, worldHeight)
  const cursor = pointer.active ? pointer.position : screen
  const ready = heldToy.snatchedAt === null
  return (
    <svg className={styles.layer} data-tool={heldToy.tool} aria-hidden="true">
      {heldToy.tool === 'laser' && (
        <g transform={`translate(${screen.x} ${screen.y})`}>
          <circle r={16} className={styles.laserGlow} />
          <circle r={4.2} fill="#ff3b2f" />
          <circle r={1.8} fill="#ffd9d4" />
        </g>
      )}
      {heldToy.tool === 'treat' && (
        <g transform={`translate(${screen.x} ${screen.y})`}>
          <g className={styles.pop} data-ready={ready}>
            <FishTreat size={32 * size} />
          </g>
        </g>
      )}
      {heldToy.tool === 'wand' && (
        <WandLine tip={cursor} feather={screen} size={Math.max(0.8, size)} tension={tensionOf(heldToy)} restLength={WAND_STRING_LENGTH} />
      )}
      {heldToy.tool === 'brush' && (
        <g transform={`translate(${screen.x} ${screen.y})`}>
          <Brush tilt={Math.max(-18, Math.min(18, pointer.velocity.x * 0.03))} size={40 * size} />
        </g>
      )}
      {heldToy.tool === 'catnip' && (
        <g transform={`translate(${screen.x} ${screen.y})`}>
          <CatnipPinch size={22 * size} wiggle={Math.sin(pointer.position.x * 0.05) * 12} />
        </g>
      )}
    </svg>
  )
}
