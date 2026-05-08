import Fuse from 'fuse.js'

import type {PublicSearchDocument} from '@/data-access/public-data/contract'
import type {SearchablePublicDataScope} from '@/data-access/public-data/scopeRegistry'
import {getPublicSearchDocument} from '@/data-access/public-data/searchRepository'

import {collectDirectMatches, mergeDirectAndFuzzyMatches, toPriority} from './entities/search'
import {
  getBestSearchFieldMatch,
  getNormalizedSearchValues,
  normalizeForSearch,
  type SearchFieldMatchKind,
} from './search-utils'

type SearchFieldName = 'name' | 'alias' | 'owner' | 'tag' | 'facet'

type SearchFields = Partial<Record<SearchFieldName, string[]>>

interface PublicSearchableEntity {
  id: string
  name: string
}

interface PublicSearchOptions<TEntity extends PublicSearchableEntity> {
  getFallbackFields?: (entity: TEntity) => SearchFields
}

interface IndexedPublicSearchRecord<TEntity extends PublicSearchableEntity> {
  entity: TEntity
  displayName: string
  fields: SearchFields
  normalizedFields: SearchFields
}

const indexedSearchCache = new WeakMap<
  readonly PublicSearchableEntity[],
  Map<SearchablePublicDataScope, IndexedPublicSearchRecord<PublicSearchableEntity>[]>
>()
const fuseSearchCache = new WeakMap<
  readonly PublicSearchableEntity[],
  Map<SearchablePublicDataScope, Fuse<IndexedPublicSearchRecord<PublicSearchableEntity>>>
>()

export function searchPublicEntities<TEntity extends PublicSearchableEntity>(
  scope: SearchablePublicDataScope,
  entities: TEntity[],
  query: string,
  options: PublicSearchOptions<TEntity> = {},
): TEntity[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) {
    return entities
  }

  const normalizedQuery = normalizeForSearch(trimmedQuery)
  if (normalizedQuery.length === 0) {
    return entities
  }

  const indexedEntities = getIndexedPublicSearchRecords(scope, entities, options)
  const directMatches = collectDirectMatches({
    records: indexedEntities,
    getPriority: (record) => getPublicSearchPriority(record, normalizedQuery),
    getDisplayName: (record) => record.displayName,
    getEntity: (record) => record.entity,
  })

  if (normalizedQuery.length < 4 && directMatches.length > 0) {
    return directMatches
  }

  if (normalizedQuery.length < 3) {
    return directMatches
  }

  const fuzzyMatches = getPublicSearchFuse(scope, entities, options)
    .search(normalizedQuery)
    .filter((result) => isRelevantPublicFuzzyMatch(result.item, normalizedQuery, result.score ?? 1))
    .filter((result) => (result.score ?? 1) <= 0.52)
    .map((result) => result.item.entity as TEntity)

  if (directMatches.length === 0) {
    return fuzzyMatches
  }

  return mergeDirectAndFuzzyMatches(directMatches, fuzzyMatches, (entity) => entity.id)
}

function getIndexedPublicSearchRecords<TEntity extends PublicSearchableEntity>(
  scope: SearchablePublicDataScope,
  entities: TEntity[],
  options: PublicSearchOptions<TEntity>,
): IndexedPublicSearchRecord<TEntity>[] {
  const cachedByScope = indexedSearchCache.get(entities)
  const cached = cachedByScope?.get(scope)
  if (cached) {
    return cached as IndexedPublicSearchRecord<TEntity>[]
  }

  const indexed = entities.map((entity) => {
    const document = getPublicSearchDocument(scope, entity.id)
    const fields = mergeSearchFields(
      fieldsFromDocument(document, entity),
      options.getFallbackFields?.(entity) ?? {},
    )
    return {
      entity,
      displayName: entity.name,
      fields,
      normalizedFields: normalizeSearchFields(fields),
    }
  })

  const nextByScope: Map<
    SearchablePublicDataScope,
    IndexedPublicSearchRecord<PublicSearchableEntity>[]
  > =
    cachedByScope ??
    new Map<SearchablePublicDataScope, IndexedPublicSearchRecord<PublicSearchableEntity>[]>()
  nextByScope.set(scope, indexed as IndexedPublicSearchRecord<PublicSearchableEntity>[])
  indexedSearchCache.set(entities, nextByScope)
  return indexed
}

function getPublicSearchFuse<TEntity extends PublicSearchableEntity>(
  scope: SearchablePublicDataScope,
  entities: TEntity[],
  options: PublicSearchOptions<TEntity>,
): Fuse<IndexedPublicSearchRecord<PublicSearchableEntity>> {
  const cachedByScope = fuseSearchCache.get(entities)
  const cached = cachedByScope?.get(scope)
  if (cached) {
    return cached
  }

  const fuse = new Fuse(
    getIndexedPublicSearchRecords(
      scope,
      entities,
      options,
    ) as IndexedPublicSearchRecord<PublicSearchableEntity>[],
    {
      threshold: 0.58,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 2,
      keys: [
        {name: 'normalizedFields.name', weight: 0.48},
        {name: 'normalizedFields.alias', weight: 0.22},
        {name: 'normalizedFields.owner', weight: 0.16},
        {name: 'normalizedFields.tag', weight: 0.08},
        {name: 'normalizedFields.facet', weight: 0.06},
      ],
    },
  )

  const nextByScope: Map<
    SearchablePublicDataScope,
    Fuse<IndexedPublicSearchRecord<PublicSearchableEntity>>
  > = cachedByScope ??
  new Map<SearchablePublicDataScope, Fuse<IndexedPublicSearchRecord<PublicSearchableEntity>>>()
  nextByScope.set(scope, fuse)
  fuseSearchCache.set(entities, nextByScope)
  return fuse
}

