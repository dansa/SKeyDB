export const COMPUTABLE_STATS = new Set(['ATK', 'DEF', 'CON'])

export function fmtNum(n: number, preservePrecision = false): string {
  // Remove arithmetic noise without rounding source coefficients to tenths.
  if (preservePrecision && !Number.isInteger(n)) return String(Number(n.toPrecision(12)))
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
