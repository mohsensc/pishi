import { memo, type ReactElement } from 'react'
import type { CatCoat, PropState } from '../../game/types'
import { depthScale, toScreen } from '../../game/projection'
import Bench from './Bench'
import Bush from './Bush'
import CardboardBox from './CardboardBox'
import CatTree from './CatTree'
import Cushion from './Cushion'
import FeedingStation from './FeedingStation'
import FlowerBed from './FlowerBed'
import FoodBowl from './FoodBowl'
import Lamppost from './Lamppost'
import PicnicBlanket from './PicnicBlanket'
import Pond from './Pond'
import Rock from './Rock'
import ScratchingPost from './ScratchingPost'
import ShadeTree from './ShadeTree'
import Tunnel from './Tunnel'
import YarnBasket from './YarnBasket'
import styles from './Props.module.css'
import type { PropViewProps } from './propView'

interface PropProps {
  prop: PropState
  worldHeight: number
  time: number
  occupantCoats?: CatCoat[]
}

interface PropBodyProps {
  prop: PropState
  worldHeight: number
  time: number
  signature: string
  occupantCoats?: CatCoat[]
}

const hintFrameRate = 30

function animatedHintFrame(prop: PropState, time: number, occupantCoats: CatCoat[] | undefined): number {
  if (prop.kind !== 'tree' || !occupantCoats || occupantCoats.length === 0) return 0
  return Math.round(time * hintFrameRate)
}

function propSignature(prop: PropState, worldHeight: number, time: number, occupantCoats: CatCoat[] | undefined): string {
  const exit = prop.tunnelExit ? `${Math.round(prop.tunnelExit.x)},${Math.round(prop.tunnelExit.y)}` : ''
  return [
    prop.id,
    prop.kind,
    Math.round(prop.position.x),
    Math.round(prop.position.y),
    prop.radius,
    prop.perchHeight,
    prop.variant,
    prop.occupantIds.join('|'),
    exit,
    Math.round(worldHeight),
    Math.round(prop.agitation * 10),
    prop.lit,
    Math.round(prop.foodLevel * 20),
    prop.pokedAt ?? '',
    Math.round(prop.lift),
    Math.round(prop.tilt),
    prop.droppedAt ?? '',
    prop.spawnedAt ?? '',
    occupantCoats?.map((coat) => `${coat.breed}${coat.baseColor}${coat.pattern}`).join('|') ?? '',
    animatedHintFrame(prop, time, occupantCoats),
  ].join(';')
}

function renderPropKind(view: PropViewProps): ReactElement {
  switch (view.prop.kind) {
    case 'catTree':
      return <CatTree {...view} />
    case 'cardboardBox':
      return <CardboardBox {...view} />
    case 'tunnel':
      return <Tunnel {...view} />
    case 'bench':
      return <Bench {...view} />
    case 'bush':
      return <Bush {...view} />
    case 'tree':
      return <ShadeTree {...view} />
    case 'rock':
      return <Rock {...view} />
    case 'flowerBed':
      return <FlowerBed {...view} />
    case 'pond':
      return <Pond {...view} />
    case 'picnicBlanket':
      return <PicnicBlanket {...view} />
    case 'yarnBasket':
      return <YarnBasket {...view} />
    case 'scratchingPost':
      return <ScratchingPost {...view} />
    case 'foodBowl':
      return <FoodBowl {...view} />
    case 'lamppost':
      return <Lamppost {...view} />
    case 'feedingStation':
      return <FeedingStation {...view} />
    case 'cushion':
      return <Cushion {...view} />
  }
}

function tunnelDepth(prop: PropState): number {
  return prop.tunnelExit ? (prop.position.y + prop.tunnelExit.y) / 2 : prop.position.y
}

const PropBody = memo(
  function PropBody({ prop, worldHeight, time, occupantCoats }: PropBodyProps) {
    const screen = toScreen(prop.position, 0)
    const depth = prop.kind === 'tunnel' ? tunnelDepth(prop) : prop.position.y
    return (
      <div className={styles.propRoot} data-prop-id={prop.id} data-prop-kind={prop.kind} data-agitation={prop.agitation.toFixed(1)} data-hiding={occupantCoats?.length ?? 0}>
        {renderPropKind({
          prop,
          x: screen.x,
          y: screen.y,
          scale: depthScale(depth, worldHeight),
          zIndex: Math.round(depth),
          time,
          occupantCoats,
        })}
      </div>
    )
  },
  (previous, next) => previous.signature === next.signature,
)

function Prop({ prop, worldHeight, time, occupantCoats }: PropProps) {
  return (
    <PropBody
      prop={prop}
      worldHeight={worldHeight}
      time={time}
      occupantCoats={occupantCoats}
      signature={propSignature(prop, worldHeight, time, occupantCoats)}
    />
  )
}

export default memo(Prop)
