import type {AwakenerFullStats} from '@/domain/awakeners-full'
import type {MechanicSegment, ScalingSegment, SkillSegment, StatSegment} from '@/domain/rich-text'
import {computeStatRange, computeStatValue, fmtNum, formatScalingRange} from '@/domain/scaling'
import {getTagIcon, resolveTag, type Tag} from '@/domain/tags'
import {
  DATABASE_INLINE_TOKEN_BUTTON_STYLE,
  DATABASE_INTERACTIVE_TOKEN_CLASS,
  DATABASE_POPOVER_SCALING_TOKEN_CLASS,
  DATABASE_SCALING_TOKEN_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
  DATABASE_UNIMPLEMENTED_TOKEN_CLASS,
  getDatabaseRealmTint,
} from '@/pages/database/utils/text-styles'

type RichSkillSegmentViewProps = Readonly<{
  segment: SkillSegment
  onSkillClick?: (name: string, event: React.MouseEvent) => void
}>

type RichMechanicSegmentViewProps = Readonly<{
  segment: MechanicSegment
  onMechanicClick?: (tag: Tag, event: React.MouseEvent) => void
}>

type RichScalingSegmentViewProps = Readonly<{
  segment: ScalingSegment
  skillLevel: number
  stats: AwakenerFullStats | null
  variant: 'inline' | 'popover'
  onScalingClick?: (
    values: number[],
    suffix: string,
    stat: string | null,
    event: React.MouseEvent,
  ) => void
}>

export function RichSkillSegmentView({segment, onSkillClick}: RichSkillSegmentViewProps) {
  if (onSkillClick === undefined) {
    return (
      <span className='inline font-bold whitespace-nowrap text-amber-200/90'>{segment.name}</span>
    )
  }

  return (
    <button
      className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} appearance-none border-0 bg-transparent p-0 font-bold whitespace-nowrap`}
      onClick={(event) => {
        onSkillClick(segment.name, event)
      }}
      style={DATABASE_INLINE_TOKEN_BUTTON_STYLE}
      type='button'
    >
      {segment.name}
    </button>
  )
}

export function RichStatSegmentView({segment}: Readonly<{segment: StatSegment}>) {
  return (
    <span className={`${DATABASE_STAT_TOKEN_CLASS} inline font-bold whitespace-nowrap`}>
      {segment.name}
    </span>
  )
}

export function RichMechanicSegmentView({segment, onMechanicClick}: RichMechanicSegmentViewProps) {
  const tag = resolveTag(segment.name)
  const hasIcon = tag?.iconId && getTagIcon(tag.iconId)
  const color = tag?.tint

  if (!hasTagDescription(tag) || onMechanicClick === undefined) {
    return (
      <span
        className={`${DATABASE_UNIMPLEMENTED_TOKEN_CLASS} font-bold whitespace-nowrap`}
        style={{color}}
        title='Details coming soon'
      >
        {hasIcon ? (
          <img
            alt=''
            className='mr-0.5 inline-block! h-[0.9em] w-auto shrink-0 align-[-0.12em]'
            src={getTagIcon(tag.iconId)}
          />
        ) : null}
        <span className='inline'>{segment.name}</span>
      </span>
    )
  }

  return (
    <button
      className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} appearance-none border-0 bg-transparent p-0 font-bold whitespace-nowrap`}
      onClick={(event) => {
        onMechanicClick(tag, event)
      }}
      style={{...DATABASE_INLINE_TOKEN_BUTTON_STYLE, color: color ?? undefined}}
      type='button'
    >
      {hasIcon ? (
        <img
          alt=''
          className='mr-0.5 inline-block! h-[0.9em] w-auto shrink-0 align-[-0.1em]'
          src={getTagIcon(tag.iconId)}
        />
      ) : null}
      <span className='inline'>{segment.name}</span>
    </button>
  )
}

export function RichRealmSegmentView({realmName}: {realmName: string}) {
  const tint = getDatabaseRealmTint(realmName)
  return (
    <span className='inline font-semibold whitespace-nowrap' style={{color: tint}}>
      {realmName}
    </span>
  )
}

export function RichScalingSegmentView({
  segment,
  skillLevel,
  stats,
  variant,
  onScalingClick,
}: RichScalingSegmentViewProps) {
  const {values, suffix, stat} = segment
  const isInteractive = onScalingClick !== undefined

  if (variant === 'popover') {
    const display = formatScalingRange(values, suffix)
    const computed = computeStatRange(values, suffix, stat, stats)
    const popoverContent = computed ?? (
      <>
        {display}
        {stat ? ` ${stat}` : ''}
      </>
    )

    if (!isInteractive) {
      return (
        <span
          className={`${DATABASE_POPOVER_SCALING_TOKEN_CLASS} inline font-bold whitespace-nowrap text-amber-200/90`}
        >
          {popoverContent}
        </span>
      )
    }

    return (
      <button
        className={`${DATABASE_SCALING_TOKEN_CLASS} cursor-help appearance-none border-0 bg-transparent p-0 font-bold whitespace-nowrap text-amber-200/90`}
        onClick={(event) => {
          onScalingClick(values, suffix, stat, event)
        }}
        style={DATABASE_INLINE_TOKEN_BUTTON_STYLE}
        title={buildScalingHover(values, suffix, stat, stats)}
        type='button'
      >
        {popoverContent}
      </button>
    )
  }

  const idx = Math.max(0, Math.min(skillLevel - 1, values.length - 1))
  const value = values[idx]
  const displayValue = fmtNum(value)
  const computedValue = computeStatValue(value, suffix, stat, stats)
  const hoverText = buildScalingHover(values, suffix, stat, stats)
  const fallbackValue = `${displayValue}${suffix}`
  const content = computedValue ?? fallbackValue
  const statSuffix = stat && computedValue === null ? ` ${stat}` : ''

  if (!isInteractive) {
    return (
      <span
        className={`${DATABASE_SCALING_TOKEN_CLASS} font-bold whitespace-nowrap`}
        title={hoverText}
      >
        {content}
        {statSuffix}
      </span>
    )
  }

  return (
    <button
      className={`${DATABASE_SCALING_TOKEN_CLASS} m-0 cursor-help appearance-none border-0 bg-transparent p-0 font-bold whitespace-nowrap`}
      onClick={(event) => {
        onScalingClick(values, suffix, stat, event)
      }}
      style={DATABASE_INLINE_TOKEN_BUTTON_STYLE}
      title={hoverText}
      type='button'
    >
      {content}
      {statSuffix}
    </button>
  )
}

function buildScalingHover(
  values: number[],
  suffix: string,
  stat: string | null,
  stats: AwakenerFullStats | null,
): string {
  if (values.length <= 1) return ''
  return values
    .map((value, index) => {
      const computed = computeStatValue(value, suffix, stat, stats)
      const base = `${String(value)}${suffix}`
      const resolvedValue = computed === null ? '' : ` = ${String(computed)}`
      return `Lv${String(index + 1)}: ${base}${resolvedValue}`
    })
    .join('\n')
}

function hasTagDescription(tag: Tag | null): tag is Tag {
  return typeof tag?.description === 'string' && tag.description.trim().length > 0
}
