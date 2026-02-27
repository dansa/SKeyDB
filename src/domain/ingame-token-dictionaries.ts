import awakenersCanonical from '../data/ingame-tokens/awakeners.json'
import possesCanonical from '../data/ingame-tokens/posses.json'
import wheelsCanonical from '../data/ingame-tokens/wheels.json'
import { getAwakeners } from './awakeners'
import { getCovenants } from './covenants'
import { getPosses } from './posses'
import { getWheels } from './wheels'

export type IngameTokenCategory = 'awakeners' | 'wheels' | 'covenants' | 'posses'

export type CanonicalTokenEntry = {
  id: string
  token: string
}

export type IngameDictionaryIssue = {
  category: IngameTokenCategory
  kind: 'duplicate_token' | 'missing_token_for_id' | 'unknown_source_id'
  id?: string
  token?: string
}

export type IngameTokenDictionaryBuildResult = {
  byIdToken: Map<string, string>
  byTokenId: Map<string, string>
  issues: IngameDictionaryIssue[]
}

type BuildTokenDictionaryInput = {
  category: IngameTokenCategory
  ids: string[]
  sourceEntries: CanonicalTokenEntry[]
}

const canonicalAwakenerEntries: CanonicalTokenEntry[] = awakenersCanonical
const canonicalPosseEntries: CanonicalTokenEntry[] = possesCanonical
const canonicalWheelEntries: CanonicalTokenEntry[] = wheelsCanonical

export function buildTokenDictionaryFromEntries({
  category,
  ids,
  sourceEntries,
}: BuildTokenDictionaryInput): IngameTokenDictionaryBuildResult {
  const issues: IngameDictionaryIssue[] = []
  const allowedIds = new Set(ids)
  const provisionalByIdToken = new Map<string, string>()
  const provisionalByTokenIds = new Map<string, string[]>()

  for (const entry of sourceEntries) {
    if (!entry.id || !entry.token) {
      continue
    }

    if (!allowedIds.has(entry.id)) {
      issues.push({ category, kind: 'unknown_source_id', id: entry.id, token: entry.token })
      continue
    }

    provisionalByIdToken.set(entry.id, entry.token)
    const existingTokenIds = provisionalByTokenIds.get(entry.token) ?? []
    existingTokenIds.push(entry.id)
    provisionalByTokenIds.set(entry.token, existingTokenIds)
  }

  const byIdToken = new Map<string, string>(provisionalByIdToken)
  const byTokenId = new Map<string, string>()

  for (const [token, mappedIds] of provisionalByTokenIds) {
    if (mappedIds.length > 1) {
      issues.push({ category, kind: 'duplicate_token', token })
      continue
    }
    byTokenId.set(token, mappedIds[0])
  }

  for (const id of ids) {
    if (!byIdToken.has(id)) {
      issues.push({ category, kind: 'missing_token_for_id', id })
    }
  }

  return {
    byIdToken,
    byTokenId,
    issues,
  }
}

export type IngameTokenDictionaries = {
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
    ids: awakeners.map((awakener) => String(awakener.id)),
    sourceEntries: canonicalAwakenerEntries,
  })

  const wheelDictionary = buildTokenDictionaryFromEntries({
    category: 'wheels',
    ids: wheels.map((wheel) => wheel.id),
    sourceEntries: canonicalWheelEntries,
  })

  const covenantDictionary = buildTokenDictionaryFromEntries({
    category: 'covenants',
    ids: covenants.map((covenant) => covenant.id),
    sourceEntries: [],
  })

  const posseDictionary = buildTokenDictionaryFromEntries({
    category: 'posses',
    ids: posses.map((posse) => posse.id),
    sourceEntries: canonicalPosseEntries,
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
