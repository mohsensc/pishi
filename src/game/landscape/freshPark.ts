import { dockKeepOut, lawnBounds, lawnTopEdge, viewportScale, type LawnBounds } from '../bounds'
import { createPropState, recipeFor } from '../layout'
import { createRandom, type Random } from '../random'
import { distance } from '../vector'
import type { PropState, Vec } from '../types'
import { MAX_TREES } from '../economy/economyConstants'

export const FRESH_TREE_COVERAGE = 0.4
export const TREE_CANOPY_RADIUS = 64

interface Clearing {
  center: Vec
  radius: number
}

interface Grove {
  center: Vec
  radius: number
  share: number
}

interface ParkFrame {
  width: number
  height: number
  bounds: LawnBounds
  canopy: number
  treeTop: number
  clearings: Clearing[]
  station: PropState
}

const groveSpacing = 1.15
const groveReach = 1.95
const looseSpacing = 1.7
const sizeJitter: [number, number] = [0.86, 1.16]

export function feedingStationProp(width: number, height: number, random: Random): PropState {
  const recipe = recipeFor('feedingStation', viewportScale(width, height), random)
  const bounds = lawnBounds(width, height, 8)
  const position = { x: bounds.right - recipe.radius * 1.2, y: bounds.bottom - recipe.radius * 0.75 }
  return createPropState('prop-feedingStation', recipe, position, null, 0)
}

export function freshTreeTarget(width: number, height: number): number {
  const bounds = lawnBounds(width, height, 8)
  const canopy = TREE_CANOPY_RADIUS * viewportScale(width, height)
  const lawnArea = (bounds.right - bounds.left) * (bounds.bottom - bounds.top)
  return Math.min(MAX_TREES, Math.round((lawnArea * FRESH_TREE_COVERAGE) / (Math.PI * canopy * canopy)))
}

function centralClearing(bounds: LawnBounds): Clearing {
  const lawnWidth = bounds.right - bounds.left
  const lawnHeight = bounds.bottom - bounds.top
  return { center: { x: (bounds.left + bounds.right) / 2, y: bounds.top + lawnHeight * 0.56 }, radius: Math.min(lawnWidth, lawnHeight) * 0.2 }
}

function sideGlades(bounds: LawnBounds, random: Random): Clearing[] {
  const lawnWidth = bounds.right - bounds.left
  const lawnHeight = bounds.bottom - bounds.top
  const span = Math.min(lawnWidth, lawnHeight)
  const side = random.sign()
  return [
    { center: { x: bounds.left + lawnWidth * (0.5 + side * random.range(0.2, 0.28)), y: bounds.top + lawnHeight * random.range(0.22, 0.4) }, radius: span * 0.11 },
    { center: { x: bounds.left + lawnWidth * (0.5 - side * random.range(0.18, 0.26)), y: bounds.top + lawnHeight * random.range(0.72, 0.86) }, radius: span * 0.1 },
  ]
}

function createFrame(width: number, height: number, random: Random): ParkFrame {
  const bounds = lawnBounds(width, height, 8)
  const sizeScale = viewportScale(width, height)
  const canopy = TREE_CANOPY_RADIUS * sizeScale
  const station = feedingStationProp(width, height, random)
  const lawnSpan = Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top)
  const stationClearing = { center: { x: station.position.x - station.radius * 0.6, y: station.position.y - station.radius * 0.4 }, radius: Math.max(station.radius * 2.1, lawnSpan * 0.14) }
  return {
    width,
    height,
    bounds,
    canopy,
    treeTop: Math.max(bounds.top + 6, lawnTopEdge(height) + 118 * sizeScale),
    clearings: [centralClearing(bounds), stationClearing, ...sideGlades(bounds, random)],
    station,
  }
}

function isTreeSpotAllowed(frame: ParkFrame, point: Vec): boolean {
  const { bounds, canopy } = frame
  if (point.x < bounds.left + canopy || point.x > bounds.right - canopy) return false
  if (point.y < frame.treeTop || point.y > bounds.bottom - canopy * 0.35) return false
  if (frame.clearings.some((clearing) => distance(clearing.center, point) < clearing.radius + canopy * 0.55)) return false
  const dock = dockKeepOut(frame.width, frame.height)
  if (dock && point.x < dock.right + canopy * 0.7 && point.y > dock.top - canopy && point.y < dock.bottom + canopy * 0.4) return false
  return true
}

function isSpaced(trees: readonly Vec[], point: Vec, gap: number): boolean {
  return trees.every((tree) => distance(tree, point) >= gap)
}

