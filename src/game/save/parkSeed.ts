import { parkNameOf, type ParkOwner } from '../../../shared/parkName'
import { hashString } from '../random'

export function parkSeedOf(owner: ParkOwner): number {
  return hashString(`park:${parkNameOf(owner)}`)
}
