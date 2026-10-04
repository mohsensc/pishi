import PropAnchor from '../Props/PropAnchor'
import { contactShadowColor, type PropViewProps } from '../Props/propView'
import Bird from './Bird'
import { pokeOf, seeded, sizeFactorOf, stoneTones, waterTones } from './shopArt'
import styles from './ShopItems.module.css'

const birdPalettes = [
  { tone: '#7b8fa6', breast: '#e9dccb' },
  { tone: '#c9704f', breast: '#f2c79c' },
  { tone: '#8a7a62', breast: '#efe2c8' },
]

export default function Birdbath({ prop, x, y, scale, zIndex }: PropViewProps) {
  const reaction = pokeOf(prop)
  const bowlY = -44
  const palette = birdPalettes[Math.floor(seeded(prop, 3) * birdPalettes.length)]
  const second = birdPalettes[Math.floor(seeded(prop, 9) * birdPalettes.length)]
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactorOf(prop)}>
      <ellipse cx={0} cy={1} rx={22} ry={7} fill={contactShadowColor} />
      <path d="M -13 0 Q -12 -6 -6 -8 L 6 -8 Q 12 -6 13 0 Z" fill={stoneTones.mid} />
      <ellipse cx={0} cy={0} rx={13} ry={3.6} fill={stoneTones.dark} />
      <path d="M -5 -8 Q -7 -26 -4 -38 L 4 -38 Q 7 -26 5 -8 Z" fill={stoneTones.light} />
      <path d="M -5 -8 Q -7 -26 -4 -38 L -1.5 -38 Q -3 -24 -2 -8 Z" fill="#ffffff" opacity={0.35} />
      <path d={`M -24 ${bowlY} Q -20 ${bowlY + 10} 0 ${bowlY + 11} Q 20 ${bowlY + 10} 24 ${bowlY} Z`} fill={stoneTones.mid} />
      <ellipse cx={0} cy={bowlY} rx={24} ry={7} fill={stoneTones.light} />
      <ellipse cx={0} cy={bowlY + 0.5} rx={19.5} ry={5} fill={prop.lit ? '#9fe3f2' : waterTones.mid} />
      <g key={reaction.key} className={reaction.poked ? styles.pokeBob : undefined}>
        <ellipse className={styles.shimmer} cx={-5} cy={bowlY + 1.5} rx={7} ry={1} fill={waterTones.foam} />
        <ellipse className={styles.ripple} style={{ animationDelay: `${seeded(prop, 4) * 2}s` }} cx={4} cy={bowlY + 0.5} rx={9} ry={2.6} fill="none" stroke={waterTones.foam} strokeWidth={0.9} />
      </g>
      <g key={`birds${reaction.key}`} className={`${styles.passive} ${reaction.poked ? styles.birdsReturn : ''}`}>
        <Bird x={-15} y={bowlY - 1} tone={palette.tone} breast={palette.breast} facing={1} delay={seeded(prop, 5) * 2} mood="peck" />
        {seeded(prop, 6) > 0.35 && <Bird x={14} y={bowlY - 2} tone={second.tone} breast={second.breast} facing={-1} delay={seeded(prop, 7) * 3} mood="hop" size={0.9} />}
        {[0, 0.4, 0.8].map((delay) => (
          <circle key={delay} className={styles.drip} style={{ animationDelay: `${delay + seeded(prop, 8)}s`, ['--fall' as string]: '-9px' }} cx={-7 + delay * 6} cy={bowlY} r={1} fill={waterTones.foam} />
        ))}
      </g>
    </PropAnchor>
  )
}
