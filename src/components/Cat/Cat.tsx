import { memo, useId, useMemo } from 'react'
import type { CatState, Vec } from '../../game/types'
import { ACTION_LIFETIME, BALL_RADIUS, CAT_BODY_LENGTH } from '../../game/constants'
import { depthScale, toScreen } from '../../game/projection'
import { hashToUnit } from '../../game/random'
import { length, scale } from '../../game/vector'
import { computeDimensions } from './breedShapes'
import { bodyToLocal } from './rig/rigModel'
import type { MouthItemSpec } from './head/MouthItem'
import Emote from '../Emote/Emote'
import { coatPalette } from './coatPalette'
import { useCatRig } from './useCatRig'
import CatBody from './CatBody'
import CatHead from './CatHead'
import CatLeg from './CatLeg'
import CatTail from './CatTail'
import styles from './Cat.module.css'

interface CatProps {
  cat: CatState
  worldHeight: number
}

const rigBodyLength = 60
const viewBoxLeft = -95
const viewBoxTop = -135
const viewBoxWidth = 190
const viewBoxHeight = 170
const perchedIntents = new Set(['perch', 'climb'])

const contentPoses = new Set(['loaf', 'purr', 'knead', 'groom'])
const slowBlinkSeconds = 1.3

function quickBlink(cycle: number, start: number): number {
  const local = cycle - start
  if (local < 0 || local > 0.16) return 1
  return Math.abs(local / 0.08 - 1)
}

function slowBlink(cycle: number): number {
  const progress = cycle / slowBlinkSeconds
  if (progress >= 1) return 1
  const closed = progress < 0.3 ? progress / 0.3 : progress < 0.55 ? 1 : 1 - (progress - 0.55) / 0.45
  const eased = closed * closed * (3 - 2 * closed)
  return 1 - eased
}

function blinkAmount(time: number, phase: number, content: boolean): number {
  if (content) {
    const period = 4.6 + phase * 3
    return slowBlink((time + phase * period) % period)
  }
  const period = 3.4 + phase * 2.2
  const shifted = time + phase * period
  const cycle = shifted % period
  const doubled = Math.floor(shifted / period) % 4 === 1
  return Math.min(quickBlink(cycle, 0), doubled ? quickBlink(cycle, 0.26) : 1)
}

function isContent(cat: CatState): boolean {
  if (contentPoses.has(cat.pose) || cat.action === 'purr') return true
  return cat.pose === 'sit' && cat.affection > 0.7
}

function pupilDirection(cat: CatState): Vec {
  const offset = { x: (cat.gaze.x - cat.position.x) * cat.facing, y: (cat.gaze.y - cat.position.y) * 0.5 }
  const distance = length(offset)
  if (distance < 1) return { x: 0, y: 0 }
  return scale(offset, Math.min(1, distance / 60) / distance)
}

function isStartled(cat: CatState): boolean {
  return cat.pose === 'startle' || cat.pose === 'arch' || (cat.intent === 'fleeCursor' && cat.pose === 'jump')
}

function mouthItemFor(cat: CatState, unitsPerPixel: number): MouthItemSpec | null {
  if (cat.heldBallId !== null) return { kind: 'ball', size: BALL_RADIUS * 2 * unitsPerPixel }
  const recentAction = cat.action !== null && cat.actionAge < ACTION_LIFETIME
  if (cat.pose === 'tug' || (recentAction && cat.action === 'catchToy')) return { kind: 'feather', size: 19 }
  if (recentAction && cat.action === 'catchTreat') return { kind: 'treat', size: 15 }
  return null
}

