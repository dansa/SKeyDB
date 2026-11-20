import type {ReactNode} from 'react'

import {FaChevronRight} from 'react-icons/fa6'

export function StageDisclosure({
  children,
  className,
  defaultOpen,
  label,
}: {
  children: ReactNode
  className?: string
  defaultOpen?: boolean
  label: ReactNode
}) {
  return (
    <details className={`group ${className ?? ''}`} open={defaultOpen ? true : undefined}>
      <summary className='flex min-h-10 cursor-pointer list-none items-center gap-2 text-xs font-semibold text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200 [&::-webkit-details-marker]:hidden'>
        <FaChevronRight
          aria-hidden
          className='size-3 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none'
        />
        {label}
      </summary>
      {children}
    </details>
  )
}
