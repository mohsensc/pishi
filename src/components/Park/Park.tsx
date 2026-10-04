import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence } from 'motion/react'
import type { BallState, CatCoat, CatState, PointerState, PropState } from '../../game/types'
import { isInPond } from '../../game/physics'
import { isPoppable, popReach } from '../../game/pointer'
import { toScreen } from '../../game/projection'
import { distance } from '../../game/vector'
import { usePointer } from '../../hooks/usePointer'
import { useTool } from '../../hooks/useTool'
import { useParkShortcuts } from '../../hooks/useParkShortcuts'
import { useItemSpawner } from '../../hooks/useItemSpawner'
import { useCarePresenter } from '../../hooks/useCarePresenter'
import { useCatHover } from '../../hooks/useCatHover'
import { isPropCapReached, isToyCapReached } from '../../game/spawning'
import { useWorld } from '../../hooks/useWorld'
import { useDragGesture } from '../../hooks/useDragGesture'
import { paintedElementAt } from '../../hooks/dragGesture/pressTargets'
import type { ViewportSize } from '../../hooks/useViewportSize'
import Scenery from '../Scenery/Scenery'
import Prop from '../Props/Prop'
import DraggableProp from '../Draggable/DraggableProp'
import HeldShadow from '../Draggable/HeldShadow'
import HeldLayer from '../Draggable/HeldLayer'
import Butterfly from '../Butterfly/Butterfly'
import Cat from '../Cat/Cat'
import LooseToy from '../ToyMouse/LooseToy'
import CatCard from '../CatCard/CatCard'
import TreatBag from '../TreatBag/TreatBag'
import PopBurst from '../PopBurst/PopBurst'
import Effects from '../Effects/Effects'
import Treats from '../Treats/Treats'
import CatnipPatches from '../CatnipPatches/CatnipPatches'
import DayNightOverlay from '../DayNightOverlay/DayNightOverlay'
import { lampLightsOf } from '../DayNightOverlay/lampLights'
import HeldItem from '../HeldItem/HeldItem'
import ToolDock from '../ToolDock/ToolDock'
import Cursor from '../Cursor/Cursor'
import Hud from '../Hud/Hud'
import CareTray from '../CareTray/CareTray'
import NeedBubbles from '../NeedBubble/NeedBubbles'
import styles from './Park.module.css'

interface ParkProps {
  viewportSize: ViewportSize
}

const proximityFalloff = 90
const armedProximity = 0.85
const interactableSelector = '[data-cat-id], [data-prop-id]'
const interfaceSelector = 'button, [data-ui]'
const skyTimeSteps = 900

function isFloatingInPond(ball: BallState, props: PropState[]): boolean {
  return ball.height <= 2 && isInPond(props, ball.position, 0.95) !== null
}

function measureCatchProximity(pointer: PointerState, balls: BallState[], worldHeight: number): number {
  if (!pointer.active) return 0
  let closest = 0
  for (const ball of balls) {
    if (!isPoppable(ball)) continue
    const gap = distance(pointer.position, toScreen(ball.position, ball.height)) - popReach(ball, worldHeight, pointer.pressed)
    closest = Math.max(closest, 1 - Math.max(gap, 0) / proximityFalloff)
  }
  return closest
}

function countBalls(balls: BallState[], status: BallState['status']): number {
  return balls.reduce((count, ball) => (ball.status === status ? count + 1 : count), 0)
}

function hiddenCoatsOf(prop: PropState, cats: CatState[]): CatCoat[] | undefined {
  if (!prop.canHide) return undefined
  const coats = cats.filter((cat) => cat.hidden && (cat.propId === prop.id || prop.occupantIds.includes(cat.id))).map((cat) => cat.coat)
  return coats.length > 0 ? coats : undefined
}

function elementOf(event: ReactPointerEvent<HTMLDivElement>): Element | null {
  return paintedElementAt(event.target, event.clientX, event.clientY)
}

