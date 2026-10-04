import PropAnchor from '../Props/PropAnchor'
import { contactShadowColor, type PropViewProps } from '../Props/propView'
import { pokeOf, seeded, sizeFactorOf } from './shopArt'
import styles from './ShopItems.module.css'

const ballTones = ['#e3c14a', '#ef8f7a', '#7fbfd6']
const featherTones = ['#e8805f', '#7fbfd6', '#9cc96b', '#f3a9c1']

function coilPath(bottom: number, top: number, turns: number, width: number): string {
  const step = (top - bottom) / (turns * 2)
  let path = `M 0 ${bottom}`
  for (let index = 0; index < turns * 2; index += 1) {
    const side = index % 2 === 0 ? width : -width
    path += ` Q ${side} ${bottom + step * (index + 0.5)} 0 ${bottom + step * (index + 1)}`
  }
  return path
}

export default function SpringToy({ prop, x, y, scale, zIndex }: PropViewProps) {
  const reaction = pokeOf(prop)
  const ballTone = ballTones[prop.variant % ballTones.length]
  const springTop = -30
  const headY = springTop - 9
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactorOf(prop)}>
      <ellipse cx={0} cy={1} rx={14} ry={4.5} fill={contactShadowColor} />
      <ellipse cx={0} cy={-2} rx={12} ry={4.4} fill="#6f8f9f" />
      <path d="M -12 -2 L -12 -5 Q 0 -10 12 -5 L 12 -2 Q 0 3 -12 -2 Z" fill="#87a8b8" />
      <ellipse cx={0} cy={-5} rx={12} ry={4.2} fill="#9dbdcc" />
      <g className={styles.wobbleIdle} style={{ animationDelay: `${seeded(prop, 2) * -2.8}s`, transformOrigin: '0px -5px' }}>
        <g key={reaction.key} className={reaction.poked ? styles.boing : undefined} style={{ transformOrigin: '0px -5px' }}>
          <g key={`coil${reaction.key}`} className={reaction.poked ? styles.springSquash : undefined} style={{ transformOrigin: '0px -5px' }}>
            <path d={coilPath(-5, springTop, 5, 5)} stroke="#b8c2c4" strokeWidth={2.2} fill="none" strokeLinecap="round" />
            <path d={coilPath(-5, springTop, 5, 5)} stroke="#e9eff0" strokeWidth={0.8} fill="none" strokeLinecap="round" />
          </g>
          <circle cx={0} cy={headY} r={9} fill={ballTone} />
          <path d={`M -6 ${headY - 3} Q 0 ${headY + 2} 6 ${headY - 3}`} stroke="#ffffff" strokeWidth={1.4} fill="none" opacity={0.75} />
          <circle cx={-3} cy={headY - 4} r={2.2} fill="#ffffff" opacity={0.4} />
          {featherTones.map((tone, index) => (
            <path
              key={tone}
              className={styles.flutter}
              style={{ animationDelay: `${index * 0.12}s` }}
              d={`M ${index - 1.5} ${headY - 8} q ${-6 + index * 4} -8 ${-4 + index * 3} -15 q ${3 - index} 6 ${3 - index * 1.4} 15 Z`}
              fill={tone}
            />
          ))}
        </g>
      </g>
    </PropAnchor>
  )
}
