import Fuse, {type FuseResultMatch} from 'fuse.js'

import {mergeDirectAndFuzzyMatches, toPriority} from './entities/search'
import {
  getBestSearchFieldMatch,
  getNormalizedSearchValues,
  normalizeForSearch,
  type SearchFieldMatchKind,
} from './search-utils'

export type SearchFieldName = 'name' | 'alias' | 'owner' | 'tag' | 'facet' | 'token'

export type SearchFields = Partial<Record<SearchFieldName, readonly string[]>>
type SearchFieldPriorityMap = Record<SearchFieldMatchKind, number>

export interface SearchableEntity {
  id: string
  name: string
}

export interface SearchDocument {
  id: string
  name: string
  aliases?: readonly string[]
  tokens?: readonly string[]
  fields?: Partial<Record<string, readonly string[]>>
}

export type SearchDocumentReader = (id: string) => SearchDocument | undefined

export interface SearchOptions<TEntity extends SearchableEntity> {
  getDocument?: SearchDocumentReader
  getFallbackFields?: (entity: TEntity) => SearchFields
}

export interface SearchResult<TEntity extends SearchableEntity> {
  entity: TEntity
  relevance: number
}

export interface EntitySearch<TEntity extends SearchableEntity> {
  search(entities: TEntity[], query: string): TEntity[]
  searchResults(entities: TEntity[], query: string): SearchResult<TEntity>[]
}

interface IndexedSearchRecord<TEntity extends SearchableEntity> {
  entity: TEntity
  displayName: string
  fields: SearchFields
  normalizedFields: SearchFields
}

interface SearchDirectMatch<TEntity extends SearchableEntity> {
  entity: TEntity
  displayName: string
  fieldName: SearchFieldName
  priority: number
}

interface SearchPriority {
  fieldName: SearchFieldName
  priority: number
}

const FACET_TOKEN_STOPWORD_QUERIES = new Set(['a', 'an', 'of', 'the'])
const SEARCH_PRIORITY_DISABLED = 99
const PRIMARY_DIRECT_PRIORITY_MAX = 5
const SHORT_TAG_QUERY_MIN_LENGTH = 2

const DIRECT_SEARCH_FIELD_ORDER: SearchFieldName[] = [
  'name',
  'alias',
  'owner',
  'tag',
  'facet',
  'token',
]

const FIELD_MATCH_PRIORITIES: Record<SearchFieldName, SearchFieldPriorityMap> = {
  name: {exact: 0, prefix: 1, wordPrefix: 2, contains: 6},
  alias: {exact: 3, prefix: 4, wordPrefix: 5, contains: 7},
  owner: {exact: 8, prefix: 9, wordPrefix: 10, contains: SEARCH_PRIORITY_DISABLED},
  tag: {exact: 13, prefix: 14, wordPrefix: 15, contains: SEARCH_PRIORITY_DISABLED},
  facet: {exact: 18, prefix: 19, wordPrefix: 20, contains: SEARCH_PRIORITY_DISABLED},
  token: {exact: 23, prefix: 24, wordPrefix: 25, contains: SEARCH_PRIORITY_DISABLED},
}

const SINGLE_CHARACTER_FIELDS = new Set<SearchFieldName>(['name', 'alias'])
const STOPWORD_BLOCKED_FIELDS = new Set<SearchFieldName>(['facet', 'token'])

export function createEntitySearch<TEntity extends SearchableEntity>(
  options: SearchOptions<TEntity> = {},
): EntitySearch<TEntity> {
  return {
    search: (entities, query) => searchEntities(entities, query, options),
    searchResults: (entities, query) => searchEntityResults(entities, query, options),
  }
}

export function searchEntities<TEntity extends SearchableEntity>(
  entities: TEntity[],
  query: string,
  options: SearchOptions<TEntity> = {},
): TEntity[] {
  return searchEntityResults(entities, query, options).map((result) => result.entity)
}

