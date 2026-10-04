import { createHash } from 'node:crypto'

const keyNamespace = 'cat-park:v1:'
const keyPattern = /^[0-9a-f]{64}$/

export function parkKeyOf(normalizedName: string): string {
  return createHash('sha256').update(`${keyNamespace}${normalizedName}`).digest('hex')
}

export function isParkKey(key: string): boolean {
  return keyPattern.test(key)
}
