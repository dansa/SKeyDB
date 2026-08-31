import {
  createDescriptionArgTokenPattern,
  createOrdinalMacroPattern,
  createPluralMacroPattern,
  extractDescriptionArgToken,
} from './description-token-grammar'
import {getMainstatLabels} from './mainstats-catalog'
import type {PublicDescriptionArg} from './public-description-args'
import {COMPUTABLE_STATS} from './scaling'

export interface TextSegment {
  type: 'text'
  value: string
}
export interface SkillSegment {
  type: 'skill'
  name: string
  referenceKind?: RichTextReferenceKind
  referenceId?: string
  referenceVariantId?: string
}
export type RichTextReferenceKind = 'derived-skill' | 'orison' | 'relic'
export interface StatSegment {
  type: 'stat'
  name: string
}
export interface MechanicSegment {
  type: 'mechanic'
  name: string
}
export interface ReferenceSegment {
  type: 'reference'
  name: string
}
export interface RealmSegment {
  type: 'realm'
  name: string
}
export interface ScalingSegment {
  type: 'scaling'
  values: number[]
  suffix: string
  stat: string | null
}
export interface DescriptionArgSegment {
  type: 'descriptionArg'
  argKey: string
  channel: string | null
}
export interface ArgPluralSegment {
  type: 'argPlural'
  argKey: string
  channel: string | null
  singular: string
  plural: string
}
export interface FormattingSegment {
  type: 'formatting'
  style: 'bold' | 'italic'
  segments: RichSegment[]
}

export interface RichTextParseOptions {
  excludedSkillNames?: Iterable<string>
  plainTextMechanicNames?: Iterable<string>
  overlayMechanicNames?: Iterable<string>
  enableFollowupLineBreaks?: boolean
}

export interface RichTextParseContext {
  cardNameByLower: ReadonlyMap<string, string>
  options: NormalizedRichTextParseOptions
}

export type RichSegment =
  | TextSegment
  | SkillSegment
  | StatSegment
  | MechanicSegment
  | ReferenceSegment
  | RealmSegment
  | ScalingSegment
  | DescriptionArgSegment
  | ArgPluralSegment
  | FormattingSegment

const LINE_BREAK_BEFORE_MECHANICS = new Set(['Aftershock', 'Leap', 'Quasar', 'Rouse'])

const KNOWN_STAT_LABELS = new Set<string>()

function ensureStatsLoaded() {
  if (KNOWN_STAT_LABELS.size > 0) return
  for (const label of getMainstatLabels()) {
    KNOWN_STAT_LABELS.add(label)
  }
  KNOWN_STAT_LABELS.add('STR')
  KNOWN_STAT_LABELS.add('Temporary STR')
}

function isStatToken(token: string): boolean {
  ensureStatsLoaded()
  if (KNOWN_STAT_LABELS.has(token)) {
    return true
  }
  if (token.startsWith('Temporary ')) {
    const baseToken = token.slice('Temporary '.length).trim()
    return KNOWN_STAT_LABELS.has(baseToken)
  }
  return false
}

const KNOWN_REALMS = new Set(['Chaos', 'Aequor', 'Caro', 'Ultra'])

const SCALING_RE = /\((\d[\d./]*(?:\/\d[\d./]*)+)(%)?\s*(?:\{([^}]+)\})?\)/
const PROSE_SCALING_RE = /(\d+(?:\.\d+)?)(%)\s+of\s+\{([^}]+)\}/
const DESCRIPTION_ARG_RE = createDescriptionArgTokenPattern()
const PLURAL_MACRO_RE = createPluralMacroPattern()
const ORDINAL_MACRO_RE = createOrdinalMacroPattern()

type NextRichMatch =
  | {kind: 'none'}
  | {kind: 'descriptionArg'; index: number; match: RegExpExecArray}
  | {kind: 'plural'; index: number; match: RegExpExecArray}
  | {kind: 'ordinal'; index: number; match: RegExpExecArray}
  | {kind: 'scaling'; index: number; match: RegExpExecArray}
  | {kind: 'prose'; index: number; match: RegExpExecArray}
  | {kind: 'bracket'; index: number}

