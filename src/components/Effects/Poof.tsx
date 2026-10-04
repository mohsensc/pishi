import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'

const cloudFill = 'radial-gradient(circle, rgba(255, 255, 250, 0.98) 0%, rgba(246, 242, 228, 0.75) 50%, rgba(240, 236, 220, 0) 74%)'
const confettiTones = ['#f3c45b', '#ef8f7a', '#8cc7d8', '#9cc96b', '#fff7cf']

export default function Poof({ effect, scale, lift }: EffectViewProps) {
  const reach = 44 * scale * Math.max(0.6, effect.intensity)
  const clouds = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(10, effect.intensity, 6), (random, index) => {
        const angle = (index / 10) * Math.PI * 2 + between(random, -0.25, 0.25)
        const distance = between(random, 0.55, 1) * reach
        return {
          size: between(random, 22, 34) * scale * Math.max(0.7, effect.intensity),
          x: Math.cos(angle) * distance,
          y: -lift - 18 * scale + Math.sin(angle) * distance * 0.55,
          duration: between(random, 0.55, 0.8),
        }
      }),
    [effect.id, effect.intensity, lift, reach, scale],
  )
  const confetti = useMemo(
    () =>
      buildParticles(
        effect.id,
        9,
        (random, index) => {
          const angle = between(random, -Math.PI * 0.95, -Math.PI * 0.05)
          const distance = between(random, 0.7, 1.4) * reach
          return {
            size: between(random, 4, 6.5) * scale,
            x: Math.cos(angle) * distance,
            y: -lift - 20 * scale + Math.sin(angle) * distance,
            fall: between(random, 18, 34) * scale,
            spin: between(random, -260, 260),
            tone: confettiTones[index % confettiTones.length],
            delay: between(random, 0, 0.08),
          }
        },
        7,
      ),
    [effect.id, lift, reach, scale],
  )
  return (
    <>
      <Particle
        size={reach * 1.6}
        height={reach * 0.6}
        style={{ border: `${Math.max(1.5, 2.2 * scale)}px solid rgba(255, 255, 244, 0.85)`, borderRadius: '50%' }}
        initial={{ y: -lift, scale: 0.2, opacity: 0 }}
        animate={{ y: -lift, scale: [0.2, 1.1, 1.6], opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <Particle
        size={reach * 1.1}
        style={{ background: 'radial-gradient(circle, rgba(255, 252, 232, 0.95) 0%, rgba(255, 252, 232, 0) 65%)', borderRadius: '50%' }}
        initial={{ y: -lift - 18 * scale, scale: 0.3, opacity: 0 }}
        animate={{ y: -lift - 18 * scale, scale: [0.3, 1.25, 0.6], opacity: [0, 1, 0] }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
      {clouds.map((cloud, index) => (
        <Particle
          key={`cloud${index}`}
          size={cloud.size}
          style={{ background: cloudFill, borderRadius: '50%' }}
          initial={{ x: 0, y: -lift - 18 * scale, scale: 0.4, opacity: 0 }}
          animate={{ x: cloud.x, y: cloud.y, scale: [0.4, 1.3, 0.2], opacity: [0, 1, 0] }}
          transition={{ duration: cloud.duration, ease: 'easeOut' }}
        />
      ))}
      {confetti.map((bit, index) => (
        <Particle
          key={`bit${index}`}
          size={bit.size}
          height={bit.size * 0.6}
          style={{ background: bit.tone, borderRadius: 1.5 }}
          initial={{ x: 0, y: -lift - 20 * scale, opacity: 0, rotate: 0 }}
          animate={{ x: [0, bit.x, bit.x * 1.1], y: [-lift - 20 * scale, bit.y, bit.y + bit.fall], opacity: [0, 1, 0], rotate: bit.spin }}
          transition={{ duration: 0.9, delay: bit.delay, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}