function fieldsFromDocument(
  document: PublicSearchDocument | undefined,
  entity: PublicSearchableEntity,
): SearchFields {
  if (!document) {
    return {name: [entity.name]}
  }

  if (!documentMatchesEntity(document, entity)) {
    return {name: [entity.name]}
  }

  return {
    name: uniqueSearchValues([entity.name, ...(document.fields.name ?? [document.name])]),
    alias: document.fields.alias ?? document.aliases,
    owner: document.fields.owner,
    tag: document.fields.tag,
    facet: document.fields.facet,
  }
}

function mergeSearchFields(...fieldSets: SearchFields[]): SearchFields {
  const merged: SearchFields = {}
  for (const fields of fieldSets) {
    for (const fieldName of Object.keys(fields) as SearchFieldName[]) {
      const values = fields[fieldName]
      if (!values) {
        continue
      }
      merged[fieldName] = uniqueSearchValues([...(merged[fieldName] ?? []), ...values])
    }
  }
  return Object.fromEntries(
    Object.entries(merged).filter(([, values]) => values.length > 0),
  ) as SearchFields
}

function normalizeSearchFields(fields: SearchFields): SearchFields {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldName, values]) => [
      fieldName,
      getNormalizedSearchValues(values),
    ]),
  ) as SearchFields
}

function getPublicSearchPriority<TEntity extends PublicSearchableEntity>(
  record: IndexedPublicSearchRecord<TEntity>,
  normalizedQuery: string,
): number | null {
  const priorities = (['name', 'alias', 'owner', 'tag', 'facet'] as const)
    .map((fieldName) =>
      toPriority(
        getBestSearchFieldMatch(record.fields[fieldName], normalizedQuery),
        getFieldPriorityMap(fieldName, normalizedQuery.length),
        {ignorePriorityAtOrAbove: 99},
      ),
    )
    .filter((priority): priority is number => priority !== null)

  return priorities.length > 0 ? Math.min(...priorities) : null
}

function getFieldPriorityMap(
  fieldName: SearchFieldName,
  queryLength: number,
): Record<SearchFieldMatchKind, number> {
  const shortContainsPriority = queryLength < 3 ? 99 : undefined
  if (fieldName === 'name') {
    return {
      exact: 0,
      prefix: 1,
      wordPrefix: 2,
      contains: shortContainsPriority ?? 6,
    }
  }
  if (fieldName === 'alias') {
    return {
      exact: 3,
      prefix: 4,
      wordPrefix: 5,
      contains: shortContainsPriority ?? 7,
    }
  }
  if (queryLength === 1) {
    return {exact: 99, prefix: 99, wordPrefix: 99, contains: 99}
  }
  if (fieldName === 'owner') {
    return {exact: 8, prefix: 9, wordPrefix: 10, contains: 99}
  }
  if (queryLength < 3) {
    return {
      exact: fieldName === 'tag' ? 13 : 18,
      prefix: 99,
      wordPrefix: 99,
      contains: 99,
    }
  }
  if (fieldName === 'tag') {
    return {exact: 13, prefix: 14, wordPrefix: 15, contains: 99}
  }
  return {exact: 18, prefix: 19, wordPrefix: 20, contains: 99}
}

function documentMatchesEntity(
  document: PublicSearchDocument,
  entity: PublicSearchableEntity,
): boolean {
  const normalizedEntityName = normalizeForSearch(entity.name)
  const documentNames = uniqueSearchValues([document.name, ...(document.fields.name ?? [])])

  return documentNames.some((name) => normalizeForSearch(name) === normalizedEntityName)
}

function isRelevantPublicFuzzyMatch<TEntity extends PublicSearchableEntity>(
  record: IndexedPublicSearchRecord<TEntity>,
  normalizedQuery: string,
  score: number,
): boolean {
  const typoTolerantFields = [
    ...(record.normalizedFields.name ?? []),
    ...(record.normalizedFields.alias ?? []),
  ]
  return typoTolerantFields.some((field) =>
    isSingleTokenFuzzyFieldCandidate(field, normalizedQuery, score),
  )
}

function isSingleTokenFuzzyFieldCandidate(
  field: string,
  normalizedQuery: string,
  score: number,
): boolean {
  if (field.length === 0 || normalizedQuery.length === 0) {
    return false
  }

  const queryPrefixLength = normalizedQuery.length >= 4 ? 2 : 1
  if (field.startsWith(normalizedQuery.slice(0, queryPrefixLength))) {
    return true
  }

  return score <= 0.25
}

function uniqueSearchValues(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const uniqueValues: string[] = []

  for (const value of values) {
    const trimmedValue = value.trim()
    if (!trimmedValue || seen.has(trimmedValue)) {
      continue
    }

    seen.add(trimmedValue)
    uniqueValues.push(trimmedValue)
  }

  return uniqueValues
}
