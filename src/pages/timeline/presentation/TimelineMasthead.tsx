import type {CSSProperties} from 'react'

import {Link} from 'react-router'

import {getRealmAccent} from '@/domain/realms'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import type {TimelineContentFilter} from '@/domain/timeline-routing'

import type {getTimelineDZoneSummary} from '../timelineDZoneSummary'
import {TimelineAgenda} from './TimelineAgenda'
import type {TimelineAgendaGroup} from './timelinePageModel'

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
    label: 'USD ≈',
    ariaLabel: 'Estimated USD',
    title: 'Show rounded estimated USD prices',
  },
]

type DZoneSummary = ReturnType<typeof getTimelineDZoneSummary>

const RING_RADIUS = 31
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function Segmented<T extends string>({
  label,
  onChange,
  options,
  quiet = false,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: {id: T; label: string; ariaLabel?: string; title?: string}[]
  quiet?: boolean
  value: T
}) {
  return (
    <div
      aria-label={label}
      className={`timeline-segmented ${quiet ? 'timeline-segmented--quiet' : ''}`}
      role='group'
    >
      {options.map((option) => (
        <button
          aria-label={option.ariaLabel}
          aria-pressed={value === option.id}
          key={option.id}
          onClick={() => {
            onChange(option.id)
          }}
          title={option.title}
          type='button'
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function DZoneSeal({now, summary}: {now: Date; summary: DZoneSummary}) {
  const start = new Date(summary.startDate).getTime()
  const end = summary.resetDate ? new Date(summary.resetDate).getTime() : start
  const live = !summary.note && end > start && now.getTime() < end
  const progress = live ? Math.min(1, Math.max(0, (now.getTime() - start) / (end - start))) : 0
  const countdown = summary.countdown?.text.replace(/^Ends in/, 'Resets in')
  const style = {
    '--timeline-season-realm': getRealmAccent(summary.realm ?? undefined),
  } as CSSProperties
  return (
    <Link
      aria-label={['D-Zone', summary.name, countdown, summary.note].filter(Boolean).join(', ')}
      className='timeline-season group'
      style={style}
      title={summary.countdown?.title}
      to='/d-zone'
    >
      <span aria-hidden className='timeline-season-ring'>
        <svg viewBox='0 0 68 68'>
          <circle className='timeline-season-track' cx='34' cy='34' r={RING_RADIUS} />
          {live ? (
            <circle
              className='timeline-season-progress'
              cx='34'
              cy='34'
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            />
          ) : null}
        </svg>
        {summary.emblemSrc ? <img alt='' src={summary.emblemSrc} /> : null}
      </span>
      <span className='min-w-0'>
        <span className='timeline-season-label block text-[0.64rem] font-extrabold tracking-[0.12em] uppercase'>
          D-Zone season
        </span>
        <span className='ui-title mt-0.5 block text-[1.12rem] leading-tight text-slate-100 group-hover:text-amber-50 group-focus-visible:text-amber-50'>
          {summary.name}
        </span>
        {countdown ? (
          <span className='mt-1 block text-xs font-semibold text-slate-400 tabular-nums'>
            {countdown}
          </span>
        ) : null}
        {summary.note ? (
          <span className='mt-1 block text-xs text-slate-400'>{summary.note}</span>
        ) : null}
      </span>
    </Link>
  )
}

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
  summary: DZoneSummary
}) {
  return (
    <header className='mb-6 border-b border-slate-700/45 pb-5'>
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end'>
        <div className='min-w-0'>
          <h1 className='ui-title text-[1.9rem] leading-[1.03] text-amber-50'>
            Events &amp; Banners
          </h1>
          <div className='mt-4 flex flex-wrap items-center gap-x-3 gap-y-2'>
            <Segmented label='Show' onChange={onFilterChange} options={FILTERS} value={filter} />
            <span aria-hidden className='hidden h-5 w-px bg-slate-700/60 sm:block' />
            <Segmented
              label='Prices'
              onChange={onPriceModeChange}
              options={PRICES}
              quiet
              value={priceMode}
            />
          </div>
        </div>
        <DZoneSeal now={now} summary={summary} />
      </div>
      <TimelineAgenda groups={groups} now={now} onSelect={onSelect} />
    </header>
  )
}
