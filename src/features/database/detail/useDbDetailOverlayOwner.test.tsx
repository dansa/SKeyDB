import {StrictMode} from 'react'

import {cleanup, render} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {
  dbDetailStore,
  type DbDetailOverlaySource,
  type DbDetailStackEntry,
} from '@/stores/dbDetailStore'

import {useDbDetailOverlayOwner} from './useDbDetailOverlayOwner'

function OverlayOwner({source}: {source: DbDetailOverlaySource}) {
  useDbDetailOverlayOwner(source)
  return null
}

function getStack(): DbDetailStackEntry[] {
  return dbDetailStore.getState().stack
}

afterEach(() => {
  cleanup()
  dbDetailStore.getState().closeAllDetails()
})

describe('useDbDetailOverlayOwner', () => {
  it('removes the owner branch on unmount while preserving another source branch', () => {
    const {unmount} = render(<OverlayOwner source='collection-overlay' />)
    dbDetailStore
      .getState()
      .openDetail({kind: 'awakener', id: 'collection-root'}, 'collection-overlay')
    dbDetailStore.getState().pushReferenceDetail({kind: 'wheel', id: 'collection-reference'})
    dbDetailStore.getState().openDetail({kind: 'posse', id: 'timeline-root'}, 'timeline-overlay')
    dbDetailStore.getState().pushReferenceDetail({kind: 'covenant', id: 'timeline-reference'})

    unmount()

    expect(getStack()).toEqual([
      {kind: 'posse', id: 'timeline-root', source: 'timeline-overlay'},
      {kind: 'covenant', id: 'timeline-reference', source: 'reference'},
    ])
  })

  it('cleans shared builder ownership across remounts and StrictMode cleanup', () => {
    const {rerender, unmount} = render(
      <StrictMode>
        <OverlayOwner key='classic' source='builder-overlay' />
      </StrictMode>,
    )
    dbDetailStore.getState().openDetail({kind: 'awakener', id: 'classic-root'}, 'builder-overlay')
    dbDetailStore.getState().pushReferenceDetail({kind: 'wheel', id: 'classic-reference'})

    rerender(
      <StrictMode>
        <OverlayOwner key='v2' source='builder-overlay' />
      </StrictMode>,
    )

    expect(getStack()).toEqual([])

    dbDetailStore.getState().openDetail({kind: 'awakener', id: 'v2-root'}, 'builder-overlay')
    dbDetailStore.getState().pushReferenceDetail({kind: 'wheel', id: 'v2-reference'})
    unmount()

    expect(getStack()).toEqual([])
  })
})
