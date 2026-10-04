import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'

const rippleDelays = [0, 0.18, 0.38]

export default function Splash({ effect, scale }: EffectViewProps) {
  const droplets = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(14, effect.intensity), (random) => {
        const angle = between(random, 0, Math.PI * 2)
        const reach = between(random, 18, 58) * scale
        const rise = between(random, 26, 62) * scale
        const endX = Math.cos(angle) * reach
        const endY = Math.sin(angle) * reach * 0.4
        return {
          size: between(random, 3, 6) * scale,
          x: [0, endX * 0.55, endX],
          y: [-4, -rise + endY * 0.5, endY],
          duration: between(random, 0.6, 0.85),
          delay: between(random, 0, 0.06),
        }
      }),
    [effect.id, scale, effect.intensity],
  )
  const ringWidth = 46 * scale
  return (
    <>
      {rippleDelays.map((delay) => (
        <Particle
          key={`ring${delay}`}
          size={ringWidth}
          height={ringWidth * 0.38}
          style={{ border: '2px solid rgba(236, 249, 251, 0.9)', borderRadius: '50%' }}
          initial={{ scale: 0.25, opacity: 0 }}
          animate={{ scale: [0.25, 1.4, 2.4], opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.1, delay, ease: 'easeOut' }}
        />
      ))}
      <Particle
        size={20 * scale}
        height={26 * scale}
        style={{ background: 'rgba(226, 246, 250, 0.85)', borderRadius: '50% 50% 45% 45%' }}
        initial={{ y: 0, scaleY: 0.2, opacity: 0 }}
        animate={{ y: [0, -14 * scale, -4 * scale], scaleY: [0.2, 1, 0.3], opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
      {droplets.map((droplet, index) => (
        <Particle
          key={index}
          size={droplet.size}
          style={{ background: '#c9ecf3', borderRadius: '50%' }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: droplet.x, y: droplet.y, opacity: [0, 1, 0] }}
          transition={{ duration: droplet.duration, delay: droplet.delay, ease: 'easeOut', y: { duration: droplet.duration, delay: droplet.delay, ease: ['easeOut', 'easeIn'] } }}
        />
      ))}
    </>
  )
}
