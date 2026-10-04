import type { PropViewProps } from '../Props/propView'
import BirdFeeder from './BirdFeeder'
import Birdbath from './Birdbath'
import BubbleMachine from './BubbleMachine'
import ButterflyHouse from './ButterflyHouse'
import Fountain from './Fountain'
import Pinwheel from './Pinwheel'
import SpringToy from './SpringToy'
import Sprinkler from './Sprinkler'
import Swing from './Swing'
import Windmill from './Windmill'

export default function ShopItemArt(view: PropViewProps) {
  switch (view.prop.kind) {
    case 'fountain':
      return <Fountain {...view} />
    case 'birdbath':
      return <Birdbath {...view} />
    case 'pinwheel':
      return <Pinwheel {...view} />
    case 'springToy':
      return <SpringToy {...view} />
    case 'birdFeeder':
      return <BirdFeeder {...view} />
    case 'swing':
      return <Swing {...view} />
    case 'butterflyHouse':
      return <ButterflyHouse {...view} />
    case 'sprinkler':
      return <Sprinkler {...view} />
    case 'windmill':
      return <Windmill {...view} />
    case 'bubbleMachine':
      return <BubbleMachine {...view} />
    default:
      return null
  }
}
