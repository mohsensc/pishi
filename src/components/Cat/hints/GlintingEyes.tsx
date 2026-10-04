import type { CatCoat } from '../../../game/types'
import { lighten } from '../catColors'
import styles from './hints.module.css'

interface GlintingEyesProps {
  coat: CatCoat
  size: number
}

export default function GlintingEyes({ coat, size }: GlintingEyesProps) {
  const gap = size * 0.2
  const eyeRadiusX = size * 0.09
  const eyeRadiusY = size * (coat.breed === 'persian' ? 0.085 : 0.1)
  const glow = lighten(coat.eyeColor, 0.35)
  const eye = (x: number) => (
    <g key={x}>
      <ellipse cx={x} cy={0} rx={eyeRadiusX * 1.9} ry={eyeRadiusY * 1.7} fill={glow} opacity={0.22} />
      <ellipse cx={x} cy={0} rx={eyeRadiusX} ry={eyeRadiusY} fill={coat.eyeColor} />
      <ellipse cx={x} cy={0} rx={eyeRadiusX * 0.28} ry={eyeRadiusY * 0.86} fill="#15110f" />
      <circle cx={x - eyeRadiusX * 0.35} cy={-eyeRadiusY * 0.4} r={eyeRadiusX * 0.28} fill="#ffffff" />
    </g>
  )
  return (
    <g className={styles.glintingEyes}>
      <ellipse cx={0} cy={0} rx={gap + eyeRadiusX * 2.6} ry={eyeRadiusY * 2.2} fill="#16240f" opacity={0.35} />
      <g className={styles.blink}>
        {eye(-gap)}
        {eye(gap)}
      </g>
    </g>
  )
}
