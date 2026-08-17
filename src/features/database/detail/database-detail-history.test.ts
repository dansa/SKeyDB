import {describe, expect, it} from 'vitest'

import {
  createDatabaseDetailFromBrowseState,
  getDatabaseDetailBrowseOrigin,
  getDatabaseRouteBoundaryKey,
} from './database-detail-history'

const origin = {entity: 'wheels' as const, pathname: '/database/wheels', search: '?q=test'}

describe('database detail history state', () => {
  it('marks a browse-opened detail entry while preserving unrelated router state', () => {
    const state = createDatabaseDetailFromBrowseState({source: 'test'}, origin)

    expect(state).toMatchObject({source: 'test'})
    expect(getDatabaseDetailBrowseOrigin(state)).toEqual(origin)
  })

  it('keeps the route boundary on the origin browse route during cross-entity details', () => {
    const state = createDatabaseDetailFromBrowseState(null, origin)

    expect(getDatabaseRouteBoundaryKey('/database/awakeners/example', state)).toBe(
      '/database/wheels',
    )
    expect(getDatabaseRouteBoundaryKey('/database/awakeners/example', null)).toBe('/database')
    expect(getDatabaseRouteBoundaryKey('/timeline', null)).toBe('/timeline')
  })

  it.each([
    undefined,
    null,
    false,
    {},
    {__databaseDetailFromBrowse: false},
    {
      __databaseDetailFromBrowse: {
        entity: 'unknown',
        pathname: '/database/unknown',
        search: '',
      },
    },
    {
      __databaseDetailFromBrowse: {
        entity: 'wheels',
        pathname: '/database',
        search: '',
      },
    },
  ])('does not treat an unmarked deep-link state as browse-originated', (state) => {
    expect(getDatabaseDetailBrowseOrigin(state)).toBeNull()
  })
})
