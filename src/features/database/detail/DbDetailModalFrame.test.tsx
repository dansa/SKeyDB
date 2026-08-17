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

  it('uses the shared dialog primitive and restores its trigger focus', () => {
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
    expect(dialog.tagName).toBe('DIV')
    expect(dialog).toHaveFocus()
    expect(container.inert).toBe(true)
    expect(container).toHaveAttribute('aria-hidden', 'true')
    expect(document.body.style.overflow).toBe('auto')
    expect(document.documentElement.style.overflow).toBe('scroll')
    expect(fireEvent.keyDown(dialog, {key: 'PageDown'})).toBe(false)

    unmount()

    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).toBe('auto')
    expect(document.documentElement.style.overflow).toBe('scroll')
    trigger.remove()
  })
})
