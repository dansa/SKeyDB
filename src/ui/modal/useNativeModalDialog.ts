import {useEffect, useEffectEvent, useLayoutEffect, type RefObject} from 'react'

import {acquirePageScrollLock, releasePageScrollLock} from './pageScrollLock'

interface UseNativeModalDialogOptions {
  dialogRef: RefObject<HTMLDialogElement | null>
  initialFocusRef?: RefObject<HTMLElement | null>
  lockBodyScroll?: boolean
  onCancel?: (event: Event) => void
  onClick?: (event: MouseEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  restoreFocus?: boolean
}

function openDialog(dialog: HTMLDialogElement) {
  if (dialog.open) {
    return
  }

  if (typeof dialog.showModal === 'function') {
    dialog.showModal()
    return
  }

  dialog.setAttribute('open', '')
}

function closeDialog(dialog: HTMLDialogElement) {
  if (!dialog.open) {
    return
  }

  if (typeof dialog.close === 'function') {
    dialog.close()
    return
  }

  dialog.removeAttribute('open')
}

function getTopmostOpenDialog(): HTMLDialogElement | null {
  const openDialogs = document.querySelectorAll<HTMLDialogElement>('dialog[open]')
  return openDialogs[openDialogs.length - 1] ?? null
}

export function useNativeModalDialog({
  dialogRef,
  initialFocusRef,
  lockBodyScroll = false,
  onCancel,
  onClick,
  onKeyDown,
  restoreFocus = true,
}: UseNativeModalDialogOptions) {
  const handleCancelEvent = useEffectEvent((event: Event) => {
    if (!onCancel) {
      event.preventDefault()
      return
    }

    onCancel(event)
  })
  const handleClickEvent = useEffectEvent((event: MouseEvent) => {
    onClick?.(event)
  })
  const handleKeyDownEvent = useEffectEvent((event: KeyboardEvent) => {
    onKeyDown?.(event)
  })

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return undefined
    }

    const previousFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    openDialog(dialog)

    initialFocusRef?.current?.focus()

    return () => {
      closeDialog(dialog)

      if (restoreFocus) {
        previousFocusedElement?.focus()
      }
    }
  }, [dialogRef, initialFocusRef, restoreFocus])

  useEffect(() => {
    if (!lockBodyScroll) {
      return undefined
    }

    const lockToken = acquirePageScrollLock()

    return () => {
      releasePageScrollLock(lockToken)
    }
  }, [lockBodyScroll])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return undefined
    }

    function handleCancel(event: Event) {
      handleCancelEvent(event)
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [dialogRef])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return undefined
    }

    function handleClick(event: MouseEvent) {
      handleClickEvent(event)
    }

    function handleKeyDown(event: KeyboardEvent) {
      handleKeyDownEvent(event)
    }

    dialog.addEventListener('click', handleClick)
    dialog.addEventListener('keydown', handleKeyDown)
    return () => {
      dialog.removeEventListener('click', handleClick)
      dialog.removeEventListener('keydown', handleKeyDown)
    }
  }, [dialogRef])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || typeof dialog.showModal === 'function') {
      return undefined
    }
    const fallbackDialog = dialog

    function handleFallbackEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || getTopmostOpenDialog() !== fallbackDialog) {
        return
      }

      const cancelEvent = new Event('cancel', {cancelable: true})
      fallbackDialog.dispatchEvent(cancelEvent)
      if (cancelEvent.defaultPrevented) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleFallbackEscape, true)
    return () => {
      window.removeEventListener('keydown', handleFallbackEscape, true)
    }
  }, [dialogRef])
}
