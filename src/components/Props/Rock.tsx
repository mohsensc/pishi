import PropAnchor from './PropAnchor'
import reactions from './Reactions.module.css'
import { contactShadowColor, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const stonePalettes = [
  { body: '#aeaea3', shade: '#8f9087', light: '#c8c8bd' },
  { body: '#b3a894', shade: '#958a77', light: '#cbc2ae' },
  { body: '#a2a7a1', shade: '#858a84', light: '#bec3bc' },
]

interface StoneProps {
  offsetX: number
  width: number
  height: number
  palette: (typeof stonePalettes)[number]
  hasMoss: boolean
}

function Stone({ offsetX, width, height, palette, hasMoss }: StoneProps) {
  const half = width / 2
  const outline = `M ${offsetX - half} 0 C ${offsetX - half * 1.05} ${-height * 0.55} ${offsetX - half * 0.55} ${-height * 1.02} ${offsetX - half * 0.05} ${-height} C ${offsetX + half * 0.55} ${-height * 0.98} ${offsetX + half * 1.08} ${-height * 0.6} ${offsetX + half} 0 Z`
  return (
    <g>
      <path d={outline} fill={palette.body} />
      <path
        d={`M ${offsetX + half * 0.15} ${-height * 0.98} C ${offsetX + half * 0.7} ${-height * 0.85} ${offsetX + half * 1.08} ${-height * 0.55} ${offsetX + half} 0 L ${offsetX + half * 0.2} 0 C ${offsetX + half * 0.45} ${-height * 0.4} ${offsetX + half * 0.4} ${-height * 0.75} ${offsetX + half * 0.15} ${-height * 0.98} Z`}
        fill={palette.shade}
        opacity={0.7}
      />
      <ellipse cx={offsetX - half * 0.35} cy={-height * 0.72} rx={half * 0.32} ry={height * 0.12} fill={palette.light} />
      {hasMoss && (
        <path
          d={`M ${offsetX - half * 0.7} ${-height * 0.82} q ${half * 0.35} ${-height * 0.28} ${half * 0.8} ${-height * 0.14} q ${-half * 0.2} ${height * 0.12} ${-half * 0.8} ${height * 0.14} Z`}
          fill="#7aa052"
          opacity={0.85}
        />
      )}
    </g>
  )
}

export default function Rock({ prop, x, y, scale, zIndex }: PropViewProps) {
  const palette = stonePalettes[prop.variant % stonePalettes.length]
  const radius = prop.radius
  const isCluster = prop.variant % 2 === 1
  const reaction = pokeReactionOf(prop)
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
      <ellipse cx={0} cy={0} rx={radius * 1.2} ry={radius * 0.38} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.rockBounce)} style={{ transformOrigin: '0px 0px' }}>
      {isCluster ? (
        <>
          <Stone offsetX={-radius * 0.35} width={radius * 1.4} height={radius * 1.05} palette={palette} hasMoss />
          <Stone offsetX={radius * 0.62} width={radius * 0.85} height={radius * 0.6} palette={palette} hasMoss={false} />
        </>
      ) : (
        <Stone offsetX={0} width={radius * 2.1} height={radius * 1.2} palette={palette} hasMoss={prop.variant % 3 === 0} />
      )}
      </g>
    </PropAnchor>
  )
}