export function searchEntityResults<TEntity extends SearchableEntity>(
  entities: TEntity[],
  query: string,
  options: SearchOptions<TEntity> = {},
): SearchResult<TEntity>[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) {
    return entities.map((entity) => ({entity, relevance: 0}))
  }

  const normalizedQuery = normalizeForSearch(trimmedQuery)
  if (normalizedQuery.length === 0) {
    return entities.map((entity) => ({entity, relevance: 0}))
  }

  const indexedEntities = getIndexedSearchRecords(entities, options)
  const directMatchResults = collectDirectMatches(indexedEntities, normalizedQuery)
  const directMatches = getSearchDirectResults(directMatchResults, normalizedQuery.length)

  if (normalizedQuery.length < 4 && directMatches.length > 0) {
    return directMatches
  }

  if (normalizedQuery.length < 3) {
    return directMatches
  }

  if (FACET_TOKEN_STOPWORD_QUERIES.has(normalizedQuery)) {
    return directMatches
  }

  const fuzzyMatches: SearchResult<TEntity>[] = []
  for (const result of getSearchFuse(indexedEntities).search(normalizedQuery)) {
    const score = result.score ?? 1
    if (!isRelevantFuzzyMatch(result.matches ?? [], normalizedQuery, score)) {
      continue
    }
    if (score > 0.52) {
      continue
    }

    fuzzyMatches.push({
      entity: result.item.entity,
      relevance: getFuzzySearchRelevance(score),
    })
  }

  if (directMatches.length === 0) {
    return fuzzyMatches
  }

  return mergeDirectAndFuzzyMatches(directMatches, fuzzyMatches, (result) => result.entity.id)
}

function collectDirectMatches<TEntity extends SearchableEntity>(
  records: IndexedSearchRecord<TEntity>[],
  normalizedQuery: string,
): SearchDirectMatch<TEntity>[] {
  const matches: SearchDirectMatch<TEntity>[] = []

  for (const record of records) {
    const priorityMatch = getSearchPriority(record, normalizedQuery)
    if (priorityMatch === null) {
      continue
    }

    matches.push({
      displayName: record.displayName,
      entity: record.entity,
      fieldName: priorityMatch.fieldName,
      priority: priorityMatch.priority,
    })
  }

  return matches.sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority
    }

    return left.displayName.localeCompare(right.displayName, undefined, {
      sensitivity: 'base',
    })
  })
}

function getSearchDirectResults<TEntity extends SearchableEntity>(
  matches: SearchDirectMatch<TEntity>[],
  queryLength: number,
): SearchResult<TEntity>[] {
  const hasPrimaryMatch = matches.some(isPrimaryDirectMatch)
  if (queryLength < 3 && hasPrimaryMatch) {
    const results: SearchResult<TEntity>[] = []
    for (const match of matches) {
      if (shouldKeepShortDirectMatch(match, queryLength, hasPrimaryMatch)) {
        results.push({entity: match.entity, relevance: match.priority})
      }
    }
    return results
  }

  return matches.map((match) => ({entity: match.entity, relevance: match.priority}))
}

function isPrimaryDirectMatch<TEntity extends SearchableEntity>(
  match: SearchDirectMatch<TEntity>,
): boolean {
  return match.priority <= PRIMARY_DIRECT_PRIORITY_MAX
}

function shouldKeepShortDirectMatch<TEntity extends SearchableEntity>(
  match: SearchDirectMatch<TEntity>,
  queryLength: number,
  hasPrimaryMatch: boolean,
): boolean {
  if (queryLength >= 3 || !hasPrimaryMatch) {
    return true
  }
  if (isPrimaryDirectMatch(match)) {
    return true
  }
  return queryLength >= SHORT_TAG_QUERY_MIN_LENGTH && match.fieldName === 'tag'
}

function getFuzzySearchRelevance(score: number): number {
  return 30 + score
}

