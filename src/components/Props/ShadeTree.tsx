import { useState, type CSSProperties, type ReactNode } from 'react'
import DanglingTail from '../Cat/hints/DanglingTail'
import { TreeCanopy, TreeShade, TreeTrunk } from '../Landscape/TreeArt'
import { treeGeometry } from '../Landscape/treeGeometry'
import { useTreeHighlight } from '../Landscape/treeHighlights'
import landscapeStyles from '../Landscape/Landscape.module.css'
import { CANOPY_DEPTH_OFFSET } from '../../game/layoutOcclusion'
import PropAnchor from './PropAnchor'
import styles from './Props.module.css'
import reactions from './Reactions.module.css'
import { groundZIndex, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const saplingGrowSeconds = 60

function saplingAge(spawnedAt: number | null, time: number): number | null {
  if (spawnedAt === null) return null
  const age = time - spawnedAt
  return age >= 0 && age < saplingGrowSeconds ? age : null
}

function Growth({ age, children }: { age: number | null; children: ReactNode }) {
  if (age === null) return <>{children}</>
  const timing: CSSProperties = { animationDelay: `${-age}s` }
  return (
    <g className={landscapeStyles.saplingGrow} style={timing}>
      <g className={landscapeStyles.saplingSway} style={timing}>
        {children}
      </g>
    </g>
  )
}

export default function ShadeTree({ prop, x, y, scale, zIndex, time, occupantCoats }: PropViewProps) {
  const geometry = treeGeometry(prop.radius, prop.variant)
  const { trunkHeight, canopyUnit, canopyBottomY, mirror } = geometry
  const reaction = pokeReactionOf(prop)
  const hiddenCoats = occupantCoats ?? []
  const highlight = useTreeHighlight(prop.id)
  const hovered = highlight === 'hovered' || highlight === 'hoveredFaded'
  const faded = highlight === 'faded' || highlight === 'hoveredFaded'
  const [growthAge] = useState(() => saplingAge(prop.spawnedAt, time))

  return (
    <>
      <PropAnchor x={x} y={y} zIndex={groundZIndex.treeShade} scale={scale} className={styles.passive}>
        <Growth age={growthAge}>
          <TreeShade geometry={geometry} />
        </Growth>
      </PropAnchor>
      <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
        <Growth age={growthAge}>
          <g className={landscapeStyles.lean} data-hovered={hovered}>
            <g key={reaction.key} className={reactionClass(reaction, reactions.trunkShake)} style={{ transformOrigin: '0px 0px' }}>
              <TreeTrunk geometry={geometry} />
            </g>
          </g>
        </Growth>
      </PropAnchor>
      <PropAnchor x={x} y={y} zIndex={zIndex + CANOPY_DEPTH_OFFSET} scale={scale}>
        <Growth age={growthAge}>
          <g className={landscapeStyles.lean} data-hovered={hovered}>
            <g className={landscapeStyles.canopyFade} data-faded={faded}>
              <g key={reaction.key} className={reactionClass(reaction, reactions.canopyShake)} style={{ transformOrigin: `0px ${-trunkHeight}px` }}>
                <g className={hiddenCoats.length > 0 ? reactions.canopyRustle : undefined}>
                  {hiddenCoats.map((coat, index) => (
                    <g key={`tail${index}`} transform={`translate(${(index === 0 ? -0.95 : 1.05) * canopyUnit * mirror} ${canopyBottomY - canopyUnit * 0.1})`}>
                      <DanglingTail coat={coat} size={canopyUnit * 0.9} clock={time + index * 1.7} />
                    </g>
                  ))}
                  <TreeCanopy geometry={geometry} variant={prop.variant} className={styles.sway} />
                </g>
              </g>
            </g>
          </g>
        </Growth>
      </PropAnchor>
    </>
  )
}
