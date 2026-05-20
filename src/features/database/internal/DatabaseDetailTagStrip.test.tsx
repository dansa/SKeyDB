import {act, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {DatabaseDetailTagStrip} from './DatabaseDetailTagStrip'

describe('DatabaseDetailTagStrip', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('tracks tag overflow with ResizeObserver when available', () => {
    let resizeCallback: ResizeObserverCallback | null = null
    const disconnect = vi.fn()
    const observe = vi.fn()

    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback
      }

      disconnect = disconnect
      observe = observe
      unobserve = vi.fn()
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver)

    const {unmount} = render(
      <DatabaseDetailTagStrip
        itemKey='awakener-0001'
        tags={['Shield', 'Damage Amp', 'Poison', 'Counter']}
      />,
    )
    const tagContainer = screen.getByText('Shield').parentElement
    if (!tagContainer) {
      throw new Error('Expected tag container')
    }

    expect(observe).toHaveBeenCalledWith(tagContainer)

    Object.defineProperty(tagContainer, 'scrollHeight', {configurable: true, value: 80})

    act(() => {
      resizeCallback?.([], {} as ResizeObserver)
    })

    expect(screen.getByRole('button', {name: 'Show all tags'})).toBeInTheDocument()

    unmount()

    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
