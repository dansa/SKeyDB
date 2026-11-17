import {useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode} from 'react'

import {useLocation, useNavigate} from 'react-router'

import {
  shouldDisplayEndedEventInArchive,
  sortBannersByRelevance,
  sortEventsByRelevance,
} from '@/domain/timeline'
import {timelineBanners, timelineEvents} from '@/domain/timeline-data'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import {
  getTimelineViewForSection,
  parseTimelineContentFilter,
  parseTimelineSectionId,
  type TimelineContentFilter,
  type TimelineSectionId,
} from '@/domain/timeline-routing'
import {DeferredDatabaseDetailOverlayOutlet} from '@/features/database/detail/DeferredDatabaseDetailOverlayOutlet'
import {useDatabaseDetailOverlay} from '@/features/database/detail/useDatabaseDetailOverlay'

import {StageSheet} from './timeline/next/StageSheet'
import {BannerTile, EventRow} from './timeline/next/TimelineLedger'
import {TimelineMasthead} from './timeline/next/TimelineMasthead'
import {
  getTimelineAgendaGroups,
  isBanner,
  type TimelineEntry,
} from './timeline/next/timelineNextModel'
import {TimelineStage} from './timeline/next/TimelineStage'
import {getTimelineDZoneSummary} from './timeline/timelineDZoneSummary'
import {TimelinePageSection} from './timeline/TimelinePageSection'
import {partitionTimelineEntriesByStatus} from './timeline/timelineStatusPartition'
import {TimelineStatusSections} from './timeline/TimelineStatusSections'
import {useTimelineArchiveExpansion} from './timeline/useTimelineArchiveExpansion'
import {useTimelineNow} from './timeline/useTimelineNow'
import {useTimelineSectionScroll} from './timeline/useTimelineSectionScroll'

import './timeline/timeline.css'
import './timeline/next/timeline-next.css'

function subscribeDesktop(callback: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined
  const media = window.matchMedia('(min-width: 1024px)')
  media.addEventListener('change', callback)
  return () => {
    media.removeEventListener('change', callback)
  }
}

function getDesktopSnapshot() {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(min-width: 1024px)').matches
}

function getServerDesktopSnapshot() {
  return true
}

interface TimelineVisit {
  depth: number
}

function readTimelineVisit(state: unknown): TimelineVisit | undefined {
  if (!state || typeof state !== 'object' || !('timelineVisit' in state)) return
  const visit = state.timelineVisit
  if (!visit || typeof visit !== 'object') return
  if (
    'depth' in visit &&
    typeof visit.depth === 'number' &&
    Number.isSafeInteger(visit.depth) &&
    visit.depth > 0
  ) {
    return {depth: visit.depth}
  }
}

