import type {CSSProperties} from 'react'

import {Link} from 'react-router'

import {getRealmAccent} from '@/domain/realms'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import type {TimelineContentFilter} from '@/domain/timeline-routing'

import type {getTimelineDZoneSummary} from '../timelineDZoneSummary'
import {TimelineAgenda} from './TimelineAgenda'
import type {TimelineAgendaGroup} from './timelineNextModel'

const FILTERS: {id: TimelineContentFilter; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'events', label: 'Events'},
  {id: 'banners', label: 'Banners'},
]
const PRICES: {id: TimelinePriceDisplayMode; label: string; ariaLabel: string; title: string}[] = [
  {
    id: 'silver-prime',
    label: 'Prime',
    ariaLabel: 'Silver Prime',
    title: 'Show game currency prices',
  },
  {
    id: 'usd-estimate',
    label: 'USD',
    ariaLabel: 'Estimated USD',
    title: 'Show rounded estimated USD prices',
  },
]

export function TimelineMasthead({
  filter,
  groups,
  now,
  onFilterChange,
  onPriceModeChange,
  onSelect,
  priceMode,
  summary,
}: {
  filter: TimelineContentFilter
  groups: TimelineAgendaGroup[]
  now: Date
  onFilterChange: (filter: TimelineContentFilter) => void
  onPriceModeChange: (mode: TimelinePriceDisplayMode) => void
  onSelect: (id: string) => void
  priceMode: TimelinePriceDisplayMode
  summary: ReturnType<typeof getTimelineDZoneSummary>
}) {
  const style = {
    '--timeline-season-realm': getRealmAccent(summary.realm ?? undefined),
  } as CSSProperties
  return (
    <header className='mb-6 border-b border-slate-700/45 pb-5'>
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end'>
        <div className='min-w-0'>
          <h1 className='ui-title text-[1.9rem] leading-[1.03] text-amber-50'>
            Events &amp; Banners
          </h1>
          <div className='mt-4 flex flex-wrap gap-x-6 gap-y-3'>
            <fieldset className='timeline-v2-price-toggle-shell'>
              <legend className='sr-only'>Show</legend>
              <span aria-hidden className='timeline-v2-price-toggle-label'>
                Show
              </span>
              <div className='timeline-v2-price-toggle timeline-next-filter-toggle'>
                {FILTERS.map((option) => (
                  <button
                    aria-pressed={filter === option.id}
                    className={`timeline-v2-price-toggle-button timeline-v2-price-toggle-button--${filter === option.id ? 'active' : 'inactive'}`}
                    key={option.id}
                    onClick={() => {
                      onFilterChange(option.id)
                    }}
                    type='button'
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className='timeline-v2-price-toggle-shell'>
              <legend className='sr-only'>Prices</legend>
              <span aria-hidden className='timeline-v2-price-toggle-label'>
                Prices
              </span>
              <div className='timeline-v2-price-toggle'>
                {PRICES.map((option) => (
                  <button
                    aria-label={option.ariaLabel}
                    aria-pressed={priceMode === option.id}
                    className={`timeline-v2-price-toggle-button timeline-v2-price-toggle-button--${priceMode === option.id ? 'active' : 'inactive'}`}
                    key={option.id}
                    onClick={() => {
                      onPriceModeChange(option.id)
                    }}
                    title={option.title}
                    type='button'
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
        <Link
          aria-label='D-Zone season'
          className='timeline-next-season group flex min-w-0 items-center gap-3 rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200/60'
          style={style}
          to='/d-zone'
        >
          <div className='min-w-0 flex-1 lg:text-right'>
            <div className='text-[0.64rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
              Current D-Zone season
            </div>
            <div className='ui-title mt-1 text-[1.12rem] text-slate-200 group-hover:text-amber-50 group-focus-visible:text-amber-50'>
              {summary.name}
            </div>
            {summary.countdown ? (
              <div
                className='mt-1 text-xs font-semibold text-slate-400 tabular-nums'
                title={summary.countdown.title}
              >
                {summary.countdown.text}
              </div>
            ) : null}
            {summary.note ? (
              <div className='mt-1 text-xs text-slate-400'>{summary.note}</div>
            ) : null}
          </div>
          {summary.emblemSrc ? (
            <div className='timeline-next-season-emblem relative flex size-[3.25rem] shrink-0 items-center justify-center md:size-[3.75rem]'>
              <img alt='' className='relative size-full object-contain' src={summary.emblemSrc} />
            </div>
          ) : null}
        </Link>
      </div>
      <TimelineAgenda groups={groups} now={now} onSelect={onSelect} />
    </header>
  )
}
