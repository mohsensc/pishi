import type { ParkSection } from './parkSaveTypes'
import { careSection } from './sections/careSection'
import { catsSection } from './sections/catsSection'
import { propsSection } from './sections/propsSection'
import { toysSection } from './sections/toysSection'
import { worldSection } from './sections/worldSection'
import { economySection } from './sections/economySection'
import { landscapeSection } from './sections/landscapeSection'

export const parkSections: readonly ParkSection[] = [worldSection, propsSection, catsSection, toysSection, careSection, landscapeSection, economySection]
