import {fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {DbDetailModalFrame} from './DbDetailModalFrame'

describe('DbDetailModalFrame', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.documentElement.style.overflow = ''
    document.documentElement.style.scrollbarGutter = ''
  })

  it('uses a native dialog with Firefox-stable containment and restores page state', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'scroll'

    const {container, unmount} = render(
      <DbDetailModalFrame ariaLabel='Database detail'>
        <p>Detail content</p>
      </DbDetailModalFrame>,
    )

    const dialog = screen.getByRole('dialog', {name: 'Database detail'})
    const shell = dialog.querySelector<HTMLElement>('[data-detail-modal-shell]')
    if (!shell) {
      throw new Error('Expected database detail modal shell')
    }
    expect(dialog.tagName).toBe('DIALOG')
    expect(dialog).toHaveAttribute('open')
    expect(shell).toHaveFocus()
    expect(container.inert).toBe(true)
    expect(container).toHaveAttribute('aria-hidden', 'true')
    expect(document.body.style.overflow).toBe('auto')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')
    expect(fireEvent.keyDown(shell, {key: 'PageDown'})).toBe(false)

    unmount()

    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).toBe('auto')
    expect(document.documentElement.style.overflow).toBe('scroll')
    expect(document.documentElement.style.scrollbarGutter).toBe('')
    trigger.remove()
  })
})
