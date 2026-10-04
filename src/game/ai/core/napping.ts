import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { distance } from '../../vector'
import type { CatState } from '../../types'
import { grabBall } from '../helpers/ball'
import { lockPose, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { threatened } from '../helpers/threat'
import { beginBehavior, beginFlee } from '../helpers/transitions'

function wake(cat: CatState, mind: CatMind, context: StepContext, startled: boolean): void {
  mind.napCooldown = randomTimer(context, 14, 24)
  if (startled && context.memory.random.chance(1 - mind.personality.spookResistance)) {
    lockPose(mind, 'startle', 0.5)
    setEmote(cat, 'startled')
    beginFlee(cat, mind, context, 1.4)
    return
  }
  beginBehavior(cat, mind, context, 'stretchIdle')
}

export const nappingBehavior: Behavior = {
  id: 'napping',
  intent: 'napping',
  interruptible: false,
  ownsTimer: true,
  minDuration: 3,
  maxDuration: 6,
  weight: (_cat, mind) => (mind.napCooldown <= 0 ? mind.personality.laziness * 0.16 : 0),
  start(cat, mind) {
    cat.intentTimer += mind.personality.laziness * 2.5
    mind.idlePose = 'loaf'
    setEmote(cat, 'sleepy')
  },
  update(cat, mind, context) {
    mind.idlePose = 'loaf'
    if (threatened(cat, mind, context, 0.45 * (1 - mind.personality.spookResistance * 0.5))) {
      wake(cat, mind, context, true)
      return zeroVector
    }
    const ball = context.world.balls.find((candidate) => candidate.status === 'loose' && candidate.height < 10 && distance(candidate.position, cat.position) < 34 * cat.coat.scale)
    if (ball && context.memory.random.chance(context.dt * 2)) {
      mind.napCooldown = 12
      grabBall(cat, mind, ball, context)
      return zeroVector
    }
    if (cat.intentTimer <= 0) wake(cat, mind, context, false)
    return brake(cat)
  },
}
