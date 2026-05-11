import {useEffect, useMemo, useState, type ReactNode} from 'react'

import realmBadgeAequor from '@/assets/ui/realm-badge-aequor.webp'
import {getAwakeners} from '@/domain/awakeners'
import type {EntityRef} from '@/domain/entities/types'
import {
  getTimelineStatus,
  sortBannersByRelevance,
  sortEventsByRelevance,
  type TimelineStatus,
} from '@/domain/timeline'
import {timelineBanners, timelineEvents} from '@/domain/timeline-data'
import {getWheels} from '@/domain/wheels'
import {DbDetailModalHost} from '@/features/database/detail/DbDetailModalHost'
import {dbDetailStore} from '@/stores/dbDetailStore'
import {FilterChipButton} from '@/ui/filters/FilterChipButton'

import {BannerCard} from './timeline/BannerCard'
import {EventList} from './timeline/EventList'
import {TimelineArchiveSection} from './timeline/TimelineArchiveSection'

const TICK_INTERVAL_MS = 60_000
type TimelineContentFilter = 'all' | 'events' | 'banners'
type TimelineStatusFilter = TimelineStatus

const CONTENT_FILTERS: {id: TimelineContentFilter; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'events', label: 'Events'},
  {id: 'banners', label: 'Banners'},
]

const STATUS_FILTERS: {id: TimelineStatusFilter; label: string; dot: string}[] = [
  {id: 'active', label: 'Live', dot: 'bg-emerald-500'},
  {id: 'upcoming', label: 'Upcoming', dot: 'bg-sky-500'},
  {id: 'ended', label: 'Ended', dot: 'bg-slate-500'},
]

