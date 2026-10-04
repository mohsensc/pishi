import { useMemo } from 'react'
import { motion } from 'motion/react'
import Particle from './Particle'
import { between, buildParticles, pickFrom } from './particles'
import type { EffectViewProps } from './effectView'
import styles from './Effects.module.css'

const yarnColors = ['#e0584a', '#4a8fc0', '#f2b233', '#6fb07a', '#f3a9c1']

export default function RollingYarn({ effect, scale, lift }: EffectViewProps) {
  const [roll] = useMemo(
    () =>
      buildParticles(effect.id, 1, (random) => ({
        direction: random() > 0.5 ? 1 : -1,
        distance: between(random, 90, 140) * scale,
        drop: between(random, 4, 22) * scale,
        color: pickFrom(random, yarnColors),
      })),
    [effect.id, scale],
  )
  const radius = 7 * scale
  const endX = roll.direction * roll.distance
  const startY = -lift - 16 * scale
  const threadPath = `M 0 ${startY} Q ${endX * 0.3} ${roll.drop - radius * 3} ${endX * 0.55} ${roll.drop * 0.6 - radius} T ${endX} ${roll.drop - radius}`
  const turns = (roll.distance / (Math.PI * 2 * radius)) * 360 * roll.direction
  return (
    <>
      <svg className={styles.vector} width={1} height={1} style={{ left: 0, top: 0 }}>
        <motion.path
          d={threadPath}
          stroke={roll.color}
          strokeWidth={Math.max(1, 1.3 * scale)}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.95 }}
          animate={{ pathLength: [0, 0.3, 1], opacity: [0.95, 0.95, 0.95, 0] }}
          transition={{ duration: 1.3, times: [0, 0.3, 1], ease: 'easeOut', opacity: { duration: 1.35, times: [0, 0.05, 0.85, 1] } }}
        />
      </svg>
      <Particle
        size={radius * 2}
        style={{ background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 55%), ${roll.color}`, borderRadius: '50%' }}
        initial={{ x: 0, y: startY, rotate: 0, opacity: 0 }}
        animate={{ x: [0, endX * 0.3, endX], y: [startY, roll.drop - radius, roll.drop - radius], rotate: [0, turns * 0.3, turns], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.3, times: [0, 0.3, 1], ease: 'easeOut', opacity: { duration: 1.35, times: [0, 0.05, 0.85, 1] } }}>
        <svg className={styles.vector} viewBox="-10 -10 20 20" width={radius * 2} height={radius * 2} style={{ left: 0, top: 0 }}>
          <path d="M -8 -3 Q 0 -9 8 -1 M -9 2 Q 0 -4 9 4 M -6 6 Q 1 0 6 7" stroke="rgba(255, 255, 255, 0.45)" strokeWidth={1.2} fill="none" />
        </svg>
      </Particle>
    </>
  )
}
