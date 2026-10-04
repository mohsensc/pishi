import { useId } from 'react'
import PropAnchor from '../Props/PropAnchor'
import { contactShadowColor, groundZIndex, type PropViewProps } from '../Props/propView'
import { pokeOf, seeded, sizeFactorOf, waterTones } from './shopArt'
import styles from './ShopItems.module.css'

const reach = 96
const arcs = [
  { spread: -14, lift: 46, length: 0.92, delay: 0 },
  { spread: 0, lift: 54, length: 1, delay: 0.15 },
  { spread: 14, lift: 46, length: 0.92, delay: 0.3 },
]
const glints = [
  { x: -60, y: 8, delay: 0 },
  { x: 48, y: -12, delay: 0.7 },
  { x: 18, y: 20, delay: 1.3 },
  { x: -28, y: -18, delay: 1.9 },
  { x: 70, y: 10, delay: 2.4 },
]

function WetPatch({ x, y, scale, gradientId }: { x: number; y: number; scale: number; gradientId: string }) {
  return (
    <PropAnchor x={x} y={y} zIndex={groundZIndex.lightPool} scale={scale} className={styles.passive}>
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor="#3f7d3a" stopOpacity={0.22} />
          <stop offset="70%" stopColor="#3f7d3a" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#3f7d3a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={reach * 1.05} ry={reach * 0.42} fill={`url(#${gradientId})`} />
      {glints.map((glint) => (
        <ellipse key={glint.x} className={styles.twinkle} style={{ animationDelay: `${glint.delay}s` }} cx={glint.x} cy={glint.y} rx={4} ry={1.2} fill="#f2fbfc" />
      ))}
    </PropAnchor>
  )
}

export default function Sprinkler({ prop, x, y, scale, zIndex }: PropViewProps) {
  const ids = useId().replace(/:/g, '')
  const reaction = pokeOf(prop)
  const drawScale = scale * sizeFactorOf(prop)
  const headY = -12
  return (
    <>
      <WetPatch x={x} y={y} scale={drawScale} gradientId={`sprinklerWet${ids}`} />
      <PropAnchor x={x} y={y} zIndex={zIndex} scale={drawScale}>
        <ellipse cx={0} cy={1} rx={13} ry={4} fill={contactShadowColor} />
        <path d="M -11 0 L -8 -7 L 8 -7 L 11 0 Q 0 4 -11 0 Z" fill="#d9584a" />
        <path d="M -8 -7 L 8 -7 L 9 -5 L -9 -5 Z" fill="#ef7b69" />
        <rect x={-2} y={headY} width={4} height={6} rx={1.4} fill="#9aa4a6" />
        <g className={styles.passive}>
          <g className={styles.sweep} style={{ transformOrigin: `0px ${headY}px`, animationDelay: `${seeded(prop, 1) * -5}s` }}>
            <rect x={-6} y={headY - 3} width={12} height={4} rx={2} fill="#c6cfd1" />
            {arcs.map((arc) => (
              <g key={arc.spread}>
                <path
                  className={styles.spray}
                  style={{ animationDelay: `${arc.delay}s` }}
                  d={`M 0 ${headY - 2} Q ${arc.spread * 0.4} ${headY - arc.lift} ${arc.spread * 0.9} ${headY - arc.lift * 0.4} T ${arc.spread} ${-reach * 0.42 * arc.length}`}
                  stroke={waterTones.light}
                  strokeWidth={1.8}
                  strokeDasharray="2 6"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.9}
                />
              </g>
            ))}
          </g>
          <g key={reaction.key} className={reaction.poked ? styles.surge : undefined} style={{ transformOrigin: `0px ${headY}px` }}>
            {[-1, 1].map((side) => (
              <path
                key={side}
                className={styles.spray}
                d={`M 0 ${headY - 2} Q ${side * reach * 0.5} ${headY - 62} ${side * reach} ${headY + 8}`}
                stroke={waterTones.light}
                strokeWidth={1.6}
                strokeDasharray="1.5 7"
                strokeLinecap="round"
                fill="none"
                opacity={0.8}
              />
            ))}
          </g>
          {[-1, 1].map((side) =>
            [0, 0.5].map((delay) => (
              <circle key={`${side}${delay}`} className={styles.mist} style={{ animationDelay: `${delay + (side > 0 ? 0.3 : 0)}s` }} cx={side * reach * (0.8 + delay * 0.2)} cy={4 - delay * 6} r={5} fill="#e9f7fb" opacity={0.6} />
            )),
          )}
        </g>
      </PropAnchor>
    </>
  )
}
