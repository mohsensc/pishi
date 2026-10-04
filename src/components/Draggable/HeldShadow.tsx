import type { World } from '../../game/types'
import { depthScale } from '../../game/projection'
import DragShadow from './DragShadow'

interface HeldShadowProps {
  world: World
}

const catShadowWidth = 58
const ballShadowWidth = 22
const treatShadowWidth = 18

interface Grounded {
  x: number
  y: number
  width: number
  lift: number
}

function groundedOf(world: World): Grounded | null {
  const drag = world.drag
  if (!drag) return null
  if (drag.target === 'cat') {
    const cat = world.cats.find((candidate) => candidate.id === drag.id)
    return cat ? { x: cat.position.x, y: cat.position.y, width: catShadowWidth * cat.coat.scale, lift: cat.height } : null
  }
  if (drag.target === 'ball') {
    const ball = world.balls.find((candidate) => candidate.id === drag.id)
    return ball ? { x: ball.position.x, y: ball.position.y, width: ballShadowWidth, lift: ball.height } : null
  }
  if (drag.target === 'treat') {
    const treat = world.treats.find((candidate) => candidate.id === drag.id)
    return treat ? { x: treat.position.x, y: treat.position.y, width: treatShadowWidth, lift: treat.height } : null
  }
  return null
}

export default function HeldShadow({ world }: HeldShadowProps) {
  const grounded = groundedOf(world)
  if (!grounded) return null
  const width = grounded.width * depthScale(grounded.y, world.height)
  return <DragShadow x={grounded.x} y={grounded.y} width={width} lift={grounded.lift} />
}