function parseScaling(raw: string): ScalingSegment | null {
  const m = SCALING_RE.exec(raw)
  if (!m) return null
  const nums = m[1].split('/').map(Number)
  if (nums.some(Number.isNaN)) return null
  const pct = m.at(2) ?? ''
  const stat = m.at(3) ?? null
  return {type: 'scaling', values: nums, suffix: pct, stat}
}

function findNextRichMatch(remaining: string): NextRichMatch {
  const descriptionArgMatch = DESCRIPTION_ARG_RE.exec(remaining)
  const pluralMatch = PLURAL_MACRO_RE.exec(remaining)
  const ordinalMatch = ORDINAL_MACRO_RE.exec(remaining)
  const scalingMatch = SCALING_RE.exec(remaining)
  const proseMatch = PROSE_SCALING_RE.exec(remaining)
  const bracketIdx = remaining.indexOf('{')

  const nextDescriptionArgIdx = descriptionArgMatch?.index ?? Infinity
  const nextPluralIdx = pluralMatch?.index ?? Infinity
  const nextOrdinalIdx = ordinalMatch?.index ?? Infinity
  const nextScalingIdx = scalingMatch?.index ?? Infinity
  const nextProseIdx =
    proseMatch && COMPUTABLE_STATS.has(proseMatch[3]) ? proseMatch.index : Infinity
  const nextBracketIdx = bracketIdx >= 0 ? bracketIdx : Infinity

  if (
    nextDescriptionArgIdx === Infinity &&
    nextPluralIdx === Infinity &&
    nextOrdinalIdx === Infinity &&
    nextScalingIdx === Infinity &&
    nextProseIdx === Infinity &&
    nextBracketIdx === Infinity
  ) {
    return {kind: 'none'}
  }

  if (
    nextDescriptionArgIdx <=
    Math.min(nextPluralIdx, nextOrdinalIdx, nextScalingIdx, nextProseIdx, nextBracketIdx)
  ) {
    if (descriptionArgMatch) {
      return {kind: 'descriptionArg', index: nextDescriptionArgIdx, match: descriptionArgMatch}
    }
  }

  if (nextPluralIdx <= Math.min(nextOrdinalIdx, nextScalingIdx, nextProseIdx, nextBracketIdx)) {
    if (pluralMatch) {
      return {kind: 'plural', index: nextPluralIdx, match: pluralMatch}
    }
  }

  if (nextOrdinalIdx <= Math.min(nextScalingIdx, nextProseIdx, nextBracketIdx)) {
    if (ordinalMatch) {
      return {kind: 'ordinal', index: nextOrdinalIdx, match: ordinalMatch}
    }
  }

  const earliestScaling = Math.min(nextScalingIdx, nextProseIdx)
  if (earliestScaling <= nextBracketIdx) {
    if (nextProseIdx < nextScalingIdx && proseMatch) {
      return {kind: 'prose', index: nextProseIdx, match: proseMatch}
    }
    if (scalingMatch) {
      return {kind: 'scaling', index: nextScalingIdx, match: scalingMatch}
    }
  }

  return {kind: 'bracket', index: nextBracketIdx}
}

function consumeDescriptionArgMatch(
  remaining: string,
  segments: RichSegment[],
  nextMatch: Extract<NextRichMatch, {kind: 'descriptionArg'}>,
  descriptionArgs: Record<string, PublicDescriptionArg> | undefined,
): string {
  if (nextMatch.index > 0) {
    segments.push({type: 'text', value: remaining.slice(0, nextMatch.index)})
  }

  const argToken = extractDescriptionArgToken(nextMatch.match[0])
  const argKey = argToken?.argKey
  if (!argKey || (descriptionArgs && !Object.hasOwn(descriptionArgs, argKey))) {
    segments.push({type: 'text', value: nextMatch.match[0]})
    return remaining.slice(nextMatch.index + nextMatch.match[0].length)
  }

  const arg = descriptionArgs?.[argKey]
  segments.push({
    type: 'descriptionArg',
    argKey,
    channel: argToken.channel,
  })

  let consumedLength = nextMatch.match[0].length
  const suffix = arg?.suffix ?? (arg && 'substatBonus' in arg ? arg.substatBonus?.suffix : '') ?? ''
  const nextCharacter = remaining[nextMatch.index + consumedLength] ?? ''
  if (suffix === '%' && nextCharacter === '%') {
    consumedLength += 1
  } else {
    return remaining.slice(nextMatch.index + consumedLength)
  }

  return remaining.slice(nextMatch.index + consumedLength)
}

