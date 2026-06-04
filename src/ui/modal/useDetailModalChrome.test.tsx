import {act, renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useDetailModalChrome} from './useDetailModalChrome'

const originalInnerWidth = window.innerWidth

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: originalInnerWidth,
  })
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  document.documentElement.style.overflow = ''
})

function renderChrome({
  clickOutsideClosesPopovers = true,
  hasOpenPopovers = true,
}: {
  clickOutsideClosesPopovers?: boolean
  hasOpenPopovers?: boolean
} = {}) {
  const closeAllPopovers = vi.fn()
  const onClose = vi.fn()

  const hook = renderHook(() =>
    useDetailModalChrome({
      clickOutsideClosesPopovers,
      closeAllPopovers,
      hasOpenPopovers,
      isSearchOpen: false,
      onClose,
    }),
  )

  const panel = document.createElement('div')
  const panelButton = document.createElement('button')
  panel.appendChild(panelButton)
  document.body.appendChild(panel)

  act(() => {
    hook.result.current.panelRef.current = panel
  })

  return {
    closeAllPopovers,
    hook,
    onClose,
    panel,
    panelButton,
  }
}

function clickTarget(
  chrome: ReturnType<typeof renderChrome>['hook']['result']['current'],
  target: HTMLElement,
) {
  act(() => {
    chrome.handleOverlayClick({target})
  })
}

describe('useDetailModalChrome', () => {
  it('locks page and root scroll until the detail chrome unmounts', () => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'scroll'

    const {hook} = renderChrome()

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.width).toBe('100%')
    expect(document.documentElement.style.overflow).toBe('hidden')

    hook.unmount()

    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.position).toBe('')
    expect(document.body.style.width).toBe('')
    expect(document.documentElement.style.overflow).toBe('scroll')
  })

  it('keeps popovers open when marked controls bubble to the overlay', () => {
    const {closeAllPopovers, hook, onClose, panelButton} = renderChrome()
    panelButton.dataset.detailModalPopoverPreserve = ''

    clickTarget(hook.result.current, panelButton)

    expect(closeAllPopovers).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes popovers when ordinary panel clicks bubble to the overlay', () => {
    const {closeAllPopovers, hook, onClose, panelButton} = renderChrome()

    clickTarget(hook.result.current, panelButton)

    expect(closeAllPopovers).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes popovers before closing the modal on outside clicks', () => {
    const {closeAllPopovers, hook, onClose} = renderChrome()
    const backdropTarget = document.createElement('div')
    document.body.appendChild(backdropTarget)

    try {
      clickTarget(hook.result.current, backdropTarget)

      expect(closeAllPopovers).toHaveBeenCalledTimes(1)
      expect(onClose).not.toHaveBeenCalled()
    } finally {
      backdropTarget.remove()
    }
  })

  it('keeps existing outside-click modal close behavior when no popovers are open', () => {
    const {closeAllPopovers, hook, onClose} = renderChrome({hasOpenPopovers: false})
    const backdropTarget = document.createElement('div')
    document.body.appendChild(backdropTarget)

    try {
      clickTarget(hook.result.current, backdropTarget)

      expect(closeAllPopovers).not.toHaveBeenCalled()
      expect(onClose).toHaveBeenCalledTimes(1)
    } finally {
      backdropTarget.remove()
    }
  })

  it('does not close popovers for registered external modal surfaces', () => {
    const {closeAllPopovers, hook, onClose} = renderChrome()
    const externalSurface = document.createElement('div')
    externalSurface.dataset.detailModalExternal = ''
    document.body.appendChild(externalSurface)

    try {
      clickTarget(hook.result.current, externalSurface)

      expect(closeAllPopovers).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
    } finally {
      externalSurface.remove()
    }
  })

  it('tracks mobile header viewport changes and cleans up the resize listener', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 900,
    })
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const {hook} = renderChrome()

    expect(hook.result.current.isMobileHeader).toBe(false)

    act(() => {
      window.innerWidth = 640
      window.dispatchEvent(new Event('resize'))
    })
    expect(hook.result.current.isMobileHeader).toBe(true)

    hook.unmount()

    const resizeListener = addEventListener.mock.calls.find(([type]) => type === 'resize')?.[1]
    expect(resizeListener).toBeDefined()
    expect(removeEventListener).toHaveBeenCalledWith('resize', resizeListener)

    addEventListener.mockRestore()
    removeEventListener.mockRestore()
  })
})
