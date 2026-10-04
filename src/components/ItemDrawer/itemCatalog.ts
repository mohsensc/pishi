import type { SpawnableItem } from '../../game/types'

export interface DrawerEntry {
  key: string
  item: SpawnableItem
  label: string
}

export const drawerEntries: DrawerEntry[] = [
  { key: 'cushion', item: { category: 'prop', kind: 'cushion' }, label: 'Cushion' },
  { key: 'cardboardBox', item: { category: 'prop', kind: 'cardboardBox' }, label: 'Box' },
  { key: 'catTree', item: { category: 'prop', kind: 'catTree' }, label: 'Cat tree' },
  { key: 'scratchingPost', item: { category: 'prop', kind: 'scratchingPost' }, label: 'Scratching post' },
  { key: 'yarnBasket', item: { category: 'prop', kind: 'yarnBasket' }, label: 'Yarn basket' },
  { key: 'foodBowl', item: { category: 'prop', kind: 'foodBowl' }, label: 'Food bowl' },
  { key: 'bench', item: { category: 'prop', kind: 'bench' }, label: 'Bench' },
  { key: 'rock', item: { category: 'prop', kind: 'rock' }, label: 'Rock' },
  { key: 'bush', item: { category: 'prop', kind: 'bush' }, label: 'Bush' },
  { key: 'flowerBed', item: { category: 'prop', kind: 'flowerBed' }, label: 'Flowers' },
  { key: 'tennis', item: { category: 'toy', kind: 'tennis' }, label: 'Tennis ball' },
  { key: 'mouse', item: { category: 'toy', kind: 'mouse' }, label: 'Toy mouse' },
]
