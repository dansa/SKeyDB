import type {ComponentProps} from 'react'

import {act, cleanup, render, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

const {hostModuleLoaded, hostRendered} = vi.hoisted(() => ({
  hostModuleLoaded: vi.fn(),
  hostRendered: vi.fn(),
}))

vi.mock('./DbDetailModalHost', () => {
  hostModuleLoaded()
  return {
    DbDetailModalHost: (props: {routeItem: unknown}) => {
      hostRendered(props.routeItem ? 'route' : 'overlay')
      return null
    },
  }
})

async function loadHarness() {
  const [{DeferredDbDetailModalHost}, {dbDetailStore}] = await Promise.all([
    import('./DeferredDbDetailModalHost'),
    import('@/stores/dbDetailStore'),
  ])
  const props: ComponentProps<typeof DeferredDbDetailModalHost> = {
    awakeners: [],
    callbacks: {
      onClose: vi.fn(),
      onSelectAwakener: vi.fn(),
      onSelectCovenant: vi.fn(),
      onSelectPosse: vi.fn(),
      onSelectWheel: vi.fn(),
      onTabChange: vi.fn(),
    },
    routeItem: null,
    wheels: [],
  }

  return {dbDetailStore, DeferredDbDetailModalHost, props}
}

afterEach(() => {
  cleanup()
})

describe('DeferredDbDetailModalHost loading boundary', () => {
  it('loads only for route detail or overlay state and cleans stale routes', async () => {
    const {dbDetailStore, DeferredDbDetailModalHost, props} = await loadHarness()
    const bareBrowse = render(<DeferredDbDetailModalHost {...props} />)

    await act(async () => undefined)
    expect(hostModuleLoaded).not.toHaveBeenCalled()
    bareBrowse.unmount()

    dbDetailStore.getState().replaceRouteDetail({kind: 'awakener', id: 'awakener-test'})
    const activeHost = render(<DeferredDbDetailModalHost {...props} />)

    await waitFor(() => {
      expect(dbDetailStore.getState().stack).toHaveLength(0)
    })
    expect(hostModuleLoaded).not.toHaveBeenCalled()

    act(() => {
      dbDetailStore
        .getState()
        .openDetail({kind: 'awakener', id: 'awakener-test'}, 'builder-overlay')
    })

    await waitFor(() => {
      expect(hostModuleLoaded).toHaveBeenCalledOnce()
      expect(hostRendered).toHaveBeenCalledWith('overlay')
    })

    act(() => {
      dbDetailStore.getState().closeAllDetails()
    })
    const routeItem = {
      kind: 'wheel',
      item: {id: 'wheel-test', name: 'Test Wheel'},
    } as ComponentProps<typeof DeferredDbDetailModalHost>['routeItem']

    activeHost.rerender(<DeferredDbDetailModalHost {...props} routeItem={routeItem} />)

    await waitFor(() => {
      expect(hostRendered).toHaveBeenCalledWith('route')
      expect(dbDetailStore.getState().stack).toEqual([
        {kind: 'wheel', id: 'wheel-test', source: 'database-route'},
      ])
    })

    activeHost.unmount()
    await waitFor(() => {
      expect(dbDetailStore.getState().stack).toHaveLength(0)
    })
    expect(hostModuleLoaded).toHaveBeenCalledOnce()
  })
})