export function TimelinePage() {
  const [now, setNow] = useState(() => new Date())
  const [showEndedBanners, setShowEndedBanners] = useState(false)
  const [contentFilter, setContentFilter] = useState<TimelineContentFilter>('all')
  const [statusFilter, setStatusFilter] = useState<TimelineStatusFilter>('active')
  const awakeners = useMemo(() => getAwakeners(), [])
  const wheels = useMemo(() => getWheels(), [])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, TICK_INTERVAL_MS)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const banners = sortBannersByRelevance(timelineBanners, now)
  const events = sortEventsByRelevance(timelineEvents, now)

  const activeBanners = banners.filter(
    (b) => getTimelineStatus(b.startDate, b.endDate, now) === 'active',
  )
  const upcomingBanners = banners.filter(
    (b) => getTimelineStatus(b.startDate, b.endDate, now) === 'upcoming',
  )
  const endedBanners = banners.filter(
    (b) => getTimelineStatus(b.startDate, b.endDate, now) === 'ended',
  )
  const showEvents = contentFilter !== 'banners'
  const showBanners = contentFilter !== 'events'
  const visibleActiveBanners = statusFilter === 'active' ? activeBanners : []
  const visibleUpcomingBanners = statusFilter === 'upcoming' ? upcomingBanners : []
  const visibleEndedBanners = statusFilter !== 'upcoming' ? endedBanners : []

  function openTimelineDetail(ref: EntityRef) {
    dbDetailStore.getState().openDetail(ref, 'timeline-overlay')
  }

  return (
    <section className='timeline-v2 -mt-4 md:-mt-5'>
      <header className='timeline-v2-hero overflow-hidden'>
        <div className='timeline-v2-hero-inner grid min-h-34 gap-6 px-4 py-6 sm:px-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:px-8'>
          <div className='max-w-3xl'>
            <h1 className='ui-title text-3xl leading-tight text-amber-50 sm:text-4xl'>
              Events & Banners
            </h1>
            <p className='mt-2 max-w-[64ch] text-sm leading-6 text-slate-300'>
              Current events and upcoming banners.
            </p>
          </div>
          <div className='timeline-v2-season justify-self-start lg:justify-self-end'>
            <div className='min-w-0 text-left lg:text-right'>
              <p className='text-[10px] font-bold tracking-[0.14em] text-amber-200/55 uppercase'>
                D-Zone Season
              </p>
              <p className='ui-title mt-1 flex items-center gap-1 text-base text-amber-50 lg:justify-end'>
                Aequor Ring
                <span aria-hidden className='text-amber-200/70'>
                  &gt;
                </span>
              </p>
            </div>
            <img
              alt=''
              className='h-16 w-16 object-contain opacity-85'
              draggable={false}
              src={realmBadgeAequor}
            />
          </div>
        </div>
      </header>

      <div className='space-y-7 py-6'>
        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-700/45 pb-4'>
          <div aria-label='Timeline content' className='flex flex-wrap items-center gap-1.5'>
            {CONTENT_FILTERS.map((filter) => (
              <FilterChipButton
                active={contentFilter === filter.id}
                key={filter.id}
                onClick={() => {
                  setContentFilter(filter.id)
                }}
              >
                {filter.label}
              </FilterChipButton>
            ))}
          </div>

          <div className='hidden h-5 w-px bg-slate-700/50 sm:block' />

          <div aria-label='Timeline state' className='flex flex-wrap items-center gap-1.5'>
            {STATUS_FILTERS.map((filter) => (
              <FilterChipButton
                active={statusFilter === filter.id}
                key={filter.id}
                onClick={() => {
                  setStatusFilter(filter.id)
                }}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${filter.dot}`} />
                {filter.label}
              </FilterChipButton>
            ))}
          </div>
        </div>

        {showEvents ? (
          <TimelineSection title='Events'>
            <EventList
              events={events}
              now={now}
              onOpenDetail={openTimelineDetail}
              statusFilter={statusFilter}
            />
          </TimelineSection>
        ) : null}

        {showBanners ? (
          <TimelineSection title='Banners'>
            <div className='space-y-6'>
              {visibleActiveBanners.length > 0 && (
                <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                  {visibleActiveBanners.map((banner) => (
                    <BannerCard
                      banner={banner}
                      key={banner.id}
                      now={now}
                      onOpenDetail={openTimelineDetail}
                    />
                  ))}
                </div>
              )}

              {visibleUpcomingBanners.length > 0 && (
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <h3 className='ui-title text-sm text-slate-400'>Upcoming banners</h3>
                    <div className='h-px flex-1 bg-gradient-to-r from-amber-200/20 via-slate-500/25 to-transparent' />
                  </div>
                  <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                    {visibleUpcomingBanners.map((banner) => (
                      <BannerCard
                        banner={banner}
                        key={banner.id}
                        now={now}
                        onOpenDetail={openTimelineDetail}
                      />
                    ))}
                  </div>
                </div>
              )}

              {visibleEndedBanners.length > 0 ? (
                <TimelineArchiveSection
                  contentClassName='grid gap-3 md:grid-cols-2 xl:grid-cols-3'
                  dividerClassName='bg-gradient-to-r from-amber-200/15 via-slate-500/20 to-transparent'
                  expanded={showEndedBanners || statusFilter === 'ended'}
                  itemCount={visibleEndedBanners.length}
                  onToggle={() => {
                    setShowEndedBanners((current) => !current)
                  }}
                  title='Ended banners'
                  titleClassName='text-slate-400'
                >
                  {visibleEndedBanners.map((banner) => (
                    <BannerCard
                      banner={banner}
                      key={banner.id}
                      now={now}
                      onOpenDetail={openTimelineDetail}
                    />
                  ))}
                </TimelineArchiveSection>
              ) : null}
            </div>
          </TimelineSection>
        ) : null}
      </div>
      <DbDetailModalHost
        awakeners={awakeners}
        callbacks={{
          onClose: () => {
            dbDetailStore.getState().popDetail()
          },
          onSelectAwakener: () => undefined,
          onSelectCovenant: () => undefined,
          onSelectWheel: () => undefined,
          onTabChange: () => undefined,
        }}
        routeItem={null}
        wheels={wheels}
      />
    </section>
  )
}

function TimelineSection({children, title}: {children: ReactNode; title: string}) {
  return (
    <section className='space-y-4'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <span aria-hidden className='block h-2 w-2 rotate-45 bg-amber-200/60' />
          <h2 className='ui-title text-sm tracking-[0.16em] text-amber-100 uppercase'>{title}</h2>
        </div>
        <div className='h-px flex-1 bg-gradient-to-r from-amber-200/25 via-slate-600/30 to-transparent' />
      </div>
      {children}
    </section>
  )
}