function getIndexedSearchRecords<TEntity extends SearchableEntity>(
  entities: TEntity[],
  options: SearchOptions<TEntity>,
): IndexedSearchRecord<TEntity>[] {
  return entities.map((entity) => {
    const document = options.getDocument?.(entity.id)
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
}

function getSearchFuse<TEntity extends SearchableEntity>(
  records: IndexedSearchRecord<TEntity>[],
): Fuse<IndexedSearchRecord<TEntity>> {
  return new Fuse(records, {
    threshold: 0.58,
    ignoreLocation: true,
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2,
    keys: [
      {name: 'normalizedFields.name', weight: 0.48},
      {name: 'normalizedFields.alias', weight: 0.22},
    ],
  })
}

function fieldsFromDocument(
  document: SearchDocument | undefined,
  entity: SearchableEntity,
): SearchFields {
  if (!document) {
    return {name: [entity.name]}
  }

  if (!documentMatchesEntity(document, entity)) {
    return {name: [entity.name]}
  }

  return {
    name: uniqueSearchValues([entity.name, ...(document.fields?.name ?? [document.name])]),
    alias: document.fields?.alias ?? document.aliases,
    owner: document.fields?.owner,
    tag: document.fields?.tag,
    facet: document.fields?.facet,
    token: document.tokens,
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
  return Object.fromEntries(Object.entries(merged).filter(([, values]) => values.length > 0))
}

function normalizeSearchFields(fields: SearchFields): SearchFields {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldName, values]) => [
      fieldName,
      getNormalizedSearchValues(values),
    ]),
  )
}

function getSearchPriority<TEntity extends SearchableEntity>(
  record: IndexedSearchRecord<TEntity>,
  normalizedQuery: string,
): SearchPriority | null {
  let bestPriority: SearchPriority | null = null

  for (const fieldName of DIRECT_SEARCH_FIELD_ORDER) {
    const priority = toPriority(
      getBestSearchFieldMatch(record.fields[fieldName], normalizedQuery),
      getFieldPriorityMap(fieldName, normalizedQuery),
      {ignorePriorityAtOrAbove: 99},
    )

    if (priority === null) {
      continue
    }

    if (bestPriority === null || priority < bestPriority.priority) {
      bestPriority = {fieldName, priority}
    }
  }

  return bestPriority
}

function getFieldPriorityMap(
  fieldName: SearchFieldName,
  normalizedQuery: string,
): SearchFieldPriorityMap {
  const queryLength = normalizedQuery.length
  if (queryLength === 1 && !SINGLE_CHARACTER_FIELDS.has(fieldName)) {
    return getDisabledFieldPriorityMap()
  }
  if (FACET_TOKEN_STOPWORD_QUERIES.has(normalizedQuery) && STOPWORD_BLOCKED_FIELDS.has(fieldName)) {
    return getDisabledFieldPriorityMap()
  }

  const priorities = FIELD_MATCH_PRIORITIES[fieldName]
  return queryLength < 3 ? {...priorities, contains: SEARCH_PRIORITY_DISABLED} : priorities
}

function getDisabledFieldPriorityMap(): SearchFieldPriorityMap {
  return {
    exact: SEARCH_PRIORITY_DISABLED,
    prefix: SEARCH_PRIORITY_DISABLED,
    wordPrefix: SEARCH_PRIORITY_DISABLED,
    contains: SEARCH_PRIORITY_DISABLED,
  }
}

function documentMatchesEntity(document: SearchDocument, entity: SearchableEntity): boolean {
  const normalizedEntityName = normalizeForSearch(entity.name)
  const documentNames = uniqueSearchValues([document.name, ...(document.fields?.name ?? [])])

  return documentNames.some((name) => normalizeForSearch(name) === normalizedEntityName)
}

function isRelevantFuzzyMatch(
  matches: readonly FuseResultMatch[],
  normalizedQuery: string,
  score: number,
): boolean {
  for (const match of matches) {
    if (!isTypoTolerantSearchField(match.key) || typeof match.value !== 'string') {
      continue
    }

    if (isSingleTokenFuzzyFieldCandidate(match.value, normalizedQuery, score)) {
      return true
    }
  }

  return false
}

function isTypoTolerantSearchField(key: string | undefined): boolean {
  return key === 'normalizedFields.name' || key === 'normalizedFields.alias'
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
