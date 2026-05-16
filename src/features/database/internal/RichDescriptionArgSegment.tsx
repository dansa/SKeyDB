import type {FullStats} from '@/domain/awakener-source-schema'
import {
  buildDescriptionArgHover,
  hasDescriptionArgInteractiveHover,
  resolveDescriptionArg,
} from '@/domain/description-args'
import type {PublicDescriptionArg} from '@/domain/public-description-args'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {RichSegmentRendererVariant} from './RichSegmentRenderer'
import {
  DATABASE_POPOVER_INTERACTIVE_SCALING_TOKEN_CLASS,
  DATABASE_POPOVER_SCALING_TOKEN_CLASS,
  DATABASE_POPOVER_STAT_TOKEN_CLASS,
  DATABASE_SCALING_GROUP_CLASS,
  DATABASE_SCALING_TOKEN_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
  DATABASE_TINTED_TOKEN_CLASS,
  getDatabaseDescriptionArgTint,
  getDatabaseTintedTokenStyle,
} from './text-styles'

export function RichDescriptionArgSegment({
  arg,
  channel,
  rank,
  maxRank,
  formulaContext,
  showVisibleScaling,
  stats,
  variant,
}: {
  arg: PublicDescriptionArg
  channel: string | null
  rank: number
  maxRank: number | undefined
  formulaContext: PublicFormulaContext | undefined
  showVisibleScaling: boolean
  stats: FullStats | null
  variant: RichSegmentRendererVariant
}) {
  const resolved = resolveDescriptionArg(arg, {rank, stats, formulaContext})
  const hoverText = buildDescriptionArgHover(arg, {rank, maxRank, stats, formulaContext})
  const isInteractive = hasDescriptionArgInteractiveHover(arg)
  const formulaText = resolved.formattedTotalValue.replaceAll('{', '').replaceAll('}', '')
  const scalingClass =
    variant === 'popover'
      ? DATABASE_POPOVER_INTERACTIVE_SCALING_TOKEN_CLASS
      : DATABASE_SCALING_TOKEN_CLASS
  const statClass =
    variant === 'popover' ? DATABASE_POPOVER_STAT_TOKEN_CLASS : DATABASE_STAT_TOKEN_CLASS
  const plainClass =
    variant === 'popover' ? DATABASE_POPOVER_SCALING_TOKEN_CLASS : 'text-amber-100/85'
  const tint = getDatabaseDescriptionArgTint(channel ?? arg.channel ?? null)
  const tintStyle = getDatabaseTintedTokenStyle(tint)
  const hoverProps = isInteractive && hoverText ? {title: hoverText} : {}

  if (resolved.absoluteValue !== null) {
    return (
      <span className={isInteractive ? DATABASE_SCALING_GROUP_CLASS : plainClass} {...hoverProps}>
        <span
          className={`${isInteractive ? scalingClass : plainClass}${tintStyle ? ` ${DATABASE_TINTED_TOKEN_CLASS}` : ''}`.trim()}
          style={tintStyle}
        >
          {resolved.absoluteValue}
        </span>
        {showVisibleScaling ? (
          <span className='text-slate-500 no-underline'>
            {' '}
            ({formulaText.replace(/\b(ATK|DEF|CON)\b/g, '$1')})
          </span>
        ) : null}
      </span>
    )
  }

  if (resolved.stat) {
    const [prefix] = formulaText.split(` ${resolved.stat}`)
    return (
      <span className={isInteractive ? scalingClass : plainClass} {...hoverProps}>
        <span className={tintStyle ? DATABASE_TINTED_TOKEN_CLASS : undefined} style={tintStyle}>
          {prefix}
        </span>{' '}
        <span className={statClass}>{resolved.stat}</span>
      </span>
    )
  }

  return (
    <span
      className={`${isInteractive ? scalingClass : plainClass}${tintStyle ? ` ${DATABASE_TINTED_TOKEN_CLASS}` : ''}`.trim()}
      style={tintStyle}
      {...hoverProps}
    >
      {formulaText}
    </span>
  )
}

export function RichDescriptionArgPluralSegment({
  arg,
  formulaContext,
  rank,
  singular,
  plural,
  stats,
}: {
  arg: PublicDescriptionArg
  formulaContext: PublicFormulaContext | undefined
  rank: number
  singular: string
  plural: string
  stats: FullStats | null
}) {
  const resolved = resolveDescriptionArg(arg, {
    rank,
    stats,
    formulaContext,
  })
  const value = resolved.absoluteValue ?? resolved.totalValue ?? resolved.baseValue
  return value === 1 ? singular : plural
}
