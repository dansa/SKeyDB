import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import {NavigationType, useLocation, useNavigate, useNavigationType} from 'react-router'

import type {EntityRef} from '@/domain/entities/types'
import {
  shouldDisplayEndedEventInArchive,
  sortBannersByRelevance,
  sortEventsByRelevance,
} from '@/domain/timeline'
import {timelineBanners, timelineEvents, timelinePatches} from '@/domain/timeline-data'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import {
  getTimelineViewForSection,
  parseTimelineContentFilter,
  parseTimelineSectionId,
  type TimelineContentFilter,
  type TimelineSectionId,
} from '@/domain/timeline-routing'
import {isDbDetailEntityRef, type DbDetailEntityRef} from '@/stores/dbDetailStore'

import {StageSheet} from './timeline/presentation/StageSheet'
import {BannerTile, EventRow} from './timeline/presentation/TimelineLedger'
import {TimelineMasthead} from './timeline/presentation/TimelineMasthead'
import {
  getTimelineAgendaGroups,
  isBanner,
  type TimelineEntry,
} from './timeline/presentation/timelinePageModel'
import {TimelineRosterOverlay} from './timeline/presentation/TimelineRosterOverlay'
import {STAGE_TITLE_ID, StageMissing, TimelineStage} from './timeline/presentation/TimelineStage'
import {getTimelineDZoneSummary} from './timeline/timelineDZoneSummary'
import {TimelinePageSection} from './timeline/TimelinePageSection'
import {partitionTimelineEntriesByStatus} from './timeline/timelineStatusPartition'
import {TimelineStatusSections} from './timeline/TimelineStatusSections'
import {useTimelineArchiveExpansion} from './timeline/useTimelineArchiveExpansion'
import {useTimelineNow} from './timeline/useTimelineNow'
import {useTimelineSectionScroll} from './timeline/useTimelineSectionScroll'

import './timeline/timeline.css'
import './timeline/presentation/timeline-presentation.css'

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

function excludesEntry(filter: TimelineContentFilter, entry: TimelineEntry) {
  return filter !== 'all' && (filter === 'banners') !== isBanner(entry)
}

function readTimelineRoster(state: unknown): DbDetailEntityRef | undefined {
  if (!state || typeof state !== 'object' || !('timelineRoster' in state)) return
  const ref = state.timelineRoster
  if (
    !ref ||
    typeof ref !== 'object' ||
    !('kind' in ref) ||
    typeof ref.kind !== 'string' ||
    !('id' in ref) ||
    typeof ref.id !== 'string' ||
    !ref.id
  )
    return
  const candidate = {kind: ref.kind, id: ref.id}
  return isDbDetailEntityRef(candidate) ? candidate : undefined
}

function focusStageTitle() {
  const heading = document.getElementById(STAGE_TITLE_ID)
  if (typeof heading?.scrollIntoView === 'function') heading.scrollIntoView({block: 'nearest'})
  heading?.focus({preventScroll: true})
}

interface SelectOptions {
  focusStage?: boolean
  reveal?: boolean
}

function getTimelinePageView(
  now: Date,
  requestedId: string | null,
  requestedFilter: TimelineContentFilter,
) {
  const events = sortEventsByRelevance(timelineEvents, now)
  const banners = sortBannersByRelevance(timelineBanners, now)
  const eventSections = partitionTimelineEntriesByStatus(events, {
    includeEnded: shouldDisplayEndedEventInArchive,
    now,
  })
  const bannerSections = partitionTimelineEntriesByStatus(banners, {now})
  const entries: TimelineEntry[] = [...events, ...banners]
  const requested = entries.find((entry) => entry.id === requestedId)
  const missingId = requestedId && !requested ? requestedId : undefined
  const filter: TimelineContentFilter =
    requested && excludesEntry(requestedFilter, requested) ? 'all' : requestedFilter
  const visibleEvents = filter === 'banners' ? undefined : eventSections
  const visibleBanners = filter === 'events' ? undefined : bannerSections
  const firstUpcoming = [visibleEvents?.upcoming.at(0), visibleBanners?.upcoming.at(0)]
    .filter((entry): entry is TimelineEntry => Boolean(entry))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .at(0)
  const fallback = visibleEvents?.active.at(0) ?? visibleBanners?.active.at(0) ?? firstUpcoming
  const dZoneSummary = getTimelineDZoneSummary(now)
  const agenda = getTimelineAgendaGroups({
    events,
    banners,
    filter,
    now,
    patches: timelinePatches,
    resetDate: dZoneSummary.resetDate,
  })
  return {
    agenda,
    bannerSections,
    dZoneSummary,
    entries,
    eventSections,
    fallback,
    filter,
    missingId,
    requested,
  }
}

