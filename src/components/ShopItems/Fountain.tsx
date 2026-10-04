import { useId } from 'react'
import PropAnchor from '../Props/PropAnchor'
import reactions from '../Props/Reactions.module.css'
import { contactShadowColor, type PropViewProps } from '../Props/propView'
import { pokeOf, sizeFactorOf, stoneTones, waterTones } from './shopArt'
import styles from './ShopItems.module.css'

const jets = [
  { to: -34, lift: 30, delay: 0 },
  { to: -18, lift: 22, delay: 0.2 },
  { to: 18, lift: 22, delay: 0.45 },
  { to: 34, lift: 30, delay: 0.1 },
]

const droplets = [
  { x: -30, y: -30, fall: 16, delay: 0 },
  { x: 26, y: -28, fall: 14, delay: 0.35 },
  { x: -16, y: -26, fall: 12, delay: 0.7 },
  { x: 12, y: -30, fall: 15, delay: 0.5 },
  { x: 36, y: -22, fall: 10, delay: 0.9 },
  { x: -38, y: -20, fall: 9, delay: 0.25 },
]

const sparkles = [
  { x: -22, y: -12, delay: 0 },
  { x: 14, y: -9, delay: 0.9 },
  { x: 30, y: -14, delay: 1.6 },
  { x: -6, y: -15, delay: 2.1 },
]

export default function Fountain({ prop, x, y, scale, zIndex }: PropViewProps) {
  const ids = useId().replace(/:/g, '')
  const reaction = pokeOf(prop)
  const lit = prop.lit
  const top = -66
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactorOf(prop)}>
      <defs>
        <radialGradient id={`fountainWater${ids}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={lit ? '#9fe3f2' : waterTones.mid} />
          <stop offset="100%" stopColor={lit ? '#6cc3db' : waterTones.deep} />
        </radialGradient>
        <radialGradient id={`fountainGlow${ids}`}>
          <stop offset="0%" stopColor="#d6fbff" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#d6fbff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={2} rx={58} ry={19} fill={contactShadowColor} />
      <path d="M -52 -12 L -48 -2 Q 0 14 48 -2 L 52 -12 Z" fill={stoneTones.mid} />
      <path d="M -48 -2 Q 0 14 48 -2 L 48 1 Q 0 17 -48 1 Z" fill={stoneTones.dark} />
      <ellipse cx={0} cy={-12} rx={52} ry={17} fill={stoneTones.light} />
      <ellipse cx={0} cy={-12} rx={45} ry={13} fill={`url(#fountainWater${ids})`} />
      <g key={reaction.key} className={reaction.poked ? styles.pokeBob : undefined}>
        <ellipse className={styles.shimmer} cx={-14} cy={-8} rx={16} ry={1.6} fill={waterTones.foam} />
        <ellipse className={styles.shimmer} style={{ animationDelay: '1.2s' }} cx={20} cy={-5} rx={9} ry={1.2} fill={waterTones.foam} />
        {[0, 0.85, 1.7].map((delay) => (
          <ellipse key={delay} className={styles.ripple} style={{ animationDelay: `${delay}s` }} cx={0} cy={-13} rx={30} ry={9} fill="none" stroke={waterTones.foam} strokeWidth={1.2} />
        ))}
      </g>
      {reaction.poked &&
        [0, 0.2].map((delay) => (
          <ellipse key={`${reaction.key}${delay}`} className={reactions.pokeRipple} style={{ animationDelay: `${delay}s` }} cx={0} cy={-12} rx={16} ry={5} fill="none" stroke={waterTones.foam} strokeWidth={2} />
        ))}
      {lit && <ellipse className={styles.glowPulse} cx={0} cy={-14} rx={44} ry={16} fill={`url(#fountainGlow${ids})`} />}
      <path d="M -6 -12 L -4.5 -44 L 4.5 -44 L 6 -12 Z" fill={stoneTones.mid} />
      <path d="M -6 -12 L -4.5 -44 L -1.5 -44 L -2.5 -12 Z" fill={stoneTones.light} opacity={0.7} />
      <path d="M -20 -48 Q 0 -36 20 -48 L 18 -44 Q 0 -34 -18 -44 Z" fill={stoneTones.dark} />
      <ellipse cx={0} cy={-48} rx={20} ry={6.5} fill={stoneTones.light} />
      <ellipse cx={0} cy={-48} rx={16} ry={4.6} fill={`url(#fountainWater${ids})`} />
      <g className={styles.passive}>
        {[-1, 1].map((side) => (
          <path key={side} className={styles.flowSlow} d={`M ${side * 17} -46 Q ${side * 23} -40 ${side * 24} -18`} stroke={waterTones.light} strokeWidth={2.4} strokeDasharray="5 3" fill="none" strokeLinecap="round" opacity={0.85} />
        ))}
        <path d={`M -2.5 -48 L -2 ${top} L 2 ${top} L 2.5 -48 Z`} fill={stoneTones.mid} />
        <circle cx={0} cy={top - 1} r={3.2} fill={stoneTones.light} />
        <g key={reaction.key} className={reaction.poked ? styles.surge : undefined} style={{ transformOrigin: `0px ${top}px` }}>
          {jets.map((jet) => (
            <path
              key={jet.to}
              className={styles.flow}
              style={{ animationDelay: `${jet.delay}s` }}
              d={`M 0 ${top - 3} Q ${jet.to * 0.45} ${top - jet.lift} ${jet.to} -14`}
              stroke={lit ? '#e6fbff' : waterTones.light}
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="none"
              strokeLinecap="round"
            />
          ))}
          <path d={`M 0 ${top - 3} L 0 ${top - 14}`} className={styles.flow} stroke={waterTones.foam} strokeWidth={2.6} strokeDasharray="4 3" strokeLinecap="round" />
        </g>
        {droplets.map((drop) => (
          <circle key={`${drop.x}${drop.y}`} className={styles.drip} style={{ animationDelay: `${drop.delay}s`, ['--fall' as string]: `${drop.fall}px` }} cx={drop.x} cy={drop.y} r={1.3} fill={waterTones.foam} />
        ))}
        {sparkles.map((sparkle) => (
          <path key={`${sparkle.x}`} className={styles.twinkle} style={{ animationDelay: `${sparkle.delay}s` }} d={`M ${sparkle.x} ${sparkle.y - 2.5} L ${sparkle.x + 0.7} ${sparkle.y - 0.7} L ${sparkle.x + 2.5} ${sparkle.y} L ${sparkle.x + 0.7} ${sparkle.y + 0.7} L ${sparkle.x} ${sparkle.y + 2.5} L ${sparkle.x - 0.7} ${sparkle.y + 0.7} L ${sparkle.x - 2.5} ${sparkle.y} L ${sparkle.x - 0.7} ${sparkle.y - 0.7} Z`} fill="#ffffff" />
        ))}
      </g>
      <path d="M -52 -12 Q 0 10 52 -12" stroke={stoneTones.shade} strokeWidth={1} fill="none" opacity={0.4} />
    </PropAnchor>
  )
}
