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
      className='timeline-next-sheet ui-inset-frame fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-screen max-w-none overflow-hidden rounded-t-[2px] border border-slate-700/60 bg-slate-950 p-0 text-inherit focus:outline-none'
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
      <div className='flex items-center gap-3 border-b border-slate-700/40 px-4 py-2'>
        <span className='ui-title min-w-0 flex-1 truncate text-sm text-amber-50'>{title}</span>
        <button
          className='min-h-10 shrink-0 px-2 text-sm text-slate-200 hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200/60'
          onClick={onClose}
          type='button'
        >
          Close
        </button>
      </div>
      <div className='ui-scrollbar max-h-[calc(88dvh-3.5rem)] overflow-y-auto' key={selectionKey}>
        {children}
      </div>
    </dialog>,
    document.body,
  )
}
