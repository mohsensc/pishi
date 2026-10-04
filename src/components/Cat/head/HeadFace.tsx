import { memo } from 'react'
import type { CatCoat } from '../../../game/types'
import type { CatDimensions } from '../breedShapes'
import { coatPalette } from '../coatPalette'
import CatFur from '../CatFur'
import { headLayout } from './headLayout'

interface HeadFaceProps {
  dimensions: CatDimensions
  coat: CatCoat
  clipId: string
}

function HeadFace({ dimensions, coat, clipId }: HeadFaceProps) {
  const palette = coatPalette(coat)
  const { radius, isPersian, isMau, headRadiusX, headRadiusY, eyeY, backEyeCenter, frontEyeCenter, nose } = headLayout(dimensions)
  const muzzleColor = palette.muzzle
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={0} cy={0} rx={headRadiusX} ry={headRadiusY} />
          <ellipse cx={radius * 0.12} cy={radius * 0.3} rx={radius * 0.98} ry={radius * 0.68} />
        </clipPath>
      </defs>
      <g fill={coat.baseColor}>
        <ellipse cx={0} cy={0} rx={headRadiusX} ry={headRadiusY} />
        <ellipse cx={radius * 0.12} cy={radius * 0.3} rx={radius * 0.98} ry={radius * 0.68} />
      </g>
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx={-radius * 0.15} cy={-radius * 0.55} rx={radius * 0.8} ry={radius * 0.4} fill={palette.headHighlight} opacity={0.5} />
        {coat.pattern === 'tuxedo' || coat.pattern === 'bicolor' ? (
          <g fill={coat.patchColor}>
            {coat.whiteMuzzle && (
              <>
                <path
                  d={`M ${0.02 * radius} ${0.3 * radius} L ${0.17 * radius} ${-0.52 * radius} Q ${0.22 * radius} ${-0.66 * radius} ${0.27 * radius} ${-0.52 * radius} L ${0.5 * radius} ${0.3 * radius} Z`}
                />
                <ellipse cx={0.26 * radius} cy={0.52 * radius} rx={0.58 * radius} ry={0.42 * radius} />
              </>
            )}
            <ellipse cx={0.1 * radius} cy={0.95 * radius} rx={0.6 * radius} ry={0.3 * radius} />
          </g>
        ) : (
          <ellipse cx={nose.x} cy={nose.y + radius * 0.2} rx={radius * 0.46} ry={radius * 0.28} fill={muzzleColor} opacity={0.85} />
        )}
        {isMau && (
          <g fill="none" stroke={coat.spotColor} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
            <path
              d={`M ${-0.1 * radius} ${-0.44 * radius} L 0 ${-0.68 * radius} L ${0.16 * radius} ${-0.52 * radius} L ${0.32 * radius} ${-0.7 * radius} L ${0.42 * radius} ${-0.46 * radius}`}
              opacity={0.75}
            />
            <path d={`M ${0.16 * radius} ${-0.54 * radius} L ${0.16 * radius} ${-0.9 * radius}`} opacity={0.75} />
            <path
              d={`M ${backEyeCenter.x - dimensions.eyeRadiusX * 0.95} ${eyeY + dimensions.eyeRadiusY * 0.35} Q ${-0.52 * radius} ${eyeY + 0.22 * radius} ${-0.78 * radius} ${eyeY + 0.12 * radius}`}
            />
            <path d={`M ${-0.36 * radius} ${0.26 * radius} Q ${-0.56 * radius} ${0.34 * radius} ${-0.7 * radius} ${0.5 * radius}`} />
            <path
              d={`M ${frontEyeCenter.x + dimensions.eyeRadiusX * 0.85} ${eyeY + dimensions.eyeRadiusY * 0.4} Q ${0.84 * radius} ${eyeY + 0.2 * radius} ${0.98 * radius} ${eyeY + 0.08 * radius}`}
            />
          </g>
        )}
        {coat.pattern === 'solid' && coat.breed !== 'persian' && (
          <g fill="none" stroke={coat.spotColor} strokeWidth={1.4} strokeLinecap="round" opacity={0.6}>
            <path d={`M ${0.02 * radius} ${-0.45 * radius} L ${0.06 * radius} ${-0.8 * radius}`} />
            <path d={`M ${0.2 * radius} ${-0.45 * radius} L ${0.2 * radius} ${-0.85 * radius}`} />
            <path d={`M ${0.38 * radius} ${-0.45 * radius} L ${0.34 * radius} ${-0.8 * radius}`} />
          </g>
        )}
      </g>
      {isPersian && (
        <CatFur
          centerX={radius * 0.15}
          centerY={radius * 0.5}
          radiusX={radius * 0.95}
          radiusY={radius * 0.45}
          tuftRadius={3}
          tuftCount={9}
          color={palette.chinTuft}
          startAngle={20}
          endAngle={160}
        />
      )}
    </>
  )
}

export default memo(HeadFace)
