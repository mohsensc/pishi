import PropAnchor from '../Props/PropAnchor'
import { contactShadowColor, type PropViewProps } from '../Props/propView'
import Bird from './Bird'
import { pokeOf, seeded, sizeFactorOf, woodTones } from './shopArt'
import styles from './ShopItems.module.css'

const birdPalettes = [
  { tone: '#c9704f', breast: '#f2c79c' },
  { tone: '#e2b04a', breast: '#f7e3a4' },
  { tone: '#7b8fa6', breast: '#e9dccb' },
  { tone: '#6d8a5a', breast: '#e4e7c4' },
]

const seeds = [
  { x: -6, delay: 0 },
  { x: 4, delay: 1.1 },
  { x: -1, delay: 1.9 },
  { x: 8, delay: 0.6 },
]

export default function BirdFeeder({ prop, x, y, scale, zIndex }: PropViewProps) {
  const reaction = pokeOf(prop)
  const hookY = -112
  const trayY = -78
  const first = birdPalettes[Math.floor(seeded(prop, 1) * birdPalettes.length)]
  const second = birdPalettes[Math.floor(seeded(prop, 2) * birdPalettes.length)]
  const third = birdPalettes[Math.floor(seeded(prop, 3) * birdPalettes.length)]
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactorOf(prop)}>
      <ellipse cx={0} cy={1} rx={16} ry={5} fill={contactShadowColor} />
      <ellipse cx={4} cy={1} rx={10} ry={2.6} fill="#c9a26a" opacity={0.55} />
      <path d="M -2 0 L -1.6 -118 L 1.6 -118 L 2 0 Z" fill="#4f6358" />
      <path d="M -2 0 L -1.6 -118 L -0.4 -118 L -0.4 0 Z" fill="#6c8276" />
      <path d="M 0 -118 Q 14 -122 18 -114" stroke="#4f6358" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <g className={styles.sway} style={{ transformOrigin: `18px ${hookY}px`, animationDelay: `${seeded(prop, 4) * -3}s` }}>
        <path d={`M 18 ${hookY} L 18 ${hookY + 8}`} stroke="#7a6a58" strokeWidth={1} />
        <path d={`M 4 ${hookY + 18} L 18 ${hookY + 7} L 32 ${hookY + 18} Z`} fill={woodTones.dark} />
        <path d={`M 4 ${hookY + 18} L 18 ${hookY + 7} L 18 ${hookY + 18} Z`} fill={woodTones.mid} />
        <rect x={9} y={hookY + 18} width={18} height={14} rx={1.5} fill="#e9f3f2" opacity={0.85} />
        <rect x={9} y={hookY + 24} width={18} height={8} fill="#d9b071" />
        <path d={`M 10 ${hookY + 26} h 3 M 15 ${hookY + 28} h 3 M 21 ${hookY + 25} h 3 M 12 ${hookY + 30} h 3`} stroke="#a77a43" strokeWidth={1} strokeLinecap="round" />
        <path d={`M 9 ${hookY + 18} L 9 ${hookY + 32} M 27 ${hookY + 18} L 27 ${hookY + 32}`} stroke={woodTones.mid} strokeWidth={1.4} />
        <path d={`M 2 ${trayY + 2} L 34 ${trayY + 2} L 31 ${trayY + 6} L 5 ${trayY + 6} Z`} fill={woodTones.mid} />
        <path d={`M 2 ${trayY + 2} L 34 ${trayY + 2}`} stroke={woodTones.light} strokeWidth={1.2} strokeLinecap="round" />
        <g className={styles.passive}>
          {seeds.map((seed) => (
            <circle key={seed.x} className={styles.seedFall} style={{ animationDelay: `${seed.delay + seeded(prop, 5)}s`, ['--fall' as string]: '74px' }} cx={18 + seed.x} cy={trayY + 6} r={0.9} fill="#a77a43" />
          ))}
          <g key={`birds${reaction.key}`} className={reaction.poked ? styles.birdsReturn : undefined}>
            <Bird x={6} y={trayY + 2} tone={first.tone} breast={first.breast} facing={-1} delay={seeded(prop, 6) * 2} mood="peck" size={0.85} />
            <Bird x={30} y={trayY + 2} tone={second.tone} breast={second.breast} facing={1} delay={seeded(prop, 7) * 2.4} mood="peck" size={0.8} />
            {seeded(prop, 8) > 0.4 && <Bird x={20} y={hookY + 9} tone={third.tone} breast={third.breast} facing={-1} delay={seeded(prop, 9) * 3} mood="hop" size={0.7} />}
          </g>
        </g>
      </g>
    </PropAnchor>
  )
}
