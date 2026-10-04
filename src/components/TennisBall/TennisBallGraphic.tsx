import { memo, useId } from 'react'

interface TennisBallGraphicProps {
  size: number
  spin: number
}

const feltBase = '#d6ea3a'
const feltShade = '#c2d62c'
const feltDeepShade = '#adc024'
const feltLight = '#e5f36a'
const seamColor = '#fbfbf2'

function TennisBallGraphic({ size, spin }: TennisBallGraphicProps) {
  const instanceId = useId().replace(/:/g, '')
  const fuzzFilterId = `ballFuzz${instanceId}`
  const clipId = `ballClip${instanceId}`
  const spinDegrees = (spin * 180) / Math.PI
  const fuzzStrength = size > 28 ? 3.2 : 2.2

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      <defs>
        <filter id={fuzzFilterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={fuzzStrength} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>
      <g filter={`url(#${fuzzFilterId})`}>
        <circle cx="50" cy="50" r="47" fill={feltBase} />
        <g clipPath={`url(#${clipId})`}>
          <circle cx="62" cy="64" r="46" fill={feltShade} />
          <circle cx="50" cy="50" r="40" fill={feltBase} transform="translate(-6 -7)" />
          <circle cx="76" cy="80" r="30" fill={feltDeepShade} opacity="0.45" />
          <ellipse cx="34" cy="30" rx="16" ry="11" fill={feltLight} opacity="0.7" transform="rotate(-35 34 30)" />
          <g transform={`rotate(${spinDegrees} 50 50)`}>
            <path d="M 14 16 C 44 34, 44 66, 14 84" fill="none" stroke={seamColor} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 86 16 C 56 34, 56 66, 86 84" fill="none" stroke={seamColor} strokeWidth="5.5" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  )
}

export default memo(TennisBallGraphic)
