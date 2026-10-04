import { memo } from 'react'
import { depthScale } from '../../game/projection'
import { hashString } from '../../game/random'
import type { CatnipPatch } from '../../game/types'
import styles from './CatnipPatches.module.css'

interface CatnipPatchesProps {
  patches: CatnipPatch[]
  time: number
  worldHeight: number
}

interface Flake {
  x: number
  y: number
  angle: number
  size: number
  shade: string
}

const shades = ['#5f9e4a', '#79b85c', '#4c8a3c', '#9ccc7a']
const flakeCount = 22

function flakesOf(patch: CatnipPatch): Flake[] {
  let seed = hashString(patch.id)
  const next = () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) >>> 0
    return seed / 4294967296
  }
  return Array.from({ length: flakeCount }, () => {
    const angle = next() * Math.PI * 2
    const reach = Math.sqrt(next())
    return {
      x: Math.cos(angle) * reach * patch.radius,
      y: Math.sin(angle) * reach * patch.radius * 0.42,
      angle: next() * 180,
      size: 1.6 + next() * 2.2,
      shade: shades[Math.floor(next() * shades.length)],
    }
  })
}

interface PatchProps {
  patch: CatnipPatch
  time: number
  worldHeight: number
}

function Patch({ patch, time, worldHeight }: PatchProps) {
  const size = depthScale(patch.position.y, worldHeight)
  const age = time - patch.createdAt
  const settle = Math.min(1, age / 0.4)
  return (
    <div className={styles.anchor} style={{ transform: `translate3d(${patch.position.x}px, ${patch.position.y}px, 0) scale(${size})`, opacity: Math.min(1, patch.potency * 1.6) }}>
      <svg className={styles.canvas} width="1" height="1" overflow="visible" aria-hidden="true">
        <ellipse className={styles.halo} cx={0} cy={0} rx={patch.radius * 1.05} ry={patch.radius * 0.46} />
        {flakesOf(patch).map((flake, index) => (
          <ellipse
            key={index}
            cx={flake.x * settle}
            cy={flake.y * settle - (1 - settle) * 20}
            rx={flake.size}
            ry={flake.size * 0.5}
            fill={flake.shade}
            transform={`rotate(${flake.angle} ${flake.x * settle} ${flake.y * settle})`}
          />
        ))}
      </svg>
    </div>
  )
}

function CatnipPatches({ patches, time, worldHeight }: CatnipPatchesProps) {
  return (
    <>
      {patches.map((patch) => (
        <Patch key={patch.id} patch={patch} time={time} worldHeight={worldHeight} />
      ))}
    </>
  )
}

export default memo(CatnipPatches)
