import type {ReactNode} from 'react'

import type {FullStats} from '@/domain/awakener-source-schema'
import {
  buildDescriptionArgHover,
  getDescriptionArgFormulaBreakdown,
  getDescriptionArgProgression,
  hasDescriptionArgInteractiveHover,
  resolveDescriptionArg,
} from '@/domain/description-args'
import type {PublicDescriptionArg} from '@/domain/public-description-args'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

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
  onScalingClick,
  recordId,
  argKey,
}: {
  arg: PublicDescriptionArg
  channel: string | null
  rank: number
  maxRank: number | undefined
  formulaContext: PublicFormulaContext | undefined
  showVisibleScaling: boolean
  stats: FullStats | null
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
  recordId?: string
  argKey?: string
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
  const handleActivate = (event: ActivationEvent) => {
    const progression = getDescriptionArgProgression(arg, {maxRank, stats, formulaContext})
    const values = progression.map((entry) => entry.baseValue ?? 0)
    const finalValues = progression.map((entry) => entry.totalValue ?? 0)
    const firstResolved = progression[0] as (typeof progression)[0] | undefined
    const suffix = firstResolved?.suffix ?? ''
    const stat = firstResolved?.stat ?? null
    const formulas = progression.map((entry) => getDescriptionArgFormulaBreakdown(arg, entry))
    let abstractFormula: string | undefined
    if (arg.substatBonus) {
      const source = arg.substatBonus.substat.replace(/([a-z])([A-Z])/g, '$1 $2')
      const mult = arg.substatBonus.multiplier
      const mode = arg.substatBonus.mode ?? (suffix.includes('%') ? 'scale_base' : 'additive')
      const baseMult = arg.substatBonus.baseMultiplier ?? '1'
      if (mode === 'scale_base') {
        abstractFormula = `base × (1 + ${source} × ${mult})`
      } else if (mode === 'additive_factor') {
        abstractFormula = `base × (${baseMult} + ${source} × ${mult})`
      } else {
        abstractFormula = `base + ${source} × ${mult}`
      }
    }
    onScalingClick?.(
      values,
      suffix,
      stat,
      event,
      formulas,
      rank,
      finalValues,
      abstractFormula,
      arg,
      recordId,
      argKey,
    )
  }
  const wrapInteractive = (content: ReactNode, className: string) => {
    if (isInteractive && onScalingClick) {
      return (
        <InteractiveToken
          ariaLabel={hoverText || 'Scaling Details'}
          className={`${className} ${DATABASE_INHERIT_FONT_SIZE_CLASS} inline`}
          onActivate={handleActivate}
          title={hoverText}
        >
          {content}
        </InteractiveToken>
      )
    }
    return (
      <span className={className} {...hoverProps}>
        {content}
      </span>
    )
  }
  if (resolved.absoluteValue !== null) {
    const inner = (
      <>
        <span
          className={`${isInteractive ? scalingClass : plainClass}${tintStyle ? ` ${DATABASE_TINTED_TOKEN_CLASS}` : ''}`.trim()}
          style={tintStyle}
        >
          {resolved.absoluteValue}
        </span>
        {showVisibleScaling ? (
          <span className='text-[0.85em] text-slate-500 no-underline'>
            {' '}
            ({formulaText.replace(/\b(ATK|DEF|CON)\b/g, '$1')})
          </span>
        ) : null}
      </>
    )
    return wrapInteractive(inner, isInteractive ? DATABASE_SCALING_GROUP_CLASS : plainClass)
  }
  if (resolved.stat) {
    const [prefix] = formulaText.split(` ${resolved.stat}`)
    const inner = (
      <>
        <span className={tintStyle ? DATABASE_TINTED_TOKEN_CLASS : undefined} style={tintStyle}>
          {prefix}
        </span>{' '}
        <span className={statClass}>{resolved.stat}</span>
      </>
    )
    return wrapInteractive(inner, isInteractive ? scalingClass : plainClass)
  }
  const inner = tintStyle ? (
    <span className={DATABASE_TINTED_TOKEN_CLASS} style={tintStyle}>
      {formulaText}
    </span>
  ) : (
    <>{formulaText}</>
  )
  return wrapInteractive(inner, isInteractive ? scalingClass : plainClass)
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
