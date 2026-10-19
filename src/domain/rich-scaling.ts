import type {FullStats} from './awakener-source-schema'
import type {ScalingSegment} from './rich-text'
import {fmtNum} from './scaling'

const COMPUTABLE_STATS = new Set(['ATK', 'DEF', 'CON'])

function formatHoverDisplayText(text: string): string {
  return text.replaceAll('{', '').replaceAll('}', '')
}

function parseStatValue(rawValue: string | undefined): number | null {
  if (!rawValue) {
    return null
  }

  const match = /^-?\d+(?:\.\d+)?/.exec(rawValue.trim())
  if (!match) {
    return null
  }

  return Number(match[0])
}

export function computeRichScalingStatValue(
  value: number,
  suffix: string,
  stat: string | null,
  stats: FullStats | null,
): number | null {
  if (suffix !== '%' || !stat || !stats || !COMPUTABLE_STATS.has(stat)) {
    return null
  }

  const statValue = parseStatValue(stats[stat as keyof FullStats])
  if (statValue === null) {
    return null
  }

  return Math.ceil((value / 100) * statValue - 1e-9)
}

export function computeRichScalingStatRange(
  segment: ScalingSegment,
  stats: FullStats | null,
): string | null {
  const first = computeRichScalingStatValue(
    segment.values[0] ?? 0,
    segment.suffix,
    segment.stat,
    stats,
  )
  if (first === null) {
    return null
  }

  if (segment.values.length <= 1) {
    return String(first)
  }

  const last = computeRichScalingStatValue(
    segment.values[segment.values.length - 1] ?? 0,
    segment.suffix,
    segment.stat,
    stats,
  )

  return `${String(first)}~${String(last ?? first)}`
}

export function formatRichScalingRange(segment: ScalingSegment): string {
  if (segment.values.length <= 1) {
    return `${fmtNum(segment.values[0] ?? 0, true)}${segment.suffix}`
  }

  const step = (segment.values[1] ?? 0) - (segment.values[0] ?? 0)
  const isEvenlySpaced =
    step !== 0 &&
    segment.values.every((value, index) => {
      if (index === 0) {
        return true
      }

      return Math.abs(value - (segment.values[index - 1] ?? 0) - step) < 0.001
    })

  if (isEvenlySpaced) {
    const sign = step > 0 ? '+' : ''
    return `${fmtNum(segment.values[0] ?? 0, true)}${segment.suffix} (${sign}${fmtNum(step, true)}${segment.suffix}/Lv)`
  }

  return `${segment.values.map((value) => fmtNum(value, true)).join('/')}${segment.suffix}`
}

export function buildRichScalingHover(segment: ScalingSegment, stats: FullStats | null): string {
  return segment.values
    .map((value, index) => {
      const base = formatHoverDisplayText(
        `Lv${String(index + 1)}: ${fmtNum(value, true)}${segment.suffix}${segment.stat ? ` {${segment.stat}}` : ''}`,
      )
      const computed = computeRichScalingStatValue(value, segment.suffix, segment.stat, stats)
      return computed === null ? base : `${base} = ${String(computed)}`
    })
    .join('\n')
}
