import {act, render, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {PopoverTrailPanel} from './PopoverTrailPanel'

function makeRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
    ...overrides,
  } as DOMRect
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('PopoverTrailPanel', () => {
  it('repositions against the live anchor element after scroll changes its viewport rect', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1200,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    })

    const anchorElement = document.createElement('button')
    document.body.appendChild(anchorElement)

    let anchorRect = makeRect({
      top: 100,
      bottom: 120,
      left: 150,
      right: 170,
      width: 20,
      height: 20,
    })

    const panelRect = makeRect({
      width: 200,
      height: 80,
      right: 200,
      bottom: 80,
    })

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this === anchorElement) {
        return anchorRect
      }
      if (this.dataset.skillPopover !== undefined) {
        return panelRect
      }
      return makeRect()
    })

    const onCloseTop = vi.fn()

    render(
      <PopoverTrailPanel
        anchorElement={anchorElement}
        anchorRect={anchorRect}
        itemCount={1}
        onCloseTop={onCloseTop}
      >
        <div>Popover content</div>
      </PopoverTrailPanel>,
    )

    const panel = document.querySelector<HTMLDivElement>('[data-skill-popover]')
    if (!panel) {
      throw new Error('Expected popover trail panel to render')
    }

    await waitFor(() => {
      expect(panel.style.top).toBe('126px')
      expect(panel.style.left).toBe('150px')
    })

    anchorRect = makeRect({
      top: 280,
      bottom: 300,
      left: 320,
      right: 340,
      width: 20,
      height: 20,
    })

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    await waitFor(() => {
      expect(panel.style.top).toBe('306px')
      expect(panel.style.left).toBe('320px')
    })
  })
})
