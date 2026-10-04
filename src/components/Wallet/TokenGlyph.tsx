import { memo } from 'react'

interface TokenGlyphProps {
  size?: number
  muted?: boolean
}

function TokenGlyph({ size = 12, muted = false }: TokenGlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block', flex: 'none' }}>
      <circle cx={8} cy={8} r={7.2} fill={muted ? '#c9cfbf' : '#d6ea3a'} />
      <path d="M8 0.8a7.2 7.2 0 0 1 0 14.4a5.6 7.2 0 0 0 0-14.4z" fill={muted ? '#b7bdac' : '#c2d62c'} opacity={0.7} />
      <ellipse cx={5.6} cy={4.9} rx={2.1} ry={1.3} fill="#ffffff" opacity={muted ? 0.25 : 0.35} transform="rotate(-35 5.6 4.9)" />
      <path d="M3.1 3.4c2.7 1.7 2.7 7.5 0 9.2M12.9 3.4c-2.7 1.7-2.7 7.5 0 9.2" stroke="#fbfbf2" strokeWidth={1.25} fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default memo(TokenGlyph)
