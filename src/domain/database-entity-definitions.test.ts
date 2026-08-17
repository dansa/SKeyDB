import {describe, expect, it} from 'vitest'

import {
  DATABASE_ENTITY_DEFINITIONS,
  getDatabaseDetailKindForEntity,
  getDatabaseEntityDefinition,
  validateDatabaseEntityDefinitions,
} from './database-entity-definitions'

describe('database entity definition spine', () => {
  it('preserves the public route, identity, and tab metadata contract', () => {
    expect(
      DATABASE_ENTITY_DEFINITIONS.map(
        ({browsePath, detailKind, detailPathPrefix, entity, publicDataScope, tab}) => ({
          browsePath,
          detailKind,
          detailPathPrefix,
          entity,
          publicDataScope,
          tab,
        }),
      ),
    ).toEqual([
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
        entity: 'relics',
        detailKind: 'relic',
        publicDataScope: 'relics',
        browsePath: '/database/relics',
        detailPathPrefix: '/database/relics',
        tab: {label: 'Relics'},
      },
    ])
  })

  it('provides consistent lookups in both identity directions', () => {
    for (const definition of DATABASE_ENTITY_DEFINITIONS) {
      expect(getDatabaseEntityDefinition(definition.entity)).toBe(definition)
      expect(getDatabaseDetailKindForEntity(definition.entity)).toBe(definition.detailKind)
    }
  })

  it('allows a local-backed entity to omit public-data scope metadata', () => {
    const {publicDataScope: _publicDataScope, ...localDefinition} = DATABASE_ENTITY_DEFINITIONS[0]

    expect(() => {
      validateDatabaseEntityDefinitions([localDefinition])
    }).not.toThrow()
  })

  it.each([
    ['entity', {entity: 'awakeners'}],
    ['detail kind', {detailKind: 'awakener'}],
    ['browse path', {browsePath: '/database'}],
    ['detail path prefix', {detailPathPrefix: '/database/awakeners'}],
  ] as const)('fails fast on a duplicate %s', (label, duplicatePatch) => {
    expect(() => {
      validateDatabaseEntityDefinitions([
        DATABASE_ENTITY_DEFINITIONS[0],
        {...DATABASE_ENTITY_DEFINITIONS[1], ...duplicatePatch},
      ])
    }).toThrow(`Duplicate database entity ${label}`)
  })
})
