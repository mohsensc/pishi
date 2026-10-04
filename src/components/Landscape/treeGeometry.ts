type CanopyBlob = [number, number, number]

export const canopyBlobs: CanopyBlob[] = [
  [-1.25, -0.1, 1.05],
  [1.2, -0.05, 1.05],
  [-0.55, -0.75, 1.15],
  [0.6, -0.8, 1.1],
  [0, -0.2, 1.3],
  [-0.1, -1.25, 0.95],
  [-1.5, 0.45, 0.7],
  [1.45, 0.5, 0.72],
  [0, 0.55, 0.85],
]

export interface TreeGeometry {
  trunkRadius: number
  trunkWidth: number
  trunkHeight: number
  canopyUnit: number
  canopyCenterY: number
  canopyBottomY: number
  mirror: 1 | -1
}

export function treeGeometry(radius: number, variant: number): TreeGeometry {
  const trunkHeight = radius * 4.4
  const canopyUnit = radius * 1.55
  const canopyCenterY = -trunkHeight - canopyUnit * 0.9
  return {
    trunkRadius: radius,
    trunkWidth: radius * 0.8,
    trunkHeight,
    canopyUnit,
    canopyCenterY,
    canopyBottomY: canopyCenterY + canopyUnit * 0.95,
    mirror: variant % 2 === 0 ? 1 : -1,
  }
}
