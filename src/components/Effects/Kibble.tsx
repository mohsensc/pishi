import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, pickFrom, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'

const kibbleTones = ['#9a6236', '#b87a45', '#8a5530', '#c58a50']

export default function Kibble({ effect, scale, lift }: EffectViewProps) {
  const bits = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(12, effect.intensity), (random) => {
        const startY = -lift - 12 * scale
        const endX = between(random, -42, 42) * scale
        const endY = between(random, -6, 10) * scale
        const hop = between(random, 22, 46) * scale
        return {
          size: between(random, 4, 6) * scale,
          color: pickFrom(random, kibbleTones),
          x: [0, endX * 0.55, endX * 0.85, endX],
          y: [startY, startY - hop, endY, endY - hop * 0.3, endY],
          rotate: between(random, -180, 180),
          duration: between(random, 0.75, 1),
          delay: between(random, 0, 0.12),
        }
      }),
    [effect.id, scale, lift, effect.intensity],
  )
  return (
    <>
      {bits.map((bit, index) => (
        <Particle
          key={index}
          size={bit.size}
          height={bit.size * 0.8}
          style={{ background: bit.color, borderRadius: '40%' }}
          initial={{ x: 0, y: bit.y[0], opacity: 0 }}
          animate={{ x: [0, bit.x[1], bit.x[2], bit.x[3], bit.x[3]], y: bit.y, rotate: bit.rotate, opacity: [0, 1, 1, 1, 0] }}
          transition={{ duration: bit.duration + 0.3, delay: bit.delay, times: [0, 0.3, 0.55, 0.7, 1], ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}
