import { horizontalGapToParkPath, parkPathCenter as pathCenter, parkPathHalfWidth as pathHalfWidth } from '../../game/parkPath'
import { createSeededRandom, randomBetween } from '../../game/random'
import type { Vec } from '../../game/types'
import { WORLD_SEED } from '../../game/constants'

interface HillLayer {
  path: string
  color: string
}

export interface CloudLayout {
  x: number
  y: number
  scale: number
  duration: number
  delay: number
}

export interface Speck {
  x: number
  y: number
  size: number
  tone: string
}

interface FenceLayout {
  posts: Vec[]
  railPaths: string[]
}

interface SceneryLayout {
  lawnTop: number
  crestPath: string
  lawnPath: string
  hills: HillLayer[]
  ridgeTrees: Speck[]
  clouds: CloudLayout[]
  stripes: string[]
  gravelPath: string
  gravelSpecks: Speck[]
  tufts: Speck[]
  daisies: Speck[]
  lawnPatches: Speck[]
  fence: FenceLayout
}

function crestY(x: number, width: number, lawnTop: number): number {
  return lawnTop + 6 - 14 * Math.sin((Math.PI * x) / width)
}

function smoothPath(points: Vec[]): string {
  const [first, ...rest] = points
  let path = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
  rest.forEach((point, index) => {
    const previous = points[index]
    const middleX = (previous.x + point.x) / 2
    const middleY = (previous.y + point.y) / 2
    path += ` Q ${previous.x.toFixed(1)} ${previous.y.toFixed(1)} ${middleX.toFixed(1)} ${middleY.toFixed(1)}`
  })
  const last = points[points.length - 1]
  return `${path} L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`
}

function hillLayer(width: number, baseY: number, amplitude: number, frequency: number, phase: number, bottom: number): string {
  const step = Math.max(24, width / 48)
  const points: Vec[] = []
  for (let x = -step; x <= width + step; x += step) {
    const wave = Math.sin(x * frequency + phase) * 0.6 + Math.sin(x * frequency * 2.3 + phase * 1.7) * 0.4
    points.push({ x, y: baseY - amplitude * (0.5 + 0.5 * wave) })
  }
  return `${smoothPath(points)} L ${width + step} ${bottom} L ${-step} ${bottom} Z`
}

