import type { BallState } from '../../game/types'
import TennisBall from '../TennisBall/TennisBall'
import ToyMouse from './ToyMouse'

interface LooseToyProps {
  ball: BallState
  worldHeight: number
  floating: boolean
}

export default function LooseToy({ ball, worldHeight, floating }: LooseToyProps) {
  if (ball.kind === 'mouse') return <ToyMouse ball={ball} worldHeight={worldHeight} floating={floating} />
  return <TennisBall ball={ball} worldHeight={worldHeight} floating={floating} />
}
