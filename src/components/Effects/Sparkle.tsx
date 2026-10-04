import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'
import styles from './Effects.module.css'

const starPath = 'M 5 0 Q 5.6 4.4 10 5 Q 5.6 5.6 5 10 Q 4.4 5.6 0 5 Q 4.4 4.4 5 0 Z'

export default function Sparkle({ effect, scale, lift }: EffectViewProps) {
  const stars = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(6, effect.intensity, 1), (random, index) => {
        const angle = between(random, 0, Math.PI * 2)
        const reach = index === 0 ? 0 : between(random, 8, 30) * scale * Math.max(0.5, effect.intensity)
        return {
          size: between(random, 12, 19) * scale,
          x: Math.cos(angle) * reach,
          y: -lift + Math.sin(angle) * reach - between(random, 0, 10) * scale,
          drift: between(random, -8, 8) * scale,
          delay: between(random, 0, 0.35),
          duration: between(random, 0.7, 0.95),
        }
      }),
    [effect.id, scale, lift, effect.intensity],
  )
  return (
    <>
      {stars.map((star, index) => (
        <Particle
          key={index}
          size={star.size * 2}
          initial={{ x: star.x, y: star.y, scale: 0, opacity: 0 }}
          animate={{ x: star.x + star.drift, y: star.y - 8 * scale, scale: [0, 1, 0.6, 0], opacity: [0, 1, 0.9, 0], rotate: [0, 25, 45] }}
          transition={{ duration: star.duration, delay: star.delay, ease: 'easeOut' }}
          style={{ background: 'radial-gradient(circle, rgba(255, 246, 196, 0.75) 0%, rgba(255, 246, 196, 0) 60%)', borderRadius: '50%' }}>
          <svg className={styles.vector} viewBox="0 0 10 10" width={star.size} height={star.size} style={{ left: star.size / 2, top: star.size / 2 }}>
            <path d={starPath} fill="#fff7cf" />
          </svg>
        </Particle>
      ))}
    </>
  )
}
