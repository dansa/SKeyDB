import {afterEach, describe, expect, it, vi} from 'vitest'

import {acquirePageScrollLock, releasePageScrollLock} from './pageScrollLock'

const originalScrollX = Object.getOwnPropertyDescriptor(window, 'scrollX')
const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')

afterEach(() => {
  restoreProperty('scrollX', originalScrollX)
  restoreProperty('scrollY', originalScrollY)
  document.documentElement.style.overflow = ''
  document.documentElement.style.scrollbarGutter = ''
  vi.restoreAllMocks()
})

describe('pageScrollLock', () => {
  it('holds the captured page position through delayed dialog open and close adjustments', () => {
    let scrollX = 12
    let scrollY = 900
    const animationFrames: FrameRequestCallback[] = []

    Object.defineProperty(window, 'scrollX', {
      configurable: true,
      get: () => scrollX,
    })
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => scrollY,
    })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation((x, y) => {
      scrollX = x
      scrollY = y
    })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrames.push(callback)
      return animationFrames.length
    })

    const lockToken = acquirePageScrollLock()

    scrollY = 902
    window.dispatchEvent(new Event('scroll'))

    expect(scrollTo).toHaveBeenLastCalledWith(12, 900)
    expect(scrollY).toBe(900)

    releasePageScrollLock(lockToken)
    expect(animationFrames).toHaveLength(1)

    animationFrames.shift()?.(0)
    scrollY = 904
    expect(animationFrames).toHaveLength(1)

    animationFrames.shift()?.(16)

    expect(scrollTo).toHaveBeenLastCalledWith(12, 900)
    expect(scrollY).toBe(900)
  })
})

function restoreProperty(
  propertyName: 'scrollX' | 'scrollY',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(window, propertyName, descriptor)
    return
  }

  Reflect.deleteProperty(window, propertyName)
}
