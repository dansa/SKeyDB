import {useCallback, useEffect, useRef, type ReactNode} from 'react'

interface PickerDrawerProps {
  isOpen: boolean
  onClose: () => void
  position?: 'right' | 'bottom'
  children: ReactNode
}

export function PickerDrawer({isOpen, onClose, position = 'right', children}: PickerDrawerProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

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

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

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
      <div aria-modal={isOpen} className={panelClass} role='dialog' style={panelStyle}>
        {isOpen ? children : null}
      </div>
    </>
  )
}
