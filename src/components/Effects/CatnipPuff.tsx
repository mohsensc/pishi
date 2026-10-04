import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, pickFrom, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'

const fleckColors = ['#7fbf5a', '#a6d67a', '#5f9e4b', '#c4e59a']

export default function CatnipPuff({ effect, scale, lift }: EffectViewProps) {
  const flecks = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(16, effect.intensity), (random) => {
        const angle = between(random, 0, Math.PI * 2)
        const reach = between(random, 14, 46) * scale
        const rise = between(random, 18, 52) * scale
        const swirl = between(random, -14, 14) * scale
        const endX = Math.cos(angle) * reach
        return {
          size: between(random, 4, 6.5) * scale,
          color: pickFrom(random, fleckColors),
          x: [0, endX * 0.5 + swirl, endX - swirl * 0.5, endX + swirl * 0.3],
          y: [-lift, -lift - rise * 0.5 + Math.sin(angle) * reach * 0.25, -lift - rise, -lift - rise * 0.8],
          duration: between(random, 1.05, 1.3),
          delay: between(random, 0, 0.1),
        }
      }),
    [effect.id, scale, lift, effect.intensity],
  )
  const cloudSize = 80 * scale * Math.max(0.6, Math.min(1.4, effect.intensity))
  return (
    <>
      <Particle
        size={cloudSize}
        height={cloudSize * 0.6}
        style={{ background: 'radial-gradient(ellipse, rgba(168, 220, 120, 0.7) 0%, rgba(168, 220, 120, 0.35) 45%, rgba(176, 222, 130, 0) 70%)' }}
        initial={{ y: -lift, scale: 0.3, opacity: 0 }}
        animate={{ y: -lift - 10 * scale, scale: [0.3, 1.1, 1.5], opacity: [0, 0.9, 0] }}
        transition={{ duration: 1.25, ease: 'easeOut' }}
      />
      {flecks.map((fleck, index) => (
        <Particle
          key={index}
          size={fleck.size}
          height={fleck.size * 0.7}
          style={{ background: fleck.color, borderRadius: '50% 10% 50% 10%' }}
          initial={{ x: 0, y: fleck.y[0], opacity: 0 }}
          animate={{ x: fleck.x, y: fleck.y, rotate: [0, 90, 200, 280], opacity: [0, 1, 0.9, 0] }}
          transition={{ duration: fleck.duration, delay: fleck.delay, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}
