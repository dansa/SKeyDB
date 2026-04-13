import React from 'react'

import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {usePopoverTrailDismiss, usePopoverTrailViewportVersion} from './popover-trail-panel-hooks'
import {DesktopPopoverTrailPanel, MobilePopoverTrailPanel} from './PopoverTrailPanelLayouts'

function DismissProbe({onCloseTop}: {onCloseTop: () => void}) {
  const ref = React.useRef<HTMLDivElement>(null)
  usePopoverTrailDismiss(ref, onCloseTop)
  return (
    <div>
      <div ref={ref}>inside</div>
      <button type='button'>outside</button>
    </div>
  )
}

describe('popover trail panel hooks and layouts', () => {
  it('rerenders on viewport change events', async () => {
    const onRender = vi.fn()

    function CounterProbe({onRenderCallback}: {onRenderCallback: () => void}) {
      usePopoverTrailViewportVersion()
      React.useEffect(() => {
        onRenderCallback()
      })
      return <div>probe</div>
    }

    render(<CounterProbe onRenderCallback={onRender} />)
    expect(onRender).toHaveBeenCalledTimes(1)

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      expect(onRender).toHaveBeenCalledTimes(2)
    })
  })

  it('closes on outside click and on Escape', () => {
    const onCloseTop = vi.fn()

    render(<DismissProbe onCloseTop={onCloseTop} />)

    fireEvent.mouseDown(screen.getByRole('button', {name: 'outside'}))
    fireEvent.keyDown(window, {key: 'Escape'})

    expect(onCloseTop).toHaveBeenCalledTimes(2)
  })

  it('renders a mobile back button for stacked popovers', () => {
    const onCloseTop = vi.fn()

    render(
      <MobilePopoverTrailPanel
        children={[<div key='a'>First</div>, <div key='b'>Second</div>]}
        containerRef={React.createRef<HTMLDivElement>()}
        itemCount={2}
        onCloseTop={onCloseTop}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: /Back/}))

    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(onCloseTop).toHaveBeenCalledTimes(1)
  })

  it('positions desktop popovers within the viewport bounds', async () => {
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: 320})
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: 180})

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.textContent.includes('Desktop popover')) {
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 140,
          bottom: 80,
          width: 140,
          height: 80,
          toJSON: () => ({}),
        } as DOMRect
      }
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        toJSON: () => ({}),
      } as DOMRect
    })

    render(
      <DesktopPopoverTrailPanel
        children={[<div key='p'>Desktop popover</div>]}
        containerRef={React.createRef<HTMLDivElement>()}
        currentAnchorRect={
          {
            top: 150,
            bottom: 170,
            left: 260,
            right: 280,
            width: 20,
            height: 20,
            x: 260,
            y: 150,
            toJSON: () => ({}),
          } as DOMRect
        }
        direction='down'
      />,
    )

    const positioned = Array.from(document.querySelectorAll<HTMLDivElement>('div')).find((node) =>
      node.className.includes('max-h-[calc(100vh-24px)]'),
    )
    if (!positioned) {
      throw new Error('Expected positioned popover')
    }

    await waitFor(() => {
      expect(positioned.style.left).toBe('168px')
      expect(positioned.style.top).toBe('88px')
    })
  })
})
