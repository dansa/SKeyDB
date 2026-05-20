import Fuse, {type FuseResultMatch} from 'fuse.js'

import type {PublicSearchDocument} from '@/data-access/public-data/contract'
import type {SearchablePublicDataScope} from '@/data-access/public-data/scopeRegistry'
import {getPublicSearchDocument} from '@/data-access/public-data/searchRepository'

import {mergeDirectAndFuzzyMatches, toPriority} from './entities/search'
import {
  getBestSearchFieldMatch,
  getNormalizedSearchValues,
  normalizeForSearch,
  type SearchFieldMatchKind,
} from './search-utils'

type SearchFieldName = 'name' | 'alias' | 'owner' | 'tag' | 'facet' | 'token'

type SearchFields = Partial<Record<SearchFieldName, string[]>>
type SearchFieldPriorityMap = Record<SearchFieldMatchKind, number>

export interface PublicSearchableEntity {
  id: string
  name: string
}

export interface PublicSearchOptions<TEntity extends PublicSearchableEntity> {
  getFallbackFields?: (entity: TEntity) => SearchFields
}

export interface PublicSearchResult<TEntity extends PublicSearchableEntity> {
  entity: TEntity
  relevance: number
}

interface IndexedPublicSearchRecord<TEntity extends PublicSearchableEntity> {
  entity: TEntity
  displayName: string
  fields: SearchFields
  normalizedFields: SearchFields
}

interface PublicSearchDirectMatch<TEntity extends PublicSearchableEntity> {
  entity: TEntity
  fieldName: SearchFieldName
  priority: number
}

interface PublicSearchPriority {
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

export function searchPublicEntities<TEntity extends PublicSearchableEntity>(
  scope: SearchablePublicDataScope,
  entities: TEntity[],
  query: string,
  options: PublicSearchOptions<TEntity> = {},
): TEntity[] {
  return searchPublicEntityResults(scope, entities, query, options).map((result) => result.entity)
}

export function searchPublicEntityResults<TEntity extends PublicSearchableEntity>(
  scope: SearchablePublicDataScope,
  entities: TEntity[],
  query: string,
  options: PublicSearchOptions<TEntity> = {},
): PublicSearchResult<TEntity>[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) {
    return entities.map((entity) => ({entity, relevance: 0}))
  }

  const normalizedQuery = normalizeForSearch(trimmedQuery)
  if (normalizedQuery.length === 0) {
    return entities.map((entity) => ({entity, relevance: 0}))
  }

  const indexedEntities = getIndexedPublicSearchRecords(scope, entities, options)
  const directMatchResults = collectPublicDirectMatches(indexedEntities, normalizedQuery)
  const directMatches = getPublicSearchDirectResults(directMatchResults, normalizedQuery.length)

  if (normalizedQuery.length < 4 && directMatches.length > 0) {
    return directMatches
  }

  if (normalizedQuery.length < 3) {
    return directMatches
  }

  if (FACET_TOKEN_STOPWORD_QUERIES.has(normalizedQuery)) {
    return directMatches
  }

  const fuzzyMatches = getPublicSearchFuse(indexedEntities)
    .search(normalizedQuery)
    .filter((result) =>
      isRelevantPublicFuzzyMatch(result.matches ?? [], normalizedQuery, result.score ?? 1),
    )
    .filter((result) => (result.score ?? 1) <= 0.52)
    .map((result) => ({
      entity: result.item.entity,
      relevance: getFuzzySearchRelevance(result.score ?? 1),
    }))

  if (directMatches.length === 0) {
    return fuzzyMatches
  }

  return mergeDirectAndFuzzyMatches(directMatches, fuzzyMatches, (result) => result.entity.id)
}

