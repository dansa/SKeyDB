import {act, renderHook, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {getDatabaseEntityRuntime, type ResolvedDatabaseDetailRoute} from './databaseEntityRuntime'
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

  it('does not expose the previous detail while a newly opened route resolves', async () => {
    const runtime = getDatabaseEntityRuntime('wheels')
    const firstResolution: ResolvedDatabaseDetailRoute = {
      canonicalPath: '/database/wheels/first',
      routeItem: null,
    }
    const secondResolution: ResolvedDatabaseDetailRoute = {
      canonicalPath: '/database/wheels/second',
      routeItem: null,
    }
    let resolveSecond: ((resolution: ResolvedDatabaseDetailRoute) => void) | undefined
    const secondRequest = new Promise<ResolvedDatabaseDetailRoute>((resolve) => {
      resolveSecond = resolve
    })
    vi.spyOn(runtime, 'resolveDetailRoute')
      .mockResolvedValueOnce(firstResolution)
      .mockReturnValueOnce(secondRequest)
    const firstRoute: ParsedDatabaseRoute = {
      entity: 'wheels',
      kind: 'detail',
      slug: 'first',
      suffixSegments: [],
    }
    const initialProps: {route: ParsedDatabaseRoute} = {route: firstRoute}
    const {result, rerender} = renderHook(
      ({route}: {route: ParsedDatabaseRoute}) =>
        useDatabaseRouteResolution({
          defaultAwakenerTab: 'upgrades',
          route,
          search: '',
        }),
      {initialProps},
    )

    await waitFor(() => {
      expect(result.current.status).toBe('resolved')
    })
    rerender({route: {entity: 'wheels', kind: 'browse'}})
    rerender({
      route: {
        entity: 'wheels',
        kind: 'detail',
        slug: 'second',
        suffixSegments: [],
      },
    })

    expect(result.current.status).toBe('loading')
    expect(result.current).not.toHaveProperty('previousResolution')

    await act(async () => {
      resolveSecond?.(secondResolution)
      await secondRequest
    })
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
