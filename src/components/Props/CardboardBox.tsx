import PeekingEars from '../Cat/hints/PeekingEars'
import PropAnchor from './PropAnchor'
import styles from './Props.module.css'
import reactions from './Reactions.module.css'
import { contactShadowColor, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const sizeFactors = [1, 0.86, 1.14, 0.95]

const cardboardPalettes = [
  { front: '#caa06a', flap: '#d8b27e', inner: '#a67a47', deep: '#6e4a28', tape: '#e8d3a6' },
  { front: '#c29460', flap: '#d3a874', inner: '#9c7140', deep: '#664424', tape: '#ead9b2' },
  { front: '#d2aa74', flap: '#e0bd8a', inner: '#ab8050', deep: '#735030', tape: '#efe0bc' },
]

export default function CardboardBox({ prop, x, y, scale, zIndex, occupantCoats }: PropViewProps) {
  const palette = cardboardPalettes[prop.variant % cardboardPalettes.length]
  const width = prop.radius * 2 * sizeFactors[prop.variant % sizeFactors.length]
  const halfWidth = width / 2
  const boxHeight = width * 0.56
  const openingDepth = width * 0.34
  const rimY = -boxHeight
  const backY = rimY - openingDepth
  const flapReach = width * 0.24
  const hiddenCoats = (occupantCoats ?? []).slice(0, 2)
  const isOccupied = hiddenCoats.length > 0
  const frontFlapFolded = prop.variant % 3 === 1
  const peekSize = width * 0.42
  const reaction = pokeReactionOf(prop)
  const flapHingeY = (rimY + backY) / 2

  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
      <ellipse cx={0} cy={1} rx={halfWidth * 1.12} ry={halfWidth * 0.32} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.boxJump)} style={{ transformOrigin: '0px 0px' }}>
      <g className={isOccupied ? styles.wiggle : undefined}>
        <path
          d={`M ${-halfWidth} ${backY} L ${halfWidth} ${backY} L ${halfWidth * 0.9} ${backY - boxHeight * 0.52} L ${-halfWidth * 0.92} ${backY - boxHeight * 0.46} Z`}
          fill={palette.inner}
        />
        <path
          d={`M ${-halfWidth} ${backY} L ${halfWidth} ${backY} L ${halfWidth} ${rimY} L ${-halfWidth} ${rimY} Z`}
          fill={palette.deep}
        />
        <path
          d={`M ${-halfWidth} ${backY} L ${halfWidth} ${backY} L ${halfWidth} ${backY + openingDepth * 0.45} L ${-halfWidth} ${backY + openingDepth * 0.45} Z`}
          fill={palette.inner}
        />
        {hiddenCoats.map((coat, index) => (
          <g key={`ears${index}`} transform={`translate(${hiddenCoats.length === 2 ? (index === 0 ? -halfWidth * 0.38 : halfWidth * 0.4) : 0} ${rimY})`}>
            <PeekingEars coat={coat} size={peekSize * (index === 0 ? 1 : 0.92)} />
          </g>
        ))}
        <g key={`flapLeft${reaction.key}`} className={reactionClass(reaction, reactions.flapLeft)} style={{ transformOrigin: `${-halfWidth}px ${flapHingeY}px` }}>
          <path
            d={`M ${-halfWidth} ${rimY} L ${-halfWidth} ${backY} L ${-halfWidth - flapReach} ${backY + openingDepth * 0.25} L ${-halfWidth - flapReach} ${rimY + openingDepth * 0.35} Z`}
            fill={palette.flap}
          />
        </g>
        <g key={`flapRight${reaction.key}`} className={reactionClass(reaction, reactions.flapRight)} style={{ transformOrigin: `${halfWidth}px ${flapHingeY}px` }}>
          <path
            d={`M ${halfWidth} ${rimY} L ${halfWidth} ${backY} L ${halfWidth + flapReach} ${backY + openingDepth * 0.2} L ${halfWidth + flapReach} ${rimY + openingDepth * 0.4} Z`}
            fill={palette.flap}
          />
          <path
            d={`M ${halfWidth} ${rimY} L ${halfWidth + flapReach} ${rimY + openingDepth * 0.4} L ${halfWidth + flapReach} ${backY + openingDepth * 0.2} L ${halfWidth + flapReach * 0.7} ${backY + openingDepth * 0.2} Z`}
            fill="#000000"
            opacity={0.08}
          />
        </g>
        <rect x={-halfWidth} y={rimY} width={width} height={boxHeight} fill={palette.front} />
        <rect x={halfWidth - width * 0.12} y={rimY} width={width * 0.12} height={boxHeight} fill="#000000" opacity={0.06} />
        <rect x={-width * 0.07} y={rimY} width={width * 0.14} height={boxHeight * 0.32} fill={palette.tape} opacity={0.85} />
        <path
          d={`M ${-halfWidth * 0.62} ${-boxHeight * 0.34} l 0 ${-boxHeight * 0.16} m -4 4 l 4 -4 l 4 4 M ${-halfWidth * 0.38} ${-boxHeight * 0.34} l 0 ${-boxHeight * 0.16} m -4 4 l 4 -4 l 4 4`}
          stroke="#8a6238"
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
        />
        {frontFlapFolded ? (
          <path
            d={`M ${-halfWidth} ${rimY} L ${halfWidth} ${rimY} L ${halfWidth * 0.96} ${rimY + boxHeight * 0.42} L ${-halfWidth * 0.96} ${rimY + boxHeight * 0.42} Z`}
            fill={palette.flap}
          />
        ) : (
          <path
            d={`M ${-halfWidth} ${rimY} L ${halfWidth} ${rimY} L ${halfWidth * 0.98} ${rimY + boxHeight * 0.1} L ${-halfWidth * 0.98} ${rimY + boxHeight * 0.1} Z`}
            fill={palette.flap}
          />
        )}
      </g>
      </g>
    </PropAnchor>
  )
}
