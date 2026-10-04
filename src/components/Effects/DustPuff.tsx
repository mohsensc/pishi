import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'

export default function DustPuff({ effect, scale, lift }: EffectViewProps) {
  const puffs = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(8, effect.intensity, 4), (random, index) => {
        const angle = (index / 8) * Math.PI * 2 + between(random, -0.3, 0.3)
        const reach = between(random, 18, 42) * scale * Math.max(0.6, effect.intensity)
        return {
          size: between(random, 18, 28) * scale,
          x: Math.cos(angle) * reach,
          y: -lift + Math.sin(angle) * reach * 0.35 - between(random, 4, 14) * scale,
          duration: between(random, 0.8, 1.15),
        }
      }),
    [effect.id, scale, lift, effect.intensity],
  )
  return (
    <>
      {puffs.map((puff, index) => (
        <Particle
          key={index}
          size={puff.size}
          height={puff.size * 0.8}
          style={{ background: 'radial-gradient(circle, rgba(236, 222, 186, 0.95) 0%, rgba(230, 212, 172, 0.6) 45%, rgba(226, 208, 168, 0) 72%)' }}
          initial={{ x: 0, y: -lift, scale: 0.3, opacity: 0 }}
          animate={{ x: puff.x, y: puff.y, scale: [0.3, 1.2, 1.7], opacity: [0, 0.9, 0] }}
          transition={{ duration: puff.duration, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}
