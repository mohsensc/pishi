import { motion } from 'motion/react'
import PropAnchor from '../Props/PropAnchor'
import { contactShadowColor, type PropViewProps } from '../Props/propView'
import { seeded, sizeFactorOf } from './shopArt'
import { useSpin } from './useSpin'
import styles from './ShopItems.module.css'

const bladeSets = [
  ['#ef8f7a', '#f3c45b', '#7fbfd6', '#9cc96b'],
  ['#f3a9c1', '#f6d36b', '#a7c7ec', '#f08a5d'],
  ['#7fbfd6', '#f4efe2', '#ef8f7a', '#f4efe2'],
]

const hubY = -58
const bladeLength = 15

export default function Pinwheel({ prop, x, y, scale, zIndex }: PropViewProps) {
  const tones = bladeSets[prop.variant % bladeSets.length]
  const angle = useSpin(50 + prop.agitation * 1100, seeded(prop, 1))
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactorOf(prop)}>
      <ellipse cx={0} cy={1} rx={9} ry={3} fill={contactShadowColor} />
      <g className={styles.swayGentle} style={{ animationDelay: `${seeded(prop, 2) * -3}s` }}>
        <path d={`M -1.2 0 L -1 ${hubY} L 1 ${hubY} L 1.2 0 Z`} fill="#c9a77a" />
        <path d={`M -1.2 0 L -1 ${hubY} L 0 ${hubY} L 0 0 Z`} fill="#e2c69a" />
        <g transform={`translate(0 ${hubY})`}>
          <motion.g style={{ rotate: angle }}>
            <circle cx={0} cy={0} r={bladeLength + 2} fill="transparent" />
            {tones.map((tone, index) => (
              <g key={index} transform={`rotate(${index * 90})`}>
                <path d={`M 0 0 L 0 ${-bladeLength} Q ${bladeLength * 0.9} ${-bladeLength * 0.9} ${bladeLength * 0.55} -1 Z`} fill={tone} />
                <path d={`M 0 0 L 0 ${-bladeLength} Q ${bladeLength * 0.35} ${-bladeLength * 0.6} ${bladeLength * 0.2} 0 Z`} fill="#ffffff" opacity={0.28} />
              </g>
            ))}
          </motion.g>
        </g>
        <circle cx={0} cy={hubY} r={2.2} fill="#f4efe2" stroke="#b98552" strokeWidth={0.8} />
      </g>
    </PropAnchor>
  )
}
