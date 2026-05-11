import type {ReactNode} from 'react'

import {FaChevronDown, FaChevronRight} from 'react-icons/fa6'

interface TimelineArchiveSectionProps {
  children: ReactNode
  contentClassName?: string
  dividerClassName?: string
  expanded: boolean
  itemCount: number
  onToggle: () => void
  title: string
  titleClassName?: string
}

export function TimelineArchiveSection({
  children,
  contentClassName,
  dividerClassName = 'bg-gradient-to-r from-slate-700/20 to-transparent',
  expanded,
  itemCount,
  onToggle,
  title,
  titleClassName = 'text-slate-500',
}: TimelineArchiveSectionProps) {
  return (
    <div className='mt-4 space-y-3'>
      <button
        aria-expanded={expanded}
        className='flex min-h-10 w-full items-center gap-3 text-left transition-colors hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none sm:min-h-8'
        onClick={onToggle}
        type='button'
      >
        {expanded ? (
          <FaChevronDown aria-hidden className='shrink-0 text-[13px] text-slate-400' />
        ) : (
          <FaChevronRight aria-hidden className='shrink-0 text-[13px] text-slate-400' />
        )}
        <h4 className={`ui-title text-sm ${titleClassName}`}>{title}</h4>
        <span className='text-[10px] font-medium tracking-wider text-slate-500/80'>
          {itemCount}
        </span>
        <div className={`h-px flex-1 ${dividerClassName}`} />
      </button>
      {expanded ? <div className={contentClassName}>{children}</div> : null}
    </div>
  )
}
