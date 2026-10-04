const squashSeconds = 0.5

export interface Squash {
  scaleX: number
  scaleY: number
}

export function isSquashing(droppedAt: number | null, time: number): boolean {
  return droppedAt !== null && time - droppedAt >= 0 && time - droppedAt < squashSeconds
}

export function landingSquash(droppedAt: number | null, time: number): Squash {
  if (!isSquashing(droppedAt, time) || droppedAt === null) return { scaleX: 1, scaleY: 1 }
  const age = time - droppedAt
  const wobble = Math.exp(-age * 9) * Math.cos(age * 30)
  return { scaleX: 1 + wobble * 0.07, scaleY: 1 - wobble * 0.11 }
}
