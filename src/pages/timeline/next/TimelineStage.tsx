import {useLayoutEffect, useRef, useState, type RefObject} from 'react'

import {FaChevronRight, FaXmark} from 'react-icons/fa6'

import type {EntityRef} from '@/domain/entities/types'
import {
  formatTimelineDisplayDate,
  getTimelineDateRangeDisplay,
  getTimelineStatus,
} from '@/domain/timeline'
import {formatTimelinePrice, type TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

import {BannerArtwork} from '../BannerArtwork'
import {resolveEventArt} from '../timelineEventHelpers'
import {TimelineRichText} from '../TimelineRichText'
import {StageBannerRules} from './StageBannerRules'
import {StageRateUpGroup} from './StageRateUpGroup'
import {StageRewards} from './StageRewards'
import {StageRoster} from './StageRoster'
import {StageSchedule} from './StageSchedule'
import {StageSelector} from './StageSelector'
import {BannerMeta, Countdown, EventArt, EventMeta} from './TimelineLedger'
import {
  getBannerArtworkSlots,
  getBannerStageProfile,
  getDisplayBanner,
  getInitialBannerRotation,
  getPoolGroups,
  isBanner,
  type TimelineEntry,
} from './timelineNextModel'

export const STAGE_TITLE_ID = 'timeline-stage-title'

interface TimelineStageProps {
  entries: TimelineEntry[]
  now: Date
  onClose?: () => void
  onOpenDetail: (ref: EntityRef) => void
  onSelect: (id: string) => void
  priceMode: TimelinePriceDisplayMode
}

export function TimelineStage({
  entry,
  ...props
}: TimelineStageProps & {entry: TimelineEntry | undefined}) {
  if (!entry)
    return (
      <p className='p-5 text-sm text-slate-400'>Select an event or banner to see its details.</p>
    )
  return <StageContent entry={entry} key={entry.id} {...props} />
}

export function StageMissing({id, onClear}: {id: string; onClear: () => void}) {
  return (
    <section aria-labelledby='timeline-stage-missing' className='space-y-3 p-5'>
      <h2 className='text-sm font-semibold text-slate-100' id='timeline-stage-missing'>
        Entry not found
      </h2>
      <p className='text-[0.86rem] leading-[1.45] break-words text-slate-300'>
        Nothing on the timeline matches “{id}”. The link may point to an entry that was renamed or
        removed.
      </p>
      <button
        className='ui-compact-control ui-compact-control--pressed'
        onClick={onClear}
        type='button'
      >
        Clear link
      </button>
    </section>
  )
}

function useHeadingScrolledAway(heading: RefObject<HTMLElement | null>, barHeight: number) {
  const [away, setAway] = useState(false)
  useLayoutEffect(() => {
    const node = heading.current
    const root = node?.closest<HTMLElement>('[data-stage-scroll]')
    if (!node || !root || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([record]) => {
        const top = record.rootBounds?.top ?? root.getBoundingClientRect().top + barHeight
        setAway(!record.isIntersecting && record.boundingClientRect.top < top)
      },
      {root, rootMargin: `-${String(barHeight)}px 0px 0px 0px`},
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
    }
  }, [heading, barHeight])
  return away
}

function StageBar({
  condensed,
  entry,
  now,
  onClose,
}: {
  condensed: boolean
  entry: TimelineEntry
  now: Date
  onClose?: () => void
}) {
  return (
    <div className='sticky top-0 z-20 h-0'>
      <div
        className='timeline-next-stage-bar absolute inset-x-0 top-0 flex min-h-14 items-center gap-3 px-3 py-1.5'
        data-condensed={condensed}
      >
        <div
          aria-hidden
          className='timeline-next-stage-bar-title flex min-w-0 flex-1 items-center gap-3 pl-2'
        >
          <span className='ui-title min-w-0 flex-1 truncate text-base text-amber-50'>
            {entry.title}
          </span>
          <Countdown entry={entry} now={now} />
        </div>
        {onClose ? (
          <button
            aria-label='Close'
            className='pointer-events-auto grid size-11 shrink-0 place-items-center rounded-sm border border-slate-500/60 bg-slate-950/95 text-slate-200 hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200'
            onClick={onClose}
            type='button'
          >
            <FaXmark aria-hidden className='size-4' />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function StageContent({
  entry,
  entries,
  now,
  onClose,
  onOpenDetail,
  onSelect,
  priceMode,
}: TimelineStageProps & {entry: TimelineEntry}) {
  const heading = useRef<HTMLHeadingElement>(null)
  const condensed = useHeadingScrolledAway(heading, 56)
  const [pickedDay, setPickedDay] = useState<number>()
  const banner = isBanner(entry) ? entry : undefined
  const liveBanner = banner ? getDisplayBanner(banner, now) : undefined
  const rotation = banner?.dailySchedule
    ? (banner.dailySchedule.find(({day}) => day === pickedDay) ??
      getInitialBannerRotation(banner, now))
    : undefined
  // Hero art follows the browsed rotation day; the metadata tags keep describing today's rotation.
  const displayBanner =
    liveBanner && rotation ? {...liveBanner, featured: rotation.featured} : liveBanner
  const featured = displayBanner?.featured ?? (!isBanner(entry) ? entry.featured : undefined)
  const profile = getBannerStageProfile(banner)
  const selectorSlots = profile?.selector ? banner?.poolSlots : undefined
  const poolGroups = banner?.poolSlots && !selectorSlots ? getPoolGroups(banner.poolSlots) : []
  const related =
    entry.related
      ?.map((id) => entries.find((item) => item.id === id))
      .filter((item): item is TimelineEntry => Boolean(item)) ?? []
  const status = getTimelineStatus(entry.startDate, entry.endDate, now)
  const start = new Date(entry.startDate).getTime()
  const end = new Date(entry.endDate).getTime()
  const progress =
    end > start ? Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100)) : 0
  const date = getTimelineDateRangeDisplay(entry.startDate, entry.endDate, now)
  const price = formatTimelinePrice(entry.pricing, priceMode)
  const hasTrackPrices = !isBanner(entry) && entry.rewards?.some((group) => group.price)
  const keyDates = !isBanner(entry) ? (entry.keyDates ?? []) : []
  const descriptions = entry.description?.split('\n') ?? []
  const ruleProfiles = banner?.rateUpGroups?.length
    ? [...new Set(banner.rateUpGroups.map((group) => group.kind))]
    : profile?.rules
      ? [profile.rules]
      : []
  return (
    <div className='timeline-next-fade'>
      <StageBar condensed={condensed} entry={entry} now={now} onClose={onClose} />
      <div
        className={`relative overflow-hidden bg-slate-950 ${banner ? 'aspect-video' : 'aspect-[5/2]'}`}
      >
        {displayBanner ? (
          <div aria-hidden className='pointer-events-none absolute inset-0' inert>
            <BannerArtwork
              customArt={displayBanner.customArt}
              featured={displayBanner.featured}
              linkedPresentation={displayBanner.linkedPresentation}
              poolSlots={getBannerArtworkSlots(displayBanner)}
              reserveDrawerInset={false}
              title={displayBanner.title}
            />
          </div>
        ) : !isBanner(entry) ? (
          <EventArt defaultPosition='50% 25%' event={entry} surface='detail' />
        ) : null}
        <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(2,6,14,0.8))]' />
      </div>
      <div className='space-y-4 p-5'>
        <div>
          {liveBanner ? (
            <BannerMeta banner={liveBanner} now={now} priceMode={priceMode} showPrice={false} />
          ) : !isBanner(entry) ? (
            <EventMeta event={entry} now={now} priceMode={priceMode} showPrice={false} />
          ) : null}
          <h2
            className='ui-title mt-2 scroll-mt-16 text-[1.55rem] leading-[1.08] text-balance text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200/70'
            id={STAGE_TITLE_ID}
            ref={heading}
            tabIndex={-1}
          >
            {entry.title}
          </h2>
        </div>
        <div className='border-t border-slate-700/40 pt-4'>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <Countdown entry={entry} large now={now} />
            <span className='pb-1 text-xs text-slate-400' title={date.title}>
              {date.text}
            </span>
          </div>
          {status === 'active' ? (
            <div
              aria-label='Event progress'
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(progress)}
              className='mt-3 h-0.5 bg-[var(--ui-border-subtle)]'
              role='progressbar'
            >
              <div className='h-full bg-amber-300/70' style={{width: `${String(progress)}%`}} />
            </div>
          ) : null}
          {(price && !hasTrackPrices) || keyDates.length ? (
            <dl className='mt-4 space-y-2'>
              {price && !hasTrackPrices ? (
                <div className='flex items-baseline justify-between gap-4'>
                  <dt className='text-[0.65rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
                    Price
                  </dt>
                  <dd className='text-right text-sm font-semibold text-slate-100 tabular-nums'>
                    {price}
                  </dd>
                </div>
              ) : null}
              {keyDates.map(({label, date: value}) => {
                const keyDate = new Date(value)
                return (
                  <div
                    className='flex items-baseline justify-between gap-4'
                    key={`${label}:${value}`}
                  >
                    <dt className='text-[0.65rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
                      {label}
                    </dt>
                    <dd className='text-right text-sm font-semibold text-slate-100 tabular-nums'>
                      <time
                        dateTime={value}
                        title={keyDate.toLocaleString(undefined, {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })}
                      >
                        {formatTimelineDisplayDate(value, now)}
                      </time>
                    </dd>
                  </div>
                )
              })}
            </dl>
          ) : null}
        </div>
        {descriptions.length ? (
          <div className='timeline-next-description border-t border-slate-700/40 pt-4'>
            {descriptions.map((text, index) => (
              <p
                className={
                  index === 0
                    ? 'text-[0.92rem] font-medium text-slate-100'
                    : 'mt-2 text-[0.86rem] leading-[1.5] text-slate-300'
                }
                key={`${String(index)}:${text}`}
              >
                <TimelineRichText priceMode={priceMode} text={text} />
              </p>
            ))}
          </div>
        ) : null}
        {!isBanner(entry) && (entry.rewards?.length || entry.missions?.length) ? (
          <StageRewards
            groups={entry.rewards ?? []}
            category={entry.category}
            missions={entry.missions}
            priceMode={priceMode}
          />
        ) : null}
        {banner?.rateUpGroups?.map((group) => (
          <StageRateUpGroup group={group} key={group.kind} onOpenDetail={onOpenDetail} />
        ))}
        {!banner?.rateUpGroups && !banner?.dailySchedule && featured?.length ? (
          <section className='border-t border-slate-700/40 pt-4'>
            <h3 className='mb-3 text-[0.65rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
              {!isBanner(entry) && entry.category === 'curriculum' && hasTrackPrices
                ? 'Selector Wheel options'
                : 'Featured'}
            </h3>
            <StageRoster onOpenDetail={onOpenDetail} units={featured} />
          </section>
        ) : null}
        {selectorSlots ? <StageSelector onOpenDetail={onOpenDetail} slots={selectorSlots} /> : null}
        {poolGroups.length ? (
          <section className='space-y-4 border-t border-slate-700/40 pt-4'>
            <h3 className='text-[0.65rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
              {profile?.artwork === 'kaleido' ? 'Featured pool' : 'Pool'}
            </h3>
            {poolGroups.map((group) => (
              <div key={group.label}>
                <h4 className='mb-2 text-xs font-semibold text-slate-300'>
                  {group.label} ({group.units.length})
                </h4>
                <StageRoster
                  compact={Boolean(banner?.rulesProfile)}
                  onOpenDetail={onOpenDetail}
                  units={group.units}
                />
              </div>
            ))}
          </section>
        ) : null}
        {banner && rotation ? (
          <StageSchedule
            banner={banner}
            now={now}
            onOpenDetail={onOpenDetail}
            onSelectDay={setPickedDay}
            selected={rotation}
          />
        ) : null}
        {ruleProfiles.length ? (
          <div className='border-t border-slate-700/40 pt-2'>
            <StageBannerRules profiles={ruleProfiles} />
          </div>
        ) : null}
        {related.length ? (
          <section className='border-t border-slate-700/40 pt-4'>
            <h3 className='mb-2 text-[0.65rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
              {related.every(isBanner) ? 'Related banners' : 'Related'}
            </h3>
            <div className='divide-y divide-slate-700/30'>
              {related.map((item) => (
                <button
                  className='flex min-h-14 w-full items-center gap-3 py-2 text-left hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200/60'
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id)
                  }}
                  type='button'
                >
                  <RelatedThumb entry={item} />
                  <span className='ui-title min-w-0 flex-1 text-sm text-slate-200'>
                    {item.title}
                  </span>
                  <Countdown entry={item} now={now} />
                  <FaChevronRight aria-hidden className='size-3 shrink-0 text-slate-400' />
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
function RelatedThumb({entry}: {entry: TimelineEntry}) {
  if (isBanner(entry)) {
    return entry.customArt ? (
      <img alt='' className='h-10 w-14 shrink-0 object-cover object-top' src={entry.customArt} />
    ) : null
  }

  const eventArt = resolveEventArt(entry.featured, entry.customArt, entry.artAlign)
  return (
    <span
      aria-hidden
      className={`relative h-10 shrink-0 overflow-hidden bg-slate-950 ${eventArt?.isWheel ? 'aspect-[430/872]' : 'w-14'}`}
    >
      <EventArt containWheel event={entry} />
    </span>
  )
}
