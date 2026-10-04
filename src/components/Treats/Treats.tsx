import { memo } from 'react'
import { depthScale } from '../../game/projection'
import type { TreatState } from '../../game/types'
import FishTreat from '../HeldItem/FishTreat'
import styles from './Treats.module.css'

interface TreatsProps {
  treats: TreatState[]
  worldHeight: number
}

interface DroppedTreatProps {
  treat: TreatState
  worldHeight: number
}

function DroppedTreat({ treat, worldHeight }: DroppedTreatProps) {
  const size = depthScale(treat.position.y, worldHeight)
  const lift = Math.min(1, treat.height / 120)
  const tilt = ((treat.id.length * 37 + Math.round(treat.position.x)) % 50) - 25
  return (
    <div
      className={styles.anchor}
      data-eaten={treat.eatenAt !== null}
      style={{ transform: `translate3d(${treat.position.x}px, ${treat.position.y}px, 0)`, zIndex: Math.round(treat.position.y) }}>
      <svg className={styles.canvas} width="1" height="1" overflow="visible" aria-hidden="true">
        <ellipse cx={0} cy={0} rx={8 * size * (1 - lift * 0.4)} ry={3 * size * (1 - lift * 0.4)} fill="rgba(38, 62, 24, 0.24)" />
        <g transform={`translate(0 ${-treat.height - 3 * size}) rotate(${tilt})`}>
          <FishTreat size={18 * size} />
        </g>
      </svg>
    </div>
  )
}

function Treats({ treats, worldHeight }: TreatsProps) {
  return (
    <>
      {treats.map((treat) => (
        <DroppedTreat key={treat.id} treat={treat} worldHeight={worldHeight} />
      ))}
    </>
  )
}

export default memo(Treats)
