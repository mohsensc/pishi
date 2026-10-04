import PropAnchor from './PropAnchor'
import reactions from './Reactions.module.css'
import { contactShadowColor, groundZIndex, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const cushionPalettes = [
  { body: '#d9826b', seam: '#b9644f', light: '#eba58f', seat: '#c9725c' },
  { body: '#6f9fc4', seam: '#557f9f', light: '#98bddb', seat: '#618db0' },
  { body: '#e2bf5c', seam: '#bf9c3e', light: '#f1d78d', seat: '#d2ae4c' },
]

export default function Cushion({ prop, x, y, scale }: PropViewProps) {
  const palette = cushionPalettes[prop.variant % cushionPalettes.length]
  const radius = prop.radius
  const reaction = pokeReactionOf(prop)
  const squash = Math.min(1, prop.agitation)
  return (
    <PropAnchor x={x} y={y} zIndex={groundZIndex.flowerBed} scale={scale}>
      <ellipse cx={0} cy={1} rx={radius * 1.12} ry={radius * 0.4} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.rockBounce)} style={{ transformOrigin: '0px 0px' }}>
        <g transform={`scale(${1 + squash * 0.05} ${1 - squash * 0.12})`}>
          <ellipse cx={0} cy={-radius * 0.2} rx={radius} ry={radius * 0.52} fill={palette.body} />
          <ellipse cx={0} cy={-radius * 0.28} rx={radius * 0.95} ry={radius * 0.45} fill={palette.light} />
          <ellipse cx={0} cy={-radius * 0.25} rx={radius * 0.64} ry={radius * 0.27} fill={palette.seat} />
          <ellipse cx={0} cy={-radius * 0.25} rx={radius * 0.64} ry={radius * 0.27} fill="none" stroke={palette.seam} strokeWidth={0.9} strokeDasharray="2 2" opacity={0.55} />
          <path d={`M ${-radius * 0.99} ${-radius * 0.16} A ${radius} ${radius * 0.52} 0 0 0 ${radius * 0.99} ${-radius * 0.16}`} fill="none" stroke={palette.seam} strokeWidth={1.1} opacity={0.5} />
          <circle cx={-radius * 0.22} cy={-radius * 0.27} r={radius * 0.05} fill={palette.seam} opacity={0.6} />
          <circle cx={radius * 0.22} cy={-radius * 0.23} r={radius * 0.05} fill={palette.seam} opacity={0.6} />
        </g>
      </g>
    </PropAnchor>
  )
}
