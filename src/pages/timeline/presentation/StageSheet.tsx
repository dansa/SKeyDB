import {useEffectEvent, useLayoutEffect, useRef, type ReactNode, type RefObject} from 'react'

import {createPortal} from 'react-dom'

import {acquirePageScrollLock, releasePageScrollLock} from '@/ui/modal/pageScrollLock'

export function StageSheet({
  children,
  fallbackFocusRef,
  onClose,
  selectionKey,
  title,
}: {
  children: ReactNode
  fallbackFocusRef: RefObject<HTMLHeadingElement | null>
  onClose: () => void
  selectionKey: string
  title: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const dismissOnBackdrop = useEffectEvent((event: MouseEvent) => {
    // Native dialog backdrop clicks target the dialog itself.
    if (event.target === event.currentTarget) onClose()
  })

  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const fallback = fallbackFocusRef.current
    const lock = acquirePageScrollLock()
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    dialog.focus({preventScroll: true})
    dialog.addEventListener('click', dismissOnBackdrop)
    return () => {
      dialog.removeEventListener('click', dismissOnBackdrop)
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
      releasePageScrollLock(lock)
      if (previous?.isConnected && previous !== document.body) {
        previous.focus({preventScroll: true})
        if (document.activeElement === previous) return
      }
      if (fallback?.isConnected) fallback.focus()
    }
  }, [fallbackFocusRef])
  return createPortal(
    <dialog
      aria-label={title}
      className='timeline-sheet ui-inset-frame fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-screen max-w-none overflow-hidden rounded-t-[2px] border border-slate-700/60 bg-slate-950 p-0 text-inherit focus:outline-none'
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      ref={ref}
      tabIndex={-1}
    >
      <div
        className='ui-scrollbar max-h-[88dvh] overflow-y-auto overscroll-contain'
        data-stage-scroll
        key={selectionKey}
      >
        {children}
      </div>
    </dialog>,
    document.body,
  )
}
