import { memo, type CSSProperties } from 'react'
import type { Vec } from '../../game/types'
import { goldenness, multiplyTint, nightness } from './skyTint'
import Moon from '../Sky/Moon'
import { skyFrameOf } from '../Sky/skyArc'
import styles from './DayNightOverlay.module.css'

export interface LightSpot {
  base: Vec
  head: Vec
  scale: number
}

interface DayNightOverlayProps {
  dayTime: number
  width: number
  height: number
  lights?: LightSpot[]
}

const fireflySeeds = Array.from({ length: 12 }, (_, index) => ({
  left: (index * 37 + 11) % 97,
  top: 24 + ((index * 53 + 7) % 70),
  delay: (index * 0.73) % 4,
  duration: 5 + ((index * 1.7) % 4),
}))

function maskFor(lights: LightSpot[]): CSSProperties {
  if (lights.length === 0) return {}
  const holes = lights.flatMap((light) => [
    `radial-gradient(ellipse ${130 * light.scale}px ${56 * light.scale}px at ${light.base.x}px ${light.base.y}px, transparent 25%, black 100%)`,
    `radial-gradient(circle ${46 * light.scale}px at ${light.head.x}px ${light.head.y}px, transparent 20%, black 100%)`,
  ])
  const image = holes.join(', ')
  return { maskImage: image, WebkitMaskImage: image, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }
}

function DayNightOverlay({ dayTime, width, height, lights = [] }: DayNightOverlayProps) {
  const dark = nightness(dayTime)
  const tint = multiplyTint(dayTime)
  const golden = goldenness(dayTime)
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.tint} style={{ backgroundColor: tint, ...maskFor(dark > 0.05 ? lights : []) }} />
      {golden > 0.01 && <div className={styles.glow} style={{ opacity: golden }} />}
      {dark > 0.02 && (
        <>
          <div className={styles.stars} style={{ opacity: dark }} />
          <Moon frame={skyFrameOf(width, height, 0.72)} dayTime={Math.round(dayTime * 900) / 900} darkness={dark} />
          <div className={styles.fireflies} style={{ opacity: dark }}>
            {fireflySeeds.map((seed) => (
              <span
                key={`${seed.left}-${seed.top}`}
                className={styles.firefly}
                style={{ left: `${seed.left}%`, top: `${seed.top}%`, animationDelay: `${seed.delay}s`, animationDuration: `${seed.duration}s` }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default memo(DayNightOverlay)
