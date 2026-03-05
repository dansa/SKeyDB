import type { AwakenerFullStats } from './awakeners-full'

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
  return `${first}~${last}`
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
    if (computed !== null) return `${fv}${suffix} ${stat} = ${computed}`
    return `${fv}${suffix}${stat ? ` ${stat}` : ''}`
  }
  const lines = values.map((v, i) => {
    const fv = fmtNum(v)
    const computed = computeStatValue(v, suffix, stat, stats)
    const base = `Lv${i + 1}: ${fv}${suffix}`
    return computed !== null ? `${base} = ${computed}` : base
  })
  return lines.join('\n')
}

export function formatScalingRange(values: number[], suffix: string): string {
  if (values.length <= 1) return `${fmtNum(values[0] ?? 0)}${suffix}`

  const step = values[1] - values[0]
  const isEvenlySpaced = step !== 0 && values.every((v, i) => {
    if (i === 0) return true
    return Math.abs((v - values[i - 1]) - step) < 0.001
  })

  if (isEvenlySpaced) {
    const sign = step > 0 ? '+' : ''
    return `${fmtNum(values[0])}${suffix} (${sign}${fmtNum(step)}${suffix}/Lv)`
  }

  return values.map((v) => fmtNum(v)).join('/') + suffix
}
