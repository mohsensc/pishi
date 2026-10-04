import { memo, type ComponentType } from 'react'
import type { EffectKind, WorldEffect } from '../../game/types'
import { depthScale, toScreen } from '../../game/projection'
import BounceRing from './BounceRing'
import CatnipPuff from './CatnipPuff'
import Crumbs from './Crumbs'
import DustPuff from './DustPuff'
import FallingLeaves from './FallingLeaves'
import FurTuft from './FurTuft'
import Hearts from './Hearts'
import Kibble from './Kibble'
import Petals from './Petals'
import RollingYarn from './RollingYarn'
import Sparkle from './Sparkle'
import Splash from './Splash'
import type { EffectViewProps } from './effectView'
import styles from './Effects.module.css'

interface EffectsProps {
  effects: WorldEffect[]
  worldHeight: number
}

interface EffectItemProps {
  effect: WorldEffect
  worldHeight: number
}

const effectViews: Record<EffectKind, ComponentType<EffectViewProps>> = {
  leaves: FallingLeaves,
  splash: Splash,
  kibble: Kibble,
  petals: Petals,
  dust: DustPuff,
  sparkle: Sparkle,
  yarn: RollingYarn,
  bounce: BounceRing,
  hearts: Hearts,
  crumbs: Crumbs,
  catnipPuff: CatnipPuff,
  furTuft: FurTuft,
}

const zIndexLift: Record<EffectKind, number> = {
  leaves: 460,
  splash: 30,
  kibble: 30,
  petals: 30,
  dust: 30,
  sparkle: 90,
  yarn: 30,
  bounce: 30,
  hearts: 120,
  crumbs: 60,
  catnipPuff: 50,
  furTuft: 90,
}

const EffectItem = memo(
  function EffectItem({ effect, worldHeight }: EffectItemProps) {
    const ground = toScreen(effect.position, 0)
    const View = effectViews[effect.kind]
    return (
      <div
        className={styles.anchor}
        data-effect-kind={effect.kind}
        style={{ transform: `translate3d(${ground.x}px, ${ground.y}px, 0)`, zIndex: Math.round(effect.position.y) + zIndexLift[effect.kind] }}>
        <View effect={effect} scale={depthScale(effect.position.y, worldHeight)} lift={Math.max(0, effect.height)} />
      </div>
    )
  },
  (previous, next) => previous.effect.id === next.effect.id && Math.round(previous.worldHeight) === Math.round(next.worldHeight),
)

function Effects({ effects, worldHeight }: EffectsProps) {
  return (
    <>
      {effects.map((effect) => (
        <EffectItem key={effect.id} effect={effect} worldHeight={worldHeight} />
      ))}
    </>
  )
}

export default memo(Effects)
