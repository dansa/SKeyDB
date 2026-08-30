interface DatabaseEntityDefinitionInput {
  browsePath: string
  detailKind: string
  detailPathPrefix: string
  entity: string
  publicDataScope?: string
  tab: {end?: boolean; label: string}
}

export function validateDatabaseEntityDefinitions(
  definitions: readonly DatabaseEntityDefinitionInput[],
): void {
  const entities = new Set<string>()
  const detailKinds = new Set<string>()
  const browsePaths = new Set<string>()
  const detailPathPrefixes = new Set<string>()

  for (const definition of definitions) {
    assertUniqueDefinitionValue('entity', definition.entity, entities)
    assertUniqueDefinitionValue('detail kind', definition.detailKind, detailKinds)
    assertUniqueDefinitionValue('browse path', definition.browsePath, browsePaths)
    assertUniqueDefinitionValue(
      'detail path prefix',
      definition.detailPathPrefix,
      detailPathPrefixes,
    )
    if (!definition.browsePath.startsWith('/') || !definition.detailPathPrefix.startsWith('/')) {
      throw new Error(`Database entity ${definition.entity} paths must be absolute`)
    }
    if (
      !definition.entity.trim() ||
      !definition.detailKind.trim() ||
      !definition.tab.label.trim()
    ) {
      throw new Error('Database entity definitions require non-empty identities and tab labels')
    }
    if (definition.publicDataScope !== undefined && !definition.publicDataScope.trim()) {
      throw new Error('Database entity public data scopes must be non-empty when provided')
    }
  }
}

function assertUniqueDefinitionValue<T>(label: string, value: T, seen: Set<T>): void {
  if (seen.has(value)) throw new Error(`Duplicate database entity ${label}: ${String(value)}`)
  seen.add(value)
}

function defineDatabaseEntityDefinitions<
  const Definitions extends readonly DatabaseEntityDefinitionInput[],
>(definitions: Definitions): Definitions & readonly DatabaseEntityDefinitionInput[] {
  validateDatabaseEntityDefinitions(definitions)
  return definitions
}

export const DATABASE_ENTITY_DEFINITIONS = defineDatabaseEntityDefinitions([
  {
    entity: 'awakeners',
    detailKind: 'awakener',
    publicDataScope: 'awakeners',
    browsePath: '/database',
    detailPathPrefix: '/database/awakeners',
    tab: {label: 'Awakeners', end: true},
  },
  {
    entity: 'wheels',
    detailKind: 'wheel',
    publicDataScope: 'wheels',
    browsePath: '/database/wheels',
    detailPathPrefix: '/database/wheels',
    tab: {label: 'Wheels'},
  },
  {
    entity: 'posses',
    detailKind: 'posse',
    publicDataScope: 'posses',
    browsePath: '/database/posses',
    detailPathPrefix: '/database/posses',
    tab: {label: 'Posses'},
  },
  {
    entity: 'covenants',
    detailKind: 'covenant',
    publicDataScope: 'covenants',
    browsePath: '/database/covenants',
    detailPathPrefix: '/database/covenants',
    tab: {label: 'Covenants'},
  },
  {
    entity: 'orisons',
    detailKind: 'orison',
    publicDataScope: 'orisons',
    browsePath: '/database/orisons',
    detailPathPrefix: '/database/orisons',
    tab: {label: 'Orisons'},
  },
  {
    entity: 'relics',
    detailKind: 'relic',
    publicDataScope: 'relics',
    browsePath: '/database/relics',
    detailPathPrefix: '/database/relics',
    tab: {label: 'Relics'},
  },
] as const)

export type DatabaseEntityDefinition = (typeof DATABASE_ENTITY_DEFINITIONS)[number]
export type DatabaseEntityId = DatabaseEntityDefinition['entity']
export type DatabaseDetailKind = DatabaseEntityDefinition['detailKind']

export const DATABASE_ENTITY_DEFINITION_BY_ID = Object.fromEntries(
  DATABASE_ENTITY_DEFINITIONS.map((definition) => [definition.entity, definition]),
) as {[Entity in DatabaseEntityId]: Extract<DatabaseEntityDefinition, {entity: Entity}>}

export function getDatabaseEntityDefinition<Entity extends DatabaseEntityId>(
  entity: Entity,
): (typeof DATABASE_ENTITY_DEFINITION_BY_ID)[Entity] {
  return DATABASE_ENTITY_DEFINITION_BY_ID[entity]
}

export function getDatabaseDetailKindForEntity(entity: DatabaseEntityId): DatabaseDetailKind {
  return getDatabaseEntityDefinition(entity).detailKind
}

export function getDatabaseEntityPublicDataScope(entity: DatabaseEntityId): string | undefined {
  const definition: DatabaseEntityDefinitionInput = getDatabaseEntityDefinition(entity)
  return definition.publicDataScope
}