function consumePluralMatch(
  remaining: string,
  segments: RichSegment[],
  nextMatch: Extract<NextRichMatch, {kind: 'plural'}>,
  descriptionArgs: Record<string, PublicDescriptionArg> | undefined,
): string {
  if (nextMatch.index > 0) {
    segments.push({type: 'text', value: remaining.slice(0, nextMatch.index)})
  }

  const argToken = nextMatch.match.groups?.argToken
  const parsedArgToken = argToken ? extractDescriptionArgToken(argToken) : null
  const argKey = parsedArgToken?.argKey
  if (!argKey || (descriptionArgs && !Object.hasOwn(descriptionArgs, argKey))) {
    segments.push({type: 'text', value: nextMatch.match[0]})
    return remaining.slice(nextMatch.index + nextMatch.match[0].length)
  }

  segments.push({
    type: 'argPlural',
    argKey,
    channel: parsedArgToken.channel,
    singular: nextMatch.match.groups?.singular ?? '',
    plural: nextMatch.match.groups?.plural ?? '',
  })
  return remaining.slice(nextMatch.index + nextMatch.match[0].length)
}

function consumeOrdinalMatch(
  remaining: string,
  segments: RichSegment[],
  nextMatch: Extract<NextRichMatch, {kind: 'ordinal'}>,
): string {
  if (nextMatch.index > 0) {
    segments.push({type: 'text', value: remaining.slice(0, nextMatch.index)})
  }

  segments.push({type: 'text', value: nextMatch.match.groups?.value ?? nextMatch.match[0]})
  return remaining.slice(nextMatch.index + nextMatch.match[0].length)
}

function consumeScalingMatch(
  remaining: string,
  segments: RichSegment[],
  nextMatch: Extract<NextRichMatch, {kind: 'scaling' | 'prose'}>,
): string {
  if (nextMatch.index > 0) {
    segments.push({type: 'text', value: remaining.slice(0, nextMatch.index)})
  }

  if (nextMatch.kind === 'prose') {
    segments.push({
      type: 'scaling',
      values: [Number(nextMatch.match[1])],
      suffix: nextMatch.match[2],
      stat: nextMatch.match[3],
    })
    return remaining.slice(nextMatch.index + nextMatch.match[0].length)
  }

  const scaling = parseScaling(remaining.slice(nextMatch.index))
  if (!scaling) {
    segments.push({type: 'text', value: remaining})
    return ''
  }
  segments.push(scaling)
  return remaining.slice(nextMatch.index + nextMatch.match[0].length)
}

function toTokenSegment(
  token: string,
  cardNameByLower: ReadonlyMap<string, string>,
  options: NormalizedRichTextParseOptions,
): RichSegment {
  const typedToken = parseTypedReferenceToken(token)
  if (typedToken?.type === 'overlay') {
    return {type: 'mechanic', name: typedToken.name}
  }
  if (typedToken?.type === 'reference') {
    return {
      type: 'skill',
      name: typedToken.name,
      referenceKind: typedToken.referenceKind,
      referenceId: typedToken.referenceId,
      referenceVariantId: typedToken.referenceVariantId,
    }
  }

  const normalizedToken = token.toLowerCase()
  const canonicalCardName = cardNameByLower.get(normalizedToken)
  if (canonicalCardName) {
    if (!options.excludedSkillNamesSet.has(normalizedToken)) {
      return {type: 'skill', name: canonicalCardName}
    }

    if (options.overlayMechanicNamesSet.has(normalizedToken)) {
      return {type: 'mechanic', name: token}
    }

    return {type: 'reference', name: canonicalCardName}
  }
  if (options.plainTextMechanicNamesSet.has(normalizedToken)) {
    return {type: 'text', value: token}
  }
  if (KNOWN_REALMS.has(token)) {
    return {type: 'realm', name: token}
  }
  if (options.overlayMechanicNamesSet.has(normalizedToken)) {
    return {type: 'mechanic', name: token}
  }
  if (isStatToken(token)) {
    return {type: 'stat', name: token}
  }
  return {type: 'mechanic', name: token}
}

