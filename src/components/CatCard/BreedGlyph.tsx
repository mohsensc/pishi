import type { CatCoat } from '../../game/types'

interface BreedGlyphProps {
  coat: CatCoat
}

function earPaths(breed: CatCoat['breed']): string {
  if (breed === 'persian') return 'M5.5 9.5 6.4 5.2 10 7.6M18.5 9.5 17.6 5.2 14 7.6'
  if (breed === 'egyptianMau') return 'M5 10 5.4 2.6 10.4 6.6M19 10 18.6 2.6 13.6 6.6'
  return 'M5.2 10 5.8 3.8 10.2 6.8M18.8 10 18.2 3.8 13.8 6.8'
}

export default function BreedGlyph({ coat }: BreedGlyphProps) {
  const fluffy = coat.breed === 'persian'
  const outline = 'rgba(32, 48, 31, 0.35)'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d={earPaths(coat.breed)} fill={coat.baseColor} stroke={outline} strokeWidth={1} strokeLinejoin="round" />
      <ellipse cx="12" cy={13.4} rx={fluffy ? 8.4 : 7.4} ry={fluffy ? 7 : 6.6} fill={coat.baseColor} stroke={outline} strokeWidth={1} />
      {coat.pattern === 'tuxedo' && <path d="M8.6 20c.6-2.6 1.8-4 3.4-4s2.8 1.4 3.4 4z" fill={coat.patchColor} />}
      {coat.pattern === 'spotted' && (
        <g fill={coat.spotColor}>
          <circle cx="9" cy="10.4" r="0.9" />
          <circle cx="15" cy="10.4" r="0.9" />
          <circle cx="12" cy="9" r="0.8" />
        </g>
      )}
      {coat.breed === 'munchkin' && <path d="M6.5 19.6h11" stroke={coat.patchColor} strokeWidth={1.2} strokeLinecap="round" />}
      <circle cx="9.3" cy="13" r="1.1" fill={coat.eyeColor} />
      <circle cx="14.7" cy="13" r="1.1" fill={coat.eyeColor} />
    </svg>
  )
}
