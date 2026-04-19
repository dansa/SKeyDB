import type {ReactNode} from 'react'

import {DatabaseEntityTabs} from './DatabaseEntityTabs'

interface DatabaseBrowseLayoutProps {
  activeEntity: 'awakeners' | 'wheels'
  search: string
  title: string
  description: string
  filters: ReactNode
  results: ReactNode
}

export function DatabaseBrowseLayout({
  activeEntity,
  description,
  filters,
  results,
  search,
  title,
}: DatabaseBrowseLayoutProps) {
  return (
    <div className='space-y-3 rounded-sm border border-slate-700/55 bg-[linear-gradient(180deg,rgba(20,32,53,0.52),rgba(8,14,26,0.34))] px-3 py-3 shadow-[inset_0_1px_0_rgba(148,163,184,0.04)] sm:space-y-4 sm:px-4 sm:py-4 lg:space-y-5 lg:px-5 lg:py-5'>
      <div className='space-y-3 border-b border-slate-700/35 pb-3 sm:space-y-3.5 sm:pb-4 lg:pb-4.5'>
        <div className='flex flex-col gap-2.5 sm:gap-3.5 lg:flex-row lg:items-end lg:justify-between'>
          <div className='space-y-1.5'>
            <h2 className='text-lg font-semibold tracking-[0.06em] text-slate-100 uppercase sm:text-xl'>
              {title}
            </h2>
            <p className='max-w-[52ch] text-[13px] leading-relaxed text-slate-400 sm:text-sm'>
              {description}
            </p>
          </div>
          <DatabaseEntityTabs activeEntity={activeEntity} search={search} />
        </div>

        <div className='space-y-1.5'>
          <p className='text-[10px] tracking-[0.18em] text-slate-500 uppercase'>Search & Filters</p>
          {filters}
        </div>
      </div>

      {results}
    </div>
  )
}