function parseTypedReferenceToken(token: string):
  | {type: 'overlay'; name: string}
  | {
      type: 'reference'
      name: string
      referenceKind: RichTextReferenceKind
      referenceId?: string
      referenceVariantId?: string
    }
  | null {
  const separatorIndex = token.indexOf(':')
  if (separatorIndex <= 0 || separatorIndex >= token.length - 1) {
    return null
  }

  const type = token.slice(0, separatorIndex).trim().toLowerCase()
  if (
    type !== 'overlay' &&
    type !== 'derived' &&
    type !== 'derived-skill' &&
    type !== 'orison' &&
    type !== 'relic'
  ) {
    return null
  }

  const payload = token.slice(separatorIndex + 1).trim()
  if (!payload) {
    return null
  }

  if (type === 'overlay') {
    return {type: 'overlay', name: payload}
  }

  if (type === 'orison' || type === 'relic') {
    const separator = payload.indexOf('|')
    if (separator > 0 && separator < payload.length - 1) {
      const selector = payload.slice(0, separator).trim()
      const name = payload.slice(separator + 1).trim()
      const match = /^(\d{4})@v-(\d{4})$/.exec(selector)
      if (match && name) {
        return {
          type: 'reference',
          name,
          referenceKind: type,
          referenceId: `${type}-${match[1]}`,
          referenceVariantId: `${type}-variant-${match[2]}`,
        }
      }
    }
  }

  return {
    type: 'reference',
    name: payload,
    referenceKind: type === 'derived' ? 'derived-skill' : type,
  }
}

function consumeBracketToken(
  remaining: string,
  segments: RichSegment[],
  index: number,
  cardNameByLower: ReadonlyMap<string, string>,
  options: NormalizedRichTextParseOptions,
): string {
  if (index > 0) {
    segments.push({type: 'text', value: remaining.slice(0, index)})
  }

  const bracketContent = remaining.slice(index + 1)
  const closeIdx = bracketContent.indexOf('}')
  if (closeIdx < 0) {
    segments.push({type: 'text', value: '{' + bracketContent})
    return ''
  }

  const token = bracketContent.slice(0, closeIdx).trim()
  if (!token) {
    segments.push({type: 'text', value: '{}'})
    return bracketContent.slice(closeIdx + 1)
  }

  segments.push(toTokenSegment(token, cardNameByLower, options))
  return bracketContent.slice(closeIdx + 1)
}

interface NormalizedRichTextParseOptions {
  excludedSkillNamesSet: Set<string>
  plainTextMechanicNamesSet: Set<string>
  overlayMechanicNamesSet: Set<string>
  bareOverlayMechanicNames: string[]
  enableFollowupLineBreaks: boolean
}

function normalizeParseOptions(
  options: RichTextParseOptions | undefined,
): NormalizedRichTextParseOptions {
  const normalize = (values: Iterable<string> | undefined): Set<string> => {
    const next = new Set<string>()
    for (const value of values ?? []) {
      const normalized = value.trim().toLowerCase()
      if (normalized) {
        next.add(normalized)
      }
    }
    return next
  }

  return {
    ...options,
    excludedSkillNamesSet: normalize(options?.excludedSkillNames),
    plainTextMechanicNamesSet: normalize(options?.plainTextMechanicNames),
    overlayMechanicNamesSet: normalize(options?.overlayMechanicNames),
    bareOverlayMechanicNames: [...new Set(options?.overlayMechanicNames ?? [])]
      .flatMap((value) => {
        const trimmedValue = value.trim()
        return trimmedValue.length > 0 && /\s/.test(trimmedValue) ? [trimmedValue] : []
      })
      .sort((a, b) => b.length - a.length),
    enableFollowupLineBreaks: options?.enableFollowupLineBreaks ?? false,
  }
}

