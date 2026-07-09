import type {FullStats} from '@/domain/awakener-source-schema'
import type {PublicDescriptionArg} from '@/domain/public-description-args'
import {
  buildRichScalingHover,
  computeRichScalingStatRange,
  computeRichScalingStatValue,
  formatRichScalingRange,
} from '@/domain/rich-scaling'
import type {ScalingSegment} from '@/domain/rich-text'
import {fmtNum} from '@/domain/scaling'

import type {RichSegmentRendererVariant} from './RichSegmentRenderer'
import {InteractiveToken, type ActivationEvent} from './RichSegmentTokens'
import {
  DATABASE_INHERIT_FONT_SIZE_CLASS,
  DATABASE_POPOVER_INTERACTIVE_SCALING_TOKEN_CLASS,
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
  onScalingClick?: (
    values: number[],
    suffix: string,
    stat: string | null,
    event: ActivationEvent,
    formulas?: string[],
    currentLevel?: number,
    finalValues?: number[],
    abstractFormula?: string,
    scalingArg?: PublicDescriptionArg,
    sourceRecordId?: string,
    sourceArgKey?: string,
  ) => void
}
export function RichScalingSegment({
  segment,
  skillLevel,
  stats,
  showVisibleScaling,
  variant,
  onScalingClick,
}: RichScalingSegmentProps) {
  const handleActivate = (event: ActivationEvent) => {
    onScalingClick?.(segment.values, segment.suffix, segment.stat, event)
    onScalingClick?.(segment.values, segment.suffix, segment.stat, event, undefined, skillLevel)
  }
  if (variant === 'popover') {
    const display = formatRichScalingRange(segment)
    const computed = computeRichScalingStatRange(segment, stats)
    const hoverText = buildRichScalingHover(segment, stats)
    if (computed) {
      const content = (
        <>
          <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS}>{computed}</span>
          {showVisibleScaling ? (
            <span className='text-[0.85em] text-slate-500'>
              {' '}
              ({display}
              {segment.stat ? ` ${segment.stat}` : ''})
            </span>
          ) : null}
        </>
      )
      if (onScalingClick) {
        return (
          <InteractiveToken
            ariaLabel={hoverText || 'Scaling Details'}
            className={`${DATABASE_POPOVER_INTERACTIVE_SCALING_TOKEN_CLASS} ${DATABASE_INHERIT_FONT_SIZE_CLASS} inline`}
            onActivate={handleActivate}
            title={hoverText}
          >
            {content}
          </InteractiveToken>
        )
      }
      return <span title={hoverText}>{content}</span>
    }
    const content = (
      <>
        {display}
        {segment.stat ? (
          <>
            {' '}
            <span className={DATABASE_POPOVER_STAT_TOKEN_CLASS}>{segment.stat}</span>
          </>
        ) : null}
      </>
    )
    if (onScalingClick) {
      return (
        <InteractiveToken
          ariaLabel={hoverText || 'Scaling Details'}
          className={`${DATABASE_POPOVER_INTERACTIVE_SCALING_TOKEN_CLASS} ${DATABASE_INHERIT_FONT_SIZE_CLASS} inline`}
          onActivate={handleActivate}
          title={hoverText}
        >
          {content}
        </InteractiveToken>
      )
    }
    return (
      <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS} title={hoverText}>
        {content}
      </span>
    )
  }
  const idx = Math.max(0, Math.min(skillLevel - 1, segment.values.length - 1))
  const value = segment.values[idx]
  const displayValue = fmtNum(value)
  const computed = computeRichScalingStatValue(value, segment.suffix, segment.stat, stats)
  const hoverText = buildRichScalingHover(segment, stats)
  if (computed !== null) {
    const content = (
      <>
        <span className={DATABASE_SCALING_TOKEN_CLASS}>{computed}</span>
        {showVisibleScaling ? (
          <span className='text-[0.85em] text-slate-500 no-underline'>
            {' '}
            ({displayValue}
            {segment.suffix}
            {segment.stat ? ` ${segment.stat}` : ''})
          </span>
        ) : null}
      </>
    )
    if (onScalingClick) {
      return (
        <InteractiveToken
          ariaLabel={hoverText || 'Scaling Details'}
          className={`${DATABASE_SCALING_GROUP_CLASS} ${DATABASE_INHERIT_FONT_SIZE_CLASS} inline`}
          onActivate={handleActivate}
          title={hoverText}
        >
          {content}
        </InteractiveToken>
      )
    }
    return (
      <span className={DATABASE_SCALING_GROUP_CLASS} title={hoverText}>
        {content}
      </span>
    )
  }
  const content = (
    <>
      {displayValue}
      {segment.suffix}
      {segment.stat ? (
        <>
          {' '}
          <span className={DATABASE_STAT_TOKEN_CLASS}>{segment.stat}</span>
        </>
      ) : null}
    </>
  )
  if (onScalingClick) {
    return (
      <InteractiveToken
        ariaLabel={hoverText || 'Scaling Details'}
        className={`${DATABASE_SCALING_TOKEN_CLASS} ${DATABASE_INHERIT_FONT_SIZE_CLASS} inline`}
        onActivate={handleActivate}
        title={hoverText}
      >
        {content}
      </InteractiveToken>
    )
  }
  return (
    <span className={DATABASE_SCALING_TOKEN_CLASS} title={hoverText}>
      {content}
    </span>
  )
}
