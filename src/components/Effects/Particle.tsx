import type { CSSProperties, ReactNode } from 'react'
import { motion, type TargetAndTransition, type Transition } from 'motion/react'
import styles from './Effects.module.css'

interface ParticleProps {
  size: number
  height?: number
  style?: CSSProperties
  initial?: TargetAndTransition
  animate: TargetAndTransition
  transition: Transition
  children?: ReactNode
}

export default function Particle({ size, height = size, style, initial, animate, transition, children }: ParticleProps) {
  return (
    <motion.div
      className={styles.particle}
      style={{ width: size, height, marginLeft: -size / 2, marginTop: -height / 2, ...style }}
      initial={initial ?? { opacity: 0 }}
      animate={animate}
      transition={transition}>
      {children}
    </motion.div>
  )
}