function getTrailingTextContent(segment: RichSegment | undefined): string {
  return segment?.type === 'text' ? segment.value : ''
}

function insertLineBreakAfterBracketedHeadings(segments: RichSegment[]): RichSegment[] {
  return segments.map((segment) => {
    if (segment.type !== 'text') {
      return segment
    }

    return {
      type: 'text',
      value: segment.value.replace(/\.]\s+(?=[^\n])/g, '.]\n'),
    }
  })
}

function insertLineBreakBeforeMechanicFollowups(segments: RichSegment[]): RichSegment[] {
  const nextSegments: RichSegment[] = []

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    const nextSegment = index + 1 < segments.length ? segments[index + 1] : undefined

    const isPlainTextMechanicFollowup =
      segment.type === 'text' &&
      LINE_BREAK_BEFORE_MECHANICS.has(segment.value.trim()) &&
      nextSegment?.type === 'text' &&
      nextSegment.value.startsWith(':')

    const isMechanicFollowup =
      segment.type === 'mechanic' &&
      LINE_BREAK_BEFORE_MECHANICS.has(segment.name) &&
      nextSegment?.type === 'text' &&
      nextSegment.value.startsWith(':')

    if (isMechanicFollowup || isPlainTextMechanicFollowup) {
      const trailingText = getTrailingTextContent(nextSegments[nextSegments.length - 1])
      if (nextSegments.length > 0 && !trailingText.endsWith('\n')) {
        nextSegments.push({type: 'text', value: '\n'})
      }
    }

    nextSegments.push(segment)
  }

  return nextSegments
}

function splitBareOverlayMechanicText(
  text: string,
  options: NormalizedRichTextParseOptions,
): RichSegment[] {
  if (!text || options.bareOverlayMechanicNames.length === 0) {
    return [{type: 'text', value: text}]
  }

  const escaped = options.bareOverlayMechanicNames.map((value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  )
  const pattern = new RegExp(`(?<![\\w{])(${escaped.join('|')})(?![\\w}])`, 'gi')
  const nextSegments: RichSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    const index = match.index
    if (index > lastIndex) {
      nextSegments.push({type: 'text', value: text.slice(lastIndex, index)})
    }
    nextSegments.push({type: 'mechanic', name: match[0]})
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    nextSegments.push({type: 'text', value: text.slice(lastIndex)})
  }

  return nextSegments.length > 0 ? nextSegments : [{type: 'text', value: text}]
}

function normalizeBareOverlayMechanicSegments(
  segments: RichSegment[],
  options: NormalizedRichTextParseOptions,
): RichSegment[] {
  const nextSegments: RichSegment[] = []

  for (const segment of segments) {
    if (segment.type === 'formatting') {
      nextSegments.push({
        ...segment,
        segments: normalizeBareOverlayMechanicSegments(segment.segments, options),
      })
      continue
    }
    if (segment.type !== 'text') {
      nextSegments.push(segment)
      continue
    }

    nextSegments.push(...splitBareOverlayMechanicText(segment.value, options))
  }

  return nextSegments
}

const FORMATTING_TAG_PATTERN = /<(Italic|Bold):/gi

function findFormattingTagClose(text: string, contentStart: number): number {
  const lowerText = text.toLowerCase()
  let depth = 1

  for (let index = contentStart; index < text.length; index += 1) {
    if (lowerText.startsWith('<italic:', index)) {
      depth += 1
      index += '<italic:'.length - 1
      continue
    }
    if (lowerText.startsWith('<bold:', index)) {
      depth += 1
      index += '<bold:'.length - 1
      continue
    }
    if (text[index] !== '>') {
      continue
    }

    depth -= 1
    if (depth === 0) {
      return index
    }
  }

  return -1
}

