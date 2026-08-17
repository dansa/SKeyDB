import {renderHook, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {getDatabaseEntityRuntime} from './databaseEntityRuntime'
import type {ParsedDatabaseRoute} from './databaseRouteResolution'
import {
  clearPrimedDatabaseRouteResolutionsForTests,
  useDatabaseRouteResolution,
} from './useDatabaseRouteResolution'

afterEach(() => {
  vi.restoreAllMocks()
  clearPrimedDatabaseRouteResolutionsForTests()
})

describe('useDatabaseRouteResolution', () => {
  it('does not restart detail loading for an equivalent route object', async () => {
    const runtime = getDatabaseEntityRuntime('wheels')
    const resolution = {
      canonicalPath: '/database/wheels/example',
      routeItem: null,
    }
    const resolveSpy = vi.spyOn(runtime, 'resolveDetailRoute').mockResolvedValue(resolution)
    const initialRoute: ParsedDatabaseRoute = {
      entity: 'wheels',
      kind: 'detail',
      slug: 'example',
      suffixSegments: [],
    }
    const {result, rerender} = renderHook(
      ({route}: {route: ParsedDatabaseRoute}) =>
        useDatabaseRouteResolution({
          defaultAwakenerTab: 'upgrades',
          route,
          search: '',
        }),
      {initialProps: {route: initialRoute}},
    )

    await waitFor(() => {
      expect(result.current.status).toBe('resolved')
    })
    rerender({route: {...initialRoute}})

    expect(result.current.status).toBe('resolved')
    expect(resolveSpy).toHaveBeenCalledTimes(1)
  })

  it('publishes a terminal error when an entity route adapter fails to load', async () => {
    const runtime = getDatabaseEntityRuntime('wheels')
    vi.spyOn(runtime, 'resolveDetailRoute').mockRejectedValue(new Error('chunk unavailable'))
    const {result} = renderHook(() =>
      useDatabaseRouteResolution({
        defaultAwakenerTab: 'upgrades',
        route: {
          entity: 'wheels',
          kind: 'detail',
          slug: 'example',
          suffixSegments: [],
        },
        search: '',
      }),
    )

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({message: 'chunk unavailable'}),
        status: 'error',
      }),
    )
  })
})