export function createSceneryLayout(width: number, height: number, lawnTopRatio: number): SceneryLayout {
  const random = createSeededRandom(WORLD_SEED)
  const lawnTop = height * lawnTopRatio
  const lawnDepth = height - lawnTop
  const depthOf = (y: number) => Math.min(1, Math.max(0, (y - lawnTop) / lawnDepth))

  const crestPoints: Vec[] = []
  for (let x = 0; x <= width; x += width / 40) {
    crestPoints.push({ x, y: crestY(x, width, lawnTop) })
  }
  const crestPath = smoothPath(crestPoints)
  const lawnPath = `${crestPath} L ${width} ${height} L 0 ${height} Z`

  const hills: HillLayer[] = [
    { path: hillLayer(width, lawnTop * 0.62, lawnTop * 0.34, 0.0042, 1.2, lawnTop + 20), color: '#b3d1bf' },
    { path: hillLayer(width, lawnTop * 0.8, lawnTop * 0.3, 0.0061, 3.4, lawnTop + 20), color: '#9cc39b' },
    { path: hillLayer(width, lawnTop * 0.98, lawnTop * 0.22, 0.0083, 0.3, lawnTop + 20), color: '#8bb87f' },
  ]

  const ridgeTrees: Speck[] = Array.from({ length: Math.round(width / 70) }, () => {
    const x = random() * width
    return {
      x,
      y: lawnTop * randomBetween(random, 0.68, 0.86),
      size: randomBetween(random, 3, 6.5),
      tone: random() > 0.5 ? '#6f9f73' : '#7aa878',
    }
  })

  const clouds: CloudLayout[] = [
    { x: width * 0.12, y: lawnTop * 0.3, scale: 1, duration: 70, delay: -10 },
    { x: width * 0.38, y: lawnTop * 0.18, scale: 0.7, duration: 90, delay: -40 },
    { x: width * 0.63, y: lawnTop * 0.36, scale: 0.85, duration: 80, delay: -25 },
    { x: width * 0.9, y: lawnTop * 0.2, scale: 0.6, duration: 100, delay: -60 },
  ]

  const vanishX = width / 2
  const stripeCount = 16
  const topSpacing = (width * 0.9) / stripeCount
  const bottomSpacing = (width * 1.9) / stripeCount
  const stripes: string[] = []
  for (let index = 0; index < stripeCount; index += 2) {
    const offset = index - stripeCount / 2
    const topLeft = vanishX + offset * topSpacing
    const topRight = vanishX + (offset + 1) * topSpacing
    const bottomLeft = vanishX + offset * bottomSpacing
    const bottomRight = vanishX + (offset + 1) * bottomSpacing
    stripes.push(`M ${topLeft} ${lawnTop - 20} L ${topRight} ${lawnTop - 20} L ${bottomRight} ${height} L ${bottomLeft} ${height} Z`)
  }

  const sampleCount = 80
  const leftEdge: Vec[] = []
  const rightEdge: Vec[] = []
  for (let index = 0; index <= sampleCount; index += 1) {
    const progress = index / sampleCount
    const center = pathCenter(progress, width, height, lawnTop)
    const ahead = pathCenter(Math.min(1, progress + 0.01), width, height, lawnTop)
    const behind = pathCenter(Math.max(0, progress - 0.01), width, height, lawnTop)
    const tangentX = ahead.x - behind.x
    const tangentY = ahead.y - behind.y
    const tangentLength = Math.hypot(tangentX, tangentY) || 1
    const normalX = -tangentY / tangentLength
    const normalY = tangentX / tangentLength
    const halfWidth = pathHalfWidth(progress, width)
    leftEdge.push({ x: center.x + normalX * halfWidth, y: center.y + normalY * halfWidth * 0.5 })
    rightEdge.push({ x: center.x - normalX * halfWidth, y: center.y - normalY * halfWidth * 0.5 })
  }
  const gravelPath = `${smoothPath(leftEdge)} L ${rightEdge[rightEdge.length - 1].x} ${rightEdge[rightEdge.length - 1].y} ${smoothPath([...rightEdge].reverse()).replace(/^M/, 'L')} Z`

  const gravelSpecks: Speck[] = Array.from({ length: Math.round(width * 0.22) }, () => {
    const progress = Math.pow(random(), 1.4)
    const center = pathCenter(progress, width, height, lawnTop)
    const halfWidth = pathHalfWidth(progress, width) * 0.85
    const depth = depthOf(center.y)
    return {
      x: center.x + randomBetween(random, -halfWidth, halfWidth),
      y: center.y + randomBetween(random, -3, 3),
      size: (0.6 + random() * 1.1) * (0.6 + depth * 0.7),
      tone: random() > 0.55 ? '#c9b180' : '#f4e8c9',
    }
  })

  const isOnPath = (x: number, y: number) => horizontalGapToParkPath({ x, y }, width, height, lawnTop) < 8

  const scatterOnLawn = (count: number, margin: number, build: (x: number, y: number, depth: number) => Speck): Speck[] => {
    const specks: Speck[] = []
    let attempts = 0
    while (specks.length < count && attempts < count * 6) {
      attempts += 1
      const x = random() * width
      const y = lawnTop + margin + Math.pow(random(), 0.85) * (lawnDepth - margin)
      if (y < crestY(x, width, lawnTop) + margin || isOnPath(x, y)) continue
      specks.push(build(x, y, depthOf(y)))
    }
    return specks.sort((first, second) => first.y - second.y)
  }

  const areaFactor = (width * height) / (1440 * 900)
  const tuftTones = ['#6aa84a', '#5d9a40', '#78b456', '#8cc063']
  const tufts = scatterOnLawn(Math.round(190 * areaFactor), 14, (x, y, depth) => ({
    x,
    y,
    size: 0.55 + depth * 0.75,
    tone: tuftTones[Math.floor(random() * tuftTones.length)],
  }))
  const daisyTones = ['#ffffff', '#ffffff', '#fbe9a6', '#f7d3dc']
  const daisies = scatterOnLawn(Math.round(80 * areaFactor), 20, (x, y, depth) => ({
    x,
    y,
    size: 0.6 + depth * 0.7,
    tone: daisyTones[Math.floor(random() * daisyTones.length)],
  }))
  const lawnPatches = scatterOnLawn(Math.round(26 * areaFactor), 24, (x, y, depth) => ({
    x,
    y,
    size: (40 + random() * 70) * (0.6 + depth * 0.6),
    tone: random() > 0.5 ? '#86b95c' : '#a3d07a',
  }))

  const posts: Vec[] = []
  const postSpacing = 34
  for (let x = postSpacing / 2; x < width; x += postSpacing) {
    posts.push({ x, y: crestY(x, width, lawnTop) + 2 })
  }
  const railPaths = [9, 4].map((railHeight) => smoothPath(posts.map((post) => ({ x: post.x, y: post.y - railHeight }))))

  return {
    lawnTop,
    crestPath,
    lawnPath,
    hills,
    ridgeTrees,
    clouds,
    stripes,
    gravelPath,
    gravelSpecks,
    tufts,
    daisies,
    lawnPatches,
    fence: { posts, railPaths },
  }
}
