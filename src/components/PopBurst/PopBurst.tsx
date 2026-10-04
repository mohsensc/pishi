import { memo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { PopEvent } from '../../game/types'
import { toScreen } from '../../game/projection'
import { BALL_RADIUS } from '../../game/constants'
import TennisBallGraphic from '../TennisBall/TennisBallGraphic'
import { randomBetween } from '../../game/random'
import styles from './PopBurst.module.css'

interface PopBurstProps {
  pop: PopEvent
}

interface FuzzParticle {
  id: number
  size: number
  travelX: number
  travelY: number
  fallDistance: number
  duration: number
  delay: number
}

interface FeltShred {
  id: number
  width: number
  height: number
  travelX: number
  travelY: number
  rotation: number
  color: string
}

const shredColors = ['#d6ea3a', '#c2d62c', '#fbfbf2', '#e5f36a']

function createFuzzParticles(count: number): FuzzParticle[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + randomBetween(Math.random, -0.3, 0.3)
    const distance = randomBetween(Math.random, 34, 86)
    return {
      id: index,
      size: randomBetween(Math.random, 3, 7),
      travelX: Math.cos(angle) * distance,
      travelY: Math.sin(angle) * distance * 0.8 - randomBetween(Math.random, 10, 30),
      fallDistance: randomBetween(Math.random, 30, 60),
      duration: randomBetween(Math.random, 0.65, 0.95),
      delay: randomBetween(Math.random, 0, 0.05),
    }
  })
}

function createFeltShreds(count: number): FeltShred[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + randomBetween(Math.random, -1.3, 1.3)
    const distance = randomBetween(Math.random, 40, 70)
    return {
      id: index,
      width: randomBetween(Math.random, 9, 14),
      height: randomBetween(Math.random, 4, 6),
      travelX: Math.cos(angle) * distance,
      travelY: Math.sin(angle) * distance,
      rotation: randomBetween(Math.random, -540, 540),
      color: shredColors[index % shredColors.length],
    }
  })
}

function PopBurst({ pop }: PopBurstProps) {
  const prefersReducedMotion = useReducedMotion()
  const [fuzzParticles] = useState(() => createFuzzParticles(prefersReducedMotion ? 6 : 22))
  const [feltShreds] = useState(() => createFeltShreds(prefersReducedMotion ? 2 : 7))
  const center = toScreen(pop.position, BALL_RADIUS)

  return (
    <motion.div
      className={styles.burst}
      style={{ x: center.x, y: center.y }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.div
        className={styles.flash}
        initial={{ scale: 0.6, opacity: 0.95 }}
        animate={{ scale: [0.6, 1.25, 0.2], opacity: [0.95, 0.7, 0] }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      />
      <motion.div
        className={styles.ring}
        initial={{ scale: 0.3, opacity: 0.9 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className={styles.ring}
        initial={{ scale: 0.2, opacity: 0.7 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className={styles.husk}
        initial={{ y: 0, scaleX: 1, scaleY: 1, opacity: 1 }}
        animate={{ y: [0, -6, BALL_RADIUS], scaleX: [1, 1.35, 1.5], scaleY: [1, 0.45, 0.28], opacity: [1, 1, 0] }}
        transition={{ duration: 1.1, times: [0, 0.2, 1], ease: 'easeOut' }}
      >
        <TennisBallGraphic size={BALL_RADIUS * 2} spin={0.6} />
      </motion.div>
      {fuzzParticles.map((particle) => (
        <motion.span
          key={`fuzz${particle.id}`}
          className={styles.fuzz}
          style={{
            width: particle.size,
            height: particle.size,
            left: -particle.size / 2,
            top: -particle.size / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: [0, particle.travelX * 0.8, particle.travelX],
            y: [0, particle.travelY, particle.travelY + particle.fallDistance],
            opacity: [1, 1, 0],
            scale: [1, 0.9, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            times: [0, 0.4, 1],
            ease: ['easeOut', 'easeIn'],
          }}
        />
      ))}
      {feltShreds.map((shred) => (
        <motion.span
          key={`shred${shred.id}`}
          className={styles.shred}
          style={{
            width: shred.width,
            height: shred.height,
            left: -shred.width / 2,
            top: -shred.height / 2,
            background: shred.color,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, shred.travelX, shred.travelX * 1.2],
            y: [0, shred.travelY, shred.travelY + 70],
            rotate: shred.rotation,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 1.05, times: [0, 0.35, 1], ease: ['easeOut', 'easeIn'] }}
        />
      ))}
    </motion.div>
  )
}

export default memo(PopBurst)
