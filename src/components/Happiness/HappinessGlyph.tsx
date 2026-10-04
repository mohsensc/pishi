interface HappinessGlyphProps {
  happiness: number
  size?: number
}

export default function HappinessGlyph({ happiness, size = 16 }: HappinessGlyphProps) {
  const value = Math.min(1, Math.max(0, happiness))
  const curve = 16.4 + (value - 0.5) * 9
  const color = `hsl(${Math.round(12 + value * 92)} 52% 44%)`
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" data-happiness={value.toFixed(2)}>
      <circle cx={12} cy={12} r={9.4} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={8.9} cy={10} r={1.25} fill={color} />
      <circle cx={15.1} cy={10} r={1.25} fill={color} />
      <path d={`M8 ${14.6 + (0.5 - value) * 1.6} Q12 ${curve} 16 ${14.6 + (0.5 - value) * 1.6}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}
