import {render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {resolveStickyAvailableHeight, useStickyMaxHeight} from './useStickyMaxHeight'

function StickyHeightHarness() {
  const {ref, maxHeight} = useStickyMaxHeight()

  return (
    <>
      <div data-testid='sticky-shell' ref={ref} />
      <output data-testid='sticky-height'>{maxHeight ?? ''}</output>
    </>
  )
}

describe('useStickyMaxHeight', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        disconnect() {
          return undefined
        }
        observe() {
          return undefined
        }
        unobserve() {
          return undefined
        }
      },
    )
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    const originalAddEventListener = window.addEventListener.bind(window)
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      originalAddEventListener(type, listener, options)
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.getAttribute('data-testid') === 'sticky-shell') {
        return {
          top: 120,
          left: 0,
          right: 100,
          bottom: 220,
          width: 100,
          height: 100,
          x: 0,
          y: 120,
          toJSON: () => undefined,
        } as DOMRect
      }

      return {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => undefined,
      } as DOMRect
    })
  })

  it('remeasures on window resize without requiring a scroll event first', async () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
      writable: true,
    })

    render(<StickyHeightHarness />)

    await waitFor(() => {
      expect(screen.getByTestId('sticky-height')).toHaveTextContent('764')
    })

    expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function), {
      passive: true,
    })
  })

  it('clamps sticky height math so page-end scrolling cannot inflate the picker shell', () => {
    expect(
      resolveStickyAvailableHeight({
        rectTop: 120,
        viewportHeight: 900,
      }),
    ).toBe(764)

    expect(
      resolveStickyAvailableHeight({
        rectTop: -80,
        viewportHeight: 900,
      }),
    ).toBe(868)
  })
})
