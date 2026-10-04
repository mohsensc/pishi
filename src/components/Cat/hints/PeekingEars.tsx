import type { CatCoat } from '../../../game/types'
import { darken, lighten } from '../catColors'

interface PeekingEarsProps {
  coat: CatCoat
  size: number
}

const innerEarColor = '#eea3a7'

export default function PeekingEars({ coat, size }: PeekingEarsProps) {
  const half = size / 2
  const earHeight = size * (coat.breed === 'persian' ? 0.3 : coat.breed === 'egyptianMau' ? 0.52 : 0.44)
  const domeHeight = size * 0.26
  const earBaseY = -domeHeight * 0.72
  const earSpread = half * 0.62
  const earWidth = half * 0.42
  const outline = darken(coat.baseColor, 0.25)
  const ear = (side: 1 | -1) => {
    const baseInner = side * (earSpread - earWidth)
    const baseOuter = side * (earSpread + earWidth * 0.55)
    const tipX = side * (earSpread + earWidth * 0.25)
    const tipY = earBaseY - earHeight
    return {
      outer: `M ${baseInner} ${earBaseY + 2} L ${tipX} ${tipY} L ${baseOuter} ${earBaseY + 3} Z`,
      inner: `M ${baseInner + side * earWidth * 0.3} ${earBaseY + 1} L ${tipX} ${tipY + earHeight * 0.3} L ${baseOuter - side * earWidth * 0.3} ${earBaseY + 2} Z`,
    }
  }
  const left = ear(-1)
  const right = ear(1)
  return (
    <g className="peekingEars">
      <path d={left.outer} fill={coat.baseColor} stroke={coat.baseColor} strokeWidth={size * 0.05} strokeLinejoin="round" />
      <path d={right.outer} fill={coat.baseColor} stroke={coat.baseColor} strokeWidth={size * 0.05} strokeLinejoin="round" />
      <path d={left.inner} fill={innerEarColor} />
      <path d={right.inner} fill={innerEarColor} />
      <path d={`M ${-half * 0.95} 0 C ${-half * 0.9} ${-domeHeight * 1.25} ${half * 0.9} ${-domeHeight * 1.25} ${half * 0.95} 0 Z`} fill={coat.baseColor} />
      <path d={`M ${-half * 0.5} ${-domeHeight * 0.72} Q 0 ${-domeHeight * 1.02} ${half * 0.5} ${-domeHeight * 0.72}`} fill="none" stroke={lighten(coat.baseColor, 0.18)} strokeWidth={size * 0.05} strokeLinecap="round" opacity={0.6} />
      <path d={`M ${-half * 0.55} ${-domeHeight * 0.18} q ${half * 0.14} ${-domeHeight * 0.3} ${half * 0.28} 0 M ${half * 0.27} ${-domeHeight * 0.18} q ${half * 0.14} ${-domeHeight * 0.3} ${half * 0.28} 0`} fill="none" stroke={outline} strokeWidth={size * 0.035} strokeLinecap="round" />
    </g>
  )
}
