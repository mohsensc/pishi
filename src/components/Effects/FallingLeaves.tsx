import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, pickFrom, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'

const leafColors = ['#4f8f47', '#66a656', '#86bf6c', '#a7c75a', '#d6b84a']

export default function FallingLeaves({ effect, scale, lift }: EffectViewProps) {
  const leaves = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(22, effect.intensity), (random) => {
        const startX = between(random, -95, 95) * scale
        const startY = -lift + between(random, -50, 30) * scale
        const endY = -between(random, 0, 18) * scale
        const sway = between(random, 10, 22) * scale * (random() > 0.5 ? 1 : -1)
        const tilt = between(random, -60, 60)
        return {
          size: between(random, 9, 14) * scale,
          color: pickFrom(random, leafColors),
          x: [startX, startX + sway, startX - sway * 0.8, startX + sway * 0.6, startX + sway * 0.2],
          y: [startY, startY + (endY - startY) * 0.25, startY + (endY - startY) * 0.55, startY + (endY - startY) * 0.85, endY],
          rotate: [tilt, tilt + 70, tilt - 30, tilt + 50, tilt + 20],
          duration: between(random, 1.05, 1.3),
          delay: between(random, 0, 0.1),
        }
      }),
    [effect.id, scale, lift, effect.intensity],
  )
  return (
    <>
      {leaves.map((leaf, index) => (
        <Particle
          key={index}
          size={leaf.size}
          height={leaf.size * 0.62}
          style={{ background: leaf.color, borderRadius: '0 80% 0 80%' }}
          initial={{ x: leaf.x[0], y: leaf.y[0], rotate: leaf.rotate[0], opacity: 0 }}
          animate={{ x: leaf.x, y: leaf.y, rotate: leaf.rotate, opacity: [0, 1, 1, 1, 0] }}
          transition={{ duration: leaf.duration, delay: leaf.delay, ease: 'linear' }}
        />
      ))}
    </>
  )
}
