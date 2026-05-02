const MAX_WHEEL_ENHANCE_LEVEL = 15

export function clampWheelEnhanceLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return 0
  }

  return Math.min(MAX_WHEEL_ENHANCE_LEVEL, Math.max(0, Math.floor(level)))
}

export function resolveWheelDescriptionRank(enhanceLevel: number): number {
  return resolveWheelDescriptionFormulaLevel(enhanceLevel) + 1
}

export function resolveWheelDescriptionFormulaLevel(enhanceLevel: number): number {
  const normalizedLevel = clampWheelEnhanceLevel(enhanceLevel)

  if (normalizedLevel === 0) {
    return 0
  }
  if (normalizedLevel === 1) {
    return 1
  }
  if (normalizedLevel === 2) {
    return 2
  }

  return 3
}

export function getWheelEnhanceDiamondCount(enhanceLevel: number): number {
  return Math.min(3, clampWheelEnhanceLevel(enhanceLevel))
}

export function getWheelEnhancePlusLevel(enhanceLevel: number): number {
  return Math.max(0, clampWheelEnhanceLevel(enhanceLevel) - 3)
}

export function formatWheelEnhanceLevelLabel(enhanceLevel: number): string {
  const normalizedLevel = clampWheelEnhanceLevel(enhanceLevel)
  const plusLevel = getWheelEnhancePlusLevel(normalizedLevel)

  return normalizedLevel <= 3 ? `E${String(normalizedLevel)}` : `E3 + ${String(plusLevel)}`
}
