import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {DatabaseGridCardFrame} from './DatabaseGridCardFrame'

describe('DatabaseGridCardFrame detail intent', () => {
  it('warms code on hover and reserves record preloading for focus or pointer down', () => {
    const onPreload = vi.fn()
    const onWarmShell = vi.fn()
    render(
      <DatabaseGridCardFrame
        content={{title: 'Record'}}
        media={{alt: '', posterSrc: undefined, posterTreatment: 'badge', prioritize: false}}
        onPreload={onPreload}
        onSelect={vi.fn()}
        onWarmShell={onWarmShell}
        realmAccent='#000'
        variant='square-art'
      />,
    )
    const action = screen.getByRole('button')

    fireEvent.pointerEnter(action)
    expect(onWarmShell).toHaveBeenCalledOnce()
    expect(onPreload).not.toHaveBeenCalled()

    fireEvent.pointerDown(action)
    fireEvent.focus(action)
    expect(onPreload).toHaveBeenCalledTimes(2)
  })
})
