import { memo } from 'react'
import type { Vec } from '../../../game/types'
import type { EarShape } from './earShape'

function earPoints(ear: EarShape, notched: boolean): string {
  const points = [ear.baseStart]
  if (notched) {
    const along = (amount: number) => ({
      x: ear.baseStart.x + (ear.tip.x - ear.baseStart.x) * amount,
      y: ear.baseStart.y + (ear.tip.y - ear.baseStart.y) * amount,
    })
    const notchStart = along(0.55)
    const notchEnd = along(0.72)
    const inward = { x: (ear.baseEnd.x - ear.baseStart.x) * 0.18, y: (ear.baseEnd.y - ear.baseStart.y) * 0.18 }
    const middle = along(0.635)
    points.push(notchStart, { x: middle.x + inward.x, y: middle.y + inward.y }, notchEnd)
  }
  points.push(ear.tip, ear.baseEnd)
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

function innerEarPoints(ear: EarShape): string {
  const centroid = {
    x: (ear.baseStart.x + ear.baseEnd.x + ear.tip.x) / 3,
    y: (ear.baseStart.y + ear.baseEnd.y + ear.tip.y) / 3,
  }
  const shrink = (point: Vec) => ({
    x: centroid.x + (point.x - centroid.x) * 0.55,
    y: centroid.y + (point.y - centroid.y) * 0.55 + 1,
  })
  return [shrink(ear.baseStart), shrink(ear.tip), shrink(ear.baseEnd)].map((point) => `${point.x},${point.y}`).join(' ')
}

interface CatEarProps {
  ear: EarShape
  angle: number
  furColor: string
  innerColor: string
  notched: boolean
}

function CatEar({ ear, angle, furColor, innerColor, notched }: CatEarProps) {
  const pivot = { x: (ear.baseStart.x + ear.baseEnd.x) / 2, y: (ear.baseStart.y + ear.baseEnd.y) / 2 }
  return (
    <g transform={`rotate(${angle} ${pivot.x} ${pivot.y})`}>
      <polygon points={earPoints(ear, notched)} fill={furColor} stroke={furColor} strokeWidth={2.4} strokeLinejoin="round" />
      <polygon points={innerEarPoints(ear)} fill={innerColor} stroke={innerColor} strokeWidth={1} strokeLinejoin="round" />
    </g>
  )
}

export default memo(CatEar)
