import { useId } from 'react'
import PropAnchor from './PropAnchor'
import styles from './Props.module.css'
import reactions from './Reactions.module.css'
import { catTreePlatforms } from './catTreeGeometry'
import { contactShadowColor, floorSquash, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const carpetPalettes = [
  { top: '#c8b39a', side: '#a58d73', rim: '#b9a286', inner: '#9c8468' },
  { top: '#a9bcc1', side: '#86999f', rim: '#98abb1', inner: '#7d9096' },
  { top: '#dfa98c', side: '#bf8769', rim: '#d0987a', inner: '#b37d60' },
]

const toyColors = ['#e8584a', '#3f8fc0', '#f2b233']

const padThickness = 10
const postWidth = 15

interface PadProps {
  centerX: number
  height: number
  width: number
  top: string
  side: string
}

function CarpetPad({ centerX, height, width, top, side }: PadProps) {
  const radiusX = width / 2
  const radiusY = radiusX * floorSquash
  const topY = -height
  const bottomY = topY + padThickness
  return (
    <g>
      <path
        d={`M ${centerX - radiusX} ${topY} L ${centerX - radiusX} ${bottomY} A ${radiusX} ${radiusY} 0 0 0 ${centerX + radiusX} ${bottomY} L ${centerX + radiusX} ${topY} Z`}
        fill={side}
      />
      <ellipse cx={centerX} cy={topY} rx={radiusX} ry={radiusY} fill={top} />
      <ellipse cx={centerX - radiusX * 0.25} cy={topY - radiusY * 0.25} rx={radiusX * 0.45} ry={radiusY * 0.35} fill="#ffffff" opacity={0.16} />
    </g>
  )
}

interface PostProps {
  centerX: number
  topY: number
  bottomY: number
  patternId: string
}

function SisalPost({ centerX, topY, bottomY, patternId }: PostProps) {
  const left = centerX - postWidth / 2
  return (
    <g>
      <rect x={left} y={topY} width={postWidth} height={bottomY - topY} fill={`url(#${patternId})`} />
      <rect x={left} y={topY} width={3} height={bottomY - topY} fill="#ffffff" opacity={0.18} />
      <rect x={left + postWidth - 4.5} y={topY} width={4.5} height={bottomY - topY} fill="#5b3f1f" opacity={0.18} />
    </g>
  )
}

export default function CatTree({ prop, x, y, scale, zIndex }: PropViewProps) {
  const sisalPatternId = `sisal${useId().replace(/:/g, '')}`
  const platforms = catTreePlatforms(prop)
  const palette = carpetPalettes[prop.variant % carpetPalettes.length]
  const toyColor = toyColors[(prop.variant + 1) % toyColors.length]
  const baseHalfWidth = prop.radius * 1.25
  const baseDepth = baseHalfWidth * floorSquash * 1.5
  const baseHeight = 11
  const baseTopY = -baseHeight
  const topPlatform = platforms[platforms.length - 1]
  const lowerPlatforms = platforms.slice(0, -1)
  const toyPlatform = lowerPlatforms[lowerPlatforms.length - 1]
  const toyDirection = Math.sign(toyPlatform.offsetX) || 1
  const toyAnchorX = toyPlatform.offsetX + toyPlatform.width * 0.3 * toyDirection
  const toyAnchorY = -toyPlatform.height + padThickness - 2
  const toyStringLength = Math.min(36, toyPlatform.height * 0.4)
  const bedRadiusX = topPlatform.width / 2
  const bedRadiusY = bedRadiusX * floorSquash
  const reaction = pokeReactionOf(prop)

  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
      <defs>
        <pattern id={sisalPatternId} width="8" height="3.2" patternUnits="userSpaceOnUse">
          <rect width="8" height="3.2" fill="#dcbd84" />
          <path d="M 0 0.9 Q 4 2.2 8 0.9" stroke="#bf9b62" strokeWidth="0.9" fill="none" />
        </pattern>
      </defs>
      <ellipse cx={0} cy={0} rx={baseHalfWidth * 1.3} ry={baseDepth * 0.75} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.wobble)} style={{ transformOrigin: '0px 0px' }}>
      <rect x={-baseHalfWidth} y={baseTopY - baseDepth} width={baseHalfWidth * 2} height={baseDepth + baseHeight} rx={6} fill={palette.side} />
      <rect x={-baseHalfWidth} y={baseTopY - baseDepth} width={baseHalfWidth * 2} height={baseDepth} rx={6} fill={palette.top} />
      <rect x={-baseHalfWidth + 5} y={baseTopY - baseDepth + 3} width={baseHalfWidth * 0.9} height={baseDepth * 0.35} rx={3} fill="#ffffff" opacity={0.14} />
      <SisalPost centerX={topPlatform.offsetX} topY={-topPlatform.height + padThickness} bottomY={baseTopY - baseDepth * 0.5} patternId={sisalPatternId} />
      {lowerPlatforms.map((platform) => (
        <SisalPost
          key={`post${platform.offsetX}`}
          centerX={platform.offsetX}
          topY={-platform.height + padThickness}
          bottomY={baseTopY - baseDepth * 0.45}
          patternId={sisalPatternId}
        />
      ))}
      {lowerPlatforms.map((platform) => (
        <CarpetPad
          key={`pad${platform.offsetX}`}
          centerX={platform.offsetX}
          height={platform.height}
          width={platform.width}
          top={palette.top}
          side={palette.side}
        />
      ))}
      <g className={reactionClass(reaction, reactions.swingHard)} style={{ transformOrigin: `${toyAnchorX}px ${toyAnchorY}px` }}>
        <g className={styles.swing} style={{ transformOrigin: `${toyAnchorX}px ${toyAnchorY}px` }}>
          <line x1={toyAnchorX} y1={toyAnchorY} x2={toyAnchorX} y2={toyAnchorY + toyStringLength} stroke="#6b5a48" strokeWidth={1.2} />
          <circle cx={toyAnchorX} cy={toyAnchorY + toyStringLength + 5} r={5.5} fill={toyColor} />
          <circle cx={toyAnchorX - 1.8} cy={toyAnchorY + toyStringLength + 3.2} r={1.8} fill="#ffffff" opacity={0.45} />
        </g>
      </g>
      <CarpetPad
        centerX={topPlatform.offsetX}
        height={topPlatform.height}
        width={topPlatform.width}
        top={palette.top}
        side={palette.side}
      />
      <ellipse
        cx={topPlatform.offsetX}
        cy={-topPlatform.height + 1}
        rx={bedRadiusX - 7}
        ry={bedRadiusY - 3.5}
        fill={palette.inner}
      />
      <path
        d={`M ${topPlatform.offsetX - bedRadiusX + 2} ${-topPlatform.height} A ${bedRadiusX - 2} ${bedRadiusY - 1} 0 0 1 ${topPlatform.offsetX + bedRadiusX - 2} ${-topPlatform.height}`}
        stroke={palette.rim}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      </g>
    </PropAnchor>
  )
}
