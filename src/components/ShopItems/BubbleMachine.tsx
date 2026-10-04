import PropAnchor from '../Props/PropAnchor'
import { contactShadowColor, type PropViewProps } from '../Props/propView'
import { pokeOf, seeded, sizeFactorOf } from './shopArt'
import styles from './ShopItems.module.css'

const bodyTones = ['#8cc7d8', '#f2b7c6', '#b6d98d']
const nozzle = { x: 18, y: -30 }

function bubbleTrail(prop: PropViewProps['prop']) {
  return Array.from({ length: 8 }, (_, index) => {
    const drift = seeded(prop, 20 + index)
    return {
      size: 3 + drift * 4.5,
      dx: 30 + drift * 90,
      dy: -40 - seeded(prop, 40 + index) * 70,
      delay: index * 0.52 + drift * 0.3,
    }
  })
}

export default function BubbleMachine({ prop, x, y, scale, zIndex }: PropViewProps) {
  const reaction = pokeOf(prop)
  const body = bodyTones[prop.variant % bodyTones.length]
  const bubbles = bubbleTrail(prop)
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactorOf(prop)}>
      <defs>
        <radialGradient id={`bubbleSkin${prop.id}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
          <stop offset="25%" stopColor="#d6eefa" stopOpacity={0.3} />
          <stop offset="75%" stopColor="#c4e2f6" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#ffd6ec" stopOpacity={0.7} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={1} rx={20} ry={6} fill={contactShadowColor} />
      <g className={styles.hum}>
        <path d="M -12 0 L -10 -6 M 12 0 L 10 -6" stroke="#6e7d82" strokeWidth={2.4} strokeLinecap="round" />
        <rect x={-16} y={-34} width={32} height={28} rx={8} fill={body} />
        <rect x={-16} y={-34} width={10} height={28} rx={6} fill="#ffffff" opacity={0.22} />
        <rect x={-10} y={-27} width={14} height={12} rx={6} fill="#ffffff" opacity={0.85} />
        <g transform="translate(-3 -21)">
          <g className={styles.fanSpin}>
            <path d="M 0 0 L 0 -4.6 A 4.6 4.6 0 0 1 4 -2.3 Z M 0 0 L 4 2.3 A 4.6 4.6 0 0 1 -0 4.6 Z M 0 0 L -4 2.3 A 4.6 4.6 0 0 1 -4 -2.3 Z" fill="#9fb4bb" />
          </g>
        </g>
        <circle cx={10} cy={-12} r={1.8} fill={prop.lit ? '#ffe39a' : '#f2785f'} className={styles.blink} />
        <path d={`M 14 -28 L ${nozzle.x} ${nozzle.y}`} stroke="#6e7d82" strokeWidth={2} strokeLinecap="round" />
        <circle cx={nozzle.x + 3} cy={nozzle.y - 2} r={4.4} fill="none" stroke="#f3c45b" strokeWidth={1.6} />
      </g>
      <g key={reaction.key} className={styles.passive}>
        {bubbles.map((bubble, index) => (
          <circle
            key={index}
            className={styles.bubble}
            style={{ animationDelay: `${reaction.poked ? index * 0.12 : bubble.delay}s`, ['--dx' as string]: `${bubble.dx}px`, ['--dy' as string]: `${bubble.dy}px`, animationDuration: reaction.poked ? '2.4s' : undefined }}
            cx={nozzle.x + 3}
            cy={nozzle.y - 2}
            r={bubble.size}
            fill={`url(#bubbleSkin${prop.id})`}
            stroke="#ffffff"
            strokeWidth={0.6}
            strokeOpacity={0.8}
          />
        ))}
      </g>
    </PropAnchor>
  )
}
