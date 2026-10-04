import PropAnchor from '../Props/PropAnchor'
import { contactShadowColor, type PropViewProps } from '../Props/propView'
import { pokeOf, seeded, sizeFactorOf, woodTones } from './shopArt'
import styles from './ShopItems.module.css'

const roofTones = ['#d9705c', '#6f9fc4', '#7fa86a']
const visitors = [
  { radius: 26, tone: '#f3c45b', className: styles.orbit, delay: 0, y: -74 },
  { radius: 34, tone: '#7fbfd6', className: styles.orbitReverse, delay: -3, y: -66 },
]

function Wing({ tone }: { tone: string }) {
  return (
    <g>
      <path className={styles.wingFlap} d="M 0 0 C -5 -6 -7 -1 -4 2 C -6 4 -3 6 0 2 Z" fill={tone} />
      <path className={styles.wingFlap} d="M 0 0 C 5 -6 7 -1 4 2 C 6 4 3 6 0 2 Z" fill={tone} />
      <path d="M 0 -2 L 0 3" stroke="#3b3026" strokeWidth={0.9} strokeLinecap="round" />
    </g>
  )
}

export default function ButterflyHouse({ prop, x, y, scale, zIndex }: PropViewProps) {
  const reaction = pokeOf(prop)
  const roof = roofTones[prop.variant % roofTones.length]
  const bodyTop = -86
  const bodyBottom = -50
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactorOf(prop)}>
      <ellipse cx={0} cy={1} rx={16} ry={5} fill={contactShadowColor} />
      <path d={`M -2.4 0 L -2 ${bodyBottom} L 2 ${bodyBottom} L 2.4 0 Z`} fill={woodTones.dark} />
      <path d="M -9 0 q 2 -10 9 -12 q 7 2 9 12" fill="#6fa84a" opacity={0.85} />
      <circle cx={-6} cy={-6} r={2} fill="#f3a9c1" />
      <circle cx={5} cy={-8} r={2.2} fill="#f6c24c" />
      <rect x={-14} y={bodyTop} width={28} height={bodyBottom - bodyTop} rx={2} fill="#f0c58e" />
      <rect x={-14} y={bodyTop} width={6} height={bodyBottom - bodyTop} fill="#ffffff" opacity={0.18} />
      {[-6, 0, 6].map((slot) => (
        <rect key={slot} x={slot - 1.2} y={bodyTop + 6} width={2.4} height={14} rx={1.2} fill={prop.lit ? '#ffe6a6' : woodTones.dark} className={prop.lit ? styles.glowPulse : undefined} style={{ animationDelay: `${slot * 0.1}s` }} />
      ))}
      <path d={`M -18 ${bodyTop + 2} L 0 ${bodyTop - 16} L 18 ${bodyTop + 2} Z`} fill={roof} />
      <path d={`M -18 ${bodyTop + 2} L 0 ${bodyTop - 16} L 0 ${bodyTop - 12} L -14 ${bodyTop + 2} Z`} fill="#ffffff" opacity={0.18} />
      <rect x={-16} y={bodyBottom - 1} width={32} height={4} rx={1.6} fill={woodTones.mid} />
      <circle cx={0} cy={bodyBottom - 8} r={4.6} fill="#5a3b26" />
      <g key={reaction.key} className={reaction.poked ? styles.doorOpen : undefined}>
        <circle cx={0} cy={bodyBottom - 8} r={4.6} fill={woodTones.light} />
        <circle cx={2.4} cy={bodyBottom - 8} r={0.8} fill={woodTones.dark} />
      </g>
      <g transform={`translate(0 ${bodyTop - 3}) scale(0.9)`}>
        <path d="M 0 0 C -4 -5 -6 -1 -3.4 1.6 C -5 3.4 -2.4 5 0 1.6 Z" fill="#ffffff" opacity={0.6} />
        <path d="M 0 0 C 4 -5 6 -1 3.4 1.6 C 5 3.4 2.4 5 0 1.6 Z" fill="#ffffff" opacity={0.6} />
      </g>
      <g className={styles.passive}>
        {visitors.map((visitor) => (
          <g key={visitor.tone} className={visitor.className} style={{ transformOrigin: `0px ${visitor.y}px`, animationDelay: `${visitor.delay + seeded(prop, 2) * -5}s` }}>
            <g transform={`translate(${visitor.radius} ${visitor.y})`}>
              <Wing tone={visitor.tone} />
            </g>
          </g>
        ))}
        {prop.lit &&
          [0, 1, 2].map((index) => (
            <circle key={index} className={styles.twinkle} style={{ animationDelay: `${index * 0.8}s` }} cx={-20 + index * 18} cy={-40 - index * 14} r={1.8} fill="#fff1a8" />
          ))}
      </g>
    </PropAnchor>
  )
}
