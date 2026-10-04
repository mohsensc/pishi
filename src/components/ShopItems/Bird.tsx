import styles from './ShopItems.module.css'

interface BirdProps {
  x: number
  y: number
  tone: string
  breast: string
  facing: 1 | -1
  delay: number
  mood: 'peck' | 'hop' | 'still'
  size?: number
}

export default function Bird({ x, y, tone, breast, facing, delay, mood, size = 1 }: BirdProps) {
  const moodClass = mood === 'peck' ? styles.peck : mood === 'hop' ? styles.hop : undefined
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * size} ${size})`}>
      <g className={moodClass} style={{ animationDelay: `${delay}s`, transformOrigin: '1px 0px' }}>
        <path d="M -7 -3 L -12 -1 L -11 1 L -6 0 Z" fill={tone} />
        <ellipse cx={-1} cy={-4} rx={6.4} ry={4.6} fill={tone} />
        <ellipse cx={0.6} cy={-2.6} rx={4} ry={3} fill={breast} />
        <path d="M -5 -5.5 Q -1 -8.5 3 -5 Q -1 -3.5 -5 -5.5 Z" fill="#000000" opacity={0.12} />
        <circle cx={4.6} cy={-8} r={3.4} fill={tone} />
        <circle cx={5.8} cy={-8.6} r={0.85} fill="#1f2a1c" />
        <path d="M 7.6 -8.4 L 10.2 -7.6 L 7.6 -6.8 Z" fill="#e8a33c" />
        <path d="M -1 0.6 L -1.6 3 M 1.6 0.6 L 1.2 3" stroke="#8a6b4a" strokeWidth={0.8} strokeLinecap="round" />
      </g>
    </g>
  )
}
