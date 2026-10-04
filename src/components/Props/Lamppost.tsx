import { useId } from 'react'
import PropAnchor from './PropAnchor'
import styles from './Props.module.css'
import reactions from './Reactions.module.css'
import { contactShadowColor, groundZIndex, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const ironColor = '#35463d'
const ironHighlight = '#4f6358'
const basketBlooms = ['#f07c6a', '#f3a9c1', '#f6c24c', '#f4efe2']
const litGlass = '#ffe9a3'
const unlitGlass = '#d9d6c6'

interface LightPoolProps {
  x: number
  y: number
  scale: number
  gradientId: string
}

function LightPool({ x, y, scale, gradientId }: LightPoolProps) {
  return (
    <PropAnchor x={x} y={y} zIndex={groundZIndex.lightPool} scale={scale} className={styles.passive}>
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor="#ffe6a6" stopOpacity={0.5} />
          <stop offset="55%" stopColor="#ffdc8c" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#ffd67a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse className={reactions.lightPool} cx={0} cy={0} rx={120} ry={46} fill={`url(#${gradientId})`} />
    </PropAnchor>
  )
}

export default function Lamppost({ prop, x, y, scale, zIndex }: PropViewProps) {
  const poleHeight = 166
  const sizeFactor = Math.min(1.15, Math.max(0.6, prop.radius / 8))
  const lanternBottom = -poleHeight
  const lanternHeight = 26
  const lanternTop = lanternBottom - lanternHeight
  const hasBasket = prop.variant % 2 === 0
  const armSide = prop.variant % 4 < 2 ? 1 : -1
  const armY = -poleHeight * 0.72
  const basketX = armSide * 20
  const basketY = armY + 22
  const reaction = pokeReactionOf(prop)
  const idBase = useId().replace(/:/g, '')
  const lit = prop.lit

  return (
    <>
    {lit && <LightPool x={x} y={y} scale={scale * sizeFactor} gradientId={`lampPool${idBase}`} />}
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale * sizeFactor}>
      <defs>
        <radialGradient id={`lampHalo${idBase}`}>
          <stop offset="0%" stopColor="#fff2c2" stopOpacity={0.75} />
          <stop offset="45%" stopColor="#ffe29a" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#ffd67a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={1} rx={16} ry={5} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.lampWobble)} style={{ transformOrigin: '0px 0px' }}>
      <path d="M -11 0 L -8 -14 L 8 -14 L 11 0 Z" fill={ironColor} />
      <rect x={-6} y={-20} width={12} height={7} rx={2} fill={ironColor} />
      <rect x={-2.6} y={-poleHeight + 4} width={5.2} height={poleHeight - 20} fill={ironColor} />
      <rect x={-2.6} y={-poleHeight + 4} width={1.6} height={poleHeight - 20} fill={ironHighlight} />
      <rect x={-4.5} y={-poleHeight * 0.45} width={9} height={4} rx={1.5} fill={ironColor} />
      <rect x={-5} y={lanternBottom} width={10} height={5} rx={1.5} fill={ironColor} />
      {lit && (
        <g className={reactionClass(reaction, reactions.lampFlicker)}>
          <circle className={styles.glow} cx={0} cy={lanternBottom - lanternHeight / 2} r={46} fill={`url(#lampHalo${idBase})`} />
        </g>
      )}
      <path
        d={`M -7 ${lanternBottom} L -10 ${lanternTop} L 10 ${lanternTop} L 7 ${lanternBottom} Z`}
        fill={lit ? litGlass : unlitGlass}
      />
      {lit && <ellipse cx={0} cy={lanternBottom - lanternHeight * 0.45} rx={3.2} ry={5} fill="#fffbe8" />}
      <path d={`M 0 ${lanternBottom} L 0 ${lanternTop}`} stroke={ironColor} strokeWidth={1.4} />
      <path
        d={`M -7 ${lanternBottom} L -10 ${lanternTop} M 7 ${lanternBottom} L 10 ${lanternTop}`}
        stroke={ironColor}
        strokeWidth={2}
      />
      <path d={`M -13 ${lanternTop} L 0 ${lanternTop - 10} L 13 ${lanternTop} Z`} fill={ironColor} />
      <circle cx={0} cy={lanternTop - 12} r={2.6} fill={ironColor} />
      {hasBasket && (
        <g>
          <path
            d={`M 0 ${armY} L ${basketX} ${armY} q ${armSide * 4} 0 ${armSide * 4} 4`}
            stroke={ironColor}
            strokeWidth={2.4}
            fill="none"
          />
          <path
            d={`M ${basketX - 8 + armSide * 4} ${basketY - 14} L ${basketX + armSide * 4} ${armY + 4} L ${basketX + 8 + armSide * 4} ${basketY - 14}`}
            stroke={ironColor}
            strokeWidth={0.9}
            fill="none"
          />
          <ellipse cx={basketX + armSide * 4} cy={basketY - 16} rx={11} ry={6} fill="#5f9e4b" />
          {basketBlooms.map((bloomColor, index) => (
            <circle
              key={bloomColor}
              cx={basketX + armSide * 4 - 8 + index * 5.3}
              cy={basketY - 18 + (index % 2) * 3}
              r={2.4}
              fill={bloomColor}
            />
          ))}
          <path
            d={`M ${basketX + armSide * 4 - 9} ${basketY - 14} Q ${basketX + armSide * 4} ${basketY - 2} ${basketX + armSide * 4 + 9} ${basketY - 14} Z`}
            fill="#8a5c3b"
          />
          <path
            d={`M ${basketX + armSide * 4 - 7} ${basketY - 12} q -2 6 0 10 M ${basketX + armSide * 4 + 6} ${basketY - 12} q 2 5 1 9`}
            stroke="#5f9e4b"
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
      </g>
    </PropAnchor>
    </>
  )
}
