import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, pickFrom, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'
import styles from './Effects.module.css'

const heartPath = 'M 6 10.5 C 1.5 7.4 0 5.3 0 3.3 C 0 1.4 1.4 0 3.2 0 C 4.4 0 5.4 0.7 6 1.7 C 6.6 0.7 7.6 0 8.8 0 C 10.6 0 12 1.4 12 3.3 C 12 5.3 10.5 7.4 6 10.5 Z'
const heartColors = ['#ef6b7b', '#f48a98', '#e8566a']

export default function Hearts({ effect, scale, lift }: EffectViewProps) {
  const hearts = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(4, effect.intensity, 2), (random, index) => {
        const startX = between(random, -12, 12) * scale
        const sway = between(random, 6, 12) * scale * (index % 2 === 0 ? 1 : -1)
        const rise = between(random, 36, 58) * scale
        return {
          size: between(random, 10, 15) * scale,
          color: pickFrom(random, heartColors),
          x: [startX, startX + sway, startX - sway * 0.6, startX + sway * 0.4],
          y: [-lift, -lift - rise * 0.35, -lift - rise * 0.7, -lift - rise],
          delay: index * 0.14 + between(random, 0, 0.06),
        }
      }),
    [effect.id, scale, lift, effect.intensity],
  )
  return (
    <>
      {hearts.map((heart, index) => (
        <Particle
          key={index}
          size={heart.size}
          initial={{ x: heart.x[0], y: heart.y[0], scale: 0, opacity: 0 }}
          animate={{ x: heart.x, y: heart.y, scale: [0, 1.15, 1, 0.85], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.05, delay: heart.delay, ease: 'easeOut' }}>
          <svg className={styles.vector} viewBox="0 0 12 10.5" width={heart.size} height={heart.size * 0.875}>
            <path d={heartPath} fill={heart.color} />
          </svg>
        </Particle>
      ))}
    </>
  )
}
