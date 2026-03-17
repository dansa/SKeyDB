import {useCallback, useEffect, useRef, type ReactNode} from 'react'

interface PickerDrawerProps {
  isOpen: boolean
  onClose: () => void
  position?: 'right' | 'bottom'
  children: ReactNode
}

export function PickerDrawer({isOpen, onClose, position = 'right', children}: PickerDrawerProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const getFocusTargets = useCallback((): HTMLElement[] => {
    const panel = panelRef.current
    if (!panel) {
      return []
    }

    const targets = Array.from(
      panel.querySelectorAll<HTMLElement>(
        [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(','),
      ),
    ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)

    return [panel, ...targets.filter((element) => element !== panel)]
  }, [])

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === backdropRef.current) {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusTargets = getFocusTargets()
    focusTargets[0]?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const nextFocusTargets = getFocusTargets()
      if (nextFocusTargets.length === 0) {
        return
      }

      const currentIndex = nextFocusTargets.findIndex(
        (element) => element === document.activeElement,
      )
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? nextFocusTargets.length - 1
          : currentIndex - 1
        : currentIndex === -1 || currentIndex === nextFocusTargets.length - 1
          ? 0
          : currentIndex + 1

      event.preventDefault()
      nextFocusTargets[nextIndex]?.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus()
      }
    }
  }, [getFocusTargets, isOpen, onClose])

  const isRight = position === 'right'
  const panelStyle = isRight
    ? {
        width: 'min(max(20rem, 34vw), 36rem)',
        maxWidth: 'calc(100vw - 3rem)',
      }
    : undefined

  const backdropClass = isOpen
    ? 'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 opacity-100'
    : 'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 opacity-0 pointer-events-none'

  const panelClass = isRight
    ? `fixed right-0 top-0 z-50 h-full overflow-y-auto bg-slate-900 shadow-xl transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`
    : `fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-xl bg-slate-900 shadow-xl transition-transform duration-200 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`

  return (
    <>
      <div
        className={backdropClass}
        onClick={handleBackdropClick}
        ref={backdropRef}
        role='presentation'
      />
      <div
        aria-hidden={!isOpen}
        aria-modal={isOpen || undefined}
        className={panelClass}
        ref={panelRef}
        role='dialog'
        style={panelStyle}
        tabIndex={-1}
      >
        {isOpen ? children : null}
      </div>
    </>
  )
}
