import { useMemo } from 'react'
import Particle from './Particle'
import { between, buildParticles, pickFrom, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'

const crumbTones = ['#d9a764', '#c48a4a', '#e8c088', '#b77a3e']

export default function Crumbs({ effect, scale, lift }: EffectViewProps) {
  const crumbs = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(9, effect.intensity), (random) => {
        const endX = between(random, -22, 22) * scale
        const hop = between(random, 6, 16) * scale
        const endY = between(random, -3, 5) * scale
        return {
          size: between(random, 2.2, 3.8) * scale,
          color: pickFrom(random, crumbTones),
          x: [0, endX * 0.5, endX, endX * 1.1],
          y: [-lift, -lift - hop, endY, endY - hop * 0.2],
          duration: between(random, 0.6, 0.9),
          delay: between(random, 0, 0.25),
        }
      }),
    [effect.id, scale, lift, effect.intensity],
  )
  return (
    <>
      {crumbs.map((crumb, index) => (
        <Particle
          key={index}
          size={crumb.size}
          style={{ background: crumb.color, borderRadius: '35%' }}
          initial={{ x: 0, y: crumb.y[0], opacity: 0 }}
          animate={{ x: crumb.x, y: crumb.y, opacity: [0, 1, 1, 0] }}
          transition={{ duration: crumb.duration, delay: crumb.delay, times: [0, 0.25, 0.75, 1], ease: 'easeIn' }}
        />
      ))}
    </>
  )
}
