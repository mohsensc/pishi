import TennisBallGraphic from '../../TennisBall/TennisBallGraphic'

type MouthItemKind = 'ball' | 'treat' | 'feather'

export interface MouthItemSpec {
  kind: MouthItemKind
  size: number
}

function FishTreat({ size }: { size: number }) {
  const half = size / 2
  return (
    <g>
      <path
        d={`M ${-half} 0 Q ${-half * 0.1} ${-half * 0.62} ${half * 0.55} 0 Q ${-half * 0.1} ${half * 0.62} ${-half} 0 Z`}
        fill="#d98a3d"
        stroke="#a85f22"
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      <path d={`M ${half * 0.45} 0 L ${half} ${-half * 0.42} L ${half} ${half * 0.42} Z`} fill="#c7772f" stroke="#a85f22" strokeWidth={0.7} strokeLinejoin="round" />
      <circle cx={-half * 0.55} cy={-half * 0.08} r={size * 0.05} fill="#3b2412" />
      <path d={`M ${-half * 0.15} ${-half * 0.25} q ${half * 0.12} ${half * 0.25} 0 ${half * 0.5}`} fill="none" stroke="#f3c48c" strokeWidth={0.7} strokeLinecap="round" />
    </g>
  )
}

function Feather({ size }: { size: number }) {
  const span = size
  return (
    <g transform="rotate(-18)">
      <path
        d={`M 0 0 C ${span * 0.25} ${-span * 0.32} ${span * 0.8} ${-span * 0.34} ${span * 1.15} ${-span * 0.12} C ${span * 0.8} ${span * 0.08} ${span * 0.3} ${span * 0.16} 0 0 Z`}
        fill="#4fb3a5"
      />
      <path
        d={`M ${span * 0.55} ${-span * 0.2} C ${span * 0.75} ${-span * 0.3} ${span * 0.95} ${-span * 0.26} ${span * 1.15} ${-span * 0.12} C ${span * 0.95} ${-span * 0.04} ${span * 0.72} ${-span * 0.04} ${span * 0.55} ${-span * 0.2} Z`}
        fill="#f0a640"
      />
      <path d={`M ${-span * 0.1} ${span * 0.04} Q ${span * 0.5} ${-span * 0.14} ${span * 1.1} ${-span * 0.12}`} fill="none" stroke="#f7f3e6" strokeWidth={0.8} strokeLinecap="round" />
    </g>
  )
}

export default function MouthItem({ kind, size }: MouthItemSpec) {
  if (kind === 'ball') return <TennisBallGraphic size={size} spin={0.6} />
  if (kind === 'treat') return <FishTreat size={size} />
  return <Feather size={size} />
}
