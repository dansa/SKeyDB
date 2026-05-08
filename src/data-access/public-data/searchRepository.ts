import searchAwakenersJson from '@/data/public-v3/indexes/search-awakeners.json'
import searchCovenantsJson from '@/data/public-v3/indexes/search-covenants.json'
import searchPossesJson from '@/data/public-v3/indexes/search-posses.json'
import searchRelicsJson from '@/data/public-v3/indexes/search-relics.json'
import searchWheelsJson from '@/data/public-v3/indexes/search-wheels.json'

import {getOrCreateMapValue} from './cache'
import type {PublicSearchDocument, PublicSearchIndex} from './contract'
import {publicSearchIndexSchema} from './schemas'
import {
  assertPublicEntityForScope,
  assertPublicScopeCapability,
  type SearchablePublicDataScope,
} from './scopeRegistry'

const searchJsonByScope = {
  awakeners: searchAwakenersJson,
  covenants: searchCovenantsJson,
  posses: searchPossesJson,
  relics: searchRelicsJson,
  wheels: searchWheelsJson,
} satisfies Record<SearchablePublicDataScope, unknown>

const searchCache = new Map<SearchablePublicDataScope, PublicSearchIndex>()
const searchDocumentByIdCache = new Map<
  SearchablePublicDataScope,
  Map<string, PublicSearchDocument>
>()

function getPublicSearchIndex(scope: SearchablePublicDataScope): PublicSearchIndex {
  assertPublicScopeCapability(scope, 'search')
  const searchJson = searchJsonByScope[scope]
  return getOrCreateMapValue(searchCache, scope, () => {
    const searchIndex = publicSearchIndexSchema.parse(searchJson)
    if (searchIndex.scope !== scope) {
      throw new Error(
        `Public V3 search index scope "${searchIndex.scope}" does not match requested scope "${scope}".`,
      )
    }
    for (const record of searchIndex.records) {
      assertPublicEntityForScope(scope, record.kind, record.id)
    }
    return searchIndex
  })
}

export function getPublicSearchDocuments(scope: SearchablePublicDataScope): PublicSearchDocument[] {
  return getPublicSearchIndex(scope).records
}

export function getPublicSearchDocument(
  scope: SearchablePublicDataScope,
  id: string,
): PublicSearchDocument | undefined {
  return getPublicSearchDocumentMap(scope).get(id)
}

function getPublicSearchDocumentMap(
  scope: SearchablePublicDataScope,
): Map<string, PublicSearchDocument> {
  const cached = searchDocumentByIdCache.get(scope)
  if (cached) {
    return cached
  }

  const map = new Map(getPublicSearchDocuments(scope).map((record) => [record.id, record]))
  searchDocumentByIdCache.set(scope, map)
  return map
}
