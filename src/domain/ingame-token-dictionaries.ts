import {getAwakeners} from './awakeners'
import {getCovenants} from './covenants'
import {getPosses} from './posses'
import {getWheels} from './wheels'

export type IngameTokenCategory = 'awakeners' | 'wheels' | 'covenants' | 'posses'

export interface LineupTokenEntry {
  id: string
  lineupToken: string
}

export interface IngameDictionaryIssue {
  category: IngameTokenCategory
  kind: 'duplicate_token'
  token?: string
}

export interface IngameTokenDictionaryBuildResult {
  byIdToken: Map<string, string>
  byTokenId: Map<string, string>
  issues: IngameDictionaryIssue[]
}

interface BuildTokenDictionaryInput {
  category: IngameTokenCategory
  entries: LineupTokenEntry[]
}

export function buildTokenDictionaryFromEntries({
  category,
  entries,
}: BuildTokenDictionaryInput): IngameTokenDictionaryBuildResult {
  const issues: IngameDictionaryIssue[] = []
  const provisionalByIdToken = new Map<string, string>()
  const provisionalByTokenIds = new Map<string, string[]>()

  for (const entry of entries) {
    if (!entry.id || !entry.lineupToken) {
      continue
    }

    provisionalByIdToken.set(entry.id, entry.lineupToken)
    const existingTokenIds = provisionalByTokenIds.get(entry.lineupToken) ?? []
    existingTokenIds.push(entry.id)
    provisionalByTokenIds.set(entry.lineupToken, existingTokenIds)
  }

  const byIdToken = new Map<string, string>(provisionalByIdToken)
  const byTokenId = new Map<string, string>()

  for (const [token, mappedIds] of provisionalByTokenIds) {
    if (mappedIds.length > 1) {
      issues.push({category, kind: 'duplicate_token', token})
      continue
    }
    byTokenId.set(token, mappedIds[0])
  }

  return {
    byIdToken,
    byTokenId,
    issues,
  }
}

export interface IngameTokenDictionaries {
  awakeners: IngameTokenDictionaryBuildResult
  wheels: IngameTokenDictionaryBuildResult
  covenants: IngameTokenDictionaryBuildResult
  posses: IngameTokenDictionaryBuildResult
  issues: IngameDictionaryIssue[]
}

export function buildIngameTokenDictionaries(): IngameTokenDictionaries {
  const awakeners = getAwakeners()
  const wheels = getWheels()
  const covenants = getCovenants()
  const posses = getPosses()

  const awakenerDictionary = buildTokenDictionaryFromEntries({
    category: 'awakeners',
    entries: awakeners.map((awakener) => ({
      id: awakener.id,
      lineupToken: awakener.lineupToken,
    })),
  })

  const wheelDictionary = buildTokenDictionaryFromEntries({
    category: 'wheels',
    entries: wheels.map((wheel) => ({
      id: wheel.id,
      lineupToken: wheel.lineupToken,
    })),
  })

  const covenantDictionary = buildTokenDictionaryFromEntries({
    category: 'covenants',
    entries: covenants.map((covenant) => ({
      id: covenant.id,
      lineupToken: covenant.lineupToken,
    })),
  })

  const posseDictionary = buildTokenDictionaryFromEntries({
    category: 'posses',
    entries: posses.map((posse) => ({
      id: posse.id,
      lineupToken: posse.lineupToken,
    })),
  })

  return {
    awakeners: awakenerDictionary,
    wheels: wheelDictionary,
    covenants: covenantDictionary,
    posses: posseDictionary,
    issues: [
      ...awakenerDictionary.issues,
      ...wheelDictionary.issues,
      ...covenantDictionary.issues,
      ...posseDictionary.issues,
    ],
  }
}
