import PropAnchor from '../Props/PropAnchor'
import { contactShadowColor, type PropViewProps } from '../Props/propView'
import { pokeOf, seeded, sizeFactorOf, woodTones } from './shopArt'
import styles from './ShopItems.module.css'

const beamY = -124
const seatY = -30
const legSpread = 50
const blooms = ['#f3a9c1', '#f6c24c', '#f4efe2']

export default function Swing({ prop, x, y, scale, zIndex }: PropViewProps) {
  const reaction = pokeOf(prop)
  const occupied = prop.occupantIds.length > 0
  const idleClass = occupied ? styles.swingRide : styles.swingIdle
  const swingClass = reaction.poked && !occupied ? styles.swingPush : idleClass
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactorOf(prop)}>
      <ellipse cx={0} cy={1} rx={58} ry={13} fill={contactShadowColor} />
      <ellipse className={styles.shadowBob} cx={0} cy={2} rx={16} ry={4} fill="rgba(38, 62, 24, 0.14)" />
      {[-1, 1].map((side) => (
        <g key={side}>
          <path d={`M ${side * legSpread - 8} 0 L ${side * (legSpread - 6)} ${beamY} L ${side * (legSpread - 3)} ${beamY} L ${side * legSpread + 2} 0 Z`} fill={woodTones.dark} />
          <path d={`M ${side * legSpread + 8} 0 L ${side * (legSpread - 6)} ${beamY} L ${side * (legSpread - 9)} ${beamY} L ${side * legSpread - 2} 0 Z`} fill={woodTones.mid} />
          <path d={`M ${side * (legSpread - 5)} -46 L ${side * (legSpread + 5)} -46`} stroke={woodTones.dark} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      ))}
      <rect x={-legSpread - 2} y={beamY - 5} width={legSpread * 2 + 4} height={7} rx={3} fill={woodTones.mid} />
      <rect x={-legSpread - 2} y={beamY - 5} width={legSpread * 2 + 4} height={2.4} rx={1.2} fill={woodTones.light} />
      <path d={`M ${-legSpread + 6} -2 q -6 -18 2 -34 q 6 -14 0 -28`} stroke="#6fa84a" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      {blooms.map((tone, index) => (
        <circle key={tone} cx={-legSpread + 4 + (index % 2) * 5} cy={-12 - index * 16} r={2.4} fill={tone} />
      ))}
      <g key={reaction.key} className={swingClass} style={{ transformOrigin: `0px ${beamY}px`, animationDelay: reaction.poked ? '0s' : `${seeded(prop, 1) * -3}s` }}>
        <path d={`M -16 ${beamY} L -17 ${seatY}`} stroke="#d8c7a4" strokeWidth={1.6} />
        <path d={`M 16 ${beamY} L 17 ${seatY}`} stroke="#d8c7a4" strokeWidth={1.6} />
        <circle cx={-16} cy={beamY + 1} r={2} fill="#7a6a58" />
        <circle cx={16} cy={beamY + 1} r={2} fill="#7a6a58" />
        <rect x={-22} y={seatY - 3} width={44} height={6} rx={2.6} fill={woodTones.mid} />
        <rect x={-22} y={seatY - 3} width={44} height={2.2} rx={1.1} fill={woodTones.light} />
      </g>
    </PropAnchor>
  )
}
