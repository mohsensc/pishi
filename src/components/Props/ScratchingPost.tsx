import { useId } from 'react'
import PropAnchor from './PropAnchor'
import styles from './Props.module.css'
import reactions from './Reactions.module.css'
import { contactShadowColor, floorSquash, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const carpetColors = [
  { top: '#e7d6b8', side: '#cdb892' },
  { top: '#c9dbc9', side: '#a9c0a9' },
  { top: '#eec3ad', side: '#d6a48b' },
]

export default function ScratchingPost({ prop, x, y, scale, zIndex }: PropViewProps) {
  const sisalPatternId = `postSisal${useId().replace(/:/g, '')}`
  const palette = carpetColors[prop.variant % carpetColors.length]
  const baseHalf = Math.max(16, prop.radius * 1.5)
  const baseDepth = baseHalf * floorSquash * 1.6
  const baseThickness = 6
  const postWidth = Math.max(14, prop.radius * 1.1)
  const postHeight = Math.max(60, prop.radius * 5.6)
  const capHalf = postWidth * 1.15
  const topY = -postHeight
  const mouseX = capHalf * 0.9
  const mouseStringTop = topY + 3
  const reaction = pokeReactionOf(prop)

  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
      <defs>
        <pattern id={sisalPatternId} width="6" height="4.5" patternUnits="userSpaceOnUse">
          <rect width="6" height="4.5" fill="#dcbc7e" />
          <path d="M 0 1.3 Q 3 3.2 6 1.3" stroke="#b8935a" strokeWidth="1.1" fill="none" />
        </pattern>
      </defs>
      <ellipse cx={0} cy={1} rx={baseHalf * 1.25} ry={baseDepth * 0.7} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.wobble)} style={{ transformOrigin: '0px 0px' }}>
      <rect x={-baseHalf} y={-baseThickness - baseDepth} width={baseHalf * 2} height={baseDepth + baseThickness} rx={4} fill={palette.side} />
      <rect x={-baseHalf} y={-baseThickness - baseDepth} width={baseHalf * 2} height={baseDepth} rx={4} fill={palette.top} />
      <rect x={-postWidth / 2} y={topY} width={postWidth} height={postHeight - baseThickness - baseDepth / 2} fill={`url(#${sisalPatternId})`} />
      <rect x={postWidth / 2 - 3.5} y={topY} width={3.5} height={postHeight - baseThickness - baseDepth / 2} fill="#000000" opacity={0.12} />
      <path
        d={`M ${-capHalf} ${topY} L ${-capHalf} ${topY + 4} A ${capHalf} ${capHalf * floorSquash} 0 0 0 ${capHalf} ${topY + 4} L ${capHalf} ${topY} Z`}
        fill={palette.side}
      />
      <ellipse cx={0} cy={topY} rx={capHalf} ry={capHalf * floorSquash} fill={palette.top} />
      <g className={reactionClass(reaction, reactions.swingHard)} style={{ transformOrigin: `${mouseX}px ${mouseStringTop}px` }}>
      <g className={styles.swing} style={{ transformOrigin: `${mouseX}px ${mouseStringTop}px`, animationDelay: '-1.2s' }}>
        <path
          d={`M ${mouseX} ${mouseStringTop} q 3 6 0 10 q -3 4 0 8 q 3 4 0 8`}
          stroke="#7b6a58"
          strokeWidth={1.1}
          fill="none"
        />
        <ellipse cx={mouseX} cy={mouseStringTop + 30} rx={4.2} ry={6} fill="#9ca3a0" />
        <circle cx={mouseX - 3} cy={mouseStringTop + 26} r={2.2} fill="#d99a9a" />
        <circle cx={mouseX + 3} cy={mouseStringTop + 26} r={2.2} fill="#d99a9a" />
        <circle cx={mouseX} cy={mouseStringTop + 36} r={1.1} fill="#d99a9a" />
      </g>
      </g>
      </g>
    </PropAnchor>
  )
}
