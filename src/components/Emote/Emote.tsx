import type { CatEmote } from '../../game/types'
import { EMOTE_LIFETIME } from '../../game/constants'
import EmoteIcon from './emoteIcons'
import styles from './Emote.module.css'

interface EmoteProps {
  emote: CatEmote
  age: number
  size: number
  x: number
  y: number
}

const popSeconds = 0.14
const fadeSeconds = 0.35

function emoteOpacity(age: number): number {
  const fadeIn = Math.min(1, age / popSeconds)
  const fadeOut = Math.min(1, Math.max(0, (EMOTE_LIFETIME - age) / fadeSeconds))
  return fadeIn * fadeOut
}

function emoteScale(age: number): number {
  if (age >= popSeconds * 2) return 1
  const progress = age / (popSeconds * 2)
  return 0.4 + progress * 0.6 + Math.sin(progress * Math.PI) * 0.18
}

export default function Emote({ emote, age, size, x, y }: EmoteProps) {
  const opacity = emoteOpacity(age)
  if (opacity <= 0.01) return null
  const lift = Math.min(age, EMOTE_LIFETIME) * size * 0.35
  const wobble = emote === 'sleepy' ? Math.sin(age * 5) * size * 0.08 : 0
  return (
    <div
      className={styles.emote}
      data-emote={emote}
      style={{
        width: size,
        height: size,
        opacity,
        transform: `translate3d(${x - size / 2 + wobble}px, ${y - size - lift}px, 0) scale(${emoteScale(age)})`,
      }}
    >
      <svg className={styles.bubble} viewBox="-2 -2 28 32" width={size} height={size * (32 / 28)} aria-hidden>
        <path d="M12 0 C18.6 0 24 5.1 24 11.4 C24 17.7 18.6 22.8 12 22.8 L10.4 22.8 L8.6 26.6 L7.6 22.2 C3.2 20.6 0 16.4 0 11.4 C0 5.1 5.4 0 12 0 Z" fill="#fffdf7" stroke="#e7dfcf" strokeWidth={1} />
        <g transform="translate(2.4 1.8) scale(0.8)">
          <EmoteIcon emote={emote} />
        </g>
      </svg>
    </div>
  )
}
