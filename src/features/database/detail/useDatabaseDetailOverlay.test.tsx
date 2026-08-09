import {StrictMode} from 'react'

import {act, render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import type {DatabaseDetailOverlayController} from './useDatabaseDetailOverlay'
import {useDatabaseDetailOverlay} from './useDatabaseDetailOverlay'

function OverlayOwner({capture}: {capture: (value: DatabaseDetailOverlayController) => void}) {
  const overlay = useDatabaseDetailOverlay()
  capture(overlay)
  return <output>{overlay.isOpen ? 'open' : 'closed'}</output>
}

describe('useDatabaseDetailOverlay', () => {
  it('reports its own open state and clears its branch on unmount', () => {
    let overlay!: DatabaseDetailOverlayController
    const view = render(<OverlayOwner capture={(value) => (overlay = value)} />)

    act(() => {
      overlay.open({kind: 'awakener', id: 'owner-root'})
    })
    expect(view.getByText('open')).toBeInTheDocument()
    expect(overlay.session.top()).toEqual({kind: 'awakener', id: 'owner-root'})

    view.unmount()
    expect(overlay.session.isOpen()).toBe(false)
  })

  it('gives classic and V2 remounts distinct branches under StrictMode', () => {
    let classic!: DatabaseDetailOverlayController
    let v2!: DatabaseDetailOverlayController
    const view = render(
      <StrictMode>
        <OverlayOwner key='classic' capture={(value) => (classic = value)} />
      </StrictMode>,
    )
    act(() => {
      classic.open({kind: 'awakener', id: 'classic-root'})
    })

    view.rerender(
      <StrictMode>
        <OverlayOwner key='v2' capture={(value) => (v2 = value)} />
      </StrictMode>,
    )

    expect(classic.session.isOpen()).toBe(false)
    expect(v2.session.isOpen()).toBe(false)
    act(() => {
      v2.open({kind: 'wheel', id: 'v2-root'})
    })
    expect(classic.session.isOpen()).toBe(false)
    expect(v2.session.top()).toEqual({kind: 'wheel', id: 'v2-root'})
  })
})
