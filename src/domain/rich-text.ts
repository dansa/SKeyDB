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
}
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

export interface RichTextParseOptions {
  excludedSkillNames?: Iterable<string>
  plainTextMechanicNames?: Iterable<string>
  overlayMechanicNames?: Iterable<string>
  enableFollowupLineBreaks?: boolean
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
const DESCRIPTION_ARG_KEY_PATTERN = String.raw`(?:StateArg|DescArg|Arg)\d+|[A-Za-z][A-Za-z0-9_]*`
const DESCRIPTION_ARG_RE = new RegExp(
  String.raw`\[(?:(?<channel>[A-Za-z]+|\{[^}\]]+\}):)?(?<argKey>${DESCRIPTION_ARG_KEY_PATTERN})\]`,
)
const PLURAL_MACRO_RE =
  /\{plural:(?<argToken>\[(?:(?:[A-Za-z]+|\{[^}\]]+\}):)?(?:(?:StateArg|DescArg|Arg)\d+|[A-Za-z][A-Za-z0-9_]*)\])\|(?<singular>[^|{}]+)\|(?<plural>[^{}]+)\}/
const ORDINAL_MACRO_RE = /\{ordinal:(?<value>[^{}]+)\}/

type NextRichMatch =
  | {kind: 'none'}
  | {kind: 'descriptionArg'; index: number; match: RegExpExecArray}
  | {kind: 'plural'; index: number; match: RegExpExecArray}
  | {kind: 'ordinal'; index: number; match: RegExpExecArray}
  | {kind: 'scaling'; index: number; match: RegExpExecArray}
  | {kind: 'prose'; index: number; match: RegExpExecArray}
  | {kind: 'bracket'; index: number}

function normalizeDescriptionArgChannel(channel: string | undefined): string | null {
  if (!channel) {
    return null
  }

  return channel.startsWith('{') && channel.endsWith('}') ? channel.slice(1, -1).trim() : channel
}

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

  const argKey = nextMatch.match.groups?.argKey
  if (!argKey || (descriptionArgs && !Object.hasOwn(descriptionArgs, argKey))) {
    segments.push({type: 'text', value: nextMatch.match[0]})
    return remaining.slice(nextMatch.index + nextMatch.match[0].length)
  }

  const arg = descriptionArgs?.[argKey]
  segments.push({
    type: 'descriptionArg',
    argKey,
    channel: normalizeDescriptionArgChannel(nextMatch.match.groups?.channel),
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
  const argMatch = argToken ? DESCRIPTION_ARG_RE.exec(argToken) : null
  const argKey = argMatch?.groups?.argKey
  if (!argKey || (descriptionArgs && !Object.hasOwn(descriptionArgs, argKey))) {
    segments.push({type: 'text', value: nextMatch.match[0]})
    return remaining.slice(nextMatch.index + nextMatch.match[0].length)
  }

  segments.push({
    type: 'argPlural',
    argKey,
    channel: normalizeDescriptionArgChannel(argMatch.groups?.channel),
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
  cardNameByLower: Map<string, string>,
  options: NormalizedRichTextParseOptions,
): RichSegment {
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

function consumeBracketToken(
  remaining: string,
  segments: RichSegment[],
  index: number,
  cardNameByLower: Map<string, string>,
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
      .map((value) => value.trim())
      .filter((value) => value.length > 0 && /\s/.test(value))
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
    if (segment.type !== 'text') {
      nextSegments.push(segment)
      continue
    }

    nextSegments.push(...splitBareOverlayMechanicText(segment.value, options))
  }

  return nextSegments
}

export function parseRichDescription(
  text: string,
  cardNames: ReadonlySet<string>,
  descriptionArgs?: Record<string, PublicDescriptionArg>,
  options?: RichTextParseOptions,
): RichSegment[] {
  const segments: RichSegment[] = []
  const cardNameByLower = new Map<string, string>()
  const normalizedOptions = normalizeParseOptions(options)
  for (const cardName of cardNames) {
    cardNameByLower.set(cardName.toLowerCase(), cardName)
  }

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
            cardNameByLower,
            normalizedOptions,
          )
        : nextMatch.kind === 'descriptionArg'
          ? consumeDescriptionArgMatch(remaining, segments, nextMatch, descriptionArgs)
          : nextMatch.kind === 'plural'
            ? consumePluralMatch(remaining, segments, nextMatch, descriptionArgs)
            : nextMatch.kind === 'ordinal'
              ? consumeOrdinalMatch(remaining, segments, nextMatch)
              : consumeScalingMatch(remaining, segments, nextMatch)
  }

  const normalizedSegments = normalizeBareOverlayMechanicSegments(segments, normalizedOptions)

  if (!normalizedOptions.enableFollowupLineBreaks) {
    return normalizedSegments
  }

  return insertLineBreakBeforeMechanicFollowups(
    insertLineBreakAfterBracketedHeadings(normalizedSegments),
  )
}
