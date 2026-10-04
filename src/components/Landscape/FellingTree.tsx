import { memo, useMemo } from 'react'
import { motion } from 'motion/react'
import type { FelledTree } from '../../game/landscape/landscapeTypes'
import { createSeededRandom, hashString } from '../../game/random'
import { TreeCanopy, TreeShade, TreeTrunk } from './TreeArt'
import { treeGeometry } from './treeGeometry'
import styles from './Landscape.module.css'

interface FellingTreeProps {
  tree: FelledTree
}

const strikeTimes = [0.04, 0.3]
const fallDelay = 0.42
const fallSeconds = 0.95
const impactAt = fallDelay + fallSeconds
const chipColors = ['#c99a62', '#e2c08c', '#8b5d3b', '#b27d4a']
const leafColors = ['#4f8f47', '#66a656', '#86bf6c', '#a7c75a', '#d6b84a']
const tuftColors = ['#78b456', '#8cc063', '#6aa84a']

function seededParticles<Particle>(seed: string, count: number, build: (random: () => number, index: number) => Particle): Particle[] {
  const random = createSeededRandom(hashString(seed))
  return Array.from({ length: count }, (_, index) => build(random, index))
}

function Stump({ radius }: { radius: number }) {
  const width = radius * 0.95
  const lip = radius * 0.28
  return (
    <motion.g initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ duration: 5.2, times: [0, 0.3, 1], ease: 'easeIn' }}>
      <path d={`M ${-width} 0 Q ${-width * 0.9} ${-lip * 1.6} ${-width * 0.72} ${-lip * 2.2} L ${width * 0.72} ${-lip * 2.2} Q ${width * 0.9} ${-lip * 1.6} ${width} 0 Z`} fill="#7d5434" />
      <ellipse cx={0} cy={-lip * 2.2} rx={width * 0.74} ry={lip * 0.95} fill="#e2c08c" />
      <ellipse cx={0} cy={-lip * 2.2} rx={width * 0.48} ry={lip * 0.6} fill="none" stroke="#c99a62" strokeWidth={1.1} />
      <ellipse cx={0} cy={-lip * 2.2} rx={width * 0.22} ry={lip * 0.28} fill="none" stroke="#c99a62" strokeWidth={1} />
    </motion.g>
  )
}

function WoodChips({ seed, radius }: { seed: string; radius: number }) {
  const chips = useMemo(
    () =>
      seededParticles(seed, 12, (random, index) => {
        const side = index % 2 === 0 ? 1 : -1
        const reach = radius * (1.4 + random() * 2.4)
        return {
          x: side * reach,
          lift: radius * (1.2 + random() * 1.8),
          land: radius * (random() * 0.6 - 0.1),
          rotate: (random() - 0.5) * 540,
          width: radius * (0.18 + random() * 0.16),
          color: chipColors[index % chipColors.length],
          delay: strikeTimes[index % strikeTimes.length] + random() * 0.05,
          startY: -radius * (0.6 + random() * 0.8),
        }
      }),
    [seed, radius],
  )
  return (
    <>
      {chips.map((chip, index) => (
        <motion.g
          key={index}
          initial={{ x: 0, y: chip.startY, rotate: 0, opacity: 0 }}
          animate={{ x: [0, chip.x * 0.55, chip.x], y: [chip.startY, chip.startY - chip.lift, chip.land], rotate: chip.rotate, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.75, delay: chip.delay, ease: 'easeOut', opacity: { duration: 1.4, delay: chip.delay, times: [0, 0.05, 0.6, 1] } }}>
          <rect x={-chip.width / 2} y={-chip.width * 0.3} width={chip.width} height={chip.width * 0.6} rx={chip.width * 0.2} fill={chip.color} />
        </motion.g>
      ))}
    </>
  )
}

