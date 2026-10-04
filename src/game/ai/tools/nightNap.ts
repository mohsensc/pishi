import type { Behavior } from '../behavior'
import { isNight } from '../../tools/dayCycle'
import { distance } from '../../vector'
import { lockPose, setEmote } from '../helpers/pose'
import { pointBeside, propsWithin, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { threatened, topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { commit, every } from './support/phases'
import { checkChance, countDoing, isFreeForTools } from './support/toolQueries'

export const nightNapBehavior: Behavior = {
  id: 'nightNap',
  intent: 'napping',
  interruptible: true,
  minDuration: 10,
  maxDuration: 20,
  weight: (_cat, mind, context) => (isNight(context.world.dayTime) ? 1.1 + mind.personality.laziness * 1.4 : 0),
  urgency(cat, mind, context) {
    if (!isNight(context.world.dayTime) || cat.behavior === 'nightNap' || !isFreeForTools(cat, mind, context)) return 0
    if (countDoing(context, new Set(['nightNap']), cat.id) >= 4) return 0
    return checkChance(context, 0.03 + mind.personality.laziness * 0.1) ? 1.5 : 0
  },
  start(cat, mind, context) {
    commit(mind)
    mind.movePose = 'walk'
    const cozy = propsWithin(cat.position, context, 260 * context.memory.sizeScale, (prop) => ['bench', 'bush', 'catTree', 'picnicBlanket', 'tree'].includes(prop.kind))
    mind.target = cozy.length > 0 ? pointBeside(context.memory.random.pick(cozy), cat, context, context.memory.random.sign()) : { ...cat.position }
  },
  update(cat, mind, context) {
    if (threatened(cat, mind, context, 0.4)) {
      lockPose(mind, 'startle', 0.4)
      setEmote(cat, 'startled')
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (mind.target && distance(cat.position, mind.target) > 10 && mind.behaviorElapsed < 8) return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.28, 30)
    mind.idlePose = mind.phaseTimer < 1.5 ? 'loaf' : 'sleep'
    if (every(mind, context, 'zzz', 4)) setEmote(cat, 'sleepy')
    return brake(cat)
  },
}
