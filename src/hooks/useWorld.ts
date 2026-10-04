import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { BallKind, CareItemKind, DragHit, DragTarget, PointerState, PropKind, Vec, World } from '../game/types'
import { createIdlePointer } from '../game/pointer'
import { createWorld, stepWorld } from '../game/world'
import { resizeWorld } from '../game/resize'
import { pokeCat, pokeGround, pokeProp } from '../game/interactions'
import { beginDrag, discardDrag, endDrag, guardBall, hitTestDraggable, setBallCatching, tapBall, updateDrag } from '../game/dragging'
import { removeProp, spawnLooseToy, spawnProp } from '../game/spawning'
import { shakeTreatBag, summonCat } from '../game/calls'
import { BALL_COUNT, CAT_COUNT } from '../game/constants'
import { careTargetAt, offerCareItem } from '../game/care/careActions'
import type { ViewportSize } from './useViewportSize'
import { useAnimationFrame } from './useAnimationFrame'

function snapshotWorld(world: World): World {
  return {
    ...world,
    cats: world.cats.map((cat) => ({
      ...cat,
      position: { ...cat.position },
      velocity: { ...cat.velocity },
      gaze: { ...cat.gaze },
      acceleration: { ...cat.acceleration },
    })),
    balls: world.balls.map((ball) => ({ ...ball, position: { ...ball.position }, velocity: { ...ball.velocity } })),
    props: world.props.map((prop) => ({ ...prop, position: { ...prop.position }, occupantIds: [...prop.occupantIds] })),
    butterflies: world.butterflies.map((butterfly) => ({ ...butterfly, position: { ...butterfly.position } })),
    pops: world.pops.map((pop) => ({ ...pop, position: { ...pop.position } })),
    effects: world.effects.map((effect) => ({ ...effect, position: { ...effect.position } })),
    treats: world.treats.map((treat) => ({ ...treat, position: { ...treat.position }, velocity: { ...treat.velocity } })),
    catnip: world.catnip.map((patch) => ({ ...patch, position: { ...patch.position } })),
    heldToy: world.heldToy ? { ...world.heldToy, position: { ...world.heldToy.position } } : null,
    drag: world.drag
      ? { ...world.drag, grabOffset: { ...world.drag.grabOffset }, pointer: { ...world.drag.pointer }, velocity: { ...world.drag.velocity } }
      : null,
    treatBagShake: world.treatBagShake ? { ...world.treatBagShake, position: { ...world.treatBagShake.position } } : null,
    care: { ...world.care, inventory: world.care.inventory.map((item) => ({ ...item })), lastReward: world.care.lastReward ? { ...world.care.lastReward } : null },
  }
}

function snapshotPointer(pointer: PointerState): PointerState {
  return { ...pointer, position: { ...pointer.position }, velocity: { ...pointer.velocity } }
}

export interface WorldActions {
  pokeProp: (propId: string, point: Vec) => void
  pokeCat: (catId: string, point: Vec) => void
  pokeGround: (point: Vec) => void
  hitTestDraggable: (point: Vec) => DragHit | null
  beginDrag: (target: DragTarget, id: string, point: Vec) => boolean
  updateDrag: (point: Vec, velocity: Vec) => void
  endDrag: (point: Vec, velocity: Vec) => boolean
  currentDrag: () => DragHit | null
  setBallCatching: (enabled: boolean) => void
  guardBall: (ballId: string | null) => void
  tapBall: (ballId: string) => boolean
  discardDrag: () => boolean
  spawnProp: (kind: PropKind, point: Vec) => string | null
  removeProp: (propId: string) => boolean
  spawnLooseToy: (kind: BallKind, point: Vec) => string | null
  summonCat: (catId: string, point: Vec) => void
  shakeTreatBag: (point: Vec) => void
  careTargetAt: (point: Vec) => string | null
  presentCareItem: (catId: string, kind: CareItemKind) => boolean
}

interface WorldView {
  world: World
  pointer: PointerState
}

interface WorldHandle extends WorldView {
  actions: WorldActions
}

export function useWorld(viewportSize: ViewportSize, pointerRef: RefObject<PointerState>): WorldHandle {
  const [liveWorld] = useState<World>(() =>
    createWorld({
      width: viewportSize.width,
      height: viewportSize.height,
      catCount: CAT_COUNT,
      ballCount: BALL_COUNT,
    }),
  )
  const worldRef = useRef<World>(liveWorld)
  const [worldView, setWorldView] = useState<WorldView>(() => ({
    world: snapshotWorld(liveWorld),
    pointer: createIdlePointer(),
  }))

  useEffect(() => {
    const world = worldRef.current
    if (world.width === viewportSize.width && world.height === viewportSize.height) return
    resizeWorld(world, viewportSize.width, viewportSize.height)
    setWorldView({ world: snapshotWorld(world), pointer: snapshotPointer(pointerRef.current) })
  }, [viewportSize.width, viewportSize.height, pointerRef])

  useAnimationFrame((deltaSeconds) => {
    if (deltaSeconds <= 0) return
    worldRef.current = stepWorld(worldRef.current, Math.min(deltaSeconds, 1 / 30), pointerRef.current)
    setWorldView({ world: snapshotWorld(worldRef.current), pointer: snapshotPointer(pointerRef.current) })
  })

  const actions = useMemo<WorldActions>(
    () => ({
      pokeProp: (propId, point) => pokeProp(worldRef.current, propId, point),
      pokeCat: (catId, point) => pokeCat(worldRef.current, catId, point),
      pokeGround: (point) => pokeGround(worldRef.current, point),
      hitTestDraggable: (point) => hitTestDraggable(worldRef.current, point),
      beginDrag: (target, id, point) => beginDrag(worldRef.current, target, id, point),
      updateDrag: (point, velocity) => updateDrag(worldRef.current, point, velocity),
      endDrag: (point, velocity) => endDrag(worldRef.current, point, velocity),
      currentDrag: () => {
        const drag = worldRef.current.drag
        return drag ? { target: drag.target, id: drag.id } : null
      },
      setBallCatching: (enabled) => setBallCatching(worldRef.current, enabled),
      guardBall: (ballId) => guardBall(worldRef.current, ballId),
      tapBall: (ballId) => tapBall(worldRef.current, ballId),
      discardDrag: () => discardDrag(worldRef.current),
      spawnProp: (kind, point) => spawnProp(worldRef.current, kind, point),
      removeProp: (propId) => removeProp(worldRef.current, propId),
      spawnLooseToy: (kind, point) => spawnLooseToy(worldRef.current, kind, point),
      summonCat: (catId, point) => summonCat(worldRef.current, catId, point),
      shakeTreatBag: (point) => shakeTreatBag(worldRef.current, point),
      careTargetAt: (point) => careTargetAt(worldRef.current, point),
      presentCareItem: (catId, kind) => offerCareItem(worldRef.current, catId, kind),
    }),
    [],
  )

  return { ...worldView, actions }
}
