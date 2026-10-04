import styles from './LockBadge.module.css'

interface LockBadgeProps {
  progress: number
  size?: number
}

const ringRadius = 6
const ringLength = 2 * Math.PI * ringRadius

export default function LockBadge({ progress, size = 15 }: LockBadgeProps) {
  const filled = Math.min(1, Math.max(0, progress))
  return (
    <svg className={styles.badge} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx={8} cy={8} r={7.6} className={styles.plate} />
      <circle cx={8} cy={8} r={ringRadius} className={styles.track} />
      <circle cx={8} cy={8} r={ringRadius} className={styles.fill} strokeDasharray={ringLength} strokeDashoffset={ringLength * (1 - filled)} transform="rotate(-90 8 8)" />
      <path d="M6.3 7.5V6.6a1.7 1.7 0 0 1 3.4 0v0.9" className={styles.shackle} />
      <rect x={5.5} y={7.4} width={5} height={3.8} rx={1} className={styles.body} />
    </svg>
  )
}
