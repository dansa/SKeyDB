import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
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

    const onCloseAll = vi.fn()

    render(
      <PopoverTrailPanel
        anchorElement={anchorElement}
        anchorRect={anchorRect}
        itemCount={1}
        onCloseAll={onCloseAll}
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

  it('does not close on outside click and uses the explicit close-all action instead', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1200,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    })

    const onCloseAll = vi.fn()

    render(
      <PopoverTrailPanel
        anchorRect={makeRect({top: 100, bottom: 120, left: 150, right: 170})}
        itemCount={2}
        onCloseAll={onCloseAll}
      >
        <div>Popover content</div>
      </PopoverTrailPanel>,
    )

    fireEvent.mouseDown(document.body)
    expect(onCloseAll).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', {name: 'Close all'}))
    expect(onCloseAll).toHaveBeenCalledTimes(1)
  })

  it('moves focus into the popover and restores it to the anchor when the panel closes', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1200,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    })

    const anchorElement = document.createElement('button')
    anchorElement.textContent = 'Anchor'
    document.body.appendChild(anchorElement)
    anchorElement.focus()

    const onCloseAll = vi.fn()
    const {unmount} = render(
      <PopoverTrailPanel
        anchorElement={anchorElement}
        anchorRect={makeRect({top: 100, bottom: 120, left: 150, right: 170})}
        itemCount={1}
        onCloseAll={onCloseAll}
      >
        <button type='button'>Nested action</button>
      </PopoverTrailPanel>,
    )

    expect(
      await screen.findByRole('dialog', {name: 'Database reference details'}),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Close all'})).toHaveFocus()
    })

    unmount()
    expect(anchorElement).toHaveFocus()
  })

  it('keeps tab focus inside the popover and supports escape-to-close', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1200,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    })

    const onCloseAll = vi.fn()

    render(
      <PopoverTrailPanel
        anchorRect={makeRect({top: 100, bottom: 120, left: 150, right: 170})}
        itemCount={1}
        onCloseAll={onCloseAll}
      >
        <button type='button'>Nested action</button>
      </PopoverTrailPanel>,
    )

    const closeButton = await screen.findByRole('button', {name: 'Close all'})
    const nestedAction = screen.getByRole('button', {name: 'Nested action'})

    closeButton.focus()
    fireEvent.keyDown(closeButton, {key: 'Tab', shiftKey: true})
    expect(nestedAction).toHaveFocus()

    nestedAction.focus()
    fireEvent.keyDown(nestedAction, {key: 'Tab'})
    expect(closeButton).toHaveFocus()

    fireEvent.keyDown(closeButton, {key: 'Escape'})
    expect(onCloseAll).toHaveBeenCalledTimes(1)
  })
})