function useTimelineStageFocus(
  id: string | undefined,
  desktop: boolean,
  navigationType: NavigationType,
  initialReveal: string | undefined,
) {
  const pendingFocus = useRef<string>(undefined)
  const focusWasInStage = useRef(false)
  const previousStageId = useRef<string>(undefined)
  const pendingReveal = useRef<string | undefined>(initialReveal)
  useLayoutEffect(() => {
    function trackFocus(event: FocusEvent) {
      focusWasInStage.current =
        event.target instanceof Element && Boolean(event.target.closest('[data-stage-scroll]'))
    }
    function clearOutsideFocus(event: PointerEvent) {
      if (event.target instanceof Element && !event.target.closest('[data-stage-scroll]'))
        focusWasInStage.current = false
    }
    document.addEventListener('focusin', trackFocus)
    document.addEventListener('pointerdown', clearOutsideFocus)
    return () => {
      document.removeEventListener('focusin', trackFocus)
      document.removeEventListener('pointerdown', clearOutsideFocus)
    }
  }, [])

  useLayoutEffect(() => {
    const priorId = previousStageId.current
    previousStageId.current = id
    if (!id) {
      focusWasInStage.current = false
      return
    }
    const lostFocusOnHistory =
      navigationType === NavigationType.Pop &&
      priorId !== undefined &&
      priorId !== id &&
      focusWasInStage.current &&
      document.activeElement === document.body
    if (pendingFocus.current === id || lostFocusOnHistory) {
      pendingFocus.current = undefined
      focusStageTitle()
    }
    if (pendingReveal.current === id) {
      pendingReveal.current = undefined
      if (!desktop) return
      const row = [...document.querySelectorAll<HTMLElement>('[data-entry-id]')].find(
        (node) => node.dataset.entryId === id,
      )
      if (typeof row?.scrollIntoView === 'function') row.scrollIntoView({block: 'nearest'})
    }
  }, [id, desktop, navigationType])

  return function prepareStageSelection(id: string, options: SelectOptions) {
    pendingFocus.current = options.focusStage ? id : undefined
    pendingReveal.current = options.reveal ? id : undefined
  }
}

