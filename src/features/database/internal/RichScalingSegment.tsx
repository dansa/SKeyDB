import type {FullStats} from '@/domain/awakener-source-schema'
import {
  buildRichScalingHover,
  computeRichScalingStatRange,
  computeRichScalingStatValue,
  formatRichScalingRange,
} from '@/domain/rich-scaling'
import type {ScalingSegment} from '@/domain/rich-text'
import {fmtNum} from '@/domain/scaling'

import type {RichSegmentRendererVariant} from './RichSegmentRenderer'
import {
  DATABASE_POPOVER_SCALING_TOKEN_CLASS,
  DATABASE_POPOVER_STAT_TOKEN_CLASS,
  DATABASE_SCALING_GROUP_CLASS,
  DATABASE_SCALING_TOKEN_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
} from './text-styles'

interface RichScalingSegmentProps {
  segment: ScalingSegment
  skillLevel: number
  stats: FullStats | null
  showVisibleScaling: boolean
  variant: RichSegmentRendererVariant
}

export function RichScalingSegment({
  segment,
  skillLevel,
  stats,
  showVisibleScaling,
  variant,
}: RichScalingSegmentProps) {
  if (variant === 'popover') {
    const display = formatRichScalingRange(segment)
    const computed = computeRichScalingStatRange(segment, stats)
    const hoverText = buildRichScalingHover(segment, stats)
    if (computed) {
      return (
        <span title={hoverText}>
          <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS}>{computed}</span>
          {showVisibleScaling ? (
            <span className='text-slate-500'>
              {' '}
              ({display}
              {segment.stat ? ` ${segment.stat}` : ''})
            </span>
          ) : null}
        </span>
      )
    }
    return (
      <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS}>
        {display}
        {segment.stat ? (
          <>
            {' '}
            <span className={DATABASE_POPOVER_STAT_TOKEN_CLASS}>{segment.stat}</span>
          </>
        ) : null}
      </span>
    )
  }

  const idx = Math.max(0, Math.min(skillLevel - 1, segment.values.length - 1))
  const value = segment.values[idx]
  const displayValue = fmtNum(value)
  const computed = computeRichScalingStatValue(value, segment.suffix, segment.stat, stats)
  const hoverText = buildRichScalingHover(segment, stats)

  if (computed !== null) {
    return (
      <span className={DATABASE_SCALING_GROUP_CLASS} title={hoverText}>
        <span className={DATABASE_SCALING_TOKEN_CLASS}>{computed}</span>
        {showVisibleScaling ? (
          <span className='text-slate-500 no-underline'>
            {' '}
            ({displayValue}
            {segment.suffix}
            {segment.stat ? ` ${segment.stat}` : ''})
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <span className={DATABASE_SCALING_TOKEN_CLASS} title={hoverText}>
      {displayValue}
      {segment.suffix}
      {segment.stat ? (
        <>
          {' '}
          <span className={DATABASE_STAT_TOKEN_CLASS}>{segment.stat}</span>
        </>
      ) : null}
    </span>
  )
}
