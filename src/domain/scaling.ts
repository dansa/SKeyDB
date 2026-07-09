import type {FullStats} from './awakener-source-schema'

export const COMPUTABLE_STATS = new Set(['ATK', 'DEF', 'CON'])
export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
export function computeStatValue(
  pct: number,
  suffix: string,
  stat: string | null,
  stats: FullStats | null,
): number | null {
  if (suffix !== '%' || !stat || !stats || !COMPUTABLE_STATS.has(stat)) return null
  const base = parseFloat(stats[stat as keyof FullStats])
  if (Number.isNaN(base)) return null
  return Math.ceil((pct / 100) * base - 1e-9)
}
