import { memo } from 'react'
import { arcPoint, horizonFade, moonProgress, type SkyFrame } from './skyArc'
import styles from './Moon.module.css'

interface MoonProps {
  frame: SkyFrame
  dayTime: number
  darkness: number
}

function Moon({ frame, dayTime, darkness }: MoonProps) {
  const progress = moonProgress(dayTime)
  if (progress === null || darkness <= 0.02) return null
  const point = arcPoint(progress, frame)
  const opacity = darkness * horizonFade(progress)
  return (
    <svg className={styles.moon} width={frame.width} height={frame.horizon} style={{ opacity }} aria-hidden="true">
      <defs>
        <mask id="moonCrescent">
          <circle cx={point.x} cy={point.y} r={17} fill="#ffffff" />
          <circle cx={point.x + 8} cy={point.y - 5} r={15} fill="#000000" />
        </mask>
      </defs>
      <circle cx={point.x} cy={point.y} r={30} fill="#fff8dc" opacity={0.12} />
      <circle cx={point.x} cy={point.y} r={17} fill="#fff6d8" mask="url(#moonCrescent)" />
    </svg>
  )
}

export default memo(Moon)
