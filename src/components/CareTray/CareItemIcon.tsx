import type { JSX } from 'react'
import type { CareItemKind } from '../../game/types'

interface CareItemIconProps {
  kind: CareItemKind
  size?: number
}

function FishArt() {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 16c4-6.4 13-7.6 18.4 0-5.4 7.6-14.4 6.4-18.4 0z" fill="#86b9da" stroke="#3f6f8f" strokeWidth={1.4} />
      <path d="M22.2 16 28.4 10.6v10.8z" fill="#6aa3c8" stroke="#3f6f8f" strokeWidth={1.4} />
      <path d="M7.2 17.6c3.4 3 9 3.2 12.6 0.2" fill="none" stroke="#dcedf7" strokeWidth={1.6} />
      <path d="M14 11.8c1.6 2.6 1.6 5.8 0 8.4" fill="none" stroke="#3f6f8f" strokeWidth={1} opacity={0.5} />
      <circle cx={8.6} cy={14.8} r={1.3} fill="#1f3442" />
    </g>
  )
}

function MilkArt() {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx={16} cy={20} rx={12.5} ry={5.4} fill="#f4efe6" stroke="#a99f8c" strokeWidth={1.3} />
      <ellipse cx={16} cy={18.6} rx={9.6} ry={3.6} fill="#ffffff" stroke="#6ea3cf" strokeWidth={1.3} />
      <ellipse cx={13.4} cy={17.9} rx={3} ry={0.9} fill="#e8f1f8" />
      <path d="M16 6.4c1.8 2.6 2.8 4.2 2.8 5.6a2.8 2.8 0 0 1-5.6 0c0-1.4 1-3 2.8-5.6z" fill="#ffffff" stroke="#6ea3cf" strokeWidth={1.2} />
    </g>
  )
}

function YarnArt() {
  return (
    <g strokeLinecap="round" fill="none">
      <path d="M22 23.6c3 1.6 5.4 0.6 6.6-1.6" stroke="#b23f33" strokeWidth={1.4} />
      <circle cx={15} cy={15.6} r={10} fill="#e0584a" stroke="#a93a2f" strokeWidth={1.4} />
      <path d="M7 10.6c5 1 10.4 5.4 12.8 13.4" stroke="#f4a093" strokeWidth={1.3} />
      <path d="M9.4 22.6c1.6-5.6 6.4-11 13.4-12.6" stroke="#b23f33" strokeWidth={1.3} />
      <path d="M11 6.6c4.6 2.4 8.4 7.4 9.6 13.6" stroke="#b23f33" strokeWidth={1.1} opacity={0.7} />
      <path d="M5.4 16.6c4.2-0.4 9.4 1.8 13.2 6.6" stroke="#f4a093" strokeWidth={1.1} opacity={0.8} />
    </g>
  )
}

function BrushArt() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round" transform="rotate(-32 16 16)">
      <path d="M16 13V3.6" stroke="#8a5a34" strokeWidth={3.4} />
      <rect x={5.6} y={12.4} width={20.8} height={8} rx={3.6} fill="#c98c55" stroke="#8a5a34" strokeWidth={1.3} />
      <path d="M7.6 14.6h16.8" stroke="#dca46e" strokeWidth={1.4} />
      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
        <path key={index} d={`M${8.2 + index * 2.6} 21.2v4`} stroke="#3b3027" strokeWidth={1.2} />
      ))}
    </g>
  )
}

function TreatArt() {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M16 4.6 19.2 11.6 26.8 12.4 21.2 17.6 22.8 25.2 16 21.4 9.2 25.2 10.8 17.6 5.2 12.4 12.8 11.6z" fill="#f2b233" stroke="#b07a17" strokeWidth={1.4} />
      <circle cx={16} cy={15.4} r={3} fill="#f7d27a" />
      <circle cx={12.8} cy={14} r={0.9} fill="#e0584a" />
      <circle cx={19} cy={17.6} r={0.9} fill="#4a8fc0" />
      <circle cx={16.6} cy={11.4} r={0.8} fill="#6fb07a" />
    </g>
  )
}

const careArt: Record<CareItemKind, () => JSX.Element> = {
  fish: FishArt,
  milk: MilkArt,
  yarn: YarnArt,
  brush: BrushArt,
  treat: TreatArt,
}

export default function CareItemIcon({ kind, size = 28 }: CareItemIconProps) {
  const Art = careArt[kind]
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <Art />
    </svg>
  )
}