function collectPublicDirectMatches<TEntity extends PublicSearchableEntity>(
  records: IndexedPublicSearchRecord<TEntity>[],
  normalizedQuery: string,
): PublicSearchDirectMatch<TEntity>[] {
  return records
    .map((record) => ({
      entity: record.entity,
      displayName: record.displayName,
      priorityMatch: getPublicSearchPriority(record, normalizedQuery),
    }))
    .filter(
      (
        match,
      ): match is {
        displayName: string
        entity: TEntity
        priorityMatch: PublicSearchPriority
      } => match.priorityMatch !== null,
    )
    .map((match) => ({
      displayName: match.displayName,
      entity: match.entity,
      fieldName: match.priorityMatch.fieldName,
      priority: match.priorityMatch.priority,
    }))
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority
      }

      return left.displayName.localeCompare(right.displayName, undefined, {
        sensitivity: 'base',
      })
    })
}

function getPublicSearchDirectResults<TEntity extends PublicSearchableEntity>(
  matches: PublicSearchDirectMatch<TEntity>[],
  queryLength: number,
): PublicSearchResult<TEntity>[] {
  const hasPrimaryMatch = matches.some(isPrimaryDirectMatch)
  if (queryLength < 3 && hasPrimaryMatch) {
    return matches
      .filter((match) => shouldKeepShortDirectMatch(match, queryLength, hasPrimaryMatch))
      .map((match) => ({entity: match.entity, relevance: match.priority}))
  }

  return matches.map((match) => ({entity: match.entity, relevance: match.priority}))
}

function isPrimaryDirectMatch<TEntity extends PublicSearchableEntity>(
  match: PublicSearchDirectMatch<TEntity>,
): boolean {
  return match.priority <= PRIMARY_DIRECT_PRIORITY_MAX
}

function shouldKeepShortDirectMatch<TEntity extends PublicSearchableEntity>(
  match: PublicSearchDirectMatch<TEntity>,
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

function getIndexedPublicSearchRecords<TEntity extends PublicSearchableEntity>(
  scope: SearchablePublicDataScope,
  entities: TEntity[],
  options: PublicSearchOptions<TEntity>,
): IndexedPublicSearchRecord<TEntity>[] {
  return entities.map((entity) => {
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
}

function getPublicSearchFuse<TEntity extends PublicSearchableEntity>(
  records: IndexedPublicSearchRecord<TEntity>[],
): Fuse<IndexedPublicSearchRecord<TEntity>> {
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

function getPublicSearchPriority<TEntity extends PublicSearchableEntity>(
  record: IndexedPublicSearchRecord<TEntity>,
  normalizedQuery: string,
): PublicSearchPriority | null {
  const priorities = DIRECT_SEARCH_FIELD_ORDER.map((fieldName) => {
    const priority = toPriority(
      getBestSearchFieldMatch(record.fields[fieldName], normalizedQuery),
      getFieldPriorityMap(fieldName, normalizedQuery),
      {ignorePriorityAtOrAbove: 99},
    )
    return priority === null ? null : {fieldName, priority}
  }).filter((priority): priority is PublicSearchPriority => priority !== null)

  if (priorities.length === 0) {
    return null
  }

  return priorities.reduce((bestPriority, priority) =>
    priority.priority < bestPriority.priority ? priority : bestPriority,
  )
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

function documentMatchesEntity(
  document: PublicSearchDocument,
  entity: PublicSearchableEntity,
): boolean {
  const normalizedEntityName = normalizeForSearch(entity.name)
  const documentNames = uniqueSearchValues([document.name, ...(document.fields.name ?? [])])

  return documentNames.some((name) => normalizeForSearch(name) === normalizedEntityName)
}

function isRelevantPublicFuzzyMatch(
  matches: readonly FuseResultMatch[],
  normalizedQuery: string,
  score: number,
): boolean {
  const typoTolerantFields = matches
    .filter((match) => isTypoTolerantSearchField(match.key))
    .map((match) => match.value)
    .filter((value): value is string => typeof value === 'string')

  return typoTolerantFields.some((field) =>
    isSingleTokenFuzzyFieldCandidate(field, normalizedQuery, score),
  )
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