function ImpactDust({ seed, x, radius }: { seed: string; x: number; radius: number }) {
  const puffs = useMemo(
    () =>
      seededParticles(`${seed}dust`, 9, (random, index) => ({
        x: x + (index - 4) * radius * 0.75 + (random() - 0.5) * radius,
        y: -radius * (0.2 + random() * 0.6),
        size: radius * (0.65 + random() * 0.55),
        drift: (random() - 0.5) * radius * 1.6,
      })),
    [seed, x, radius],
  )
  return (
    <>
      <motion.ellipse
        cx={x}
        cy={0}
        rx={radius * 5}
        ry={radius * 1.1}
        fill="none"
        stroke="#f2e6c4"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.8, 0], scale: [0.3, 1, 1.35] }}
        transition={{ duration: 0.8, delay: impactAt, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      {puffs.map((puff, index) => (
        <motion.circle
          key={index}
          cx={puff.x}
          cy={puff.y}
          r={puff.size}
          fill="#ecdeba"
          initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.3, 1.1, 1.7], x: puff.drift, y: -puff.size * 0.8 }}
          transition={{ duration: 1.1, delay: impactAt + index * 0.02, ease: 'easeOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      ))}
    </>
  )
}

function ImpactLeaves({ seed, x, canopyY, spread }: { seed: string; x: number; canopyY: number; spread: number }) {
  const leaves = useMemo(
    () =>
      seededParticles(`${seed}leaves`, 18, (random) => {
        const startX = x + (random() - 0.5) * spread * 2
        const startY = canopyY + (random() - 0.5) * spread * 0.6
        const sway = (random() > 0.5 ? 1 : -1) * spread * (0.15 + random() * 0.2)
        const rise = spread * (0.4 + random() * 0.7)
        return {
          size: spread * (0.11 + random() * 0.07),
          color: leafColors[Math.floor(random() * leafColors.length)],
          x: [startX, startX + sway, startX - sway * 0.6, startX + sway * 0.3],
          y: [startY, startY - rise, startY - rise * 0.4, -random() * spread * 0.1],
          rotate: [0, 120, 40, 160 + random() * 80],
          duration: 1.5 + random() * 0.7,
          delay: impactAt - 0.05 + random() * 0.12,
        }
      }),
    [seed, x, canopyY, spread],
  )
  return (
    <>
      {leaves.map((leaf, index) => (
        <motion.g
          key={index}
          initial={{ x: leaf.x[0], y: leaf.y[0], rotate: 0, opacity: 0 }}
          animate={{ x: leaf.x, y: leaf.y, rotate: leaf.rotate, opacity: [0, 1, 1, 0] }}
          transition={{ duration: leaf.duration, delay: leaf.delay, ease: 'easeOut' }}>
          <path d={`M 0 ${-leaf.size * 0.5} Q ${leaf.size * 0.7} 0 0 ${leaf.size * 0.5} Q ${-leaf.size * 0.7} 0 0 ${-leaf.size * 0.5} Z`} fill={leaf.color} />
        </motion.g>
      ))}
    </>
  )
}

function FreshGrass({ seed, radius }: { seed: string; radius: number }) {
  const tufts = useMemo(
    () =>
      seededParticles(`${seed}grass`, 7, (random, index) => ({
        x: (index - 3) * radius * 0.55 + (random() - 0.5) * radius * 0.4,
        y: (random() - 0.5) * radius * 0.5,
        size: 0.7 + random() * 0.5,
        tone: tuftColors[index % tuftColors.length],
        daisy: random() > 0.7,
      })),
    [seed, radius],
  )
  return (
    <motion.g initial={{ opacity: 0, y: 3 }} animate={{ opacity: [0, 1, 1, 0], y: [3, 0, 0, 0] }} transition={{ duration: 3.8, delay: 4.1, times: [0, 0.25, 0.7, 1], ease: 'easeOut' }}>
      <ellipse cx={0} cy={0} rx={radius * 2.2} ry={radius * 0.7} fill="#9fd06f" opacity={0.45} />
      {tufts.map((tuft, index) => (
        <g key={index}>
          <path
            d={`M ${tuft.x - 4 * tuft.size} ${tuft.y} q ${tuft.size} ${-4 * tuft.size} ${-tuft.size} ${-8 * tuft.size} M ${tuft.x} ${tuft.y} q ${-tuft.size} ${-6 * tuft.size} ${tuft.size} ${-11 * tuft.size} M ${tuft.x + 4 * tuft.size} ${tuft.y} q ${-tuft.size} ${-4 * tuft.size} ${2 * tuft.size} ${-7 * tuft.size}`}
            stroke={tuft.tone}
            strokeWidth={1.6 * tuft.size}
            strokeLinecap="round"
            fill="none"
          />
          {tuft.daisy && <circle cx={tuft.x + 2} cy={tuft.y - 9 * tuft.size} r={1.8 * tuft.size} fill="#ffffff" />}
        </g>
      ))}
    </motion.g>
  )
}

function FellingTree({ tree }: FellingTreeProps) {
  const geometry = treeGeometry(tree.radius, tree.variant)
  const scale = tree.scale
  const cut = tree.radius * 0.62
  const direction = tree.direction
  const reachX = (geometry.trunkHeight + geometry.canopyUnit * 0.9) * direction * 0.97
  return (
    <>
      <div className={styles.anchor} style={{ transform: `translate3d(${tree.position.x}px, ${tree.position.y}px, 0) scale(${scale})`, zIndex: 3 }}>
        <svg className={styles.canvas} width="1" height="1" overflow="visible" aria-hidden="true">
          <motion.g initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7, delay: fallDelay + 0.2 }}>
            <TreeShade geometry={geometry} />
          </motion.g>
          <FreshGrass seed={tree.id} radius={tree.radius} />
        </svg>
      </div>
      <div className={styles.anchor} style={{ transform: `translate3d(${tree.position.x}px, ${tree.position.y}px, 0) scale(${scale})`, zIndex: Math.round(tree.position.y) + 1 }} data-felled-tree={tree.propId}>
        <svg className={styles.canvas} width="1" height="1" overflow="visible" aria-hidden="true">
          <Stump radius={tree.radius} />
          <g className={styles.fellFade}>
            <g className={direction > 0 ? styles.fellRight : styles.fellLeft} style={{ transformOrigin: `0px ${-cut}px` }}>
              <g transform={`translate(0 ${-cut})`}>
                <TreeTrunk geometry={geometry} />
                <TreeCanopy geometry={geometry} variant={tree.variant} />
              </g>
            </g>
          </g>
          <WoodChips seed={tree.id} radius={tree.radius} />
          <ImpactDust seed={tree.id} x={reachX} radius={tree.radius} />
          <ImpactLeaves seed={tree.id} x={reachX} canopyY={-geometry.canopyUnit * 0.6} spread={geometry.canopyUnit * 1.6} />
        </svg>
      </div>
    </>
  )
}

export default memo(FellingTree)
