import { memo } from 'react'
import type { FelledTree } from '../../game/landscape/landscapeTypes'
import FellingTree from './FellingTree'

interface LandscapeEffectsProps {
  felled: readonly FelledTree[]
}

function LandscapeEffects({ felled }: LandscapeEffectsProps) {
  return (
    <>
      {felled.map((tree) => (
        <FellingTree key={tree.id} tree={tree} />
      ))}
    </>
  )
}

export default memo(LandscapeEffects)
