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
  const {DeferredDbDetailModalHost} = await import('./DeferredDbDetailModalHost')
  const props: ComponentProps<typeof DeferredDbDetailModalHost> = {
    awakeners: [],
    navigationPort: {close: vi.fn(), select: vi.fn(), updateState: vi.fn()},
    routeItem: null,
    wheels: [],
  }

  return {DeferredDbDetailModalHost, props}
}

afterEach(() => {
  cleanup()
})

describe('DeferredDbDetailModalHost loading boundary', () => {
  it('loads only for a URL-owned route detail and never mirrors it into overlay state', async () => {
    const {DeferredDbDetailModalHost, props} = await loadHarness()
    const bareBrowse = render(<DeferredDbDetailModalHost {...props} />)

    await act(async () => undefined)
    expect(hostModuleLoaded).not.toHaveBeenCalled()
    bareBrowse.unmount()

    const routeItem = {
      kind: 'wheel',
      item: {id: 'wheel-test', name: 'Test Wheel'},
    } as ComponentProps<typeof DeferredDbDetailModalHost>['routeItem']

    const activeHost = render(<DeferredDbDetailModalHost {...props} routeItem={routeItem} />)

    await waitFor(() => {
      expect(hostRendered).toHaveBeenCalledWith('route')
    })

    activeHost.unmount()
    expect(hostModuleLoaded).toHaveBeenCalledOnce()
  })
})
