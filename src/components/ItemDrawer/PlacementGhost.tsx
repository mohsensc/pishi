import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { viewportScale } from '../../game/bounds'
import { createPropState, recipeFor } from '../../game/layout'
import { createRandom } from '../../game/random'
import type { PropKind, PropState, Vec } from '../../game/types'
import type { GhostPreview } from '../../hooks/useItemSpawner'
import Prop from '../Props/Prop'
import PriceChip from '../Wallet/PriceChip'
import { ghostHeights } from './itemCatalog'
import styles from './ItemDrawer.module.css'

interface PlacementGhostProps {
  preview: GhostPreview
  price: number
  affordable: boolean
  deniedAt: number
  stage: HTMLElement
}

const ghostSeed = 7331

function ghostPropOf(kind: PropKind, sizeScale: number): PropState {
  return createPropState(`prop-ghost-${kind}`, recipeFor(kind, sizeScale, createRandom(ghostSeed)), { x: 0, y: 0 }, null, 0)
}

function footprintCenter(preview: GhostPreview): Vec {
  return preview.exit ? { x: (preview.position.x + preview.exit.x) / 2, y: preview.position.y } : preview.position
}

export default function PlacementGhost({ preview, price, affordable, deniedAt, stage }: PlacementGhostProps) {
  const sizeScale = viewportScale(stage.clientWidth, stage.clientHeight)
  const baseProp = useMemo(() => ghostPropOf(preview.kind, sizeScale), [preview.kind, sizeScale])
  const prop: PropState = { ...baseProp, position: preview.position, tunnelExit: preview.exit }
  const center = footprintCenter(preview)
  const span = (preview.exit ? Math.abs(preview.exit.x - preview.position.x) + preview.radius * 2 : preview.radius * 2.4) * preview.scale
  const height = (ghostHeights[preview.kind] ?? 60) * preview.scale * Math.max(0.75, sizeScale)
  const valid = preview.valid && affordable
  return createPortal(
    <div className={styles.ghostLayer} data-valid={valid} aria-hidden="true">
      <motion.div
        className={styles.footprint}
        style={{ left: center.x, top: center.y, width: span + 18, height: (span + 18) * 0.38 }}
        animate={{ scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div key={deniedAt} className={styles.ghostArt} initial={{ x: 0 }} animate={deniedAt > 0 ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }} transition={{ duration: 0.32 }}>
        <div className={styles.ghostFloat}>
          <Prop prop={prop} worldHeight={preview.worldHeight} time={0} />
        </div>
      </motion.div>
      <motion.div className={styles.ghostChip} style={{ left: center.x, top: center.y - height - 18 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}>
        <PriceChip price={price} affordable={affordable} />
      </motion.div>
    </div>,
    stage,
  )
}
