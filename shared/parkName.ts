export interface ParkOwner {
  first: string
  last: string
}

export const MAX_NAME_PART_LENGTH = 40

const namePartPattern = /^[\p{L}\p{M}](?:[\p{L}\p{M}'’. -]*[\p{L}\p{M}.])?$/u
const fullNamePattern = /^[\p{L}\p{M}'’. -]+$/u

export function tidyNamePart(part: string): string {
  return part.normalize('NFC').trim().replace(/\s+/g, ' ')
}

export function isValidNamePart(part: string): boolean {
  const tidy = tidyNamePart(part)
  return tidy.length > 0 && tidy.length <= MAX_NAME_PART_LENGTH && namePartPattern.test(tidy)
}

export function isValidOwner(owner: ParkOwner): boolean {
  return isValidNamePart(owner.first) && isValidNamePart(owner.last)
}

export function tidyOwner(owner: ParkOwner): ParkOwner {
  return { first: tidyNamePart(owner.first), last: tidyNamePart(owner.last) }
}

export function displayNameOf(owner: ParkOwner): string {
  const tidy = tidyOwner(owner)
  return `${tidy.first} ${tidy.last}`
}

export function normalizeParkName(fullName: string): string {
  return tidyNamePart(fullName).toLowerCase()
}

export function parkNameOf(owner: ParkOwner): string {
  return normalizeParkName(displayNameOf(owner))
}

export function parseParkName(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const normalized = normalizeParkName(raw)
  if (normalized.length < 3 || normalized.length > MAX_NAME_PART_LENGTH * 2 + 1) return null
  if (!fullNamePattern.test(normalized) || !normalized.includes(' ')) return null
  return normalized
}
