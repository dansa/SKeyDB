import type {ReactNode} from 'react'

interface TimelinePageSectionProps {
  children: ReactNode
  title: string
}

export function TimelinePageSection({children, title}: TimelinePageSectionProps) {
  return (
    <section className='space-y-4'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <span aria-hidden className='block h-1.5 w-1.5 bg-amber-200/60' />
          <h2 className='ui-title text-sm tracking-[0.16em] text-amber-100 uppercase'>{title}</h2>
        </div>
        <div className='h-px flex-1 bg-gradient-to-r from-amber-200/25 via-slate-600/30 to-transparent' />
      </div>
      {children}
    </section>
  )
}
