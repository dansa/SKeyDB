import type {FullStats} from './awakener-source-schema'
import {
  createDescriptionArgTokenPattern,
  createOrdinalMacroPattern,
  createPluralMacroPattern,
  extractDescriptionArgToken,
} from './description-token-grammar'
import {
  evaluatePublicFormulaExpression,
  getPublicScaledFormulaBreakdown,
  type PublicDescriptionArg,
  type PublicFormulaContext,
} from './public-description-args'
import {buildPublicFormulaContext} from './public-formula-context'
import {fmtNum} from './scaling'

const COMPUTABLE_STAT_KEYS = new Set(['ATK', 'DEF', 'CON'])
const ARG_TOKEN_PATTERN = createDescriptionArgTokenPattern('g')
const PLURAL_MACRO_PATTERN = createPluralMacroPattern('g')
const ORDINAL_MACRO_PATTERN = createOrdinalMacroPattern('g')

export interface DescriptionArgResolveContext {
  rank?: number
  stats?: Partial<FullStats> | null
  formulaContext?: PublicFormulaContext
}

export interface DescriptionArgProgressionContext {
  rank?: number
  maxRank?: number
  stats?: Partial<FullStats> | null
  formulaContext?: PublicFormulaContext
}

export interface ResolvedDescriptionArg {
  input: PublicDescriptionArg
  rank: number
  resolved: boolean
  rawBaseValue: string
  baseValue: number | null
  substatSourceValue: number | null
  substatBonusMode: 'additive' | 'scale_base' | 'additive_factor' | null
  substatBonusValue: number
  totalValue: number | null
  suffix: string
  stat: string | null
  formattedBaseValue: string
  formattedTotalValue: string
  absoluteValue: number | null
}

