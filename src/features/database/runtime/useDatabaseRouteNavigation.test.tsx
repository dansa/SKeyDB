import {act, renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {DatabaseDetailRouteItem} from '@/features/database/detail/dbDetailRegistry'

import {resolveDatabaseRuntimeDetailReference} from './databaseEntityRuntime'
import {useDatabaseRouteNavigation} from './useDatabaseRouteNavigation'
import {primeDatabaseRouteResolution} from './useDatabaseRouteResolution'

vi.mock('./databaseEntityRuntime', () => ({
  resolveDatabaseRuntimeDetailReference: vi.fn(),
}))

vi.mock('./useDatabaseRouteResolution', () => ({
  primeDatabaseRouteResolution: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('useDatabaseRouteNavigation', () => {
  it('ignores an older selection that resolves after a newer selection', async () => {
    const first = createDeferred<ResolvedTarget>()
    const second = createDeferred<ResolvedTarget>()
    vi.mocked(resolveDatabaseRuntimeDetailReference)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const navigate = vi.fn()
    const {result} = renderHook(() =>
      useDatabaseRouteNavigation({
        activeSearch: '?query=ritual',
        defaultAwakenerTab: 'upgrades',
        locationState: {from: 'database'},
        navigate,
        onClose: vi.fn(),
        routeItem: null,
      }),
    )

    act(() => {
      result.current.select({kind: 'wheel', id: 'wheel-0001'})
      result.current.select({kind: 'wheel', id: 'wheel-0002'})
    })

    const secondTarget = createTarget('/database/wheels/second')
    await act(async () => {
      second.resolve(secondTarget)
      await second.promise
    })

    expect(primeDatabaseRouteResolution).toHaveBeenCalledOnce()
    expect(primeDatabaseRouteResolution).toHaveBeenCalledWith(
      secondTarget.pathname,
      secondTarget.search,
      secondTarget.resolution,
    )
    expect(navigate).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith(
      {pathname: secondTarget.pathname, search: secondTarget.search},
      {replace: true, state: {from: 'database'}},
    )

    await act(async () => {
      first.resolve(createTarget('/database/wheels/first'))
      await first.promise
    })

    expect(primeDatabaseRouteResolution).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledOnce()
  })

  it('primes canonical detail state before replacing the current route and preserves its hash', async () => {
    const target = createTarget('/database/relics/test-relic')
    vi.mocked(resolveDatabaseRuntimeDetailReference).mockResolvedValue(target)
    const navigate = vi.fn()
    const routeItem: DatabaseDetailRouteItem = {
      kind: 'relic',
      item: {
        aliases: [],
        assetId: 'Icon_Creation_Test',
        categories: ['OTHER'],
        defaultVariantCategory: 'OTHER',
        defaultVariantId: 'relic-variant-0001',
        description: 'Test relic',
        id: 'relic-0001',
        kind: 'GENERIC',
        name: 'Test Relic',
        rarity: 'SSR',
        relicType: 'Relic',
        route: {
          canonicalPath: '/database/relics/test-relic',
          slug: 'test-relic',
        },
        variantCategoryTiers: [{category: 'OTHER', tier: 'Base'}],
        variantCount: 1,
        variantTiers: ['Base'],
      },
    }
    const {result} = renderHook(() =>
      useDatabaseRouteNavigation({
        activeSearch: '?tier=GOLD',
        defaultAwakenerTab: 'upgrades',
        locationState: {from: 'database'},
        navigate,
        onClose: vi.fn(),
        routeItem,
      }),
    )

    act(() => {
      result.current.updateState({variant: 'relic-variant-0002'}, {hash: '#effect'})
    })

    await vi.waitFor(() => {
      expect(primeDatabaseRouteResolution).toHaveBeenCalledWith(
        target.pathname,
        target.search,
        target.resolution,
      )
    })
    expect(resolveDatabaseRuntimeDetailReference).toHaveBeenCalledWith({
      defaultAwakenerTab: 'upgrades',
      ref: {kind: 'relic', id: 'relic-0001'},
      search: '?tier=GOLD',
      state: {variant: 'relic-variant-0002'},
    })
    expect(navigate).toHaveBeenCalledWith(
      {hash: '#effect', pathname: target.pathname, search: target.search},
      {replace: true, state: {from: 'database'}},
    )
  })
})

interface ResolvedTarget {
  pathname: string
  resolution: {
    canonicalPath: string
    routeItem: null
  }
  search: string
}

function createTarget(pathname: string): ResolvedTarget {
  return {
    pathname,
    resolution: {canonicalPath: pathname, routeItem: null},
    search: '?query=ritual',
  }
}

function createDeferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return {promise, resolve}
}
