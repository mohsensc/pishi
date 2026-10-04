import { useId } from 'react'
import PropAnchor from './PropAnchor'
import styles from './Props.module.css'
import reactions from './Reactions.module.css'
import { POND_ASPECT } from '../../game/constants'
import { groundZIndex, pokeReactionOf, reactionClass, type PropViewProps } from './propView'
import { createSeededRandom, hashString } from '../../game/random'

export default function Pond({ prop, x, y }: PropViewProps) {
  const gradientId = `pondWater${useId().replace(/:/g, '')}`
  const radiusX = prop.radius
  const radiusY = radiusX * POND_ASPECT
  const centerY = 0
  const random = createSeededRandom(hashString(prop.id) + 5)
  const rimStones = Array.from({ length: 30 }, (_, index) => {
    const angle = (index / 30) * Math.PI * 2 + random() * 0.08
    const wobble = 1 + (random() - 0.5) * 0.06
    return {
      cx: Math.cos(angle) * (radiusX + 3) * wobble,
      cy: centerY + Math.sin(angle) * (radiusY + 2.5) * wobble,
      size: 4 + random() * 3.5,
      tone: random() > 0.5 ? '#d6cfbd' : '#c4bca8',
    }
  })
  const mirror = prop.variant % 2 === 0 ? 1 : -1
  const lilyPads = [
    { cx: -radiusX * 0.42 * mirror, cy: centerY + radiusY * 0.2, size: radiusX * 0.12, rotation: 20 },
    { cx: -radiusX * 0.22 * mirror, cy: centerY + radiusY * 0.45, size: radiusX * 0.09, rotation: 160 },
    { cx: radiusX * 0.45 * mirror, cy: centerY - radiusY * 0.28, size: radiusX * 0.1, rotation: 260 },
  ]
  const ripples = [
    { cx: radiusX * 0.12 * mirror, cy: centerY + radiusY * 0.05, delay: 0 },
    { cx: radiusX * 0.3 * mirror, cy: centerY + radiusY * 0.35, delay: 1.4 },
    { cx: -radiusX * 0.05 * mirror, cy: centerY - radiusY * 0.35, delay: 2.5 },
  ]
  const reaction = pokeReactionOf(prop)
  const pokeRings = [0, 0.22, 0.46]
  const reedBaseX = radiusX * 0.72 * -mirror
  const reedBaseY = centerY - radiusY * 0.62
  const reeds = [
    { dx: 0, height: 34, lean: -2 },
    { dx: 6, height: 42, lean: 2 },
    { dx: 12, height: 30, lean: 4 },
    { dx: -6, height: 26, lean: -4 },
  ]

  return (
    <PropAnchor x={x} y={y} zIndex={groundZIndex.pond} scale={1}>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#6cb6c9" />
          <stop offset="70%" stopColor="#7fc3d1" />
          <stop offset="100%" stopColor="#98d0d6" />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={centerY + 3} rx={radiusX + 10} ry={radiusY + 8} fill="rgba(38, 62, 24, 0.14)" />
      <ellipse cx={0} cy={centerY} rx={radiusX + 4} ry={radiusY + 4} fill="#b9ae93" />
      <ellipse cx={0} cy={centerY} rx={radiusX} ry={radiusY} fill={`url(#${gradientId})`} />
      <path
        d={`M ${-radiusX} ${centerY} A ${radiusX} ${radiusY} 0 0 1 ${radiusX} ${centerY} A ${radiusX} ${radiusY * 0.72} 0 0 0 ${-radiusX} ${centerY} Z`}
        fill="#4f9fb3"
        opacity={0.45}
      />
      <ellipse cx={-radiusX * 0.3 * mirror} cy={centerY + radiusY * 0.55} rx={radiusX * 0.28} ry={2} fill="#ffffff" opacity={0.45} />
      <ellipse cx={radiusX * 0.05 * mirror} cy={centerY + radiusY * 0.68} rx={radiusX * 0.12} ry={1.5} fill="#ffffff" opacity={0.35} />
      {ripples.map((ripple) => (
        <ellipse
          key={`${ripple.cx}${ripple.cy}`}
          className={styles.ripple}
          style={{ animationDelay: `${ripple.delay}s` }}
          cx={ripple.cx}
          cy={ripple.cy}
          rx={radiusX * 0.14}
          ry={radiusX * 0.055}
          fill="none"
          stroke="#e9f7f8"
          strokeWidth={1.2}
        />
      ))}
      {reaction.poked &&
        pokeRings.map((delay) => (
          <ellipse
            key={`${reaction.key}${delay}`}
            className={reactions.pokeRipple}
            style={{ animationDelay: `${delay}s` }}
            cx={0}
            cy={centerY}
            rx={radiusX * 0.3}
            ry={radiusX * 0.3 * 0.42}
            fill="none"
            stroke="#f2fbfc"
            strokeWidth={2}
          />
        ))}
      <g key={reaction.key} className={reactionClass(reaction, reactions.bobHard)}>
      {lilyPads.map((pad) => (
        <g key={`${pad.cx}${pad.cy}`} className={styles.bob}>
          <path
            d={`M ${pad.cx} ${pad.cy} L ${pad.cx + Math.cos((pad.rotation * Math.PI) / 180) * pad.size} ${pad.cy + Math.sin((pad.rotation * Math.PI) / 180) * pad.size * 0.45} A ${pad.size} ${pad.size * 0.45} 0 1 0 ${pad.cx + Math.cos(((pad.rotation + 38) * Math.PI) / 180) * pad.size} ${pad.cy + Math.sin(((pad.rotation + 38) * Math.PI) / 180) * pad.size * 0.45} Z`}
            fill="#5f9e4b"
          />
          <ellipse cx={pad.cx - pad.size * 0.25} cy={pad.cy - pad.size * 0.12} rx={pad.size * 0.35} ry={pad.size * 0.12} fill="#7bb660" />
        </g>
      ))}
      <g className={styles.bob}>
        <path
          d={`M ${lilyPads[0].cx - 4} ${lilyPads[0].cy - 1} q 1 -6 4 -7 q 3 1 4 7 Z`}
          fill="#f4a7b9"
        />
        <path d={`M ${lilyPads[0].cx - 2} ${lilyPads[0].cy - 1} q 2 -8 4 0 Z`} fill="#fbd3dc" />
      </g>
      </g>
      {rimStones.map((stone) => (
        <g key={`${stone.cx}${stone.cy}`}>
          <ellipse cx={stone.cx} cy={stone.cy} rx={stone.size} ry={stone.size * 0.62} fill={stone.tone} />
          <ellipse cx={stone.cx - 0.8} cy={stone.cy - 1} rx={stone.size * 0.45} ry={stone.size * 0.22} fill="#ebe5d6" />
        </g>
      ))}
      {reeds.map((reed) => (
        <g key={reed.dx}>
          <path
            d={`M ${reedBaseX + reed.dx} ${reedBaseY} q ${reed.lean} ${-reed.height * 0.5} ${reed.lean * 1.5} ${-reed.height}`}
            stroke="#5c8f3f"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
          />
          {reed.height > 30 && (
            <rect
              x={reedBaseX + reed.dx + reed.lean * 1.4 - 2}
              y={reedBaseY - reed.height + 2}
              width={4}
              height={10}
              rx={2}
              fill="#8a5a36"
            />
          )}
        </g>
      ))}
      <path
        d={`M ${reedBaseX - 10} ${reedBaseY + 1} q 4 -14 8 -16 M ${reedBaseX + 18} ${reedBaseY + 1} q -2 -12 -8 -18`}
        stroke="#6ea24c"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
    </PropAnchor>
  )
}
