import {createRef, useRef} from 'react'

import {act, render, renderHook, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useNativeModalDialog} from './useNativeModalDialog'

function TestDialog({
  initialFocus = false,
  label = 'Native modal',
  lockBodyScroll = false,
  onCancel,
}: {
  initialFocus?: boolean
  label?: string
  lockBodyScroll?: boolean
  onCancel?: (event: Event) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useNativeModalDialog({
    dialogRef,
    initialFocusRef: initialFocus ? buttonRef : undefined,
    lockBodyScroll,
    onCancel,
  })

  return (
    <dialog aria-label={label} ref={dialogRef}>
      <button ref={buttonRef} type='button'>
        Initial action
      </button>
    </dialog>
  )
}

function LockedDialogStack({showFirst, showSecond}: {showFirst: boolean; showSecond: boolean}) {
  return (
    <>
      {showFirst ? <TestDialog label='First modal' lockBodyScroll={true} /> : null}
      {showSecond ? <TestDialog label='Second modal' lockBodyScroll={true} /> : null}
    </>
  )
}

describe('useNativeModalDialog', () => {
  const showModalDescriptor = Object.getOwnPropertyDescriptor(
    HTMLDialogElement.prototype,
    'showModal',
  )
  const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')

  afterEach(() => {
    restoreDialogMethod('showModal', showModalDescriptor)
    restoreDialogMethod('close', closeDescriptor)
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    document.documentElement.style.overflow = ''
    document.body.replaceChildren()
  })

  it('calls showModal when available and closes on cleanup', () => {
    const dialog = document.createElement('dialog')
    const dialogRef = createRef<HTMLDialogElement>()
    dialogRef.current = dialog
    const showModalSpy = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    const closeSpy = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    })
    HTMLDialogElement.prototype.showModal = showModalSpy
    HTMLDialogElement.prototype.close = closeSpy

    const {unmount} = renderHook(() => {
      useNativeModalDialog({dialogRef})
    })

    expect(showModalSpy).toHaveBeenCalledTimes(1)
    expect(dialog).toHaveAttribute('open')

    unmount()

    expect(closeSpy).toHaveBeenCalledTimes(1)
    expect(dialog).not.toHaveAttribute('open')
  })

  it('sets open directly when dialog methods are missing in jsdom', () => {
    const dialog = document.createElement('dialog')
    const dialogRef = createRef<HTMLDialogElement>()
    dialogRef.current = dialog
    HTMLDialogElement.prototype.showModal = undefined as unknown as HTMLDialogElement['showModal']
    HTMLDialogElement.prototype.close = undefined as unknown as HTMLDialogElement['close']

    const {unmount} = renderHook(() => {
      useNativeModalDialog({dialogRef})
    })

    expect(dialog).toHaveAttribute('open')

    unmount()

    expect(dialog).not.toHaveAttribute('open')
  })

  it('makes fallback-open dialogs available to role queries', () => {
    HTMLDialogElement.prototype.showModal = undefined as unknown as HTMLDialogElement['showModal']

    render(<TestDialog />)

    expect(screen.getByRole('dialog', {name: 'Native modal'})).toHaveAttribute('open')
  })

  it('preserves focus, supports initial focus, wires cancel, and restores scroll lock', () => {
    const previousButton = document.createElement('button')
    document.body.appendChild(previousButton)
    previousButton.focus()
    document.body.style.overflow = 'auto'
    const onCancel = vi.fn((event: Event) => {
      event.preventDefault()
    })

    const {unmount} = render(
      <TestDialog initialFocus={true} lockBodyScroll={true} onCancel={onCancel} />,
    )
    const dialog = screen.getByRole('dialog', {name: 'Native modal'})

    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Initial action'}))
    expect(document.body.style.overflow).toBe('hidden')

    const cancelEvent = new Event('cancel', {cancelable: true})
    act(() => {
      dialog.dispatchEvent(cancelEvent)
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(cancelEvent.defaultPrevented).toBe(true)

    unmount()

    expect(document.body.style.overflow).toBe('auto')
    expect(document.activeElement).toBe(previousButton)
  })

  it('prevents uncontrolled native dismissal when no cancel handler is supplied', () => {
    render(<TestDialog />)

    const dialog = screen.getByRole('dialog', {name: 'Native modal'})
    const cancelEvent = new Event('cancel', {cancelable: true})

    act(() => {
      dialog.dispatchEvent(cancelEvent)
    })

    expect(cancelEvent.defaultPrevented).toBe(true)
  })

  it('keeps the dialog open when the cancel callback changes', () => {
    const showModalSpy = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    const closeSpy = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    })
    HTMLDialogElement.prototype.showModal = showModalSpy
    HTMLDialogElement.prototype.close = closeSpy

    const {rerender, unmount} = render(<TestDialog onCancel={vi.fn()} />)

    rerender(<TestDialog onCancel={vi.fn()} />)

    expect(showModalSpy).toHaveBeenCalledTimes(1)
    expect(closeSpy).not.toHaveBeenCalled()

    unmount()

    expect(closeSpy).toHaveBeenCalledTimes(1)
  })

  it('keeps page scroll locked until every locked dialog has unmounted', () => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'scroll'

    const {rerender, unmount} = render(<LockedDialogStack showFirst={true} showSecond={true} />)

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.position).toBe('fixed')
    expect(document.documentElement.style.overflow).toBe('hidden')

    rerender(<LockedDialogStack showFirst={false} showSecond={true} />)

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.position).toBe('fixed')
    expect(document.documentElement.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.position).toBe('')
    expect(document.documentElement.style.overflow).toBe('scroll')
  })
})

function restoreDialogMethod(
  methodName: 'close' | 'showModal',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, methodName, descriptor)
    return
  }

  Reflect.deleteProperty(HTMLDialogElement.prototype, methodName)
}
