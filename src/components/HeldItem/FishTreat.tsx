interface FishTreatProps {
  size: number
}

const treatBody = '#c9853f'
const treatEdge = '#8a5526'
const treatBelly = '#e6ae6c'

export default function FishTreat({ size }: FishTreatProps) {
  return (
    <g transform={`scale(${size / 24})`}>
      <path d="M-11 0c3.6-5.4 11-6.2 15.6 0-4.6 6.2-12 5.4-15.6 0z" fill={treatBody} stroke={treatEdge} strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M4.6 0 11 -4.4v8.8z" fill={treatBody} stroke={treatEdge} strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M-8 1.2c2.8 2.6 7.4 2.8 10.6 0.2" fill="none" stroke={treatBelly} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M-2.6 -3.4v6.6M0.6 -3.4v6.6" stroke={treatEdge} strokeWidth={0.9} strokeLinecap="round" opacity={0.55} />
      <circle cx={-7} cy={-1.1} r={1.1} fill="#3a2414" />
    </g>
  )
}
