import type {MouseEvent} from 'react'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import type {RichSegment, ScalingSegment} from '@/domain/rich-text'
import {
  buildScalingHover,
  computeStatRange,
  computeStatValue,
  fmtNum,
  formatScalingRange,
} from '@/domain/scaling'
import {resolveTag, type Tag} from '@/domain/tags'

import {renderTextWithBreaks} from './font-scale'
import {
  DATABASE_INTERACTIVE_TOKEN_CLASS,
  DATABASE_POPOVER_SCALING_TOKEN_CLASS,
  DATABASE_POPOVER_STAT_TOKEN_CLASS,
  DATABASE_SCALING_TOKEN_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
  DATABASE_UNIMPLEMENTED_TOKEN_CLASS,
  getDatabaseRealmTint,
} from './text-styles'

type RichSegmentRendererVariant = 'inline' | 'popover'

interface RichSegmentRendererProps {
  segment: RichSegment
  variant: RichSegmentRendererVariant
  skillLevel: number
  stats: AwakenerFullStats | null
  onSkillClick?: (name: string, event: MouseEvent<HTMLButtonElement>) => void
  onMechanicClick?: (tag: Tag, event: MouseEvent<HTMLButtonElement>) => void
}

interface RichScalingSegmentProps {
  segment: ScalingSegment
  skillLevel: number
  stats: AwakenerFullStats | null
  variant: RichSegmentRendererVariant
}

export function RichSegmentRenderer({
  segment,
  variant,
  skillLevel,
  stats,
  onSkillClick,
  onMechanicClick,
}: RichSegmentRendererProps) {
  switch (segment.type) {
    case 'text':
      return <>{renderTextWithBreaks(segment.value)}</>

    case 'skill':
      if (!onSkillClick) {
        return <span>{segment.name}</span>
      }
      return (
        <button
          className={DATABASE_INTERACTIVE_TOKEN_CLASS}
          onClick={(event) => {
            onSkillClick(segment.name, event)
          }}
          style={{fontSize: 'inherit'}}
          type='button'
        >
          {segment.name}
        </button>
      )

    case 'stat':
      return (
        <span
          className={
            variant === 'popover' ? DATABASE_POPOVER_STAT_TOKEN_CLASS : DATABASE_STAT_TOKEN_CLASS
          }
        >
          {segment.name}
        </span>
      )

    case 'mechanic': {
      const tag = resolveTag(segment.name)
      const desc = tag?.description
      if (tag && desc && onMechanicClick) {
        return (
          <button
            className={DATABASE_INTERACTIVE_TOKEN_CLASS}
            onClick={(event) => {
              onMechanicClick(tag, event)
            }}
            style={{fontSize: 'inherit'}}
            type='button'
          >
            {segment.name}
          </button>
        )
      }
      return (
        <span className={DATABASE_UNIMPLEMENTED_TOKEN_CLASS} title='Details coming soon'>
          {segment.name}
        </span>
      )
    }

    case 'realm':
      return <span style={{color: getDatabaseRealmTint(segment.name)}}>{segment.name}</span>

    case 'scaling':
      return (
        <RichScalingSegment
          segment={segment}
          skillLevel={skillLevel}
          stats={stats}
          variant={variant}
        />
      )
  }
}

function RichScalingSegment({segment, skillLevel, stats, variant}: RichScalingSegmentProps) {
  if (variant === 'popover') {
    const {values, suffix, stat} = segment
    const display = formatScalingRange(values, suffix)
    const computed = computeStatRange(values, suffix, stat, stats)
    if (computed) {
      return (
        <span>
          <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS}>{computed}</span>
          <span className='text-slate-500'>
            {' '}
            ({display}
            {stat ? ` ${stat}` : ''})
          </span>
        </span>
      )
    }
    return (
      <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS}>
        {display}
        {stat ? (
          <>
            {' '}
            <span className={DATABASE_POPOVER_STAT_TOKEN_CLASS}>{stat}</span>
          </>
        ) : null}
      </span>
    )
  }

  const idx = Math.max(0, Math.min(skillLevel - 1, segment.values.length - 1))
  const value = segment.values[idx]
  const displayValue = fmtNum(value)
  const computed = computeStatValue(value, segment.suffix, segment.stat, stats)
  const hoverText = buildScalingHover(segment.values, segment.suffix, segment.stat, stats)

  if (computed !== null) {
    return (
      <span className={DATABASE_SCALING_TOKEN_CLASS} title={hoverText}>
        <span>{computed}</span>
        <span className='text-slate-500'>
          {' '}
          ({displayValue}
          {segment.suffix}
          {segment.stat ? ` ${segment.stat}` : ''})
        </span>
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
