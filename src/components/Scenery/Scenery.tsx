import { memo, useMemo } from 'react'
import { LAWN_TOP_RATIO } from '../../game/constants'
import Sun from '../Sky/Sun'
import { skyFrameOf } from '../Sky/skyArc'
import styles from './Scenery.module.css'
import { createSceneryLayout, type CloudLayout, type Speck } from './sceneryLayout'

interface SceneryProps {
  width: number
  height: number
  skyTime: number
}

function Cloud({ x, y, scale, duration, delay }: CloudLayout) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={styles.cloud} style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}>
        <ellipse cx={0} cy={0} rx={46} ry={11} fill="#ffffff" opacity={0.92} />
        <circle cx={-14} cy={-8} r={14} fill="#ffffff" opacity={0.92} />
        <circle cx={8} cy={-12} r={17} fill="#ffffff" opacity={0.92} />
        <circle cx={26} cy={-4} r={11} fill="#ffffff" opacity={0.92} />
      </g>
    </g>
  )
}

function GrassTuft({ x, y, size, tone }: Speck) {
  return (
    <path
      d={`M ${x - 4 * size} ${y} q ${1 * size} ${-4 * size} ${-1 * size} ${-8 * size} M ${x} ${y} q ${-1 * size} ${-6 * size} ${1 * size} ${-11 * size} M ${x + 4 * size} ${y} q ${-1 * size} ${-4 * size} ${2 * size} ${-7 * size}`}
      stroke={tone}
      strokeWidth={1.6 * size}
      strokeLinecap="round"
      fill="none"
    />
  )
}

function Daisy({ x, y, size, tone }: Speck) {
  return (
    <g>
      <circle cx={x - 1.8 * size} cy={y} r={1.5 * size} fill={tone} />
      <circle cx={x + 1.8 * size} cy={y} r={1.5 * size} fill={tone} />
      <circle cx={x} cy={y - 1.3 * size} r={1.5 * size} fill={tone} />
      <circle cx={x} cy={y + 1.3 * size} r={1.5 * size} fill={tone} />
      <circle cx={x} cy={y} r={1.1 * size} fill="#f2b233" />
    </g>
  )
}

function Scenery({ width, height, skyTime }: SceneryProps) {
  const layout = useMemo(() => createSceneryLayout(width, height, LAWN_TOP_RATIO), [width, height])
  const { lawnTop } = layout

  return (
    <svg className={styles.scenery} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id="scenerySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe1ef" />
          <stop offset="100%" stopColor="#eef6e8" />
        </linearGradient>
        <linearGradient id="sceneryLawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b2d887" />
          <stop offset="35%" stopColor="#9bcb69" />
          <stop offset="100%" stopColor="#82b953" />
        </linearGradient>
        <radialGradient id="sceneryVignette" cx="50%" cy="55%" r="75%">
          <stop offset="65%" stopColor="#234a14" stopOpacity={0} />
          <stop offset="100%" stopColor="#234a14" stopOpacity={0.16} />
        </radialGradient>
        <linearGradient id="sceneryHaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef6e8" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#eef6e8" stopOpacity={0} />
        </linearGradient>
        <clipPath id="sceneryLawnClip">
          <path d={layout.lawnPath} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={width} height={lawnTop + 30} fill="url(#scenerySky)" />
      <Sun frame={skyFrameOf(width, height, 1.05)} dayTime={skyTime} />
      {layout.clouds.map((cloud) => (
        <Cloud key={`${cloud.x}${cloud.y}`} {...cloud} />
      ))}
      {layout.hills.map((hill) => (
        <path key={hill.color} d={hill.path} fill={hill.color} />
      ))}
      {layout.ridgeTrees.map((tree) => (
        <g key={`${tree.x}${tree.y}`}>
          <rect x={tree.x - 0.8} y={tree.y} width={1.6} height={tree.size * 0.8} fill="#6d8a5e" />
          <circle cx={tree.x} cy={tree.y - tree.size * 0.3} r={tree.size} fill={tree.tone} />
        </g>
      ))}
      <path d={layout.lawnPath} fill="url(#sceneryLawn)" />
      <g clipPath="url(#sceneryLawnClip)">
        {layout.lawnPatches.map((patch) => (
          <ellipse
            key={`${patch.x}${patch.y}`}
            cx={patch.x}
            cy={patch.y}
            rx={patch.size}
            ry={patch.size * 0.32}
            fill={patch.tone}
            opacity={0.22}
          />
        ))}
        {layout.stripes.map((stripe) => (
          <path key={stripe} d={stripe} fill="#ffffff" opacity={0.07} />
        ))}
        <rect x={0} y={lawnTop - 20} width={width} height={(height - lawnTop) * 0.25} fill="url(#sceneryHaze)" />
      </g>
      <path d={layout.crestPath} stroke="#b9dc92" strokeWidth={3} fill="none" opacity={0.8} />
      <g opacity={0.85}>
        {layout.fence.railPaths.map((rail) => (
          <path key={rail} d={rail} stroke="#c8a576" strokeWidth={1.6} fill="none" />
        ))}
        {layout.fence.posts.map((post) => (
          <rect key={post.x} x={post.x - 1.4} y={post.y - 13} width={2.8} height={13} rx={1} fill="#b89366" />
        ))}
      </g>
      {layout.tufts.map((tuft) => (
        <GrassTuft key={`${tuft.x}${tuft.y}`} {...tuft} />
      ))}
      {layout.daisies.map((daisy) => (
        <Daisy key={`${daisy.x}${daisy.y}`} {...daisy} />
      ))}
      <rect x={0} y={0} width={width} height={height} fill="url(#sceneryVignette)" />
    </svg>
  )
}

export default memo(Scenery)