export function TimelinePage() {
  const now = useTimelineNow()
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  )
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const searchParams = new URLSearchParams(location.search)
  const pageTitleRef = useRef<HTMLHeadingElement>(null)
  const pendingClose = useRef<string>(undefined)
  const locationState: unknown = location.state
  const visit = readTimelineVisit(locationState)
  const roster = readTimelineRoster(locationState)
  const [priceMode, setPriceMode] = useState<TimelinePriceDisplayMode>('silver-prime')
  const hashSection = parseTimelineSectionId(location.hash.slice(1))
  const targetSection = parseTimelineSectionId(searchParams.get('section')) ?? hashSection
  const requestedId = searchParams.get('item')
  const requestedFilter =
    getTimelineViewForSection(targetSection) ?? parseTimelineContentFilter(searchParams.get('view'))
  useTimelineSectionScroll(targetSection)
  const {
    agenda,
    bannerSections,
    dZoneSummary,
    entries,
    eventSections,
    fallback,
    filter,
    missingId,
    requested,
  } = getTimelinePageView(now, requestedId, requestedFilter)
  const selected = requested ?? (desktop && !missingId ? fallback : undefined)

  const prepareStageSelection = useTimelineStageFocus(
    selected?.id,
    desktop,
    navigationType,
    targetSection ? undefined : (requestedId ?? undefined),
  )

  useLayoutEffect(() => {
    if (!pendingClose.current || pendingClose.current === location.key) return
    pendingClose.current = undefined
    const next = new URLSearchParams(location.search)
    if (!next.has('item')) return
    next.delete('item')
    void navigate({search: next.toString(), hash: location.hash}, {replace: true})
  }, [location.key, location.search, location.hash, navigate])

  function select(id: string, options: SelectOptions = {}) {
    if (pendingClose.current) return
    if (id === requested?.id) {
      if (options.focusStage) focusStageTitle()
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('item', id)
    const target = entries.find((entry) => entry.id === id)
    let hash = location.hash
    if (target && excludesEntry(filter, target)) {
      next.delete('view')
      next.delete('section')
      if (hashSection) hash = ''
    }
    prepareStageSelection(id, options)
    const timelineVisit: TimelineVisit =
      visit && requested ? {...visit, depth: visit.depth + 1} : {depth: 1}
    void navigate({search: next.toString(), hash}, {state: {timelineVisit}})
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
    if (requested && excludesEntry(nextFilter, requested)) {
      next.delete('item')
    }
    if (nextFilter === 'all') next.delete('view')
    else next.set('view', nextFilter)
    void navigate(
      {search: next.toString(), hash: hashSection ? '' : location.hash},
      {
        replace: true,
        state: next.has('item') && visit ? {timelineVisit: visit} : null,
      },
    )
  }

  function openRoster(ref: EntityRef) {
    if (!isDbDetailEntityRef(ref) || roster || pendingClose.current) return
    void navigate(
      {search: location.search, hash: location.hash},
      {state: {timelineVisit: visit, timelineRoster: ref}},
    )
  }

  function clearMissing() {
    const next = new URLSearchParams(searchParams)
    next.delete('item')
    void navigate({search: next.toString(), hash: location.hash}, {replace: true})
  }

  const jumpToDetails = desktop ? focusStageTitle : undefined
  const missing = missingId ? <StageMissing id={missingId} onClear={clearMissing} /> : null
  const stage = missing ?? (
    <TimelineStage
      entries={entries}
      entry={selected}
      now={now}
      onClose={desktop ? undefined : closeSelection}
      onOpenDetail={openRoster}
      onSelect={(id) => {
        select(id, {focusStage: true, reveal: true})
      }}
      priceMode={priceMode}
    />
  )

  return (
    <section>
      <TimelineMasthead
        filter={filter}
        groups={agenda}
        headingRef={pageTitleRef}
        now={now}
        onFilterChange={setFilter}
        onPriceModeChange={setPriceMode}
        onSelect={(id) => {
          select(id, {focusStage: desktop})
        }}
        priceMode={priceMode}
        summary={dZoneSummary}
      />
      {!desktop && missing ? (
        <div className='mb-6 rounded-[2px] border border-slate-700/50 bg-slate-950/80'>
          {missing}
        </div>
      ) : null}
      <div className='grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_27rem]'>
        <div className='min-w-0 space-y-7'>
          {filter !== 'banners' ? (
            <TimelinePageSection title='Events'>
              <TimelineLedger
                kind='events'
                sections={eventSections}
                selectedId={selected?.id}
                targetSection={targetSection}
                renderItem={(event) => (
                  <EventRow
                    event={event}
                    key={event.id}
                    now={now}
                    onJumpToDetails={jumpToDetails}
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
                selectedId={selected?.id}
                targetSection={targetSection}
                renderItem={(banner) => (
                  <BannerTile
                    banner={banner}
                    key={banner.id}
                    now={now}
                    onJumpToDetails={jumpToDetails}
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
            className='timeline-stage ui-inset-frame relative rounded-[2px] border border-slate-700/50 bg-slate-950/80'
            key={selected?.id}
          >
            <div className='timeline-stage-scroll ui-scrollbar' data-stage-scroll>
              {stage}
            </div>
          </aside>
        ) : null}
      </div>
      {!desktop && requested ? (
        <StageSheet
          fallbackFocusRef={pageTitleRef}
          onClose={closeSelection}
          selectionKey={requested.id}
          title={requested.title}
        >
          {stage}
        </StageSheet>
      ) : null}
      {roster ? <TimelineRosterOverlay entry={roster} key={location.key} /> : null}
    </section>
  )
}

function TimelineLedger<TEntry extends TimelineEntry>({
  kind,
  sections,
  renderItem,
  selectedId,
  targetSection,
}: {
  kind: 'events' | 'banners'
  sections: Record<'active' | 'upcoming' | 'ended', TEntry[]>
  renderItem: (entry: TEntry) => ReactNode
  selectedId?: string
  targetSection?: TimelineSectionId
}) {
  const endedSectionId = `ended-${kind}` as const
  const upcomingSectionId = `upcoming-${kind}` as const
  const revealRole = !selectedId
    ? undefined
    : sections.ended.some((entry) => entry.id === selectedId)
      ? 'ended'
      : sections.upcoming.some((entry) => entry.id === selectedId)
        ? 'upcoming'
        : undefined
  const archive = useTimelineArchiveExpansion({
    endedSectionId,
    reveal: revealRole && selectedId ? {role: revealRole, key: selectedId} : undefined,
    targetSection,
    upcomingSectionId,
  })
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
      renderItem={(entry, section) => {
        if (section !== 'ended') return renderItem(entry)
        const index = sections.ended.indexOf(entry)
        const date = new Date(entry.endDate)
        const previous = index > 0 ? new Date(sections.ended[index - 1].endDate) : undefined
        const newMonth =
          !previous ||
          date.getFullYear() !== previous.getFullYear() ||
          date.getMonth() !== previous.getMonth()
        const heading = (
          <h3 className='flex items-center gap-3 pt-3 text-[0.65rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
            {date.toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}
            <span aria-hidden className='h-px flex-1 bg-slate-700/40' />
          </h3>
        )
        return (
          <Fragment key={entry.id}>
            {newMonth ? (
              isEventList ? (
                <li>{heading}</li>
              ) : (
                <div className='col-span-full'>{heading}</div>
              )
            ) : null}
            {renderItem(entry)}
          </Fragment>
        )
      }}
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
