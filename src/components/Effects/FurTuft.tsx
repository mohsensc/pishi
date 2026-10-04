import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, pickFrom, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'
import styles from './Effects.module.css'

const tuftTones = ['#f4f1ea', '#e3ddd2', '#3a3a40', '#c9c3b8']
const tuftPath = 'M 2 7 C 0 7 0 4 2 4 C 2 2 5 1 6 3 C 8 2 10 4 9 6 C 10 8 7 9 6 8 C 5 9 3 9 2 7 Z'
const wispPath = 'M 1 4 C 0 2 1 1 0 0 M 9 6 C 10 4 9.5 3 10 1.5'

export default function FurTuft({ effect, scale, lift }: EffectViewProps) {
  const tufts = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(5, effect.intensity, 3), (random, index) => {
        const direction = index % 2 === 0 ? 1 : -1
        const startX = between(random, -10, 10) * scale
        const drift = between(random, 16, 34) * scale * direction
        const rise = between(random, 8, 22) * scale
        return {
          size: between(random, 10, 15) * scale,
          color: pickFrom(random, tuftTones),
          x: [startX, startX + drift * 0.4, startX + drift * 0.75, startX + drift],
          y: [-lift, -lift - rise, -lift - rise * 0.6, -lift + rise * 0.3],
          rotate: [0, direction * 40, direction * -10, direction * 60],
          delay: between(random, 0, 0.12),
        }
      }),
    [effect.id, scale, lift, effect.intensity],
  )
  return (
    <>
      {tufts.map((tuft, index) => (
        <Particle
          key={index}
          size={tuft.size}
          initial={{ x: tuft.x[0], y: tuft.y[0], opacity: 0 }}
          animate={{ x: tuft.x, y: tuft.y, rotate: tuft.rotate, opacity: [0, 1, 0.9, 0] }}
          transition={{ duration: 1.25, delay: tuft.delay, ease: 'easeOut' }}>
          <svg className={styles.vector} viewBox="0 0 10 10" width={tuft.size} height={tuft.size}>
            <path d={tuftPath} fill={tuft.color} />
            <path d={wispPath} stroke={tuft.color} strokeWidth={0.8} strokeLinecap="round" fill="none" />
          </svg>
        </Particle>
      ))}
    </>
  )
}
