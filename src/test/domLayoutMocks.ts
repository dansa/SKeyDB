import {vi} from 'vitest'

interface MockDomRectInit {
  bottom?: number
  height?: number
  left?: number
  right?: number
  top?: number
  width?: number
  x?: number
  y?: number
}

function createMockDomRect(init: MockDomRectInit): DOMRect {
  const left = init.left ?? init.x ?? 0
  const top = init.top ?? init.y ?? 0
  const width = init.width ?? (init.right === undefined ? 0 : init.right - left)
  const height = init.height ?? (init.bottom === undefined ? 0 : init.bottom - top)
  const x = init.x ?? left
  const y = init.y ?? top

  return {
    bottom: init.bottom ?? top + height,
    height,
    left,
    right: init.right ?? left + width,
    toJSON() {
      return {}
    },
    top,
    width,
    x,
    y,
  }
}

function restorePropertyDescriptor(
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

export function installElementRectMock(
  getRect: (element: HTMLElement) => DOMRect | MockDomRectInit,
): () => void {
  const getBoundingClientRectSpy = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function mockGetBoundingClientRect(this: HTMLElement) {
      const rect = getRect(this)
      return rect instanceof DOMRect ? rect : createMockDomRect(rect)
    })

  return () => {
    getBoundingClientRectSpy.mockRestore()
  }
}

export function installOffsetHeightFromRectMock(): () => void {
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight',
  )

  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: function getMockOffsetHeight(this: HTMLElement) {
      return Math.round(this.getBoundingClientRect().height)
    },
  })

  return () => {
    restorePropertyDescriptor(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
  }
}

export function installStaticMatchMediaMock({
  matches = false,
  media,
}: {
  matches?: boolean
  media?: string
} = {}): () => void {
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia')

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation(
      (query: string): MediaQueryList =>
        ({
          addEventListener: vi.fn(),
          addListener: vi.fn(),
          dispatchEvent: vi.fn(),
          matches,
          media: media ?? query,
          onchange: null,
          removeEventListener: vi.fn(),
          removeListener: vi.fn(),
        }) as MediaQueryList,
    ),
  })

  return () => {
    restorePropertyDescriptor(window, 'matchMedia', originalMatchMedia)
  }
}
