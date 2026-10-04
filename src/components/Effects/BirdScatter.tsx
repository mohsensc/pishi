import { useMemo } from 'react'
import { motion } from 'motion/react'
import Particle from './Particle'
import { between, buildParticles, scaledCount } from './particles'
import type { EffectViewProps } from './effectView'
import styles from './Effects.module.css'

const birdTones = ['#7b8fa6', '#c9704f', '#8a7a62', '#e2b04a']

export default function BirdScatter({ effect, scale, lift }: EffectViewProps) {
  const birds = useMemo(
    () =>
      buildParticles(effect.id, scaledCount(3, effect.intensity, 2), (random, index) => {
        const side = index % 2 === 0 ? -1 : 1
        return {
          size: between(random, 13, 17) * scale,
          x: side * between(random, 90, 170) * scale,
          y: -lift - between(random, 110, 190) * scale,
          tone: birdTones[Math.floor(random() * birdTones.length)],
          flap: between(random, 0.16, 0.22),
          delay: index * 0.07,
          side,
        }
      }),
    [effect.id, effect.intensity, lift, scale],
  )
  const feathers = useMemo(
    () =>
      buildParticles(
        effect.id,
        4,
        (random) => ({
          size: between(random, 5, 8) * scale,
          x: between(random, -26, 26) * scale,
          y: -lift + between(random, -6, 10) * scale,
          sway: between(random, 6, 14) * scale,
          duration: between(random, 1.1, 1.4),
        }),
        13,
      ),
    [effect.id, lift, scale],
  )
  return (
    <>
      {birds.map((bird, index) => (
        <Particle
          key={`bird${index}`}
          size={bird.size * 2}
          height={bird.size * 1.4}
          initial={{ x: 0, y: -lift, opacity: 1, scale: 0.9 }}
          animate={{ x: [0, bird.x * 0.35, bird.x], y: [-lift, -lift - 40 * scale, bird.y], opacity: [1, 1, 0], scale: [0.9, 1, 0.7] }}
          transition={{ duration: 1.25, delay: bird.delay, ease: 'easeOut' }}>
          <svg className={styles.vector} viewBox="-10 -8 20 14" width={bird.size * 2} height={bird.size * 1.4} style={{ left: 0, top: 0, transform: `scaleX(${bird.side})` }}>
            <ellipse cx={0} cy={1} rx={5.4} ry={3.6} fill={bird.tone} />
            <circle cx={4.4} cy={-1.4} r={2.6} fill={bird.tone} />
            <path d="M 6.8 -1.6 L 9 -1 L 6.8 -0.4 Z" fill="#e8a33c" />
            <motion.path
              d="M -1 0 Q -6 -8 -9 -5 Q -5 -2 -1 1 Z"
              fill="#ffffff"
              opacity={0.75}
              style={{ originX: 1, originY: 1 }}
              animate={{ scaleY: [1, -0.6, 1] }}
              transition={{ duration: bird.flap, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </Particle>
      ))}
      {feathers.map((feather, index) => (
        <Particle
          key={`feather${index}`}
          size={feather.size}
          height={feather.size * 0.45}
          style={{ background: '#f4efe4', borderRadius: '50%' }}
          initial={{ x: 0, y: -lift - 30 * scale, opacity: 0, rotate: 0 }}
          animate={{ x: [0, feather.x - feather.sway, feather.x + feather.sway, feather.x], y: [-lift - 30 * scale, feather.y - 18 * scale, feather.y], opacity: [0, 1, 1, 0], rotate: [0, 40, -30, 10] }}
          transition={{ duration: feather.duration, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}
