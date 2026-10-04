export class Spring {
  value = 0
  velocity = 0

  private readonly stiffness: number
  private readonly damping: number

  constructor(stiffness: number, damping: number) {
    this.stiffness = stiffness
    this.damping = damping
  }

  step(target: number, seconds: number): number {
    const steps = Math.max(1, Math.ceil(seconds / (1 / 120)))
    const slice = seconds / steps
    for (let index = 0; index < steps; index += 1) {
      const force = (target - this.value) * this.stiffness - this.velocity * this.damping
      this.velocity += force * slice
      this.value += this.velocity * slice
    }
    return this.value
  }

  kick(impulse: number): void {
    this.velocity += impulse
  }
}

export function clampRange(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function createPulseRandom(seed: number): () => number {
  let state = Math.floor(seed * 2147483646) + 1
  return () => {
    state = (state * 48271) % 2147483647
    return state / 2147483647
  }
}

export function envelope(progress: number): number {
  return progress <= 0 || progress >= 1 ? 0 : Math.sin(progress * Math.PI)
}
