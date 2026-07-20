import {describe, expect, it, vi} from 'vitest'

import {DEFAULT_DATABASE_AWAKENER_TAB} from '@/domain/database-paths'

import {
  databaseAwakeners,
  databaseCovenants,
  databasePosses,
  databaseRelics,
  databaseWheels,
} from '../data'
import {
  createDatabaseDetailCatalogLookup,
  getDatabaseDetailKindForEntity,
  resolveDatabaseDetailOverlayRouteItem,
  resolveDatabaseDetailReference,
  selectDatabaseDetailResult,
  type DatabaseDetailRenderCallbacks,
} from './dbDetailRegistry'

function createCallbacks(): DatabaseDetailRenderCallbacks {
  return {
    onClose: vi.fn(),
    onSelectAwakener: vi.fn(),
    onSelectCovenant: vi.fn(),
    onSelectPosse: vi.fn(),
    onSelectRelic: vi.fn(),
    onSelectWheel: vi.fn(),
    onTabChange: vi.fn(),
  }
}

describe('database detail registry adapters', () => {
  const lookup = createDatabaseDetailCatalogLookup({
    awakeners: databaseAwakeners,
    relics: databaseRelics,
    wheels: databaseWheels,
  })

  it('maps every browse entity to its detail adapter', () => {
    expect(getDatabaseDetailKindForEntity('awakeners')).toBe('awakener')
    expect(getDatabaseDetailKindForEntity('wheels')).toBe('wheel')
    expect(getDatabaseDetailKindForEntity('posses')).toBe('posse')
    expect(getDatabaseDetailKindForEntity('covenants')).toBe('covenant')
    expect(getDatabaseDetailKindForEntity('relics')).toBe('relic')
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
        resolveDatabaseDetailOverlayRouteItem(
          {kind, id: item.id},
          lookup,
          DEFAULT_DATABASE_AWAKENER_TAB,
        ),
      ).toMatchObject({kind, item: {id: item.id}})
    }
  })

  it('keeps normalized-name reference fallback behind the entity adapter', () => {
    const wheel = databaseWheels[0]
    expect(
      resolveDatabaseDetailReference('wheel', lookup, {name: `  ${wheel.name.toUpperCase()}  `}),
    ).toEqual({kind: 'wheel', id: wheel.id})
  })

  it('dispatches result navigation through each entity callback', () => {
    const refs = [
      {kind: 'awakener', item: databaseAwakeners[0], callbackKey: 'onSelectAwakener'},
      {kind: 'wheel', item: databaseWheels[0], callbackKey: 'onSelectWheel'},
      {kind: 'posse', item: databasePosses[0], callbackKey: 'onSelectPosse'},
      {kind: 'covenant', item: databaseCovenants[0], callbackKey: 'onSelectCovenant'},
      {kind: 'relic', item: databaseRelics[0], callbackKey: 'onSelectRelic'},
    ] as const

    for (const {callbackKey, item, kind} of refs) {
      const callbacks = createCallbacks()
      const ref = {kind, id: item.id, name: item.name}
      selectDatabaseDetailResult(ref, callbacks, DEFAULT_DATABASE_AWAKENER_TAB)

      const expectedCallback = callbacks[callbackKey]
      expect(expectedCallback).toHaveBeenCalledTimes(1)
      expect(expectedCallback).toHaveBeenCalledWith(
        ref,
        ...(kind === 'awakener' ? [DEFAULT_DATABASE_AWAKENER_TAB] : []),
      )

      const selectionCallbacks = [
        callbacks.onSelectAwakener,
        callbacks.onSelectWheel,
        callbacks.onSelectPosse,
        callbacks.onSelectCovenant,
        callbacks.onSelectRelic,
      ]
      expect(
        selectionCallbacks.reduce(
          (total, callback) => total + (callback ? vi.mocked(callback).mock.calls.length : 0),
          0,
        ),
      ).toBe(1)
    }
  })
})
