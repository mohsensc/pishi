import type { CatCoat, Vec } from '../../game/types'
import type { CatDimensions } from './breedShapes'
import type { CatRig } from './rig/rigModel'
import { coatPalette } from './coatPalette'
import CatFur from './CatFur'
import CatEar from './head/CatEar'
import { earShapesFor } from './head/earShape'
import CatEye from './head/CatEye'
import MouthItem, { type MouthItemSpec } from './head/MouthItem'
import HeadFace from './head/HeadFace'
import { headLayout } from './head/headLayout'

interface CatHeadProps {
  center: Vec
  rig: CatRig
  dimensions: CatDimensions
  coat: CatCoat
  pupilOffset: Vec
  eyeOpen: number
  mouthItem: MouthItemSpec | null
  clipId: string
}

const tongueColor = '#f08c9a'

function itemTransform(item: MouthItemSpec, nose: Vec): string {
  if (item.kind === 'ball') return `translate(${nose.x - item.size * 0.2} ${nose.y + item.size * 0.02})`
  if (item.kind === 'treat') return `translate(${nose.x + item.size * 0.25} ${nose.y + 5})`
  return `translate(${nose.x - 1} ${nose.y + 4.5})`
}

export default function CatHead({ center, rig, dimensions, coat, pupilOffset, eyeOpen, mouthItem, clipId }: CatHeadProps) {
  const { radius, isPersian, backEyeCenter, frontEyeCenter, nose } = headLayout(dimensions)
  const palette = coatPalette(coat)
  const lineColor = palette.line
  const whiskerColor = palette.whisker
  const whiskerReach = isPersian ? 0.8 : 1
  const { backEar, frontEar } = earShapesFor(dimensions)
  const dilation = rig.pupilDilation
  const earAngleBack = -rig.earAngle + rig.earFlickFar
  const earAngleFront = rig.earAngle + rig.earFlickNear
  const whiskerTwitch = rig.whiskerTwitch
  const mouthOpen = rig.mouthOpen
  const pinkNose = palette.nose
  return (
    <g transform={`translate(${center.x} ${center.y}) rotate(${rig.headAngle})`}>
      {isPersian && (
        <CatFur
          centerX={-radius * 0.1}
          centerY={radius * 0.2}
          radiusX={radius * 1.08}
          radiusY={radius * 0.95}
          tuftRadius={4.2}
          tuftCount={16}
          color={coat.baseColor}
          startAngle={-30}
          endAngle={250}
        />
      )}
      <CatEar ear={backEar} angle={earAngleBack} furColor={palette.backEar} innerColor={palette.innerEar} notched={coat.earNotch} />
      <CatEar ear={frontEar} angle={earAngleFront} furColor={coat.baseColor} innerColor={palette.innerEar} notched={false} />
      <HeadFace dimensions={dimensions} coat={coat} clipId={clipId} />
      <CatEye
        center={backEyeCenter}
        radiusX={dimensions.eyeRadiusX}
        radiusY={dimensions.eyeRadiusY}
        openness={eyeOpen}
        happy={rig.eyeHappy}
        irisColor={coat.eyeColor}
        irisGlow={palette.irisGlow}
        lidColor={lineColor}
        furColor={coat.baseColor}
        pupilOffset={pupilOffset}
        dilation={dilation}
      />
      <CatEye
        center={frontEyeCenter}
        radiusX={dimensions.eyeRadiusX * 0.9}
        radiusY={dimensions.eyeRadiusY}
        openness={eyeOpen}
        happy={rig.eyeHappy}
        irisColor={coat.eyeColor}
        irisGlow={palette.irisGlow}
        lidColor={lineColor}
        furColor={coat.baseColor}
        pupilOffset={pupilOffset}
        dilation={dilation}
      />
      <path
        d={`M ${nose.x - 2.3} ${nose.y - 1.3} L ${nose.x + 2.3} ${nose.y - 1.3} L ${nose.x} ${nose.y + 1.3} Z`}
        fill={pinkNose}
        stroke={pinkNose}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {mouthOpen > 0.08 && mouthItem === null && (
        <ellipse cx={nose.x} cy={nose.y + 3.6 + mouthOpen * 1.6} rx={2.2 + mouthOpen} ry={1 + mouthOpen * 2.4} fill="#7c3845" />
      )}
      <path
        d={`M ${nose.x} ${nose.y + 1.4} v 1.3 M ${nose.x - 2.6} ${nose.y + 3.1} q 1.3 1.2 2.6 -0.4 q 1.3 1.6 2.6 0.4`}
        fill="none"
        stroke={palette.mouthLine}
        strokeWidth={0.85}
        strokeLinecap="round"
      />
      <g stroke={whiskerColor} strokeWidth={0.7} strokeLinecap="round" opacity={0.85}>
        <g transform={`rotate(${whiskerTwitch} ${nose.x + 3} ${nose.y + 2.6})`}>
          <line x1={nose.x + 3} y1={nose.y + 1.8} x2={radius * 1.55 * whiskerReach} y2={nose.y - 1.5} />
          <line x1={nose.x + 3} y1={nose.y + 2.6} x2={radius * 1.6 * whiskerReach} y2={nose.y + 2.6} />
          <line x1={nose.x + 3} y1={nose.y + 3.4} x2={radius * 1.5 * whiskerReach} y2={nose.y + 6.5} />
        </g>
        <g transform={`rotate(${-whiskerTwitch * 0.7} ${nose.x - 4} ${nose.y + 2.7})`}>
          <line x1={nose.x - 4} y1={nose.y + 2.2} x2={-radius * 0.95} y2={nose.y + 0.5} />
          <line x1={nose.x - 4} y1={nose.y + 3.2} x2={-radius * 0.95} y2={nose.y + 4.6} />
        </g>
      </g>
      {rig.tongue > 0.05 && mouthItem === null && (
        <ellipse cx={nose.x + 0.6} cy={nose.y + 4.4 + rig.tongue * 1.4} rx={1.7} ry={1 + rig.tongue * 1.6} fill={tongueColor} />
      )}
      {mouthItem && (
        <g transform={itemTransform(mouthItem, nose)}>
          <MouthItem kind={mouthItem.kind} size={mouthItem.size} />
        </g>
      )}
    </g>
  )
}
