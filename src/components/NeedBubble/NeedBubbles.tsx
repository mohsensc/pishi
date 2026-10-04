import { AnimatePresence } from 'motion/react'
import type { CatState } from '../../game/types'
import { bubbleAnchorOf } from './bubbleAnchor'
import NeedBubble from './NeedBubble'
import SleepZs from './SleepZs'

interface NeedBubblesProps {
  cats: CatState[]
  worldHeight: number
}

const bubbleBaseSize = 34
const zBaseSize = 14
const bubbleGap = 4

function bubbleSize(pixelsPerUnit: number): number {
  return bubbleBaseSize * Math.min(1.2, Math.max(0.8, pixelsPerUnit))
}

function renderBubble(cat: CatState, worldHeight: number) {
  if (!cat.need) return null
  const anchor = bubbleAnchorOf(cat, worldHeight)
  return (
    <NeedBubble
      key={cat.id}
      catId={cat.id}
      kind={cat.need}
      urge={cat.needUrge ?? 0}
      asleep={Boolean(cat.asleep)}
      facing={cat.facing}
      x={anchor.x}
      y={anchor.y}
      lift={anchor.headTop + bubbleGap}
      size={bubbleSize(anchor.pixelsPerUnit)}
    />
  )
}

function renderZs(cat: CatState, worldHeight: number) {
  if (cat.pose !== 'sleep') return null
  const anchor = bubbleAnchorOf(cat, worldHeight)
  const size = zBaseSize * Math.max(0.8, anchor.pixelsPerUnit)
  return <SleepZs key={cat.id} x={anchor.x + anchor.headForward} y={anchor.y - anchor.headDrop} size={size} facing={cat.facing} />
}

export default function NeedBubbles({ cats, worldHeight }: NeedBubblesProps) {
  const visible = cats.filter((cat) => !cat.hidden)
  return (
    <>
      <AnimatePresence>{visible.map((cat) => renderBubble(cat, worldHeight))}</AnimatePresence>
      {visible.map((cat) => renderZs(cat, worldHeight))}
    </>
  )
}
