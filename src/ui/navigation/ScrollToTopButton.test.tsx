import {act, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, expect, vi} from 'vitest'

import {ScrollToTopButton} from './ScrollToTopButton'

const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight')
const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')
const originalScrollHeight = Object.getOwnPropertyDescriptor(
  document.documentElement,
  'scrollHeight',
)

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0)
    return 0
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
})

afterEach(() => {
  restoreProperty(window, 'innerHeight', originalInnerHeight)
  restoreProperty(window, 'scrollY', originalScrollY)
  restoreProperty(document.documentElement, 'scrollHeight', originalScrollHeight)
  vi.restoreAllMocks()
})

describe('ScrollToTopButton', () => {
  it('stays unavailable when a page has less than one viewport of scrolling', () => {
    setPageDimensions({innerHeight: 800, scrollHeight: 1500, scrollY: 600})

    render(<ScrollToTopButton routeKey='short-page' />)

    const button = screen.getByRole('button', {hidden: true})
    expect(button).toHaveAttribute('aria-label', 'Scroll to top')
    expect(button).toHaveAttribute('aria-hidden', 'true')
  })

  it('appears after meaningful progress on a long page', () => {
    setPageDimensions({innerHeight: 800, scrollHeight: 4800, scrollY: 700})

    render(<ScrollToTopButton routeKey='long-page' />)

    const button = screen.getByRole('button', {name: 'Scroll to top'})
    expect(button).toHaveClass('scroll-to-top-button--visible')
    expect(button).toHaveAttribute('tabindex', '0')
  })

  it('updates as the user scrolls and returns smoothly to the top', () => {
    setPageDimensions({innerHeight: 800, scrollHeight: 4800, scrollY: 0})
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)

    render(<ScrollToTopButton routeKey='long-page' />)

    setPageDimensions({innerHeight: 800, scrollHeight: 4800, scrollY: 700})
    act(() => {
      fireEvent.scroll(window)
    })
    fireEvent.click(screen.getByRole('button', {name: 'Scroll to top'}))

    expect(scrollTo).toHaveBeenCalledWith({behavior: 'smooth', top: 0})
  })
})

function setPageDimensions({
  innerHeight,
  scrollHeight,
  scrollY,
}: {
  innerHeight: number
  scrollHeight: number
  scrollY: number
}) {
  Object.defineProperty(window, 'innerHeight', {configurable: true, value: innerHeight})
  Object.defineProperty(window, 'scrollY', {configurable: true, value: scrollY})
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  })
}

function restoreProperty(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor)
    return
  }

  Reflect.deleteProperty(target, property)
}
