import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, pickFrom, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'

const petalColors = ['#f3a9c1', '#f07c6a', '#f6c24c', '#fbe3ea', '#f4efe2', '#9fc3ee']

export default function Petals({ effect, scale, lift }: EffectViewProps) {
  const petals = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(16, effect.intensity), (random) => {
        const angle = between(random, 0, Math.PI * 2)
        const reach = between(random, 20, 64) * scale
        const endX = Math.cos(angle) * reach
        const rise = between(random, 30, 70) * scale
        const baseY = -lift - 10 * scale
        return {
          size: between(random, 5, 8) * scale,
          color: pickFrom(random, petalColors),
          x: [0, endX * 0.6, endX, endX * 1.15],
          y: [baseY, baseY - rise, baseY - rise * 0.7, baseY - rise * 0.2 + Math.sin(angle) * reach * 0.3],
          rotate: [0, between(random, -120, 120), between(random, -200, 200), between(random, -260, 260)],
          duration: between(random, 1.05, 1.3),
          delay: between(random, 0, 0.08),
        }
      }),
    [effect.id, scale, lift, effect.intensity],
  )
  return (
    <>
      {petals.map((petal, index) => (
        <Particle
          key={index}
          size={petal.size}
          height={petal.size * 0.72}
          style={{ background: petal.color, borderRadius: '60% 60% 60% 0' }}
          initial={{ x: 0, y: petal.y[0], opacity: 0 }}
          animate={{ x: petal.x, y: petal.y, rotate: petal.rotate, opacity: [0, 1, 1, 0] }}
          transition={{ duration: petal.duration, delay: petal.delay, times: [0, 0.25, 0.6, 1], ease: 'easeOut' }}
        />
      ))}
    </>
  )
}
