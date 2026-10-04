import type { ShopItemId } from '../../game/types'

export type ShopTab = 'static' | 'moving' | 'water' | 'care'

export interface ShopTabEntry {
  tab: ShopTab
  label: string
  items: ShopItemId[]
}

export const shopTabs: ShopTabEntry[] = [
  {
    tab: 'static',
    label: 'Furniture',
    items: ['rock', 'cushion', 'cardboardBox', 'flowerBed', 'sapling', 'foodBowl', 'yarnBasket', 'scratchingPost', 'bush', 'picnicBlanket', 'bench', 'lamppost', 'tunnel', 'catTree'],
  },
  { tab: 'moving', label: 'Moving', items: ['pinwheel', 'springToy', 'birdFeeder', 'swing', 'butterflyHouse', 'sprinkler', 'windmill', 'bubbleMachine'] },
  { tab: 'water', label: 'Water', items: ['birdbath', 'pond', 'fountain'] },
  { tab: 'care', label: 'Care', items: ['careFish', 'careMilk', 'toyMouse', 'careYarn', 'careBrush', 'careTreat'] },
]

export const shopItemLabels: Record<string, string> = {
  rock: 'Rock',
  cushion: 'Cushion',
  cardboardBox: 'Box',
  flowerBed: 'Flowers',
  sapling: 'Sapling',
  foodBowl: 'Food bowl',
  yarnBasket: 'Yarn basket',
  scratchingPost: 'Scratching post',
  bush: 'Bush',
  picnicBlanket: 'Picnic blanket',
  bench: 'Bench',
  lamppost: 'Lamp',
  tunnel: 'Tunnel',
  catTree: 'Cat tree',
  pinwheel: 'Pinwheel',
  springToy: 'Spring toy',
  birdFeeder: 'Bird feeder',
  swing: 'Swing',
  butterflyHouse: 'Butterfly house',
  sprinkler: 'Sprinkler',
  windmill: 'Windmill',
  bubbleMachine: 'Bubble machine',
  birdbath: 'Birdbath',
  pond: 'Pond',
  fountain: 'Fountain',
  careFish: 'Fish',
  careMilk: 'Milk',
  toyMouse: 'Toy mouse',
  careYarn: 'Yarn',
  careBrush: 'Brush',
  careTreat: 'Treat',
  collar: 'Collar',
}

export const ghostHeights: Record<string, number> = {
  rock: 34,
  cushion: 28,
  cardboardBox: 62,
  flowerBed: 34,
  tree: 170,
  foodBowl: 22,
  yarnBasket: 44,
  scratchingPost: 84,
  bush: 62,
  picnicBlanket: 18,
  bench: 64,
  lamppost: 210,
  tunnel: 52,
  catTree: 170,
  pinwheel: 84,
  springToy: 64,
  birdFeeder: 136,
  swing: 128,
  butterflyHouse: 112,
  sprinkler: 30,
  windmill: 236,
  bubbleMachine: 66,
  birdbath: 62,
  pond: 30,
  fountain: 112,
}
