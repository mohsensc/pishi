import { memo } from 'react'
import type { TreatBagShake } from '../../game/types'
import styles from './TreatBag.module.css'

interface TreatBagProps {
  shake: TreatBagShake | null
  time: number
}

const visibleSeconds = 1.1
const kibbleBits = [
  { x: -7, rise: 16, delay: 0 },
  { x: 3, rise: 22, delay: 0.12 },
  { x: 9, rise: 14, delay: 0.24 },
]

function TreatBag({ shake, time }: TreatBagProps) {
  if (!shake) return null
  const age = time - shake.time
  if (age < 0 || age > visibleSeconds) return null
  const fade = Math.min(1, (visibleSeconds - age) / 0.25)
  const rattle = Math.sin(age * 42) * 16 * Math.max(0, 1 - age / 0.8)
  return (
    <div className={styles.anchor} style={{ transform: `translate3d(${shake.position.x}px, ${shake.position.y}px, 0)`, opacity: fade }} aria-hidden="true">
      {kibbleBits.map((bit) => {
        const progress = Math.max(0, Math.min(1, (age - bit.delay) / 0.5))
        const height = bit.rise * 4 * progress * (1 - progress)
        return progress > 0 && progress < 1 ? (
          <span key={bit.x} className={styles.kibble} style={{ transform: `translate(${bit.x * (1 + progress)}px, ${-30 - height}px)` }} />
        ) : null
      })}
      <svg className={styles.bag} width="39" height="44" viewBox="0 0 30 34" style={{ transform: `translate(-19.5px, -50px) rotate(${rattle}deg)` }}>
        <path d="M6 9 L24 9 L27 31 C27 32.4 26 33 24.6 33 L5.4 33 C4 33 3 32.4 3 31 Z" fill="#e7c78d" stroke="#b98f4f" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M6 9 L8 3.5 L12 6.2 L15 2.6 L18 6.2 L22 3.5 L24 9" fill="#d9b374" stroke="#b98f4f" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M10.5 20.5 C12.8 17.6 17.4 17.6 19.5 20.5 C17.4 23.4 12.8 23.4 10.5 20.5 Z M19.5 20.5 L22 18.6 L22 22.4 Z" fill="#e0735f" />
      </svg>
    </div>
  )
}

export default memo(TreatBag)