export default function Park({ viewportSize }: ParkProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const pointerRef = usePointer(stageRef)
  const { world, pointer, actions } = useWorld(viewportSize, pointerRef)
  const { tool, selectTool } = useTool(pointerRef)
  useParkShortcuts(stageRef, pointerRef, actions)
  const spawnItem = useItemSpawner(stageRef, actions)
  const carePresenter = useCarePresenter(stageRef, actions)
  const hoveredCat = useCatHover(world, pointer, world.drag !== null || pointer.pressed)
  const [hovering, setHovering] = useState(false)
  const dragGesture = useDragGesture(actions, pointerRef, tool === 'hand')
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = elementOf(event)
    const overInteractable = element?.closest(interfaceSelector) == null && element?.closest(interactableSelector) != null
    if (overInteractable !== hovering) setHovering(overInteractable)
    dragGesture.onPointerMove(event)
  }
  const handlePointerLeave = () => setHovering(false)
  const proximity = measureCatchProximity(pointer, world.balls, world.height)

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-popped-count={world.poppedCount}
      data-care-items={world.care.inventory.length}
      data-needy-count={world.cats.filter((cat) => cat.need).length}
      data-asleep-count={world.cats.filter((cat) => cat.asleep).length}
      data-held-count={countBalls(world.balls, 'held')}
      data-stashed-count={countBalls(world.balls, 'stashed')}
      data-tool={tool}
      data-drag-target={world.drag?.target}
      data-discard-hover={dragGesture.overDiscard}
      onPointerDown={dragGesture.onPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={dragGesture.onPointerUp}
      onPointerCancel={dragGesture.onPointerCancel}
      onPointerLeave={handlePointerLeave}
      style={{ width: viewportSize.width, height: viewportSize.height }}>
      <div className={styles.sceneryLayer}>
        <Scenery width={world.width} height={world.height} skyTime={Math.round(world.dayTime * skyTimeSteps) / skyTimeSteps} />
      </div>
      {world.props.map((prop) => (
        <DraggableProp key={prop.id} prop={prop} worldHeight={world.height} time={world.time} discarding={dragGesture.overDiscard && world.drag?.id === prop.id}>
          <Prop prop={prop} worldHeight={world.height} time={world.time} occupantCoats={hiddenCoatsOf(prop, world.cats)} />
        </DraggableProp>
      ))}
      <CatnipPatches patches={world.catnip} time={world.time} worldHeight={world.height} />
      <Treats treats={world.treats} worldHeight={world.height} />
      {world.butterflies.map((butterfly) => (
        <Butterfly key={butterfly.id} butterfly={butterfly} worldHeight={world.height} />
      ))}
      {world.balls.map((ball) => (
        <HeldLayer key={ball.id} held={world.drag?.target === 'ball' && world.drag.id === ball.id}>
          <LooseToy ball={ball} worldHeight={world.height} floating={isFloatingInPond(ball, world.props)} />
        </HeldLayer>
      ))}
      <HeldShadow world={world} />
      {world.cats.map((cat) => (
        <HeldLayer key={cat.id} held={world.drag?.target === 'cat' && world.drag.id === cat.id}>
          <Cat cat={cat} worldHeight={world.height} />
        </HeldLayer>
      ))}
      <Effects effects={world.effects} worldHeight={world.height} />
      <NeedBubbles cats={world.cats} worldHeight={world.height} />
      <TreatBag shake={world.treatBagShake} time={world.time} />
      {hoveredCat && <CatCard cat={hoveredCat} worldHeight={world.height} />}
      <AnimatePresence>
        {world.pops.map((pop) => (
          <PopBurst key={pop.id} pop={pop} />
        ))}
      </AnimatePresence>
      <DayNightOverlay dayTime={world.dayTime} width={world.width} height={world.height} lights={lampLightsOf(world.props, world.height)} />
      <HeldItem heldToy={world.heldToy} worldHeight={world.height} pointerRef={pointerRef} />
      <Hud poppedCount={world.poppedCount} />
      <CareTray care={world.care} presenter={carePresenter} />
      <ToolDock
        tool={tool}
        onSelect={selectTool}
        dragTarget={world.drag?.target ?? null}
        propsFull={isPropCapReached(world)}
        toysFull={isToyCapReached(world)}
        onSpawn={spawnItem}
        discardHover={dragGesture.overDiscard}
      />
      <Cursor pointerRef={pointerRef} tool={tool} hovering={hovering || world.drag !== null} nearBall={proximity > armedProximity} pressed={pointer.pressed} />
    </div>
  )
}
