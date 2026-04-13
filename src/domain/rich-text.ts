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
export interface NewlineSegment {
  type: 'newline'
}
export interface ParagraphSegment {
  type: 'paragraph'
}
export interface LineSegment {
  type: 'line'
  indented: boolean
  segments: RichSegment[]
}
export interface IndentSegment {
  type: 'indent'
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
  | NewlineSegment
  | ParagraphSegment
  | LineSegment
  | IndentSegment

const KNOWN_STAT_LABELS = new Set<string>()

function ensureStatsLoaded() {
  if (KNOWN_STAT_LABELS.size > 0) return
  for (const m of getMainstats()) {
    KNOWN_STAT_LABELS.add(m.label)
    for (const a of m.aliases) KNOWN_STAT_LABELS.add(a)
  }
}

function isStatToken(token: string): boolean {
  ensureStatsLoaded()
  const normalizedToken = token.startsWith('Temporary ')
    ? token.slice('Temporary '.length).trim()
    : token

  // Treat Crit Rate and Crit DMG as tags/mechanics instead of raw stats
  if (
    normalizedToken === 'Crit Rate' ||
    normalizedToken === 'Crit DMG' ||
    normalizedToken.toLowerCase() === 'crit damage'
  ) {
    return false
  }

  if (KNOWN_STAT_LABELS.has(normalizedToken)) {
    return true
  }
  return false
}

const KNOWN_REALMS = new Set(['Chaos', 'Aequor', 'Caro', 'Ultra'])

const SCALING_RE = /\((\d[\d./]*(?:\/\d[\d./]*)*)(%)?\s*(?:\{([^}]+)\}|([A-Z]{2,}))?\)(%)?/
const PROSE_SCALING_RE = /(\d+(?:\.\d+)?)(%)\s+of\s+\{([^}]+)\}/

type NextRichMatch =
  | {kind: 'none'}
  | {kind: 'scaling'; index: number; match: RegExpExecArray}
  | {kind: 'prose'; index: number; match: RegExpExecArray}
  | {kind: 'bracket'; index: number}
  | {kind: 'newline'; index: number}
  | {kind: 'indent'; index: number}

function parseScaling(raw: string): ScalingSegment | null {
  const m = SCALING_RE.exec(raw)
  if (!m) return null
  const nums = m[1].split('/').map(Number)
  if (nums.some(Number.isNaN)) return null
  const pct = m[2] || m[5] || ''
  const stat = m[3] || m[4] || null
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
  const nextNewlineIdx = remaining.indexOf('\n')
  const nextIndentIdx = remaining.indexOf('>')

  const earliest = Math.min(
    nextScalingIdx,
    nextProseIdx,
    nextBracketIdx,
    nextNewlineIdx >= 0 ? nextNewlineIdx : Infinity,
    nextIndentIdx >= 0 ? nextIndentIdx : Infinity,
  )

  if (earliest === Infinity) {
    return {kind: 'none'}
  }

  if (earliest === nextNewlineIdx) return {kind: 'newline', index: nextNewlineIdx}
  if (earliest === nextIndentIdx) return {kind: 'indent', index: nextIndentIdx}
  if (earliest === nextBracketIdx) return {kind: 'bracket', index: nextBracketIdx}

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
    // Если парсинг не удался, потребляем только текущий символ и продолжаем
    segments.push({type: 'text', value: remaining.slice(0, 1)})
    return remaining.slice(1)
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

export function parseRichDescription(
  text: string | undefined | null,
  cardNames: Set<string>,
): RichSegment[] {
  if (!text) return []
  const cleaned = text.replace(/\s*\(\s*([+-]?\d[\d.]*\/Lv)\s*\)/g, ' $1')
  const segments: RichSegment[] = []
  const cardNameByLower = new Map<string, string>()
  for (const cardName of cardNames) {
    cardNameByLower.set(cardName.toLowerCase(), cardName)
  }

  const rawLines = cleaned.split('\n')
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]

    if (line.trim() === '' && i > 0 && i < rawLines.length - 1) {
      segments.push({type: 'paragraph'})
      continue
    }

    if (line.trim() === '') continue

    let indented = false
    let lineText = line
    if (lineText.startsWith('>')) {
      indented = true
      lineText = lineText.slice(1)
      if (lineText.startsWith(' ')) lineText = lineText.slice(1)
    }

    const lineSegments: RichSegment[] = []
    let remaining = lineText
    while (remaining.length > 0) {
      const nextMatch = findNextRichMatch(remaining)
      if (nextMatch.kind === 'none') {
        lineSegments.push({type: 'text', value: remaining})
        break
      }

      if (nextMatch.kind === 'newline') {
        if (nextMatch.index > 0) {
          lineSegments.push({type: 'text', value: remaining.slice(0, nextMatch.index)})
        }
        lineSegments.push({type: 'newline'})
        remaining = remaining.slice(nextMatch.index + 1)
        continue
      }

      if (nextMatch.kind === 'indent') {
        if (nextMatch.index > 0) {
          lineSegments.push({type: 'text', value: remaining.slice(0, nextMatch.index)})
        }
        lineSegments.push({type: 'indent'})
        remaining = remaining.slice(nextMatch.index + 1)
        continue
      }

      remaining =
        nextMatch.kind === 'bracket'
          ? consumeBracketToken(remaining, lineSegments, nextMatch.index, cardNameByLower)
          : consumeScalingMatch(remaining, lineSegments, nextMatch)
    }

    segments.push({
      type: 'line',
      indented,
      segments: lineSegments,
    })
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
  for (const [key, card] of Object.entries(awakener.cards)) {
    names.add(card.name)
    names.add(key)
  }
  names.add(awakener.exalts.exalt.name)
  names.add('exalt')
  names.add(awakener.exalts.over_exalt.name)
  names.add('over_exalt')
  for (const [key, talent] of Object.entries(awakener.talents)) {
    if (talent.name === 'None') continue
    names.add(talent.name)
    names.add(key)
  }
  for (const [key, enlighten] of Object.entries(awakener.enlightens)) {
    names.add(enlighten.name)
    names.add(key)
  }
  return names
}