export function TimelineNextPage() {
  const now = useTimelineNow()
  const detailOverlay = useDatabaseDetailOverlay()
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  )
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const pendingClose = useRef<string>(undefined)
  const locationState: unknown = location.state
  const visit = readTimelineVisit(locationState)
  const {session} = detailOverlay
  const [priceMode, setPriceMode] = useState<TimelinePriceDisplayMode>('silver-prime')
  const targetSection = parseTimelineSectionId(searchParams.get('section'))
  const filter =
    getTimelineViewForSection(targetSection) ?? parseTimelineContentFilter(searchParams.get('view'))
  useTimelineSectionScroll(targetSection)
  const events = sortEventsByRelevance(timelineEvents, now)
  const banners = sortBannersByRelevance(timelineBanners, now)
  const eventSections = partitionTimelineEntriesByStatus(events, {
    includeEnded: shouldDisplayEndedEventInArchive,
    now,
  })
  const bannerSections = partitionTimelineEntriesByStatus(banners, {now})
  const entries: TimelineEntry[] = [...events, ...banners]
  const requested = entries.find((entry) => entry.id === searchParams.get('item'))
  const visibleEvents = filter === 'banners' ? undefined : eventSections
  const visibleBanners = filter === 'events' ? undefined : bannerSections
  const firstUpcoming = [visibleEvents?.upcoming.at(0), visibleBanners?.upcoming.at(0)]
    .filter((entry): entry is TimelineEntry => Boolean(entry))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .at(0)
  const fallback = visibleEvents?.active.at(0) ?? visibleBanners?.active.at(0) ?? firstUpcoming
  const selected = requested ?? (desktop ? fallback : undefined)
  const dZoneSummary = getTimelineDZoneSummary(events, now)
  const agenda = getTimelineAgendaGroups({
    events,
    banners,
    filter,
    now,
    season: dZoneSummary.endDate
      ? {name: dZoneSummary.name, endDate: dZoneSummary.endDate}
      : undefined,
  })

  useLayoutEffect(
    () => () => {
      session.dispose()
    },
    [requested?.id, session],
  )

  useLayoutEffect(() => {
    if (!pendingClose.current || pendingClose.current === location.key) return
    pendingClose.current = undefined
    const next = new URLSearchParams(location.search)
    if (!next.has('item')) return
    next.delete('item')
    void navigate({search: next.toString(), hash: location.hash}, {replace: true})
  }, [location.key, location.search, location.hash, navigate])

  function select(id: string) {
    if (pendingClose.current || id === requested?.id) return
    const next = new URLSearchParams(searchParams)
    next.set('item', id)
    const timelineVisit: TimelineVisit =
      visit && requested ? {...visit, depth: visit.depth + 1} : {depth: 1}
    void navigate({search: next.toString(), hash: location.hash}, {state: {timelineVisit}})
  }

  function closeSelection() {
    if (pendingClose.current) return
    if (visit) {
      pendingClose.current = location.key
      void navigate(-visit.depth)
      return
    }
    const next = new URLSearchParams(searchParams)
    next.delete('item')
    void navigate({search: next.toString(), hash: location.hash}, {replace: true})
  }

  function setFilter(nextFilter: TimelineContentFilter) {
    if (pendingClose.current) return
    const next = new URLSearchParams(searchParams)
    next.delete('section')
    const clearsSelection =
      requested && nextFilter !== 'all' && (nextFilter === 'banners') !== isBanner(requested)
    if (clearsSelection) {
      next.delete('item')
    }
    if (nextFilter === 'all') next.delete('view')
    else next.set('view', nextFilter)
    void navigate(
      {search: next.toString(), hash: location.hash},
      {
        replace: !clearsSelection,
        state: next.has('item') && visit ? {timelineVisit: visit} : null,
      },
    )
  }

  const stage = (
    <TimelineStage
      entries={entries}
      entry={selected}
      now={now}
      onOpenDetail={detailOverlay.open}
      onSelect={select}
      priceMode={priceMode}
    />
  )

  return (
    <section className='timeline-v2'>
      <TimelineMasthead
        filter={filter}
        groups={agenda}
        now={now}
        onFilterChange={setFilter}
        onPriceModeChange={setPriceMode}
        onSelect={select}
        priceMode={priceMode}
        summary={dZoneSummary}
      />
      <div className='grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_27rem]'>
        <div className='min-w-0 space-y-7'>
          {filter !== 'banners' ? (
            <TimelinePageSection title='Events'>
              <TimelineLedger
                kind='events'
                sections={eventSections}
                targetSection={targetSection}
                renderItem={(event) => (
                  <EventRow
                    event={event}
                    key={event.id}
                    now={now}
                    onSelect={select}
                    priceMode={priceMode}
                    selected={event.id === selected?.id}
                  />
                )}
              />
            </TimelinePageSection>
          ) : null}
          {filter !== 'events' ? (
            <TimelinePageSection title='Banners'>
              <TimelineLedger
                kind='banners'
                sections={bannerSections}
                targetSection={targetSection}
                renderItem={(banner) => (
                  <BannerTile
                    banner={banner}
                    key={banner.id}
                    now={now}
                    onSelect={select}
                    priceMode={priceMode}
                    selected={banner.id === selected?.id}
                  />
                )}
              />
            </TimelinePageSection>
          ) : null}
        </div>
        {desktop ? (
          <aside
            aria-label='Selected details'
            className='timeline-next-stage ui-inset-frame relative rounded-[2px] border border-slate-700/50 bg-slate-950/80'
            key={selected?.id}
          >
            {requested ? (
              <button
                className='absolute top-2 right-2 z-10 rounded-sm border border-slate-700/60 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200/60'
                onClick={closeSelection}
                type='button'
              >
                Close
              </button>
            ) : null}
            <div className='timeline-next-stage-scroll ui-scrollbar'>{stage}</div>
          </aside>
        ) : null}
      </div>
      {!desktop && requested ? (
        <StageSheet onClose={closeSelection} selectionKey={requested.id} title={requested.title}>
          {stage}
        </StageSheet>
      ) : null}
      <DeferredDatabaseDetailOverlayOutlet session={detailOverlay.session} />
    </section>
  )
}

function TimelineLedger<TEntry extends TimelineEntry>({
  kind,
  sections,
  renderItem,
  targetSection,
}: {
  kind: 'events' | 'banners'
  sections: Record<'active' | 'upcoming' | 'ended', TEntry[]>
  renderItem: (entry: TEntry) => ReactNode
  targetSection?: TimelineSectionId
}) {
  const endedSectionId = `ended-${kind}` as const
  const upcomingSectionId = `upcoming-${kind}` as const
  const archive = useTimelineArchiveExpansion({endedSectionId, upcomingSectionId, targetSection})
  const isEventList = kind === 'events'
  if (!sections.active.length && !sections.upcoming.length && !sections.ended.length) {
    return <p className='text-sm text-slate-400'>No {kind} to display.</p>
  }
  return (
    <TimelineStatusSections
      activeContainer={isEventList ? 'ul' : 'div'}
      archiveContainer={isEventList ? 'ul' : 'div'}
      activeItems={sections.active}
      ended={{
        expanded: archive.endedExpanded,
        onToggle: archive.toggleEnded,
        sectionId: endedSectionId,
        title: `Ended ${kind}`,
      }}
      endedItems={sections.ended}
      gridClassName={
        isEventList
          ? 'grid grid-cols-[minmax(0,1fr)] gap-2'
          : 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-4'
      }
      renderItem={renderItem}
      upcoming={{
        expanded: archive.upcomingExpanded,
        onToggle: archive.toggleUpcoming,
        sectionId: upcomingSectionId,
        title: `Upcoming ${kind}`,
      }}
      upcomingItems={sections.upcoming}
      wrapperClassName={isEventList ? 'space-y-5' : undefined}
    />
  )
}