function pickGroves(frame: ParkFrame, target: number, random: Random): Grove[] {
  const { bounds } = frame
  const count = target < 10 ? 3 : target < 24 ? 4 : 5
  const candidates: Vec[] = []
  for (let attempt = 0; attempt < 600 && candidates.length < 48; attempt += 1) {
    const center = { x: random.range(bounds.left, bounds.right), y: random.range(frame.treeTop, bounds.bottom) }
    if (isTreeSpotAllowed(frame, center)) candidates.push(center)
  }
  const groves: Grove[] = []
  while (groves.length < count && candidates.length > 0) {
    const scored = candidates.map((candidate) => ({
      candidate,
      score: groves.length === 0 ? random.next() : Math.min(...groves.map((grove) => Math.hypot(grove.center.x - candidate.x, (grove.center.y - candidate.y) * 1.3))) * random.range(0.75, 1),
    }))
    scored.sort((first, second) => second.score - first.score)
    const chosen = scored[0].candidate
    candidates.splice(candidates.indexOf(chosen), 1)
    groves.push({ center: chosen, radius: frame.canopy * random.range(2.2, 3.4), share: random.range(0.7, 1.3) })
  }
  return groves
}

function growGrove(frame: ParkFrame, grove: Grove, quota: number, placed: Vec[], random: Random): number {
  const gap = frame.canopy * groveSpacing
  if (!isSpaced(placed, grove.center, gap)) return 0
  const active: Vec[] = [grove.center]
  placed.push(grove.center)
  let grown = 1
  while (active.length > 0 && grown < quota) {
    const index = random.integer(0, active.length - 1)
    const origin = active[index]
    let spawned = false
    for (let attempt = 0; attempt < 18 && grown < quota; attempt += 1) {
      const angle = random.range(0, Math.PI * 2)
      const reach = random.range(gap, frame.canopy * groveReach)
      const candidate = { x: origin.x + Math.cos(angle) * reach, y: origin.y + Math.sin(angle) * reach * 0.72 }
      const spread = distance(candidate, grove.center) / grove.radius
      if (spread > 1.25 || (spread > 0.8 && !random.chance(1.25 - spread))) continue
      if (!isTreeSpotAllowed(frame, candidate) || !isSpaced(placed, candidate, gap)) continue
      placed.push(candidate)
      active.push(candidate)
      grown += 1
      spawned = true
    }
    if (!spawned) active.splice(index, 1)
  }
  return grown
}

function scatterLoners(frame: ParkFrame, quota: number, placed: Vec[], random: Random): void {
  const { bounds } = frame
  let added = 0
  for (let attempt = 0; attempt < quota * 160 && added < quota; attempt += 1) {
    const candidate = { x: random.range(bounds.left, bounds.right), y: random.range(frame.treeTop, bounds.bottom) }
    const gap = frame.canopy * (attempt < quota * 100 ? looseSpacing : groveSpacing)
    if (!isTreeSpotAllowed(frame, candidate) || !isSpaced(placed, candidate, gap)) continue
    placed.push(candidate)
    added += 1
  }
}

export function freshTreeSpots(width: number, height: number, seed: number): { station: PropState; spots: Vec[]; random: Random } {
  const random = createRandom(seed ^ 0x5bd1e995)
  const frame = createFrame(width, height, random)
  const target = freshTreeTarget(width, height)
  const groves = pickGroves(frame, target, random)
  const totalShare = groves.reduce((sum, grove) => sum + grove.share, 0)
  const groveQuota = Math.round(target * 0.82)
  const placed: Vec[] = []
  groves.forEach((grove) => {
    growGrove(frame, grove, Math.max(1, Math.round((groveQuota * grove.share) / Math.max(totalShare, 1e-6))), placed, random)
  })
  scatterLoners(frame, Math.max(0, target - placed.length), placed, random)
  return { station: frame.station, spots: placed.slice(0, target), random }
}

export function createFreshParkProps(width: number, height: number, seed: number): PropState[] {
  const { station, spots, random } = freshTreeSpots(width, height, seed)
  const sizeScale = viewportScale(width, height)
  const trees = [...spots]
    .sort((first, second) => first.y - second.y || first.x - second.x)
    .map((position, index) => {
      const recipe = recipeFor('tree', sizeScale, random)
      const radius = recipe.radius * random.range(sizeJitter[0], sizeJitter[1])
      return createPropState(`prop-tree-${index}`, { ...recipe, radius }, position, null, random.integer(0, 2))
    })
  return [station, ...trees]
}
