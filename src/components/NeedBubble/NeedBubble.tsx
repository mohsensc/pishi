import { motion, type TargetAndTransition, type Transition } from 'motion/react'
import type { CareItemKind } from '../../game/types'
import CareItemIcon from '../CareTray/CareItemIcon'
import styles from './NeedBubble.module.css'

interface NeedBubbleProps {
  catId: string
  kind: CareItemKind
  urge: number
  asleep: boolean
  facing: 1 | -1
  x: number
  y: number
  lift: number
  size: number
}

interface PulseStyle {
  animate: TargetAndTransition
  transition: Transition
}

const ringRadius = 17.5
const ringLength = 2 * Math.PI * ringRadius
const restingPulse: PulseStyle = { animate: { scale: 1 }, transition: { duration: 0.3 } }
const sleepingPulse: PulseStyle = { animate: { scale: [1, 1.04, 1] }, transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } }
const eagerPulse: PulseStyle = { animate: { scale: [1, 1.07, 1] }, transition: { duration: 1.7, repeat: Infinity, ease: 'easeInOut' } }
const urgentPulse: PulseStyle = { animate: { scale: [1, 1.14, 1] }, transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } }
const enterTransition: Transition = { type: 'spring', stiffness: 420, damping: 22 }
const exitTransition: Transition = { duration: 0.26, ease: 'easeOut' }

function pulseFor(urge: number, asleep: boolean): PulseStyle {
  if (asleep) return sleepingPulse
  if (urge > 0.7) return urgentPulse
  if (urge > 0.35) return eagerPulse
  return restingPulse
}

export default function NeedBubble({ catId, kind, urge, asleep, facing, x, y, lift, size }: NeedBubbleProps) {
  const pulse = pulseFor(urge, asleep)
  return (
    <div className={styles.anchor} style={{ transform: `translate3d(${x}px, ${y}px, 0)` }} data-need={kind} data-need-cat={catId} data-asleep={asleep}>
      <div className={styles.lift} style={{ transform: `translateY(${-lift}px)` }}>
        <motion.div
          className={styles.bubble}
          style={{ width: size, height: size * 1.25, left: -size / 2, top: -size * 1.25 }}
          initial={{ scale: 0.2, opacity: 0, y: size * 0.2 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.45, opacity: 0, transition: exitTransition }}
          transition={enterTransition}>
          <motion.div className={styles.pulse} animate={pulse.animate} transition={pulse.transition}>
            <svg className={styles.shape} viewBox="0 0 40 50" width={size} height={size * 1.25} aria-hidden="true">
              <g transform={facing === -1 ? 'translate(40 0) scale(-1 1)' : undefined}>
                <circle cx={29} cy={40.5} r={3.4} className={styles.trail} />
                <circle cx={33.5} cy={47} r={2} className={styles.trail} />
              </g>
              <circle cx={20} cy={19} r={15.5} className={styles.body} />
              {!asleep && (
                <circle
                  cx={20}
                  cy={19}
                  r={ringRadius}
                  className={styles.patience}
                  strokeDasharray={`${ringLength * Math.min(1, urge)} ${ringLength}`}
                  transform="rotate(-90 20 19)"
                />
              )}
            </svg>
            <div className={styles.icon} style={{ width: size, height: size * 0.95 }}>
              <CareItemIcon kind={kind} size={size * 0.62} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
