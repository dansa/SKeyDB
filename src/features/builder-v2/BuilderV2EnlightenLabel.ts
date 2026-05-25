export function formatBuilderV2EnlightenLabel(level: number | null | undefined): string | null {
  if (!level || level <= 0) {
    return null
  }

  const baseLevel = Math.min(level, 3)
  const overflow = level - baseLevel
  return overflow > 0 ? `E${String(baseLevel)}+${String(overflow)}` : `E${String(baseLevel)}`
}
