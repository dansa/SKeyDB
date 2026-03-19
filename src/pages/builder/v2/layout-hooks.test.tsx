import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useMeasuredElementRect, useMeasuredElementSize} from './layout-hooks'

function RectProbe() {
  const {ref, top} = useMeasuredElementRect()

  return (
    <div>
      <div data-testid='rect-target' ref={ref} />
      <output data-testid='rect-top'>{String(top)}</output>
    </div>
  )
}

function SizeProbe() {
  const {height, ref, width} = useMeasuredElementSize()

  return (
    <div>
      <div data-testid='size-target' ref={ref} />
      <output data-testid='size-width'>{String(width)}</output>
      <output data-testid='size-height'>{String(height)}</output>
    </div>
  )
}

function createDomRect(top: number, width: number, height: number): DOMRect {
  return {
    bottom: top + height,
    height,
    left: 0,
    right: width,
    toJSON: () => ({}),
    top,
    width,
    x: 0,
    y: top,
  } as DOMRect
}

describe('layout-hooks', () => {
  it('re-measures viewport-relative rect position when the page scrolls', async () => {
    render(<RectProbe />)

    const target = screen.getByTestId('rect-target')
    let currentTop = 200

    Object.defineProperty(target, 'getBoundingClientRect', {
      configurable: true,
      value: () => createDomRect(currentTop, 320, 180),
    })

    fireEvent.scroll(window)

    await waitFor(() => {
      expect(screen.getByTestId('rect-top')).toHaveTextContent('200')
    })

    currentTop = 24
    fireEvent.scroll(window)

    await waitFor(() => {
      expect(screen.getByTestId('rect-top')).toHaveTextContent('24')
    })
  })

  it('publishes zero once a measured element collapses', async () => {
    let notifyResize: (() => void) | undefined
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        constructor(callback: ResizeObserverCallback) {
          notifyResize = () => {
            callback([] as ResizeObserverEntry[], this)
          }
        }
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
    const triggerResize = () => {
      if (!notifyResize) {
        throw new Error('ResizeObserver callback was not captured')
      }
      notifyResize()
    }

    render(<SizeProbe />)

    const target = screen.getByTestId('size-target')
    let currentRect = createDomRect(0, 320, 180)

    Object.defineProperty(target, 'getBoundingClientRect', {
      configurable: true,
      value: () => currentRect,
    })

    triggerResize()

    await waitFor(() => {
      expect(screen.getByTestId('size-width')).toHaveTextContent('320')
      expect(screen.getByTestId('size-height')).toHaveTextContent('180')
    })

    currentRect = createDomRect(0, 0, 0)
    triggerResize()

    await waitFor(() => {
      expect(screen.getByTestId('size-width')).toHaveTextContent('0')
      expect(screen.getByTestId('size-height')).toHaveTextContent('0')
    })
  })
})
