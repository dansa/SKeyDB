import {getMainstats} from './mainstats'
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

export type RichSegment =
  | TextSegment
  | SkillSegment
  | StatSegment
  | MechanicSegment
  | RealmSegment
  | ScalingSegment

const KNOWN_STAT_LABELS = new Set<string>()

function ensureStatsLoaded() {
  if (KNOWN_STAT_LABELS.size > 0) return
  for (const m of getMainstats()) {
    KNOWN_STAT_LABELS.add(m.label)
    for (const a of m.aliases) KNOWN_STAT_LABELS.add(a)
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

type NextRichMatch =
  | {kind: 'none'}
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
  const scalingMatch = SCALING_RE.exec(remaining)
  const proseMatch = PROSE_SCALING_RE.exec(remaining)
  const bracketIdx = remaining.indexOf('{')

  const nextScalingIdx = scalingMatch?.index ?? Infinity
  const nextProseIdx =
    proseMatch && COMPUTABLE_STATS.has(proseMatch[3]) ? proseMatch.index : Infinity
  const nextBracketIdx = bracketIdx >= 0 ? bracketIdx : Infinity

  if (nextScalingIdx === Infinity && nextProseIdx === Infinity && nextBracketIdx === Infinity) {
    return {kind: 'none'}
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

function toTokenSegment(token: string, cardNameByLower: Map<string, string>): RichSegment {
  const canonicalCardName = cardNameByLower.get(token.toLowerCase())
  if (canonicalCardName) {
    return {type: 'skill', name: canonicalCardName}
  }
  if (isStatToken(token)) {
    return {type: 'stat', name: token}
  }
  if (KNOWN_REALMS.has(token)) {
    return {type: 'realm', name: token}
  }
  return {type: 'mechanic', name: token}
}

function consumeBracketToken(
  remaining: string,
  segments: RichSegment[],
  index: number,
  cardNameByLower: Map<string, string>,
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

  segments.push(toTokenSegment(token, cardNameByLower))
  return bracketContent.slice(closeIdx + 1)
}

export function parseRichDescription(text: string, cardNames: Set<string>): RichSegment[] {
  const segments: RichSegment[] = []
  const cardNameByLower = new Map<string, string>()
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
        ? consumeBracketToken(remaining, segments, nextMatch.index, cardNameByLower)
        : consumeScalingMatch(remaining, segments, nextMatch)
  }

  return segments
}

export function getCardNamesFromFull(awakener: {
  cards: Record<string, {name: string}>
  exalts: {exalt: {name: string}; over_exalt: {name: string}}
  talents: Record<string, {name: string}>
  enlightens: Record<string, {name: string}>
}): Set<string> {
  const names = new Set<string>()
  for (const card of Object.values(awakener.cards)) {
    names.add(card.name)
  }
  names.add(awakener.exalts.exalt.name)
  names.add(awakener.exalts.over_exalt.name)
  for (const talent of Object.values(awakener.talents)) {
    if (talent.name === 'None') continue
    names.add(talent.name)
  }
  for (const enlighten of Object.values(awakener.enlightens)) {
    names.add(enlighten.name)
  }
  return names
}