function formatSubstatLabel(substat: string): string {
  return substat.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function formatHoverDisplayText(text: string): string {
  return text.replaceAll('{', '').replaceAll('}', '')
}

const HOVER_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const HOVER_DECIMAL_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

const HOVER_FACTOR_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

function ceilDisplayValue(value: number): number {
  return Math.ceil(value - 1e-9)
}

function clampRank(rank: number): number {
  if (!Number.isFinite(rank)) {
    return 1
  }
  return Math.max(1, Math.floor(rank))
}

function inferDefaultMaxRank(arg: PublicDescriptionArg): number {
  switch (arg.kind) {
    case 'fixed':
      return 1
    case 'linear':
      return 1
    case 'scaling':
      return arg.values.length
    case 'computed':
      return 1
  }
}

function clampMaxRank(arg: PublicDescriptionArg, maxRank: number | undefined): number {
  const fallback = inferDefaultMaxRank(arg)
  if (maxRank === undefined || !Number.isFinite(maxRank)) {
    return fallback
  }

  return Math.max(1, Math.floor(maxRank))
}

function tryParseNumericValue(rawValue: string): number | null {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return 0
  }

  const parsed = Number(trimmed)
  if (Number.isNaN(parsed)) {
    return null
  }

  return parsed
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

function getSubstatBonus(arg: PublicDescriptionArg) {
  return 'substatBonus' in arg ? arg.substatBonus : undefined
}

function getDisplayFormula(arg: PublicDescriptionArg): string | undefined {
  return 'displayFormula' in arg ? arg.displayFormula : undefined
}

function isComputedArg(arg: PublicDescriptionArg): boolean {
  return arg.kind === 'computed'
}

function resolveBaseValue(
  arg: PublicDescriptionArg,
  rank: number,
  formulaContext: PublicFormulaContext = {},
): number {
  switch (arg.kind) {
    case 'fixed':
      return tryParseNumericValue(arg.value ?? '') ?? 0

    case 'linear':
      return (
        (tryParseNumericValue(arg.base) ?? 0) +
        (tryParseNumericValue(arg.gainPerLevel) ?? 0) * (rank - 1)
      )

    case 'scaling': {
      const index = Math.max(0, Math.min(rank - 1, arg.values.length - 1))
      return tryParseNumericValue(arg.values[index] ?? '0') ?? 0
    }

    case 'computed':
      return evaluatePublicFormulaExpression(arg, formulaContext).value ?? 0
  }
}

function resolveRawBaseValue(
  arg: PublicDescriptionArg,
  rank: number,
  formulaContext: PublicFormulaContext = {},
): string {
  switch (arg.kind) {
    case 'fixed':
      return arg.value ?? ''

    case 'linear':
      return String(resolveBaseValue(arg, rank, formulaContext))

    case 'scaling': {
      const index = Math.max(0, Math.min(rank - 1, arg.values.length - 1))
      return arg.values[index] ?? '0'
    }

    case 'computed': {
      const evaluation = evaluatePublicFormulaExpression(arg, formulaContext)
      return evaluation.resolved && evaluation.value !== null ? String(evaluation.value) : '—'
    }
  }
}

function resolveSubstatBonusValue(
  arg: PublicDescriptionArg,
  baseValue: number | null,
  stats: Partial<FullStats> | null | undefined,
): {
  sourceValue: number | null
  mode: 'additive' | 'scale_base' | 'additive_factor' | null
  value: number
} {
  const substatBonus = getSubstatBonus(arg)
  if (!substatBonus || !stats) {
    return {
      sourceValue: null,
      mode: null,
      value: 0,
    }
  }

  const statValue = parseStatValue(stats[substatBonus.substat as keyof FullStats])
  if (statValue === null) {
    return {
      sourceValue: null,
      mode:
        substatBonus.mode ??
        (arg.kind !== 'fixed' && inferSuffix(arg).includes('%') ? 'scale_base' : 'additive'),
      value: 0,
    }
  }

  const multiplier = tryParseNumericValue(substatBonus.multiplier) ?? 0
  const mode =
    substatBonus.mode ??
    (arg.kind !== 'fixed' && inferSuffix(arg).includes('%') ? 'scale_base' : 'additive')
  const value =
    mode === 'scale_base' && baseValue !== null
      ? baseValue * ((statValue * multiplier) / 100)
      : mode === 'additive_factor' && baseValue !== null
        ? baseValue *
          ((tryParseNumericValue(substatBonus.baseMultiplier ?? '') ?? 1) +
            (statValue * multiplier) / 100 -
            1)
        : statValue * multiplier

  return {
    sourceValue: statValue,
    mode,
    value,
  }
}

function inferStat(arg: PublicDescriptionArg, suffix: string): string | null {
  if (arg.stat) {
    return arg.stat
  }

  const suffixStatMatch = /\{(ATK|DEF|CON)\}/.exec(suffix)
  return suffixStatMatch?.[1] ?? null
}

function inferSuffix(arg: PublicDescriptionArg): string {
  return arg.suffix ?? getSubstatBonus(arg)?.suffix ?? ''
}

function formatResolvedValue(value: number, suffix: string, stat: string | null): string {
  const suffixHasInlineStat = /\{(ATK|DEF|CON)\}/.test(suffix)
  const statSuffix = stat && !suffixHasInlineStat ? ` {${stat}}` : ''
  return `${fmtNum(value)}${suffix}${statSuffix}`
}

function formatLiteralValue(rawValue: string, suffix: string, stat: string | null): string {
  const suffixHasInlineStat = /\{(ATK|DEF|CON)\}/.test(suffix)
  const statSuffix = stat && !suffixHasInlineStat ? ` {${stat}}` : ''
  return `${rawValue}${suffix}${statSuffix}`
}

function formatHoverFormulaNumber(value: number): string {
  if (Math.abs(value) >= 100) {
    return HOVER_NUMBER_FORMATTER.format(Math.round(value))
  }
  return HOVER_DECIMAL_FORMATTER.format(value)
}

function formatHoverPercentMultiplier(value: number): string {
  return `${formatHoverFormulaNumber(value * 100)}%`
}

function formatHoverEffectMultiplier(value: number): {
  formulaValue: string
  rowValue: string
} {
  if (Math.abs(value) >= 1) {
    const factor = formatHoverFormulaFactor(value)
    return {
      formulaValue: factor,
      rowValue: `×${factor}`,
    }
  }

  const percent = formatHoverPercentMultiplier(value)
  return {
    formulaValue: percent,
    rowValue: percent,
  }
}

function formatHoverComputedValue(value: number, suffix: string): string {
  return `${formatHoverFormulaNumber(value)}${suffix}`
}

function formatHoverFormulaFactor(value: number): string {
  return HOVER_FACTOR_FORMATTER.format(value)
}

function hasAstralReignResearchBonus(
  breakdown: ReturnType<typeof getPublicScaledFormulaBreakdown>,
): breakdown is ReturnType<typeof getPublicScaledFormulaBreakdown> & {
  ownedPosseCount: number
  ownedPosseMultiplier: number
} {
  return (
    breakdown.ownedPosseCount !== null &&
    breakdown.ownedPosseMultiplier !== null &&
    breakdown.ownedPosseCount > 0 &&
    breakdown.ownedPosseMultiplier > 1
  )
}

function resolveScaledFormulaResultValue(baseValue: number, multiplier: number | null): number {
  return multiplier === null ? baseValue : baseValue * multiplier
}

function formatScaledFormulaResultText(value: number, suffix: string): string {
  return formatHoverComputedValue(ceilDisplayValue(value), suffix)
}

function buildScaledComputedFormulaHover(
  arg: Extract<PublicDescriptionArg, {kind: 'computed'; formulaKey: 'scaled'}>,
  resolved: ResolvedDescriptionArg,
  formulaContext: PublicFormulaContext = {},
): string {
  const breakdown = getPublicScaledFormulaBreakdown(arg, formulaContext)
  const baseValueText = formatHoverFormulaNumber(breakdown.baseValue)
  const baseContextText =
    breakdown.baseLabelPlacement === 'before'
      ? `${breakdown.baseLabel} ${baseValueText}`
      : `${baseValueText} ${breakdown.baseLabel}`

  if (hasAstralReignResearchBonus(breakdown)) {
    const multiplierText =
      breakdown.multiplier === null ? null : formatHoverEffectMultiplier(breakdown.multiplier)
    const baseFormulaText =
      multiplierText === null
        ? baseContextText
        : `${baseContextText} × ${multiplierText.formulaValue}`
    const baseResultValue = resolveScaledFormulaResultValue(
      breakdown.baseValue,
      breakdown.multiplier,
    )
    const astralResearchValue = breakdown.baseValue * breakdown.ownedPosseMultiplier
    const astralResultValue = resolveScaledFormulaResultValue(
      astralResearchValue,
      breakdown.multiplier,
    )

    return formatHoverDisplayText(
      [
        breakdown.title,
        `Base (Account Lv ${String(breakdown.accountLevel)}): ${baseFormulaText} = ${formatScaledFormulaResultText(baseResultValue, resolved.suffix)}`,
        `Astral Reign: ${String(breakdown.ownedPosseCount)} Posses add +${String(breakdown.ownedPosseCount)}% to Research → ${formatScaledFormulaResultText(astralResultValue, resolved.suffix)}`,
      ].join('\n'),
    )
  }

  const rows = [breakdown.title, `Account Lv ${String(breakdown.accountLevel)}: ${baseContextText}`]
  const formulaTerms = [baseValueText]

  if (breakdown.multiplier !== null) {
    const multiplierText = formatHoverEffectMultiplier(breakdown.multiplier)
    rows.push(`Effect multiplier: ${multiplierText.rowValue}`)
    formulaTerms.push(multiplierText.formulaValue)
  }

  return formatHoverDisplayText(
    [
      ...rows,
      '',
      `${formulaTerms.join(' × ')} = ${
        resolved.totalValue === null
          ? resolved.formattedTotalValue
          : formatScaledFormulaResultText(resolved.totalValue, resolved.suffix)
      }`,
    ].join('\n'),
  )
}

function buildWheelEnlightenFormulaHover(
  arg: Extract<PublicDescriptionArg, {kind: 'computed'; formulaKey: 'wheelRefinementLinear'}>,
  resolved: ResolvedDescriptionArg,
  formulaContext: PublicFormulaContext = {},
): string {
  if (typeof formulaContext.wheelRefinementLevel !== 'number') {
    return ''
  }

  const suffix = inferSuffix(arg)
  const tier = Math.max(0, Math.floor(formulaContext.wheelRefinementLevel))
  const baseValue = formatHoverComputedValue(arg.baseValue, suffix)
  const perTierValue = formatHoverComputedValue(arg.perLevel, suffix)

  return formatHoverDisplayText(
    [
      'Wheel Enlighten Bonus',
      `Current Enlighten tier: ${String(tier)}`,
      `Base value: ${baseValue}`,
      `Per tier: +${perTierValue}`,
      '',
      `${baseValue} + (${String(tier)} × ${perTierValue}) = ${resolved.formattedTotalValue}`,
    ].join('\n'),
  )
}

function buildRealmMasteryFormulaHover(
  arg: Extract<PublicDescriptionArg, {kind: 'computed'; formulaKey: 'realmMasteryLinear'}>,
  resolved: ResolvedDescriptionArg,
  formulaContext: PublicFormulaContext = {},
): string {
  const resolvedContext = buildPublicFormulaContext(formulaContext)
  const realmMasteryFinal =
    typeof resolvedContext.realmMasteryFinal === 'number' ? resolvedContext.realmMasteryFinal : 0
  const suffix = inferSuffix(arg)
  const baseValue = formatHoverComputedValue(arg.baseValue, suffix)
  const perPointValue = `${formatHoverFormulaFactor(arg.perPoint)}${suffix}`
  const realmMasteryText = formatHoverFormulaNumber(realmMasteryFinal)

  return formatHoverDisplayText(
    [
      'Realm Mastery Scaling',
      `Final Realm Mastery: ${realmMasteryText}`,
      `Base value: ${baseValue}`,
      `Per Realm Mastery: +${perPointValue}`,
      '',
      `${baseValue} + (${realmMasteryText} × ${perPointValue}) = ${resolved.formattedTotalValue}`,
    ].join('\n'),
  )
}

function shouldCeilDisplayedTotalValue(
  arg: PublicDescriptionArg,
  baseValue: number | null,
): boolean {
  const substatBonus = getSubstatBonus(arg)
  if (!substatBonus && arg.kind === 'computed' && arg.formulaKey === 'scaled') {
    return true
  }

  if (!substatBonus) {
    return false
  }

  const mode =
    substatBonus.mode ??
    (arg.kind !== 'fixed' && inferSuffix(arg).includes('%') ? 'scale_base' : 'additive')
  if (mode === 'additive' || mode === 'additive_factor') {
    return true
  }

  const suffix = inferSuffix(arg)
  return arg.kind === 'fixed' && baseValue !== null && !inferStat(arg, suffix)
}

function resolveAbsoluteValue(
  totalValue: number,
  suffix: string,
  stat: string | null,
  stats: Partial<FullStats> | null | undefined,
): number | null {
  if (!stats || !stat || !COMPUTABLE_STAT_KEYS.has(stat) || !suffix.includes('%')) {
    return null
  }

  const statValue = parseStatValue(stats[stat as keyof FullStats])
  if (statValue === null) {
    return null
  }

  return ceilDisplayValue((totalValue / 100) * statValue)
}

function formatDescriptionArgTotalValue(
  arg: PublicDescriptionArg,
  rawBaseValue: string,
  baseValue: number | null,
  totalValue: number | null,
  suffix: string,
  stat: string | null,
  formulaContext: PublicFormulaContext | undefined,
): string {
  const primaryValue =
    totalValue === null
      ? formatLiteralValue(rawBaseValue, suffix, stat)
      : formatResolvedValue(
          shouldCeilDisplayedTotalValue(arg, baseValue) ? ceilDisplayValue(totalValue) : totalValue,
          suffix,
          stat,
        )

  if (
    totalValue === null ||
    arg.kind !== 'computed' ||
    arg.formulaKey !== 'scaled' ||
    getSubstatBonus(arg)
  ) {
    return primaryValue
  }

  const breakdown = getPublicScaledFormulaBreakdown(arg, buildPublicFormulaContext(formulaContext))
  if (!hasAstralReignResearchBonus(breakdown)) {
    return primaryValue
  }

  const astralResearchValue = breakdown.baseValue * breakdown.ownedPosseMultiplier
  const astralResultValue = resolveScaledFormulaResultValue(
    astralResearchValue,
    breakdown.multiplier,
  )
  const astralValue = formatResolvedValue(ceilDisplayValue(astralResultValue), suffix, stat)

  return astralValue === primaryValue ? primaryValue : `${primaryValue} (${astralValue})`
}

export function resolveDescriptionArg(
  arg: PublicDescriptionArg,
  context: DescriptionArgResolveContext = {},
): ResolvedDescriptionArg {
  const rank = clampRank(context.rank ?? 1)
  const rawBaseValue = resolveRawBaseValue(arg, rank, context.formulaContext)
  const resolved = !isComputedArg(arg) || rawBaseValue !== '—'
  const parsedBaseValue = tryParseNumericValue(rawBaseValue)
  const hasLiteralBaseValue = rawBaseValue.trim().length > 0
  const baseValue = hasLiteralBaseValue ? parsedBaseValue : null
  const resolvedSubstatBonus = resolveSubstatBonusValue(arg, baseValue, context.stats)
  const substatBonusValue = resolvedSubstatBonus.value
  const totalValue =
    baseValue === null
      ? getSubstatBonus(arg)
        ? substatBonusValue
        : null
      : baseValue + substatBonusValue
  const suffix = inferSuffix(arg)
  const stat = inferStat(arg, suffix)
  const formattedBaseValue = baseValue === null ? '' : formatResolvedValue(baseValue, suffix, stat)
  const formattedTotalValue = formatDescriptionArgTotalValue(
    arg,
    rawBaseValue,
    baseValue,
    totalValue,
    suffix,
    stat,
    context.formulaContext,
  )

  return {
    input: arg,
    rank,
    resolved,
    rawBaseValue,
    baseValue,
    substatSourceValue: resolvedSubstatBonus.sourceValue,
    substatBonusMode: resolvedSubstatBonus.mode,
    substatBonusValue,
    totalValue,
    suffix,
    stat,
    formattedBaseValue,
    formattedTotalValue,
    absoluteValue:
      totalValue === null ? null : resolveAbsoluteValue(totalValue, suffix, stat, context.stats),
  }
}

export function resolveDescriptionArgs(
  descriptionArgs: Record<string, PublicDescriptionArg>,
  context: DescriptionArgResolveContext = {},
): Record<string, ResolvedDescriptionArg> {
  return Object.fromEntries(
    Object.entries(descriptionArgs).map(([key, arg]) => [key, resolveDescriptionArg(arg, context)]),
  )
}

export function getDescriptionArgKeysInTemplateOrder(
  descriptionTemplate: string,
  descriptionArgs: Record<string, PublicDescriptionArg>,
): string[] {
  const orderedKeys: string[] = []
  const seenKeys = new Set<string>()

  for (const match of descriptionTemplate.matchAll(ARG_TOKEN_PATTERN)) {
    const argKey = match.groups?.argKey
    if (!argKey || seenKeys.has(argKey) || !Object.hasOwn(descriptionArgs, argKey)) {
      continue
    }

    seenKeys.add(argKey)
    orderedKeys.push(argKey)
  }

  for (const argKey of Object.keys(descriptionArgs)) {
    if (seenKeys.has(argKey)) {
      continue
    }

    orderedKeys.push(argKey)
  }

  return orderedKeys
}

export function getDescriptionArgProgression(
  arg: PublicDescriptionArg,
  context: DescriptionArgProgressionContext = {},
): ResolvedDescriptionArg[] {
  const maxRank = clampMaxRank(arg, context.maxRank)
  return Array.from({length: maxRank}, (_, index) =>
    resolveDescriptionArg(arg, {
      rank: index + 1,
      stats: context.stats,
      formulaContext: context.formulaContext,
    }),
  )
}

export function formatDescriptionArgProgression(
  arg: PublicDescriptionArg,
  context: DescriptionArgProgressionContext = {},
): string {
  const progression = getDescriptionArgProgression(arg, context)
  const suffix = inferSuffix(arg)
  const stat = inferStat(arg, suffix)
  const suffixHasInlineStat = /\{(ATK|DEF|CON)\}/.test(suffix)
  const statSuffix = stat && !suffixHasInlineStat ? ` {${stat}}` : ''
  const numericProgression = progression.map((entry) => entry.totalValue)

  if (numericProgression.some((value) => value === null)) {
    const formattedValues = progression.map((entry) => entry.formattedTotalValue)
    if (formattedValues.every((value) => value === formattedValues[0])) {
      return formattedValues[0] ?? ''
    }
    return formattedValues.join('/')
  }

  if (numericProgression.length <= 1) {
    return `${fmtNum(numericProgression[0] ?? 0)}${suffix}${statSuffix}`
  }

  const step = (numericProgression[1] ?? 0) - (numericProgression[0] ?? 0)
  const isEvenlySpaced =
    step !== 0 &&
    numericProgression.every((value, index) => {
      if (index === 0) {
        return true
      }

      return Math.abs((value ?? 0) - (numericProgression[index - 1] ?? 0) - step) < 0.001
    })

  if (isEvenlySpaced) {
    const sign = step > 0 ? '+' : ''
    return `${fmtNum(numericProgression[0] ?? 0)}${suffix} (${sign}${fmtNum(step)}${suffix}/Lv)${statSuffix}`
  }

  return `${numericProgression.map((value) => fmtNum(value ?? 0)).join('/')}${suffix}${statSuffix}`
}

function buildDescriptionArgFormula(
  arg: PublicDescriptionArg,
  resolved: ResolvedDescriptionArg,
  formulaContext: PublicFormulaContext = {},
): string {
  const displayFormula = getDisplayFormula(arg)
  if (displayFormula) {
    return formatHoverDisplayText(displayFormula)
  }

  if (arg.kind === 'computed' && arg.formulaKey === 'scaled') {
    return buildScaledComputedFormulaHover(arg, resolved, buildPublicFormulaContext(formulaContext))
  }

  if (arg.kind === 'computed' && arg.formulaKey === 'realmMasteryLinear') {
    return buildRealmMasteryFormulaHover(arg, resolved, formulaContext)
  }

  if (!('substatBonus' in arg) || !arg.substatBonus) {
    return formatHoverDisplayText(resolved.formattedTotalValue)
  }

  if (
    resolved.substatBonusMode === 'scale_base' &&
    resolved.baseValue !== null &&
    resolved.substatSourceValue !== null
  ) {
    const multiplier = tryParseNumericValue(arg.substatBonus.multiplier) ?? 0
    const scalePercent = resolved.substatSourceValue * multiplier
    return formatHoverDisplayText(
      `${resolved.formattedBaseValue} × ${fmtNum(100 + scalePercent)}% from ${formatSubstatLabel(arg.substatBonus.substat)}`,
    )
  }

  if (
    resolved.substatBonusMode === 'additive_factor' &&
    resolved.baseValue !== null &&
    resolved.substatSourceValue !== null
  ) {
    const multiplier = tryParseNumericValue(arg.substatBonus.multiplier) ?? 0
    const baseMultiplier = tryParseNumericValue(arg.substatBonus.baseMultiplier ?? '') ?? 1
    const factor = baseMultiplier + (resolved.substatSourceValue * multiplier) / 100
    return formatHoverDisplayText(
      `${resolved.formattedBaseValue} × ${fmtNum(factor)} from ${formatSubstatLabel(arg.substatBonus.substat)}`,
    )
  }

  const substatTerm = formatHoverDisplayText(
    `${formatSubstatLabel(arg.substatBonus.substat)} × ${formatLiteralValue(arg.substatBonus.multiplier, resolved.suffix, resolved.stat)}`,
  )

  if (resolved.baseValue === null || resolved.baseValue === 0) {
    return substatTerm
  }

  return `${formatHoverDisplayText(resolved.formattedBaseValue)} + ${substatTerm}`
}

export function hasDescriptionArgInteractiveHover(arg: PublicDescriptionArg): boolean {
  return arg.kind !== 'fixed' || Boolean(getSubstatBonus(arg) ?? getDisplayFormula(arg))
}

export function buildDescriptionArgHover(
  arg: PublicDescriptionArg,
  context: DescriptionArgProgressionContext = {},
): string {
  if (!hasDescriptionArgInteractiveHover(arg)) {
    return ''
  }

  if (arg.kind === 'fixed') {
    const resolved = resolveDescriptionArg(arg, {
      rank: context.rank,
      stats: context.stats,
      formulaContext: context.formulaContext,
    })
    return buildDescriptionArgFormula(arg, resolved, context.formulaContext)
  }

  if (arg.kind === 'computed' && arg.formulaKey === 'scaled') {
    const resolved = resolveDescriptionArg(arg, {
      rank: context.rank,
      stats: context.stats,
      formulaContext: context.formulaContext,
    })
    return buildDescriptionArgFormula(arg, resolved, context.formulaContext)
  }

  if (arg.kind === 'computed' && arg.formulaKey === 'wheelRefinementLinear') {
    const resolved = resolveDescriptionArg(arg, {
      rank: context.rank,
      stats: context.stats,
      formulaContext: context.formulaContext,
    })
    return buildWheelEnlightenFormulaHover(arg, resolved, context.formulaContext)
  }

  if (arg.kind === 'computed') {
    const resolved = resolveDescriptionArg(arg, {
      rank: context.rank,
      stats: context.stats,
      formulaContext: context.formulaContext,
    })
    return buildRealmMasteryFormulaHover(arg, resolved, context.formulaContext)
  }

  const progression = getDescriptionArgProgression(arg, context)
  return progression
    .map((entry) => {
      const base = `Lv${String(entry.rank)}: ${formatHoverDisplayText(entry.formattedTotalValue)}`
      const breakdown =
        'substatBonus' in arg &&
        arg.substatBonus &&
        entry.baseValue !== null &&
        entry.substatBonusValue !== 0
          ? entry.substatBonusMode === 'scale_base' && entry.substatSourceValue !== null
            ? ` (${formatHoverDisplayText(entry.formattedBaseValue)} × ${fmtNum(100 + entry.substatSourceValue * (tryParseNumericValue(arg.substatBonus.multiplier) ?? 0))}% from ${formatSubstatLabel(arg.substatBonus.substat)})`
            : entry.substatBonusMode === 'additive_factor' && entry.substatSourceValue !== null
              ? ` (${formatHoverDisplayText(entry.formattedBaseValue)} × ${fmtNum((tryParseNumericValue(arg.substatBonus.baseMultiplier ?? '') ?? 1) + (entry.substatSourceValue * (tryParseNumericValue(arg.substatBonus.multiplier) ?? 0)) / 100)} from ${formatSubstatLabel(arg.substatBonus.substat)})`
              : ` (${formatHoverDisplayText(entry.formattedBaseValue)} + ${formatHoverDisplayText(formatResolvedValue(entry.substatBonusValue, entry.suffix, entry.stat))} from ${formatSubstatLabel(arg.substatBonus.substat)})`
          : ''
      const computed = entry.absoluteValue === null ? '' : ` = ${String(entry.absoluteValue)}`
      return `${base}${computed}${breakdown}`
    })
    .join('\n')
}

export function resolveDescriptionTemplate(
  descriptionTemplate: string,
  descriptionArgs: Record<string, PublicDescriptionArg>,
  context: DescriptionArgResolveContext = {},
): string {
  const normalizedTemplate = descriptionTemplate
    .replace(PLURAL_MACRO_PATTERN, (fullMatch, ...args: unknown[]) => {
      const groups = args.at(-1) as
        | {argToken?: string; singular?: string; plural?: string}
        | undefined
      const argToken = groups?.argToken ? extractDescriptionArgToken(groups.argToken) : null
      const argKey = argToken?.argKey
      const arg = argKey && Object.hasOwn(descriptionArgs, argKey) ? descriptionArgs[argKey] : null
      if (!arg) {
        return fullMatch
      }

      const resolved = resolveDescriptionArg(arg, context)
      const value = resolved.absoluteValue ?? resolved.totalValue ?? resolved.baseValue
      return value === 1 ? (groups?.singular ?? '') : (groups?.plural ?? '')
    })
    .replace(ORDINAL_MACRO_PATTERN, (...args: unknown[]) => {
      const groups = args.at(-1) as {value?: string} | undefined
      return groups?.value ?? ''
    })
  let result = ''
  let cursor = 0

  for (const match of normalizedTemplate.matchAll(ARG_TOKEN_PATTERN)) {
    const fullMatch = match[0]
    const index = match.index
    const argKey = match.groups?.argKey
    if (!argKey) {
      continue
    }

    result += normalizedTemplate.slice(cursor, index)

    const arg = Object.hasOwn(descriptionArgs, argKey) ? descriptionArgs[argKey] : undefined
    if (!arg) {
      result += fullMatch
      cursor = index + fullMatch.length
      continue
    }

    const resolved = resolveDescriptionArg(arg, context)
    if (!resolved.resolved) {
      result += fullMatch
      cursor = index + fullMatch.length
      continue
    }

    const replacement = resolved.formattedTotalValue
    const nextCharacter = normalizedTemplate[index + fullMatch.length] ?? ''
    const shouldSkipTrailingPercent = replacement.endsWith('%') && nextCharacter === '%'

    result += replacement
    cursor = index + fullMatch.length + (shouldSkipTrailingPercent ? 1 : 0)
  }

  result += normalizedTemplate.slice(cursor)
  return result
}
