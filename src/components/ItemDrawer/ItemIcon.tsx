import type { SpawnableItem } from '../../game/types'

interface ItemIconProps {
  item: SpawnableItem
  size?: number
}

const accents = {
  cardboard: '#d9a766',
  wood: '#b98552',
  leaf: '#6fa84a',
  petal: '#ef8fa6',
  yarn: '#e0736a',
  kibble: '#c98b4a',
  cushion: '#e39a7f',
  stone: '#a7a39a',
  felt: '#d6ea3a',
  mouse: '#9b9ba6',
}

function ItemPaths({ item }: { item: SpawnableItem }) {
  switch (item.kind) {
    case 'cushion':
      return (
        <>
          <path d="M3.5 14.5c0-3.6 3.8-6 8.5-6s8.5 2.4 8.5 6-3.8 5-8.5 5-8.5-1.4-8.5-5z" fill={accents.cushion} />
          <path d="M8 12.5c1.2.6 2.5.9 4 .9s2.8-.3 4-.9" />
        </>
      )
    case 'cardboardBox':
      return (
        <>
          <path d="M4 9.5h16v10H4z" fill={accents.cardboard} />
          <path d="M4 9.5 2 6M20 9.5 22 6M8 9.5 9.5 5.5M16 9.5 14.5 5.5" />
        </>
      )
    case 'catTree':
      return (
        <>
          <path d="M9 21V5M15 21V10" />
          <rect x="5" y="3" width="8" height="3" rx="1" fill={accents.cushion} />
          <rect x="11" y="9" width="8" height="3" rx="1" fill={accents.cushion} />
          <path d="M5 21h14" />
        </>
      )
    case 'scratchingPost':
      return (
        <>
          <path d="M9 4h6v15H9z" fill={accents.wood} />
          <path d="M9 7.5l6 1.5M9 11l6 1.5M9 14.5l6 1.5" />
          <path d="M6 20.5h12" />
        </>
      )
    case 'yarnBasket':
      return (
        <>
          <circle cx="12" cy="9" r="3.6" fill={accents.yarn} />
          <path d="M5 12h14l-1.6 7.5H6.6z" fill={accents.wood} />
          <path d="M7 15.5h10" />
        </>
      )
    case 'foodBowl':
      return (
        <>
          <path d="M8 12.5l1-1.6 1.4 1.2 1.4-1.6 1.4 1.4 1.4-1.3 1.2 1.9" fill={accents.kibble} />
          <path d="M3.5 12.5h17c0 3.6-3.8 6-8.5 6s-8.5-2.4-8.5-6z" fill="#6f9fc4" />
        </>
      )
    case 'bench':
      return (
        <>
          <path d="M3 11.5h18v3H3z" fill={accents.wood} />
          <path d="M4 7.5h16M5 14.5V20M19 14.5V20M5 7.5v4M19 7.5v4" />
        </>
      )
    case 'rock':
      return <path d="M4 18.5c-.6-3.4 1.4-7.4 5-8.8 2.6-1 3.8-3 6.6-2 3.2 1.1 5 5.6 4.4 10.8z" fill={accents.stone} />
    case 'bush':
      return (
        <>
          <path d="M4 18.5c-1.6-3 .4-6.2 3.2-6.2.4-3.2 3.2-5.4 5.8-4.4 2.2-1.4 5.8.2 5.8 3.6 2.2.8 2.8 4.4 1.2 7z" fill={accents.leaf} />
          <path d="M3 18.5h18" />
        </>
      )
    case 'flowerBed':
      return (
        <>
          <path d="M7 19v-6M12 19v-8M17 19v-6" />
          <circle cx="7" cy="11.5" r="2.2" fill={accents.petal} />
          <circle cx="12" cy="8.5" r="2.4" fill="#f1c75b" />
          <circle cx="17" cy="11.5" r="2.2" fill={accents.petal} />
          <path d="M4 19.5h16" />
        </>
      )
    case 'tennis':
      return (
        <>
          <circle cx="12" cy="12" r="7.5" fill={accents.felt} />
          <path d="M6.2 7.4c2.6 2.4 2.6 6.8 0 9.2M17.8 7.4c-2.6 2.4-2.6 6.8 0 9.2" stroke="#fbfbf2" />
        </>
      )
    case 'mouse':
      return (
        <>
          <path d="M4 15.5c0-3.6 3-6.5 7.4-6.5 3.6 0 6.6 2.6 7.6 6.5z" fill={accents.mouse} />
          <circle cx="8.5" cy="9" r="2" fill={accents.mouse} />
          <path d="M19 15.5c1.8 0 2.6 1.2 1.8 2.6-.8 1.3-2.6 1.1-3.8 2.4" />
          <circle cx="6.2" cy="13" r="0.7" fill="currentColor" stroke="none" />
        </>
      )
  }
}

export default function ItemIcon({ item, size = 24 }: ItemIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ItemPaths item={item} />
    </svg>
  )
}