function CatSprite({ cat, worldHeight }: CatProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const { coat } = cat
  const dimensions = useMemo(() => computeDimensions(coat), [coat])
  const seed = useMemo(() => hashToUnit(cat.id), [cat.id])
  const startled = isStartled(cat)
  const { rig, time } = useCatRig(cat, dimensions, startled)

  if (cat.hidden) return null

  const pixelsPerUnit = (CAT_BODY_LENGTH / rigBodyLength) * coat.scale * depthScale(cat.position.y, worldHeight)
  const floorPoint = toScreen(cat.position, 0)
  const bodyPoint = toScreen(cat.position, cat.height)
  const perched = cat.propId !== null && perchedIntents.has(cat.intent) && cat.height > 1
  const shadowLift = perched ? bodyPoint.y - floorPoint.y : 0
  const airborne = perched ? 0 : Math.max(0, cat.height)
  const shadowWidth = dimensions.bodyRadiusX * 2.7 * pixelsPerUnit * Math.max(0.45, 1 - airborne / 160)
  const shadowOpacity = Math.max(0.3, 1 - airborne / 140)
  const zIndex = Math.round(cat.position.y) + (cat.height > 2 ? 40 : 0)

  const shoulder = bodyToLocal(rig, dimensions.shoulder)
  const hip = bodyToLocal(rig, dimensions.hip)
  const farShoulder = { x: shoulder.x - 2, y: shoulder.y - 1 }
  const farHip = { x: hip.x + 2, y: hip.y - 1 }
  const neck = bodyToLocal(rig, dimensions.neck)
  const headCenter = { x: neck.x + rig.headOffsetX, y: neck.y + rig.headOffsetY }
  const tailBase = bodyToLocal(rig, dimensions.tailBase)

  const palette = coatPalette(coat)
  const farFurColor = palette.farFur
  const farSockColor = palette.farSock
  const hasSocks = coat.pattern === 'tuxedo' || coat.pattern === 'bicolor'
  const sockFor = (index: number, far: boolean) =>
    hasSocks && coat.whiteSocks[index] ? (far ? farSockColor : coat.patchColor) : null
  const fluffy = dimensions.fluff > 0.4
  const tailTipColor = coat.pattern === 'spotted' ? coat.spotColor : coat.tailTip ? coat.patchColor : null
  const tailRingColor = coat.breed === 'egyptianMau' ? coat.spotColor : null
  const mouthItem = mouthItemFor(cat, 1 / ((CAT_BODY_LENGTH / rigBodyLength) * coat.scale))
  const eyeOpen = Math.min(rig.eyeOpen, blinkAmount(time, seed, !startled && isContent(cat)))
  const tailInFront = rig.tailFront > 0.5
  const hindOpacity = rig.bodyOpacity
  const emoteSize = Math.max(18, 26 * pixelsPerUnit)

  const legProps = {
    upperLength: dimensions.frontUpperLength,
    lowerLength: dimensions.frontLowerLength,
    pawRadiusX: dimensions.pawRadiusX,
    pawRadiusY: dimensions.pawRadiusY,
    fluffy,
  }
  const hindLegProps = {
    ...legProps,
    upperLength: dimensions.hindUpperLength,
    lowerLength: dimensions.hindLowerLength,
  }

  const tail = (
    <CatTail
      base={tailBase}
      angle={rig.tailAngle}
      curl={rig.tailCurl}
      length={dimensions.tailLength * rig.tailReach}
      width={dimensions.tailWidth}
      puff={rig.tailPuff}
      color={coat.baseColor}
      tipColor={tailTipColor}
      ringColor={tailRingColor}
      fluffy={fluffy}
    />
  )

  return (
    <div
      className={styles.catRoot}
      data-cat-id={cat.id}
      data-breed={coat.breed}
      data-hidden={cat.hidden}
      data-intent={cat.intent}
      data-facing={cat.facing}
      data-pose={cat.pose}
      data-behavior={cat.behavior}
      data-action={cat.action ?? undefined}
      data-leap={cat.leapStyle ?? undefined}
      data-holding={cat.heldBallId ?? undefined}
      data-prop={cat.propId ?? undefined}
      data-screen-x={Math.round(floorPoint.x)}
      data-screen-y={Math.round(floorPoint.y)}
      style={{ transform: `translate3d(${floorPoint.x}px, ${floorPoint.y}px, 0)`, zIndex }}>
      <div
        className={styles.shadow}
        style={{
          width: shadowWidth,
          height: shadowWidth * 0.3,
          left: -shadowWidth / 2 - 2 * pixelsPerUnit * cat.facing,
          top: shadowLift - shadowWidth * 0.15,
          opacity: shadowOpacity,
        }}
      />
      <svg
        className={styles.sprite}
        width={viewBoxWidth * pixelsPerUnit}
        height={viewBoxHeight * pixelsPerUnit}
        viewBox={`${viewBoxLeft} ${viewBoxTop} ${viewBoxWidth} ${viewBoxHeight}`}
        style={{ left: viewBoxLeft * pixelsPerUnit, top: bodyPoint.y - floorPoint.y + viewBoxTop * pixelsPerUnit }}
        aria-hidden
      >
        <g transform={`scale(${cat.facing} 1)`}>
          <g opacity={hindOpacity} visibility={hindOpacity < 0.02 ? 'hidden' : undefined}>
            {!tailInFront && tail}
          </g>
          <CatLeg {...legProps} hip={farShoulder} paw={{ x: rig.frontFarX, y: rig.frontFarY }} width={dimensions.frontLegWidth} furColor={farFurColor} sockColor={sockFor(1, true)} sockReach={0.45} />
          <g opacity={hindOpacity} visibility={hindOpacity < 0.02 ? 'hidden' : undefined}>
            <CatLeg {...hindLegProps} hip={farHip} paw={{ x: rig.hindFarX, y: rig.hindFarY }} width={dimensions.hindLegWidth} furColor={farFurColor} sockColor={sockFor(3, true)} sockReach={0.6} />
            <CatBody rig={rig} dimensions={dimensions} coat={coat} clipId={`catBody${instanceId}`} seed={seed} />
            <CatLeg {...hindLegProps} hip={hip} paw={{ x: rig.hindNearX, y: rig.hindNearY }} width={dimensions.hindLegWidth} furColor={coat.baseColor} sockColor={sockFor(2, false)} sockReach={0.6} />
            {tailInFront && tail}
          </g>
          <CatLeg {...legProps} hip={shoulder} paw={{ x: rig.frontNearX, y: rig.frontNearY }} width={dimensions.frontLegWidth} furColor={coat.baseColor} sockColor={sockFor(0, false)} sockReach={0.45} />
          <CatHead
            center={headCenter}
            rig={rig}
            dimensions={dimensions}
            coat={coat}
            pupilOffset={pupilDirection(cat)}
            eyeOpen={eyeOpen}
            mouthItem={mouthItem}
            clipId={`catHead${instanceId}`}
          />
        </g>
      </svg>
      {cat.emote && (
        <Emote
          emote={cat.emote}
          age={cat.emoteAge}
          size={emoteSize}
          x={headCenter.x * cat.facing * pixelsPerUnit}
          y={bodyPoint.y - floorPoint.y + (headCenter.y - dimensions.headRadius * 1.25) * pixelsPerUnit}
        />
      )}
    </div>
  )
}

export default memo(CatSprite)
