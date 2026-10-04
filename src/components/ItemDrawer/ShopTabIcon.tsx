import type { ReactElement } from 'react'
import type { ShopTab } from './itemCatalog'

const tabPaths: Record<ShopTab, ReactElement> = {
  static: (
    <>
      <path d="M4 12.5h16v3H4z" />
      <path d="M5 8.5h14M6 15.5V20M18 15.5V20M6 8.5v4M18 8.5v4" />
    </>
  ),
  moving: (
    <>
      <path d="M12 12v8.5" />
      <path d="M12 12V5a3.5 3.5 0 0 1 3.5 3.5zM12 12h7a3.5 3.5 0 0 1-3.5 3.5zM12 12H5a3.5 3.5 0 0 1 3.5-3.5z" />
    </>
  ),
  water: <path d="M12 4c3.4 4.4 5.4 7.4 5.4 10a5.4 5.4 0 0 1-10.8 0c0-2.6 2-5.6 5.4-10z" />,
  care: <path d="M12 19.5s-7-4.3-7-9.3A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.2c0 5-7 9.3-7 9.3z" />,
}

export default function ShopTabIcon({ tab }: { tab: ShopTab }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tabPaths[tab]}
    </svg>
  )
}
