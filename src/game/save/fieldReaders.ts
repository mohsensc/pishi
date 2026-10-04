import type { Vec } from '../types'

export type FieldReader<Value> = (raw: unknown) => Value | undefined

export type FieldReaders<Target> = { [Key in keyof Target]?: FieldReader<Target[Key]> }

const colorPattern = /^#[0-9a-f]{3,8}$/i
const idPattern = /^[\w.:-]{1,64}$/

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readNumberIn(minimum: number, maximum: number): FieldReader<number> {
  return (raw) => (typeof raw === 'number' && Number.isFinite(raw) ? Math.min(maximum, Math.max(minimum, raw)) : undefined)
}

export function readIntegerIn(minimum: number, maximum: number): FieldReader<number> {
  const readNumber = readNumberIn(minimum, maximum)
  return (raw) => {
    const value = readNumber(raw)
    return value === undefined ? undefined : Math.round(value)
  }
}

export const readUnit = readNumberIn(0, 1)

export const readCount = readIntegerIn(0, Number.MAX_SAFE_INTEGER)

export const readBoolean: FieldReader<boolean> = (raw) => (typeof raw === 'boolean' ? raw : undefined)

export const readColor: FieldReader<string> = (raw) => (typeof raw === 'string' && colorPattern.test(raw) ? raw : undefined)

export const readId: FieldReader<string> = (raw) => (typeof raw === 'string' && idPattern.test(raw) ? raw : undefined)

export function readText(maxLength: number): FieldReader<string> {
  return (raw) => {
    if (typeof raw !== 'string') return undefined
    const text = raw.normalize('NFC').replace(/\p{Cc}/gu, '').trim().slice(0, maxLength)
    return text.length > 0 ? text : undefined
  }
}

export function readOneOf<Value extends string | number>(values: readonly Value[]): FieldReader<Value> {
  return (raw) => values.find((value) => value === raw)
}

export function readNullable<Value>(reader: FieldReader<Value>): FieldReader<Value | null> {
  return (raw) => (raw === null ? null : reader(raw))
}

export const readVec: FieldReader<Vec> = (raw) => {
  if (!isRecord(raw)) return undefined
  const { x, y } = raw
  return typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined
}

export function readList(raw: unknown, maxLength: number): unknown[] {
  return Array.isArray(raw) ? raw.slice(0, maxLength) : []
}

export function captureFields<Target extends object>(target: Target, readers: FieldReaders<Target>): Record<string, unknown> {
  const captured: Record<string, unknown> = {}
  ;(Object.keys(readers) as (keyof Target & string)[]).forEach((key) => {
    const value = target[key]
    if (value !== undefined) captured[key] = value
  })
  return captured
}

export function restoreFields<Target extends object>(target: Target, raw: unknown, readers: FieldReaders<Target>): Target {
  if (!isRecord(raw)) return target
  ;(Object.keys(readers) as (keyof Target & string)[]).forEach((key) => {
    const reader = readers[key]
    if (!reader || !(key in raw)) return
    const value = reader(raw[key])
    if (value !== undefined) target[key] = value as Target[typeof key]
  })
  return target
}

export function highestSerial(ids: readonly string[], pattern: RegExp): number {
  return ids.reduce((highest, id) => {
    const match = pattern.exec(id)
    return match ? Math.max(highest, Number(match[1]) || 0) : highest
  }, 0)
}
