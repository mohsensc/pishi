import type { CatCoat } from '../../../game/types'
import CatTail from '../CatTail'

interface DanglingTailProps {
  coat: CatCoat
  size: number
  clock: number
}

export default function DanglingTail({ coat, size, clock }: DanglingTailProps) {
  const units = size / 42
  const sway = Math.sin(clock * 1.6) * 16
  const flick = Math.sin(clock * 3.3 + 1) * 28
  const fluffy = coat.fluffiness > 0.4
  const tipColor = coat.pattern === 'spotted' ? coat.spotColor : coat.tailTip ? coat.patchColor : null
  const ringColor = coat.breed === 'egyptianMau' ? coat.spotColor : null
  return (
    <g transform={`scale(${units})`}>
      <CatTail
        base={{ x: 0, y: 0 }}
        angle={-90 + sway}
        curl={flick}
        length={42}
        width={5 + coat.fluffiness * 4}
        puff={0}
        color={coat.baseColor}
        tipColor={tipColor}
        ringColor={ringColor}
        fluffy={fluffy}
      />
    </g>
  )
}
