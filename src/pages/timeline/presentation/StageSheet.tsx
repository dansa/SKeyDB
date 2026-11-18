import {useLayoutEffect, useRef, type ReactNode} from 'react'

import {createPortal} from 'react-dom'

import {acquirePageScrollLock, releasePageScrollLock} from '@/ui/modal/pageScrollLock'

export function StageSheet({
  children,
  onClose,
  selectionKey,
  title,
}: {
  children: ReactNode
  onClose: () => void
  selectionKey: string
  title: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const lock = acquirePageScrollLock()
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    dialog.focus({preventScroll: true})
    return () => {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
      releasePageScrollLock(lock)
      previous?.focus({preventScroll: true})
    }
  }, [])
  return createPortal(
    <dialog
      aria-label={title}
      className='timeline-sheet ui-inset-frame fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-screen max-w-none overflow-hidden rounded-t-[2px] border border-slate-700/60 bg-slate-950 p-0 text-inherit focus:outline-none'
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
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
