import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'

const bubbleSkin = 'radial-gradient(circle at 34% 30%, rgba(255, 255, 255, 0.95) 0 14%, rgba(214, 238, 250, 0.35) 22%, rgba(196, 226, 246, 0.16) 58%, rgba(255, 214, 236, 0.5) 86%, rgba(255, 255, 255, 0.85) 100%)'

export default function Bubbles({ effect, scale, lift }: EffectViewProps) {
  const bubbles = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(9, effect.intensity, 3), (random) => {
        const rise = between(random, 40, 110) * scale
        const drift = between(random, -46, 46) * scale
        return {
          size: between(random, 8, 17) * scale,
          x: [0, drift * 0.5, drift],
          y: [-lift, -lift - rise * 0.6, -lift - rise],
          duration: between(random, 0.8, 1.3),
          delay: between(random, 0, 0.25),
        }
      }),
    [effect.id, effect.intensity, lift, scale],
  )
  return (
    <>
      {bubbles.map((bubble, index) => (
        <Particle
          key={index}
          size={bubble.size}
          style={{ background: bubbleSkin, borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.7)' }}
          initial={{ x: 0, y: -lift, scale: 0.3, opacity: 0 }}
          animate={{ x: bubble.x, y: bubble.y, scale: [0.3, 1, 1.05, 1.5], opacity: [0, 0.95, 0.9, 0] }}
          transition={{ duration: bubble.duration, delay: bubble.delay, ease: 'easeOut', times: [0, 0.25, 0.85, 1] }}
        />
      ))}
    </>
  )
}
