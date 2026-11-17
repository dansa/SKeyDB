import {FaChevronRight} from 'react-icons/fa6'

import type {EntityRef} from '@/domain/entities/types'
import {getTimelineDateRangeDisplay, getTimelineStatus} from '@/domain/timeline'
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
  getPoolGroups,
  isBanner,
  type TimelineEntry,
} from './timelineNextModel'

export function TimelineStage({
  entry,
  entries,
  now,
  onOpenDetail,
  onSelect,
  priceMode,
}: {
  entry: TimelineEntry | undefined
  entries: TimelineEntry[]
  now: Date
  onOpenDetail: (ref: EntityRef) => void
  onSelect: (id: string) => void
  priceMode: TimelinePriceDisplayMode
}) {
  if (!entry)
    return (
      <p className='p-5 text-sm text-slate-400'>Select an event or banner to see its details.</p>
    )
  const banner = isBanner(entry) ? entry : undefined
  const displayBanner = banner ? getDisplayBanner(banner, now) : undefined
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
  return (
    <div className='timeline-next-fade' key={entry.id}>
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
          {displayBanner ? (
            <BannerMeta banner={displayBanner} now={now} priceMode={priceMode} />
          ) : !isBanner(entry) ? (
            <EventMeta event={entry} now={now} priceMode={priceMode} showPrice={!hasTrackPrices} />
          ) : null}
          <h2 className='ui-title mt-2 text-[1.55rem] leading-[1.08] text-amber-50'>
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
        </div>
        {price && !hasTrackPrices ? (
          <p className='border-t border-slate-700/40 pt-4 text-sm font-semibold text-slate-200'>
            {price}
          </p>
        ) : null}
        {entry.description ? (
          <p className='timeline-next-description border-t border-slate-700/40 pt-4 text-[0.86rem] leading-[1.5] text-slate-300'>
            <TimelineRichText priceMode={priceMode} text={entry.description} />
          </p>
        ) : null}
        {!isBanner(entry) && (entry.rewards?.length || entry.missions?.length) ? (
          <StageRewards
            groups={entry.rewards ?? []}
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
              Pool
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
        {banner ? (
          <StageSchedule key={banner.id} banner={banner} now={now} onOpenDetail={onOpenDetail} />
        ) : null}
        {profile?.rules ? (
          <div className='border-t border-slate-700/40 pt-2'>
            <StageBannerRules profile={profile.rules} />
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
