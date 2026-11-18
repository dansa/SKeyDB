import {useEffect, useId, useRef, useState, type ReactNode} from 'react'

import type {TimelineRewardItem} from '@/domain/timeline'

export function RewardPreview({
  item,
  image,
  description,
  large,
  label,
  className,
  children,
  notable,
}: {
  item: TimelineRewardItem
  image?: string
  description?: string
  large?: boolean
  label?: string
  className?: string
  children: ReactNode
  notable?: boolean
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const name = `${item.name} ${item.amount ?? ''}`.trim()

  function togglePreview() {
    const el = panel.current
    const button = anchor.current
    if (!el?.showPopover || !button) return
    if (el.matches(':popover-open')) {
      el.hidePopover()
      return
    }
    el.showPopover()
    el.style.maxHeight = ''
    const rect = button.getBoundingClientRect()
    const {width, height} = el.getBoundingClientRect()
    el.style.left = `${String(Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)))}px`
    const below = window.innerHeight - rect.bottom - 12
    const above = rect.top - 12
    const placeBelow = below >= height || below >= above
    const availableHeight = Math.max(0, placeBelow ? below : above)
    el.style.maxHeight = `${String(availableHeight)}px`
    el.style.top = `${String(placeBelow ? rect.bottom + 4 : rect.top - Math.min(height, availableHeight) - 4)}px`
  }

  useEffect(() => {
    if (!open) return
    function onEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !panel.current?.matches(':popover-open')) return
      event.preventDefault()
      event.stopImmediatePropagation()
      panel.current.hidePopover()
    }
    window.addEventListener('keydown', onEscape, true)
    function dismiss() {
      if (panel.current?.matches(':popover-open')) panel.current.hidePopover()
    }
    function onScroll(event: Event) {
      if (event.target === panel.current) return
      dismiss()
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', dismiss)
    return () => {
      window.removeEventListener('keydown', onEscape, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [open])

  return (
    <>
      <button
        aria-controls={id}
        aria-label={label ?? name}
        className={`cursor-pointer ${className ?? ''}`}
        data-notable={notable ? 'true' : undefined}
        onClick={(event) => {
          event.preventDefault()
          togglePreview()
        }}
        popoverTarget={id}
        ref={anchor}
        type='button'
      >
        {children}
      </button>
      <div
        aria-label={name}
        className='fixed inset-auto m-0 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-[2px] border border-amber-300/35 bg-slate-950 px-3 py-2 text-sm text-slate-200 shadow-lg'
        id={id}
        onToggle={() => {
          setOpen(panel.current?.matches(':popover-open') ?? false)
        }}
        popover='auto'
        ref={panel}
        role='region'
      >
        {image ? (
          <img
            alt=''
            className={`mx-auto mb-2 object-contain ${large ? 'size-28' : 'size-16'}`}
            src={image}
          />
        ) : null}
        <p className='font-semibold'>{name}</p>
        {description ? <p className='mt-1 max-w-56 text-xs text-slate-300'>{description}</p> : null}
      </div>
    </>
  )
}
