interface BrushProps {
  tilt: number
  size: number
}

export default function Brush({ tilt, size }: BrushProps) {
  return (
    <g transform={`rotate(${tilt}) scale(${size / 40})`}>
      <path d="M4 -6 22 -30" stroke="#8a5a34" strokeWidth={5} strokeLinecap="round" />
      <rect x={-16} y={-10} width={32} height={11} rx={4} fill="#b77945" />
      <rect x={-16} y={-10} width={32} height={4} rx={2} fill="#c98c55" />
      {Array.from({ length: 9 }, (_, index) => (
        <path key={index} d={`M${-13 + index * 3.25} 1v6`} stroke="#3b3027" strokeWidth={1.4} strokeLinecap="round" />
      ))}
    </g>
  )
}
