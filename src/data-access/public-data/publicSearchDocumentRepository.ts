import type {PublicSearchDocument, PublicSearchIndex} from './contract'
import {publicSearchIndexSchema} from './schemas'
import {
  assertPublicEntityForScope,
  assertPublicScopeCapability,
  type SearchablePublicDataScope,
} from './scopeRegistry'

export interface PublicSearchDocumentRepository {
  getDocuments(): readonly PublicSearchDocument[]
  getDocument(id: string): PublicSearchDocument | undefined
}

/** Adapts one generated public-v3 index to the source-neutral domain search engine. */
export function createPublicSearchDocumentRepository(
  scope: SearchablePublicDataScope,
  searchIndexJson: unknown,
): PublicSearchDocumentRepository {
  let cachedIndex: PublicSearchIndex | undefined
  let cachedDocumentsById: ReadonlyMap<string, PublicSearchDocument> | undefined

  const getIndex = (): PublicSearchIndex => {
    if (cachedIndex) return cachedIndex

    assertPublicScopeCapability(scope, 'search')
    const searchIndex = publicSearchIndexSchema.parse(searchIndexJson)
    if (searchIndex.scope !== scope) {
      throw new Error(
        `Public V3 search index scope "${searchIndex.scope}" does not match requested scope "${scope}".`,
      )
    }

    assertUniqueSearchDocumentIds(scope, searchIndex.records)
    for (const record of searchIndex.records) {
      assertPublicEntityForScope(scope, record.kind, record.id)
    }

    cachedIndex = searchIndex
    return searchIndex
  }

  const getDocuments = (): readonly PublicSearchDocument[] => getIndex().records

  return {
    getDocuments,
    getDocument(id) {
      cachedDocumentsById ??= new Map(getDocuments().map((record) => [record.id, record]))
      return cachedDocumentsById.get(id)
    },
  }
}

function assertUniqueSearchDocumentIds(
  scope: SearchablePublicDataScope,
  records: readonly PublicSearchDocument[],
): void {
  const seenIds = new Set<string>()
  for (const record of records) {
    if (seenIds.has(record.id)) {
      throw new Error(`Public V3 search index "${scope}" contains duplicate id "${record.id}".`)
    }
    seenIds.add(record.id)
  }
}
