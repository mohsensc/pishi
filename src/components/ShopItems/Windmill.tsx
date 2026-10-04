import { motion } from 'motion/react'
import PropAnchor from '../Props/PropAnchor'
import { contactShadowColor, type PropViewProps } from '../Props/propView'
import { pokeOf, seeded, sizeFactorOf, woodTones } from './shopArt'
import { useSpin } from './useSpin'
import styles from './ShopItems.module.css'

const hubY = -148
const sailLength = 62
const capTones = ['#c96b4f', '#6f8fa8', '#7d9a64']

function Sail() {
  return (
    <g>
      <rect x={-1.6} y={-sailLength} width={3.2} height={sailLength} rx={1.2} fill={woodTones.dark} />
      <path d={`M 2 ${-sailLength + 4} L 15 ${-sailLength + 6} L 13 -12 L 2 -10 Z`} fill="#f4ecdc" />
      <path d={`M 2 ${-sailLength + 16} L 14.5 ${-sailLength + 17} M 2 ${-sailLength + 28} L 14 ${-sailLength + 29} M 2 ${-sailLength + 40} L 13.5 ${-sailLength + 41}`} stroke="#c9b48e" strokeWidth={1} />
      <path d={`M 8 ${-sailLength + 5} L 7.5 -11`} stroke="#c9b48e" strokeWidth={0.9} />
    </g>
  )
}

export default function Windmill({ prop, x, y, scale, zIndex }: PropViewProps) {
  const reaction = pokeOf(prop)
  const night = prop.lit
  const cap = capTones[prop.variant % capTones.length]
  const angle = useSpin((night ? 10 : 28) + prop.agitation * 260, seeded(prop, 1))
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactorOf(prop)}>
      <ellipse cx={0} cy={2} rx={44} ry={12} fill={contactShadowColor} />
      <ellipse className={styles.shadowBob} cx={10} cy={4} rx={56} ry={9} fill="rgba(38, 62, 24, 0.1)" />
      <path d={`M -28 0 L -17 ${hubY + 14} L 17 ${hubY + 14} L 28 0 Z`} fill="#f2e6cf" />
      <path d={`M -28 0 L -17 ${hubY + 14} L -8 ${hubY + 14} L -14 0 Z`} fill="#ffffff" opacity={0.35} />
      <path d={`M 28 0 L 17 ${hubY + 14} L 11 ${hubY + 14} L 18 0 Z`} fill="#d9c9a8" opacity={0.6} />
      <path d={`M -26 -40 L 26 -40 M -23 -80 L 23 -80 M -20 -116 L 20 -116`} stroke={woodTones.mid} strokeWidth={2.4} />
      <path d="M -7 0 L -7 -20 Q 0 -27 7 -20 L 7 0 Z" fill={woodTones.dark} />
      <rect x={-6} y={-70} width={12} height={14} rx={6} fill={night ? '#ffe39a' : '#9fc3d6'} className={night ? styles.glowPulse : undefined} />
      <path d="M 0 -70 L 0 -56 M -6 -63 L 6 -63" stroke={woodTones.dark} strokeWidth={1.2} />
      <rect x={-5} y={-106} width={10} height={11} rx={5} fill={night ? '#ffe39a' : '#9fc3d6'} className={night ? styles.glowPulse : undefined} style={{ animationDelay: '0.8s' }} />
      <path d={`M -22 ${hubY + 16} Q 0 ${hubY - 18} 22 ${hubY + 16} Z`} fill={cap} />
      <path d={`M -22 ${hubY + 16} Q -10 ${hubY - 6} 0 ${hubY - 2} L -2 ${hubY + 16} Z`} fill="#ffffff" opacity={0.16} />
      <path d="M -8 0 q -6 -8 -14 -6 M 8 0 q 6 -10 15 -7" stroke="#6fa84a" strokeWidth={2} fill="none" strokeLinecap="round" />
      <circle cx={-22} cy={-6} r={2.4} fill="#f3a9c1" />
      <circle cx={24} cy={-7} r={2.4} fill="#f6c24c" />
      <g transform={`translate(0 ${hubY})`}>
        <g key={reaction.key} className={reaction.poked ? styles.pokeBob : undefined}>
          <motion.g style={{ rotate: angle }}>
            <circle cx={0} cy={0} r={sailLength + 2} fill="transparent" />
            {[0, 90, 180, 270].map((turn) => (
              <g key={turn} transform={`rotate(${turn})`}>
                <Sail />
              </g>
            ))}
          </motion.g>
        </g>
        <circle cx={0} cy={0} r={5} fill={woodTones.dark} />
        <circle cx={0} cy={0} r={2} fill={woodTones.light} />
      </g>
    </PropAnchor>
  )
}
