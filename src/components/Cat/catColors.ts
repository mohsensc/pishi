interface RgbColor {
  red: number
  green: number
  blue: number
}

function parseHexColor(color: string): RgbColor | null {
  const hex = color.trim().replace('#', '')
  const expanded = hex.length === 3 ? hex.split('').map((digit) => digit + digit).join('') : hex
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null
  return {
    red: parseInt(expanded.slice(0, 2), 16),
    green: parseInt(expanded.slice(2, 4), 16),
    blue: parseInt(expanded.slice(4, 6), 16),
  }
}

function toHexChannel(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, '0')
}

export function mixColors(color: string, target: string, amount: number): string {
  const source = parseHexColor(color)
  const destination = parseHexColor(target)
  if (!source || !destination) return color
  const blend = (from: number, to: number) => from + (to - from) * amount
  return `#${toHexChannel(blend(source.red, destination.red))}${toHexChannel(blend(source.green, destination.green))}${toHexChannel(blend(source.blue, destination.blue))}`
}

export function darken(color: string, amount: number): string {
  return mixColors(color, '#1a1410', amount)
}

export function lighten(color: string, amount: number): string {
  return mixColors(color, '#ffffff', amount)
}

export function luminance(color: string): number {
  const parsed = parseHexColor(color)
  if (!parsed) return 0.5
  return (0.2126 * parsed.red + 0.7152 * parsed.green + 0.0722 * parsed.blue) / 255
}
