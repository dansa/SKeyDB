import type {AwakenerFullStats} from './awakeners-full'

export const COMPUTABLE_STATS = new Set(['ATK', 'DEF', 'CON'])

export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function computeStatValue(
  pct: number,
  suffix: string,
  stat: string | null,
  stats: AwakenerFullStats | null,
): number | null {
  if (suffix !== '%' || !stat || !stats || !COMPUTABLE_STATS.has(stat)) return null
  const base = parseInt(stats[stat as keyof AwakenerFullStats], 10)
  if (Number.isNaN(base)) return null
  return Math.round((pct / 100) * base)
}

export function computeStatRange(
  values: number[],
  suffix: string,
  stat: string | null,
  stats: AwakenerFullStats | null,
): string | null {
  const first = computeStatValue(values[0], suffix, stat, stats)
  if (first === null) return null
  if (values.length <= 1) return String(first)
  const last = computeStatValue(values[values.length - 1], suffix, stat, stats)
  return `${String(first)}~${String(last)}`
}

export function buildScalingHover(
  values: number[],
  suffix: string,
  stat: string | null,
  stats: AwakenerFullStats | null,
): string {
  if (values.length <= 1) {
    const v = values[0]
    const fv = fmtNum(v)
    const computed = computeStatValue(v, suffix, stat, stats)
    if (computed !== null) return `${fv}${suffix} ${String(stat)} = ${String(computed)}`
    const statLabel = stat ? ` ${stat}` : ''
    return `${fv}${suffix}${statLabel}`
  }
  const lines = values.map((v, i) => {
    const fv = fmtNum(v)
    const computed = computeStatValue(v, suffix, stat, stats)
    const base = `Lv${String(i + 1)}: ${fv}${suffix}`
    return computed !== null ? `${base} = ${String(computed)}` : base
  })
  return lines.join('\n')
}

export function formatScalingRange(values: number[], suffix: string): string {
  if (values.length <= 1) return `${fmtNum(values[0] ?? 0)}${suffix}`

  return `${fmtNum(values[0])}~${fmtNum(values[values.length - 1])}${suffix}`
}
