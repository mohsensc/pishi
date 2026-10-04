import type { CSSProperties } from 'react'
import PropAnchor from './PropAnchor'
import styles from './Props.module.css'
import reactions from './Reactions.module.css'
import { contactShadowColor, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const fabricPalettes = [
  { body: '#e2674f', rib: '#c24f3b', light: '#f0937e', inner: '#5a2a22' },
  { body: '#4c9db5', rib: '#357f96', light: '#7bbccf', inner: '#1f3f4b' },
  { body: '#eeb23c', rib: '#cf912a', light: '#f6cd72', inner: '#5c421a' },
]

export default function Tunnel({ prop, x, y, scale, zIndex, occupantCoats }: PropViewProps) {
  const palette = fabricPalettes[prop.variant % fabricPalettes.length]
  const exit = prop.tunnelExit ?? { x: prop.position.x + prop.radius * 6, y: prop.position.y }
  const deltaX = exit.x - prop.position.x
  const deltaY = exit.y - prop.position.y
  const length = Math.max(Math.hypot(deltaX, deltaY), prop.radius * 2)
  const angleDegrees = (Math.atan2(deltaY, deltaX) * 180) / Math.PI
  const tubeRadius = prop.radius * scale
  const openingRadiusX = tubeRadius * 0.34
  const ribSpacing = tubeRadius * 0.62
  const ribCount = Math.max(3, Math.floor((length - openingRadiusX * 2) / ribSpacing))
  const ribs = Array.from({ length: ribCount }, (_, index) => openingRadiusX + ((index + 0.5) * (length - openingRadiusX * 2)) / ribCount)
  const isOccupied = prop.occupantIds.length > 0 || (occupantCoats?.length ?? 0) > 0
  const reaction = pokeReactionOf(prop)
  const tubeTop = -tubeRadius
  const tubeBottom = tubeRadius

  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={1}>
      <line
        x1={0}
        y1={2}
        x2={deltaX}
        y2={deltaY + 2}
        stroke={contactShadowColor}
        strokeWidth={tubeRadius * 1.3}
        strokeLinecap="round"
      />
      <g transform={`translate(0 ${-tubeRadius}) rotate(${angleDegrees})`}>
        <g key={reaction.key} className={reactionClass(reaction, reactions.roll)} style={{ transformOrigin: `${length / 2}px ${tubeBottom}px` }}>
        <g className={reactionClass(reaction, reactions.crinkle)} style={{ transformOrigin: `${length / 2}px 0px` }}>
        <g className={isOccupied ? styles.rustle : undefined}>
          <path
            d={`M 0 ${tubeTop} Q ${length / 2} ${tubeTop + tubeRadius * 0.12} ${length} ${tubeTop} L ${length} ${tubeBottom} Q ${length / 2} ${tubeBottom + tubeRadius * 0.04} 0 ${tubeBottom} Z`}
            fill={palette.body}
          />
          <path
            d={`M 0 ${tubeTop + tubeRadius * 0.18} Q ${length / 2} ${tubeTop + tubeRadius * 0.3} ${length} ${tubeTop + tubeRadius * 0.18} L ${length} ${tubeTop + tubeRadius * 0.5} Q ${length / 2} ${tubeTop + tubeRadius * 0.62} 0 ${tubeTop + tubeRadius * 0.5} Z`}
            fill={palette.light}
            opacity={0.55}
          />
          <path
            d={`M 0 ${tubeBottom - tubeRadius * 0.45} Q ${length / 2} ${tubeBottom - tubeRadius * 0.38} ${length} ${tubeBottom - tubeRadius * 0.45} L ${length} ${tubeBottom} L 0 ${tubeBottom} Z`}
            fill="#000000"
            opacity={0.1}
          />
          {ribs.map((ribX) => (
            <path
              key={ribX}
              d={`M ${ribX} ${tubeTop + 1} Q ${ribX + tubeRadius * 0.22} 0 ${ribX} ${tubeBottom - 1}`}
              stroke={palette.rib}
              strokeWidth={Math.max(1.4, tubeRadius * 0.09)}
              fill="none"
              strokeLinecap="round"
            />
          ))}
          {isOccupied && (
            <ellipse
              className={reactions.tunnelBulge}
              style={{ '--travel': `${length - openingRadiusX * 4}px` } as CSSProperties}
              cx={openingRadiusX * 2}
              cy={0}
              rx={tubeRadius * 0.42}
              ry={tubeRadius * 1.08}
              fill={palette.body}
              stroke={palette.rib}
              strokeWidth={Math.max(1.4, tubeRadius * 0.09)}
            />
          )}
          <ellipse cx={length} cy={0} rx={openingRadiusX} ry={tubeRadius} fill={palette.rib} />
          <ellipse cx={length + 1} cy={0} rx={openingRadiusX * 0.7} ry={tubeRadius * 0.82} fill={palette.inner} />
          <ellipse cx={0} cy={0} rx={openingRadiusX} ry={tubeRadius} fill={palette.rib} />
          <ellipse cx={-1} cy={0} rx={openingRadiusX * 0.7} ry={tubeRadius * 0.82} fill={palette.inner} />
        </g>
        </g>
        </g>
      </g>
    </PropAnchor>
  )
}
