import {act, renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

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
