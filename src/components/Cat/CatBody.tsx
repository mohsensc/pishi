import { memo } from 'react'
import type { CatCoat } from '../../game/types'
import type { CatDimensions } from './breedShapes'
import type { CatRig } from './rig/rigModel'
import { coatPalette } from './coatPalette'
import CatFur from './CatFur'
import CatSpots from './CatSpots'

interface CatBodyProps {
  rig: CatRig
  dimensions: CatDimensions
  coat: CatCoat
  clipId: string
  seed: number
}

function BodySilhouette({ dimensions, arch }: { dimensions: CatDimensions; arch: number }) {
  const { bodyRadiusX, bodyRadiusY, chestRadius, haunchRadius } = dimensions
  return (
    <>
      <ellipse cx={0} cy={0} rx={bodyRadiusX} ry={bodyRadiusY} />
      {arch > 0.02 && (
        <ellipse cx={-bodyRadiusX * 0.05} cy={-bodyRadiusY * 1.05 * arch} rx={bodyRadiusX * (0.62 - 0.1 * arch)} ry={bodyRadiusY * (0.6 + 0.7 * arch)} />
      )}
      <circle cx={bodyRadiusX * 0.58} cy={bodyRadiusY * 0.08} r={chestRadius} />
      <circle cx={-bodyRadiusX * 0.5} cy={bodyRadiusY * 0.1} r={haunchRadius} />
    </>
  )
}

function TabbyStripes({ dimensions, color }: { dimensions: CatDimensions; color: string }) {
  const { bodyRadiusX, bodyRadiusY } = dimensions
  const stripes = Array.from({ length: 6 }, (_, index) => -bodyRadiusX * 0.85 + index * bodyRadiusX * 0.32)
  return (
    <g fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" opacity={0.55}>
      {stripes.map((x, index) => (
        <path key={index} d={`M ${x} ${-bodyRadiusY * 1.1} q ${-3} ${bodyRadiusY * 0.5} ${1} ${bodyRadiusY * 0.95}`} />
      ))}
    </g>
  )
}

const CoatPatches = memo(function CoatPatches({ dimensions, coat, seed }: { dimensions: CatDimensions; coat: CatCoat; seed: number }) {
  const { bodyRadiusX, bodyRadiusY } = dimensions
  const bibAmount = Math.min(1, Math.max(0, coat.whiteBib))
  if (coat.pattern === 'spotted') {
    return <CatSpots radiusX={bodyRadiusX} radiusY={bodyRadiusY} color={coat.spotColor} seed={seed} />
  }
  if (coat.pattern === 'solid') {
    if (coat.breed === 'persian') return null
    return <TabbyStripes dimensions={dimensions} color={coat.spotColor} />
  }
  const bicolor = coat.pattern === 'bicolor'
  return (
    <g fill={coat.patchColor}>
      <ellipse
        cx={bodyRadiusX * 0.92}
        cy={bodyRadiusY * 0.5}
        rx={bodyRadiusY * (0.5 + bibAmount * 0.45)}
        ry={bodyRadiusY * (0.75 + bibAmount * 0.25)}
      />
      <ellipse
        cx={bodyRadiusX * 0.1}
        cy={bodyRadiusY * (bicolor ? 0.85 : 1.08)}
        rx={bodyRadiusX * (bicolor ? 1.15 : 0.35 + bibAmount * 0.4)}
        ry={bodyRadiusY * (bicolor ? 0.6 : 0.32)}
      />
    </g>
  )
})

export default function CatBody({ rig, dimensions, coat, clipId, seed }: CatBodyProps) {
  const { bodyRadiusX, bodyRadiusY, fluff } = dimensions
  const palette = coatPalette(coat)
  const lightBelly = coat.pattern === 'solid' || coat.pattern === 'spotted'
  const furTuft = 2.5 + Math.max(fluff * 2.5, rig.furPuff * 2.6)
  const transform = `translate(${rig.bodyX} ${rig.bodyY}) rotate(${rig.bodyAngle}) scale(${rig.bodyStretch} ${rig.bodySquash})`
  return (
    <g transform={transform}>
      <defs>
        <clipPath id={clipId}>
          <BodySilhouette dimensions={dimensions} arch={rig.bodyArch} />
        </clipPath>
      </defs>
      {(fluff > 0.5 || rig.furPuff > 0.05) && (
        <CatFur
          centerX={0}
          centerY={bodyRadiusY * 0.05}
          radiusX={bodyRadiusX * 1.02}
          radiusY={bodyRadiusY * 1.02}
          tuftRadius={furTuft}
          tuftCount={26}
          color={coat.baseColor}
        />
      )}
      {rig.bodyArch > 0.02 && rig.furPuff > 0.05 && (
        <CatFur
          centerX={-bodyRadiusX * 0.05}
          centerY={-bodyRadiusY * 1.05 * rig.bodyArch}
          radiusX={bodyRadiusX * (0.62 - 0.1 * rig.bodyArch)}
          radiusY={bodyRadiusY * (0.6 + 0.7 * rig.bodyArch)}
          tuftRadius={furTuft}
          tuftCount={16}
          color={coat.baseColor}
          startAngle={180}
          endAngle={360}
        />
      )}
      <g fill={coat.baseColor}>
        <BodySilhouette dimensions={dimensions} arch={rig.bodyArch} />
      </g>
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx={-bodyRadiusX * 0.05} cy={-bodyRadiusY * 0.7} rx={bodyRadiusX * 0.8} ry={bodyRadiusY * 0.45} fill={palette.bodyHighlight} opacity={0.55} />
        {lightBelly && <ellipse cx={bodyRadiusX * 0.1} cy={bodyRadiusY * 0.98} rx={bodyRadiusX * 0.78} ry={bodyRadiusY * 0.4} fill={palette.belly} opacity={0.65} />}
        <CoatPatches dimensions={dimensions} coat={coat} seed={seed} />
        <ellipse cx={0} cy={bodyRadiusY * 1.25} rx={bodyRadiusX * 1.3} ry={bodyRadiusY * 0.5} fill={palette.underShade} opacity={fluff > 0.5 ? 0.08 : 0.14} />
      </g>
      {fluff > 0.5 && coat.pattern !== 'spotted' && (
        <CatFur
          centerX={bodyRadiusX * 0.85}
          centerY={bodyRadiusY * 0.1}
          radiusX={bodyRadiusY * 0.55}
          radiusY={bodyRadiusY * 0.75}
          tuftRadius={2.2 + fluff * 1.8}
          tuftCount={7}
          color={palette.chestTuft}
          startAngle={-60}
          endAngle={110}
        />
      )}
    </g>
  )
}
