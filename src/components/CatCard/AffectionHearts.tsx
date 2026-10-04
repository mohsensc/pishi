import { useId } from 'react'
import styles from './CatCard.module.css'

interface AffectionHeartsProps {
  affection: number
}

const heartCount = 5
const heartPath = 'M12 20 C6 15.6 3.4 12.6 3.4 9.2 C3.4 6.6 5.4 4.6 7.9 4.6 C9.6 4.6 11 5.6 12 7 C13 5.6 14.4 4.6 16.1 4.6 C18.6 4.6 20.6 6.6 20.6 9.2 C20.6 12.6 18 15.6 12 20 Z'

export default function AffectionHearts({ affection }: AffectionHeartsProps) {
  const clipBase = useId().replace(/[^a-zA-Z0-9]/g, '')
  const filled = Math.max(0, Math.min(1, affection)) * heartCount
  return (
    <span className={styles.hearts} aria-label={`Affection ${Math.round(affection * 100)}%`}>
      {Array.from({ length: heartCount }, (_, index) => {
        const fill = Math.max(0, Math.min(1, filled - index))
        return (
          <svg key={index} width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
            <path d={heartPath} fill="rgba(32, 48, 31, 0.14)" />
            <clipPath id={`${clipBase}heart${index}`}>
              <rect x="0" y="0" width={24 * fill} height="24" />
            </clipPath>
            <path d={heartPath} fill="#e4506a" clipPath={`url(#${clipBase}heart${index})`} />
          </svg>
        )
      })}
    </span>
  )
}
