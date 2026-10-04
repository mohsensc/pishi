interface FeatherProps {
  angle: number
  size: number
}

const plumes = [
  { color: '#3fa7a0', tilt: -22 },
  { color: '#f08a5d', tilt: 18 },
  { color: '#f2c14e', tilt: 0 },
]

export default function Feather({ angle, size }: FeatherProps) {
  return (
    <g transform={`rotate(${angle}) scale(${size / 30})`}>
      {plumes.map((plume) => (
        <g key={plume.color} transform={`rotate(${plume.tilt})`}>
          <path d="M0 2c-5 5-6.4 13-3.6 22 5.4-4.6 7-13 3.6-22z" fill={plume.color} />
          <path d="M0 2c-.6 7-.8 13-2 20" stroke="rgba(0,0,0,0.18)" strokeWidth={0.8} fill="none" strokeLinecap="round" />
        </g>
      ))}
      <circle cx={0} cy={1} r={2.6} fill="#e5483b" />
    </g>
  )
}
