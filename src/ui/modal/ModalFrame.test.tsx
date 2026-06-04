import {fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {ModalFrame} from './ModalFrame'

describe('ModalFrame', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  })

  it('locks page and root scroll while open and restores the previous overflow on cleanup', () => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'scroll'

    const {unmount} = render(
      <ModalFrame onClose={vi.fn()} title='Import Teams'>
        <p>Paste an import code.</p>
      </ModalFrame>,
    )

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.width).toBe('100%')
    expect(document.documentElement.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.position).toBe('')
    expect(document.body.style.width).toBe('')
    expect(document.documentElement.style.overflow).toBe('scroll')
  })

  it('allows the visible overlay to own light-dismiss clicks', () => {
    const onClose = vi.fn()
    const {container} = render(
      <ModalFrame onClose={onClose} title='Export Owned Box'>
        <p>Export settings</p>
      </ModalFrame>,
    )

    const overlay = container.querySelector('.ui-modal-overlay')
    expect(overlay).toBeInstanceOf(HTMLElement)

    fireEvent.click(overlay as HTMLElement)

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog', {name: 'Export Owned Box'})).toBeInTheDocument()
  })
})
