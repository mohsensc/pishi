import { MAX_EXTRA_TOYS } from '../../constants'
import { createBall } from '../../spawning'
import type { BallKind } from '../../types'
import { isRecord, readList, readOneOf, readVec } from '../fieldReaders'
import type { ParkSection } from '../parkSaveTypes'

const keptKinds: readonly BallKind[] = ['mouse']
const readKeptKind = readOneOf(keptKinds)

export const toysSection: ParkSection = {
  key: 'toys',
  capture: (world) =>
    world.balls.filter((ball) => keptKinds.includes(ball.kind) && ball.status !== 'popped').map((ball) => ({ kind: ball.kind, position: ball.position })),
  restore: (raw, { world, memory, mapPoint }) => {
    readList(raw, MAX_EXTRA_TOYS).forEach((entry) => {
      if (!isRecord(entry)) return
      const kind = readKeptKind(entry.kind)
      const position = readVec(entry.position)
      if (!kind || !position) return
      const ball = createBall(memory, kind, mapPoint(position), 0, 'spawned')
      ball.velocity = { x: 0, y: 0 }
      world.balls.push(ball)
    })
  },
}
