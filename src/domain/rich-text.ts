import { getMainstats } from './mainstats'
import { COMPUTABLE_STATS } from './scaling'

export type TextSegment = { type: 'text'; value: string }
export type SkillSegment = { type: 'skill'; name: string }
export type StatSegment = { type: 'stat'; name: string }
export type MechanicSegment = { type: 'mechanic'; name: string }
export type RealmSegment = { type: 'realm'; name: string }
export type ScalingSegment = {
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
  return KNOWN_STAT_LABELS.has(token)
}

const KNOWN_REALMS = new Set(['Chaos', 'Aequor', 'Caro', 'Ultra'])

const SCALING_RE = /\(([0-9.]+(?:\/[0-9.]+)+)(%)?\s*(?:\{([^}]+)\})?\)/
const PROSE_SCALING_RE = /([0-9]+(?:\.[0-9]+)?)(%)\s+of\s+\{([^}]+)\}/

function parseScaling(raw: string): ScalingSegment | null {
  const m = SCALING_RE.exec(raw)
  if (!m) return null
  const nums = m[1].split('/').map(Number)
  if (nums.some(Number.isNaN)) return null
  const pct = m[2] ?? ''
  const stat = m[3] ?? null
  return { type: 'scaling', values: nums, suffix: pct, stat }
}

export function parseRichDescription(
  text: string,
  cardNames: Set<string>,
): RichSegment[] {
  const segments: RichSegment[] = []

  let remaining = text
  while (remaining.length > 0) {
    const scalingMatch = SCALING_RE.exec(remaining)
    const proseMatch = PROSE_SCALING_RE.exec(remaining)
    const bracketIdx = remaining.indexOf('{')

    const nextScalingIdx = scalingMatch?.index ?? Infinity
    const nextProseIdx = proseMatch && COMPUTABLE_STATS.has(proseMatch[3]) ? proseMatch.index : Infinity
    const nextBracketIdx = bracketIdx >= 0 ? bracketIdx : Infinity

    if (nextScalingIdx === Infinity && nextProseIdx === Infinity && nextBracketIdx === Infinity) {
      segments.push({ type: 'text', value: remaining })
      break
    }

    const earliestScaling = Math.min(nextScalingIdx, nextProseIdx)
    if (earliestScaling <= nextBracketIdx) {
      if (earliestScaling > 0) {
        segments.push({ type: 'text', value: remaining.slice(0, earliestScaling) })
      }
      if (nextProseIdx < nextScalingIdx) {
        const nums = [Number(proseMatch![1])]
        const pct = proseMatch![2]
        const stat = proseMatch![3]
        segments.push({ type: 'scaling', values: nums, suffix: pct, stat })
        remaining = remaining.slice(nextProseIdx + proseMatch![0].length)
      } else {
        const scaling = parseScaling(remaining.slice(nextScalingIdx))!
        segments.push(scaling)
        remaining = remaining.slice(nextScalingIdx + scalingMatch![0].length)
      }
      continue
    }

    if (nextBracketIdx > 0) {
      segments.push({ type: 'text', value: remaining.slice(0, nextBracketIdx) })
    }
    remaining = remaining.slice(nextBracketIdx + 1)

    const closeIdx = remaining.indexOf('}')
    if (closeIdx < 0) {
      segments.push({ type: 'text', value: '{' + remaining })
      break
    }

    const token = remaining.slice(0, closeIdx).trim()
    remaining = remaining.slice(closeIdx + 1)

    if (!token) {
      segments.push({ type: 'text', value: '{}' })
      continue
    }

    if (cardNames.has(token)) {
      segments.push({ type: 'skill', name: token })
    } else if (isStatToken(token)) {
      segments.push({ type: 'stat', name: token })
    } else if (KNOWN_REALMS.has(token)) {
      segments.push({ type: 'realm', name: token })
    } else {
      segments.push({ type: 'mechanic', name: token })
    }
  }

  return segments
}

export function getCardNamesFromFull(awakener: {
  cards: Record<string, { name: string }>
  exalts: { exalt: { name: string }; over_exalt: { name: string } }
  talents: Record<string, { name: string }>
  enlightens: Record<string, { name: string }>
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
