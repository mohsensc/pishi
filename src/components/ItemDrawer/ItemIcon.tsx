import type { ReactElement } from 'react'
import type { ShopItemId } from '../../game/types'
import CareItemIcon from '../CareTray/CareItemIcon'

interface ItemIconProps {
  id: ShopItemId
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
  mouse: '#9b9ba6',
  water: '#8cc7d8',
  deepWater: '#5fa9c0',
  sun: '#f1c75b',
  iron: '#4a5646',
  plaid: '#e77c6b',
  sky: '#b9dcef',
}

const iconPaths: Partial<Record<ShopItemId, ReactElement>> = {
  cushion: (
    <>
      <path d="M3.5 14.5c0-3.6 3.8-6 8.5-6s8.5 2.4 8.5 6-3.8 5-8.5 5-8.5-1.4-8.5-5z" fill={accents.cushion} />
      <path d="M8 12.5c1.2.6 2.5.9 4 .9s2.8-.3 4-.9" />
    </>
  ),
  cardboardBox: (
    <>
      <path d="M4 9.5h16v10H4z" fill={accents.cardboard} />
      <path d="M4 9.5 2 6M20 9.5 22 6M8 9.5 9.5 5.5M16 9.5 14.5 5.5" />
    </>
  ),
  catTree: (
    <>
      <path d="M9 21V5M15 21V10" />
      <rect x="5" y="3" width="8" height="3" rx="1" fill={accents.cushion} />
      <rect x="11" y="9" width="8" height="3" rx="1" fill={accents.cushion} />
      <path d="M5 21h14" />
    </>
  ),
  scratchingPost: (
    <>
      <path d="M9 4h6v15H9z" fill={accents.wood} />
      <path d="M9 7.5l6 1.5M9 11l6 1.5M9 14.5l6 1.5" />
      <path d="M6 20.5h12" />
    </>
  ),
  yarnBasket: (
    <>
      <circle cx="12" cy="9" r="3.6" fill={accents.yarn} />
      <path d="M5 12h14l-1.6 7.5H6.6z" fill={accents.wood} />
      <path d="M7 15.5h10" />
    </>
  ),
  foodBowl: (
    <>
      <path d="M8 12.5l1-1.6 1.4 1.2 1.4-1.6 1.4 1.4 1.4-1.3 1.2 1.9" fill={accents.kibble} />
      <path d="M3.5 12.5h17c0 3.6-3.8 6-8.5 6s-8.5-2.4-8.5-6z" fill="#6f9fc4" />
    </>
  ),
  bench: (
    <>
      <path d="M3 11.5h18v3H3z" fill={accents.wood} />
      <path d="M4 7.5h16M5 14.5V20M19 14.5V20M5 7.5v4M19 7.5v4" />
    </>
  ),
  rock: <path d="M4 18.5c-.6-3.4 1.4-7.4 5-8.8 2.6-1 3.8-3 6.6-2 3.2 1.1 5 5.6 4.4 10.8z" fill={accents.stone} />,
  bush: (
    <>
      <path d="M4 18.5c-1.6-3 .4-6.2 3.2-6.2.4-3.2 3.2-5.4 5.8-4.4 2.2-1.4 5.8.2 5.8 3.6 2.2.8 2.8 4.4 1.2 7z" fill={accents.leaf} />
      <path d="M3 18.5h18" />
    </>
  ),
  flowerBed: (
    <>
      <path d="M7 19v-6M12 19v-8M17 19v-6" />
      <circle cx="7" cy="11.5" r="2.2" fill={accents.petal} />
      <circle cx="12" cy="8.5" r="2.4" fill={accents.sun} />
      <circle cx="17" cy="11.5" r="2.2" fill={accents.petal} />
      <path d="M4 19.5h16" />
    </>
  ),
  sapling: (
    <>
      <path d="M12 20v-8" />
      <path d="M12 13c-3.6.2-6-2-6-5.4 3.4-.2 5.8 1.8 6 5.4z" fill={accents.leaf} />
      <path d="M12 11c.2-3.4 2.4-5.6 6-5.6 0 3.4-2.4 5.6-6 5.6z" fill="#8fc463" />
      <path d="M7 20.5h10" />
    </>
  ),
  picnicBlanket: (
    <>
      <path d="M2.5 15.5 7 9.5h14.5L17 15.5z" fill={accents.plaid} />
      <path d="M7 15.5l4.5-6M12 15.5l4.5-6M4.8 12.5h14.6" stroke="#fbeee6" />
    </>
  ),
  lamppost: (
    <>
      <path d="M12 9v11M9 20.5h6" />
      <path d="M9.5 4h5l-1 5h-3z" fill={accents.sun} />
      <path d="M8.5 4h7" />
    </>
  ),
  tunnel: (
    <>
      <path d="M4 9h14v8H4z" fill="#e0614f" />
      <ellipse cx="18" cy="13" rx="2.5" ry="4" fill="#7b2f25" />
      <path d="M8 9v8M12 9v8" stroke="#f3a596" />
    </>
  ),
  pond: (
    <>
      <ellipse cx="12" cy="14" rx="9" ry="5" fill={accents.water} />
      <path d="M8 14c1.2-.8 2.6-.8 3.8 0M13 16c.8-.5 1.8-.5 2.6 0" stroke="#e9f7f8" />
      <path d="M17.5 10V5M19 10V6.5" stroke="#5c8f3f" />
    </>
  ),
  fountain: (
    <>
      <path d="M3.5 16h17c0 2.4-3.8 3.6-8.5 3.6S3.5 18.4 3.5 16z" fill={accents.stone} />
      <ellipse cx="12" cy="16" rx="8.5" ry="2.4" fill={accents.water} />
      <path d="M12 16V8" />
      <path d="M12 8c-2.6-3-5-2.6-6.4.4M12 8c2.6-3 5-2.6 6.4.4" stroke={accents.deepWater} />
      <circle cx="12" cy="5.2" r="1.3" fill={accents.water} stroke="none" />
    </>
  ),
  birdbath: (
    <>
      <path d="M4.5 9.5h15c0 2.4-3.4 3.6-7.5 3.6s-7.5-1.2-7.5-3.6z" fill={accents.stone} />
      <path d="M10.5 13v6h3v-6M8 20.5h8" />
      <ellipse cx="12" cy="9.5" rx="6.5" ry="1.6" fill={accents.water} stroke="none" />
      <path d="M15 7.5c.8-1.6 2.4-1.8 3.2-.8" />
    </>
  ),
  pinwheel: (
    <>
      <path d="M12 12v9" />
      <path d="M12 12 12 4.5a3.8 3.8 0 0 1 3.8 3.8z" fill="#ef8f7a" />
      <path d="M12 12h7.5a3.8 3.8 0 0 1-3.8 3.8z" fill={accents.sun} />
      <path d="M12 12v7.5a3.8 3.8 0 0 1-3.8-3.8z" fill="#7fbfd6" />
      <path d="M12 12H4.5a3.8 3.8 0 0 1 3.8-3.8z" fill="#9cc96b" />
    </>
  ),
  springToy: (
    <>
      <path d="M8 20.5h8" />
      <path d="M12 20c-2.4-.4-2.4-1.6 0-2s2.4-1.6 0-2-2.4-1.6 0-2 2.4-1.6 0-2" />
      <circle cx="12" cy="7.5" r="3.4" fill="#e3c14a" />
      <path d="M10.8 4.4c.4-1.4 1.6-2 2.8-1.6" />
    </>
  ),
  birdFeeder: (
    <>
      <path d="M12 2.5v3" />
      <path d="M6 9l6-3.5L18 9z" fill={accents.wood} />
      <path d="M8 9h8v7H8z" fill="#f2e3c4" />
      <path d="M6.5 16h11" />
      <circle cx="16.5" cy="13.4" r="1.9" fill="#c9704f" stroke="none" />
      <path d="M12 16v5" />
    </>
  ),
  swing: (
    <>
      <path d="M3.5 21 7 3.5h10L20.5 21" />
      <path d="M9.5 3.5v11M14.5 3.5v11" />
      <path d="M8.5 14.5h7v2h-7z" fill={accents.wood} />
    </>
  ),
  butterflyHouse: (
    <>
      <path d="M6.5 9.5 12 4l5.5 5.5" fill={accents.plaid} />
      <path d="M7.5 9.5h9v8h-9z" fill="#f0c58e" />
      <path d="M10 11.5v4M12 11.5v4M14 11.5v4" stroke="#8a5a36" />
      <path d="M12 17.5v3.5" />
      <path d="M18.6 5.4c1.2-1.4 2.8-.6 2.2.8-.4 1-1.6 1-2.2.4.4 1-.4 2-1.4 1.6-1-.6-.4-2.2 1.4-2.8z" fill="#7fbfd6" stroke="none" />
    </>
  ),
  sprinkler: (
    <>
      <path d="M9 19h6l-1-3h-4z" fill="#e0614f" />
      <path d="M12 16v-2" />
      <path d="M12 14c-3-4-6.4-4.6-8.4-3.4M12 14c3-4 6.4-4.6 8.4-3.4M12 14c0-4 0-6.6 0-8" stroke={accents.deepWater} strokeDasharray="1.4 1.8" />
    </>
  ),
  windmill: (
    <>
      <path d="M9.5 21 10.6 11h2.8l1.1 10z" fill="#f2e3c4" />
      <path d="M12 9.5 6 3.5M12 9.5l6-6M12 9.5l-6 6M12 9.5l6 6" stroke={accents.wood} strokeWidth="2.2" />
      <circle cx="12" cy="9.5" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  bubbleMachine: (
    <>
      <rect x="6" y="13" width="10" height="7" rx="2" fill="#7fbfd6" />
      <path d="M16 15.5h3" />
      <circle cx="18.5" cy="9" r="2.4" fill={accents.sky} />
      <circle cx="14" cy="6.2" r="1.7" fill={accents.sky} />
      <circle cx="20" cy="4" r="1.2" fill={accents.sky} />
    </>
  ),
  toyMouse: (
    <>
      <path d="M4 15.5c0-3.6 3-6.5 7.4-6.5 3.6 0 6.6 2.6 7.6 6.5z" fill={accents.mouse} />
      <circle cx="8.5" cy="9" r="2" fill={accents.mouse} />
      <path d="M19 15.5c1.8 0 2.6 1.2 1.8 2.6-.8 1.3-2.6 1.1-3.8 2.4" />
      <circle cx="6.2" cy="13" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
}

const careKinds = {
  careFish: 'fish',
  careMilk: 'milk',
  careYarn: 'yarn',
  careBrush: 'brush',
  careTreat: 'treat',
  collar: 'collar',
} as const

function isCareIcon(id: ShopItemId): id is keyof typeof careKinds {
  return id in careKinds
}

export default function ItemIcon({ id, size = 24 }: ItemIconProps) {
  if (isCareIcon(id)) return <CareItemIcon kind={careKinds[id]} size={size + 2} />
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[id]}
    </svg>
  )
}
