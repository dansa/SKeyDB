import {describe, expect, it, vi} from 'vitest'

import {DATABASE_ENTITY_DEFINITIONS} from '@/domain/database-entity-definitions'
import {DEFAULT_DATABASE_AWAKENER_TAB} from '@/domain/database-paths'

import {
  databaseAwakeners,
  databaseCovenants,
  databasePosses,
  databaseOrisons,
  databaseRelics,
  databaseWheels,
} from '../data'
import {
  createDatabaseDetailCatalogLookup,
  createDatabaseDetailResultSet,
  dbDetailRegistry,
  getDatabaseDetailKindForEntity,
  resolveDatabaseDetailOverlayRouteItem,
  resolveDatabaseDetailReference,
  selectDatabaseDetailResult,
  type DatabaseDetailNavigationPort,
} from './dbDetailRegistry'

function createNavigationPort(): DatabaseDetailNavigationPort {
  return {
    close: vi.fn(),
    select: vi.fn(),
    updateState: vi.fn(),
  }
}

describe('database detail registry adapters', () => {
  const lookup = createDatabaseDetailCatalogLookup({
    awakeners: databaseAwakeners,
    orisons: databaseOrisons,
    relics: databaseRelics,
    wheels: databaseWheels,
  })

  it('maps every browse entity to its detail adapter', () => {
    expect(getDatabaseDetailKindForEntity('awakeners')).toBe('awakener')
    expect(getDatabaseDetailKindForEntity('wheels')).toBe('wheel')
    expect(getDatabaseDetailKindForEntity('posses')).toBe('posse')
    expect(getDatabaseDetailKindForEntity('covenants')).toBe('covenant')
    expect(getDatabaseDetailKindForEntity('relics')).toBe('relic')
    expect(getDatabaseDetailKindForEntity('orisons')).toBe('orison')
  })

  it('has exact registry coverage for every declared detail kind', () => {
    expect(Object.keys(dbDetailRegistry).sort()).toEqual(
      DATABASE_ENTITY_DEFINITIONS.map(({detailKind}) => detailKind).sort(),
    )
  })

  it('resolves overlay route items through the matching catalog adapter', () => {
    const refs = [
      {kind: 'awakener', item: databaseAwakeners[0]},
      {kind: 'wheel', item: databaseWheels[0]},
      {kind: 'posse', item: databasePosses[0]},
      {kind: 'covenant', item: databaseCovenants[0]},
      {kind: 'relic', item: databaseRelics[0]},
    ] as const

    for (const {kind, item} of refs) {
      expect(
        resolveDatabaseDetailOverlayRouteItem({kind, id: item.id}, lookup, {
          tab: DEFAULT_DATABASE_AWAKENER_TAB,
        }),
      ).toMatchObject({kind, item: {id: item.id}})
    }
  })

  it('keeps normalized-name reference fallback behind the entity adapter', () => {
    const wheel = databaseWheels[0]
    expect(
      resolveDatabaseDetailReference('wheel', lookup, {name: `  ${wheel.name.toUpperCase()}  `}),
    ).toEqual({kind: 'wheel', id: wheel.id})
  })

  it('dispatches every result through the generic navigation port', () => {
    const refs = [
      {kind: 'awakener', item: databaseAwakeners[0]},
      {kind: 'wheel', item: databaseWheels[0]},
      {kind: 'posse', item: databasePosses[0]},
      {kind: 'covenant', item: databaseCovenants[0]},
      {kind: 'relic', item: databaseRelics[0]},
    ] as const

    for (const {item, kind} of refs) {
      const navigation = createNavigationPort()
      const ref = {kind, id: item.id, name: item.name}
      const routeItem =
        kind === 'awakener'
          ? ({kind, item, activeTab: DEFAULT_DATABASE_AWAKENER_TAB} as const)
          : ({kind, item} as Exclude<
              Parameters<typeof selectDatabaseDetailResult>[2],
              {kind: 'awakener'} | {kind: 'relic'}
            >)
      selectDatabaseDetailResult(ref, navigation, routeItem)

      expect(navigation.select).toHaveBeenCalledWith(
        ref,
        ...(kind === 'awakener' ? [{tab: DEFAULT_DATABASE_AWAKENER_TAB}] : []),
      )
    }
  })

  it('keeps result presentation in the registered entity adapter', () => {
    expect(createDatabaseDetailResultSet('wheel', [databaseWheels[0]])).toMatchObject({
      kind: 'wheel',
      items: [{id: databaseWheels[0].id, imageTreatment: 'icon'}],
    })
  })
})