function parseRichDescriptionTokens(
  text: string,
  context: RichTextParseContext,
  descriptionArgs?: Record<string, PublicDescriptionArg>,
): RichSegment[] {
  const segments: RichSegment[] = []
  let remaining = text
  while (remaining.length > 0) {
    const nextMatch = findNextRichMatch(remaining)
    if (nextMatch.kind === 'none') {
      segments.push({type: 'text', value: remaining})
      break
    }

    remaining =
      nextMatch.kind === 'bracket'
        ? consumeBracketToken(
            remaining,
            segments,
            nextMatch.index,
            context.cardNameByLower,
            context.options,
          )
        : nextMatch.kind === 'descriptionArg'
          ? consumeDescriptionArgMatch(remaining, segments, nextMatch, descriptionArgs)
          : nextMatch.kind === 'plural'
            ? consumePluralMatch(remaining, segments, nextMatch, descriptionArgs)
            : nextMatch.kind === 'ordinal'
              ? consumeOrdinalMatch(remaining, segments, nextMatch)
              : consumeScalingMatch(remaining, segments, nextMatch)
  }
  return segments
}

function parseFormattingSegments(
  text: string,
  context: RichTextParseContext,
  descriptionArgs?: Record<string, PublicDescriptionArg>,
): RichSegment[] {
  const segments: RichSegment[] = []
  let lastIndex = 0
  const formattingTagPattern = new RegExp(
    FORMATTING_TAG_PATTERN.source,
    FORMATTING_TAG_PATTERN.flags,
  )
  let match = formattingTagPattern.exec(text)

  while (match) {
    const closeIndex = findFormattingTagClose(text, formattingTagPattern.lastIndex)
    if (closeIndex < 0) {
      break
    }
    if (match.index > lastIndex) {
      segments.push(
        ...parseRichDescriptionTokens(text.slice(lastIndex, match.index), context, descriptionArgs),
      )
    }

    const style = match[1].toLowerCase() === 'bold' ? 'bold' : 'italic'
    const content = text.slice(formattingTagPattern.lastIndex, closeIndex)
    segments.push({
      type: 'formatting',
      style,
      segments: parseFormattingSegments(content, context, descriptionArgs),
    })
    lastIndex = closeIndex + 1
    formattingTagPattern.lastIndex = lastIndex
    match = formattingTagPattern.exec(text)
  }

  if (lastIndex < text.length) {
    segments.push(...parseRichDescriptionTokens(text.slice(lastIndex), context, descriptionArgs))
  }
  return segments
}

export function buildRichTextParseContext(
  cardNames: ReadonlySet<string>,
  options?: RichTextParseOptions,
): RichTextParseContext {
  const cardNameByLower = new Map<string, string>()
  for (const cardName of cardNames) {
    cardNameByLower.set(cardName.toLowerCase(), cardName)
  }

  return {
    cardNameByLower,
    options: normalizeParseOptions(options),
  }
}

export function parseRichDescriptionWithContext(
  text: string,
  context: RichTextParseContext,
  descriptionArgs?: Record<string, PublicDescriptionArg>,
): RichSegment[] {
  const segments = parseFormattingSegments(text, context, descriptionArgs)

  const normalizedSegments = normalizeBareOverlayMechanicSegments(segments, context.options)

  if (!context.options.enableFollowupLineBreaks) {
    return normalizedSegments
  }

  return insertLineBreakBeforeMechanicFollowups(
    insertLineBreakAfterBracketedHeadings(normalizedSegments),
  )
}

export function parseRichDescription(
  text: string,
  cardNames: ReadonlySet<string>,
  descriptionArgs?: Record<string, PublicDescriptionArg>,
  options?: RichTextParseOptions,
): RichSegment[] {
  return parseRichDescriptionWithContext(
    text,
    buildRichTextParseContext(cardNames, options),
    descriptionArgs,
  )
}
