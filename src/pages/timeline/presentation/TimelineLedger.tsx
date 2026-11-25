import {useState} from 'react'

import {
  EVENT_CATEGORY_METADATA,
  getTimelineCountdown,
  getTimelineCountdownDisplay,
  getTimelineStatus,
  type BannerEntry,
  type EventEntry,
} from '@/domain/timeline'
import {formatTimelinePrice, type TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

import {BannerArtwork} from '../BannerArtwork'
import {BannerMetadataList} from '../bannerMetadata'
import {CATEGORY_TONE, resolveEventArt} from '../timelineEventHelpers'
import {TimelineRichText} from '../TimelineRichText'
import {getBannerArtworkSlots, getDisplayBanner, type TimelineEntry} from './timelinePageModel'

export function EventArt({
  className = '',
  containWheel = false,
  event,
  surface = 'card',
}: {
  className?: string
  containWheel?: boolean
  event: EventEntry
  surface?: 'card' | 'detail'
}) {
  const variant = event.artVariants?.[surface]
  const art = resolveEventArt(event.featured, variant ?? event.customArt)
  const position = variant
    ? 'object-center'
    : surface === 'detail'
      ? 'object-[50%_25%]'
      : art?.isWheel
        ? 'object-center'
        : 'object-top'
  const [failedUrl, setFailedUrl] = useState<string>()
  return art?.url && art.url !== failedUrl ? (
    <img
      alt=''
      onError={() => {
        setFailedUrl(art.url)
      }}
      className={`h-full w-full ${art.isWheel && containWheel ? 'object-contain' : 'object-cover'} ${position} ${className}`}
      src={art.url}
    />
  ) : null
}

function getEventMetaAmount(event: EventEntry, priceMode: TimelinePriceDisplayMode) {
  if (event.pricing) {
    const price = formatTimelinePrice(event.pricing, priceMode)
    const rewardPrices = event.rewards?.flatMap((group) => (group.price ? [group.price] : []))
    const hasPremiumTrack =
      event.category !== 'preorder' && rewardPrices?.length === 2 && rewardPrices.includes('Free')
    return price && hasPremiumTrack ? `Premium: ${price}` : price
  }

  const thresholds = event.missions?.flatMap((mission) =>
    'silverPrimeExtracted' in mission ? [mission.silverPrimeExtracted] : [],
  )
  if (!thresholds?.length) return undefined

  const min = Math.min(...thresholds)
  const max = Math.max(...thresholds)
  const amount = min === max ? String(min) : `${String(min)}-${String(max)}`
  const value = formatTimelinePrice(`${amount} Silver Prime`, priceMode, {includeGifted: false})
  const label = priceMode === 'usd-estimate' ? 'Base extraction cost' : 'Base Prime extracted'
  return value ? `${label}: ${value}` : undefined
}

export function EventMeta({
  compact = false,
  event,
  now,
  priceMode,
  showPrice = true,
}: {
  compact?: boolean
  showPrice?: boolean
  event: EventEntry
  now: Date
  priceMode: TimelinePriceDisplayMode
}) {
  const ended = getTimelineStatus(event.startDate, event.endDate, now) === 'ended'
  const tone = ended ? 'ended' : CATEGORY_TONE[event.category ?? 'other']
  const amount = showPrice ? getEventMetaAmount(event, priceMode) : undefined
  return (
    <div
      className={`flex items-center gap-x-1.5 gap-y-1 text-[0.64rem] leading-tight font-extrabold tracking-[0.11em] uppercase ${compact ? 'flex-wrap sm:flex-nowrap sm:overflow-hidden sm:whitespace-nowrap' : 'flex-wrap'}`}
    >
      <span className={`shrink-0 timeline-event-meta--${tone}`}>
        {EVENT_CATEGORY_METADATA[event.category ?? 'other'].label}
      </span>
      {event.rerun ? (
        <>
          <span className='shrink-0 text-slate-600'>·</span>
          <span className={`shrink-0 timeline-event-meta--${ended ? 'ended' : 'violet'}`}>
            Rerun
          </span>
        </>
      ) : null}
      {event.preliminary ? (
        <>
          <span className='shrink-0 text-slate-600'>·</span>
          <span className='shrink-0 text-slate-400'>Preliminary</span>
        </>
      ) : null}
      <EventMetaAmount amount={amount} compact={compact} ended={ended} />
    </div>
  )
}

function EventMetaAmount({
  amount,
  compact,
  ended,
}: {
  amount?: string
  compact: boolean
  ended: boolean
}) {
  if (!amount) return null
  return (
    <>
      <span className={`shrink-0 text-slate-600 ${compact ? 'hidden sm:inline' : ''}`}>·</span>
      <span
        className={`${compact ? 'basis-full sm:min-w-0 sm:basis-auto sm:truncate' : ''} timeline-event-meta--${ended ? 'ended' : 'price'}`}
      >
        {amount}
      </span>
    </>
  )
}

export function Countdown({
  entry,
  now,
  large = false,
}: {
  entry: TimelineEntry
  now: Date
  large?: boolean
}) {
  const countdown = getTimelineCountdown(entry.startDate, entry.endDate, now)
  const display = getTimelineCountdownDisplay(entry.startDate, entry.endDate, now)
  if (!countdown || !display) return null
  const ended = countdown.label === 'Ended'
  const urgent = countdown.label === 'Ends in' && countdown.totalMs <= 72 * 60 * 60 * 1000
  const value = !ended
    ? countdown.days > 0
      ? `${String(countdown.days)}d ${String(countdown.hours)}h`
      : `${String(countdown.hours)}h ${String(countdown.minutes)}m`
    : display.text.replace(/^Ended\s*/, '') || 'today'
  return (
    <div title={display.title}>
      <div className='text-xs leading-tight font-semibold text-slate-400'>{countdown.label}</div>
      <div
        className={`mt-0.5 leading-tight tabular-nums ${
          ended
            ? `${large ? 'text-base' : 'max-w-[12ch] text-sm'} font-medium text-slate-400`
            : `${large ? 'text-[1.375rem]' : 'text-base'} font-semibold whitespace-nowrap ${urgent ? 'text-rose-300' : 'text-[var(--ui-text-main)]'}`
        }`}
      >
        {value}
      </div>
    </div>
  )
}

export function BannerMeta({
  banner,
  now,
  priceMode,
  limit,
  showPrice = true,
}: {
  banner: BannerEntry
  now: Date
  priceMode: TimelinePriceDisplayMode
  limit?: number
  showPrice?: boolean
}) {
  return (
    <BannerMetadataList
      banner={banner}
      className='flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.64rem] leading-tight font-extrabold tracking-[0.11em] uppercase'
      endedSeparatorClass='text-slate-700'
      endedTextClass='timeline-event-meta--ended'
      fallbackClass='text-slate-300'
      isEnded={getTimelineStatus(banner.startDate, banner.endDate, now) === 'ended'}
      limit={limit}
      priceClass='timeline-event-meta--price'
      priceMode={priceMode}
      showPrice={showPrice}
      separatorClass='text-slate-600'
    />
  )
}

function JumpToDetails({onJump}: {onJump: () => void}) {
  return (
    <button
      className='sr-only z-30 min-h-10 items-center self-start rounded-[2px] border border-amber-300/60 bg-slate-950 px-3 text-[0.64rem] font-extrabold tracking-[0.12em] text-amber-100 uppercase focus:not-sr-only focus:m-1.5 focus:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200/60'
      onClick={onJump}
      type='button'
    >
      Jump to details
    </button>
  )
}

const ROW_SCROLL_MARGIN = 'scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4'

export function EventRow({
  event,
  now,
  onJumpToDetails,
  onSelect,
  priceMode,
  selected,
}: {
  event: EventEntry
  now: Date
  onJumpToDetails?: () => void
  onSelect: (id: string) => void
  priceMode: TimelinePriceDisplayMode
  selected: boolean
}) {
  const ended = getTimelineStatus(event.startDate, event.endDate, now) === 'ended'
  const summary = event.description
    ?.split('\n')[0]
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
  return (
    <li className={`relative ${ROW_SCROLL_MARGIN}`} data-entry-id={event.id}>
      <button
        aria-current={selected ? 'true' : undefined}
        className={`timeline-row relative flex min-h-20 w-full overflow-hidden rounded-[2px] border bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(10,16,28,0.88))] text-left transition-colors duration-[var(--ui-motion-duration-fast)] hover:border-amber-200/30 focus-visible:ring-2 focus-visible:ring-amber-200/50 focus-visible:outline-none motion-reduce:transition-none ${selected ? 'ui-inset-frame border-amber-300/55' : 'border-slate-700/40'}`}
        data-selected={selected}
        onClick={() => {
          onSelect(event.id)
        }}
        type='button'
      >
        <div
          className={`relative w-[4.5rem] shrink-0 self-stretch overflow-hidden bg-slate-950 sm:w-[5.5rem] ${ended ? 'opacity-55 saturate-50' : ''}`}
        >
          <EventArt className='absolute inset-0' event={event} />
        </div>
        <div className='min-w-0 flex-1 space-y-1 px-3 py-2'>
          <span
            className={`ui-title line-clamp-2 text-base sm:line-clamp-none sm:truncate ${ended ? 'text-slate-300' : 'text-amber-50'}`}
          >
            {event.title}
          </span>
          <EventMeta compact event={event} now={now} priceMode={priceMode} />
          {summary ? (
            <span className='line-clamp-1 text-xs text-slate-400'>
              <TimelineRichText priceMode={priceMode} text={summary} />
            </span>
          ) : null}
        </div>
        <div className='shrink-0 self-center px-3 text-right'>
          <Countdown entry={event} now={now} />
        </div>
      </button>
      {selected && onJumpToDetails ? <JumpToDetails onJump={onJumpToDetails} /> : null}
    </li>
  )
}

export function BannerTile({
  banner,
  now,
  onJumpToDetails,
  onSelect,
  priceMode,
  selected,
}: {
  banner: BannerEntry
  now: Date
  onJumpToDetails?: () => void
  onSelect: (id: string) => void
  priceMode: TimelinePriceDisplayMode
  selected: boolean
}) {
  const display = getDisplayBanner(banner, now)
  const ended = getTimelineStatus(banner.startDate, banner.endDate, now) === 'ended'
  return (
    <article
      data-entry-id={banner.id}
      className={`relative flex h-full flex-col overflow-hidden rounded-[2px] border bg-slate-950 ${ROW_SCROLL_MARGIN} ${selected ? 'border-amber-300/55 ring-1 ring-amber-300/15 ring-inset' : 'border-slate-700/50 hover:border-amber-200/30'}`}
    >
      <div className='ui-inset-frame relative aspect-[8/5] overflow-hidden'>
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 isolate ${ended ? 'opacity-55 saturate-50' : ''}`}
          inert
        >
          <BannerArtwork
            customArt={display.customArt}
            featured={display.featured}
            linkedPresentation={display.linkedPresentation}
            poolSlots={getBannerArtworkSlots(display)}
            title={display.title}
          />
        </div>
      </div>
      <div className='flex flex-1 items-center gap-3 border-t border-slate-700/40 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(10,16,28,0.88))] px-3 py-2'>
        <div className='min-w-0 flex-1'>
          <h3
            className={`ui-title line-clamp-2 text-base leading-tight text-balance ${ended ? 'text-slate-300' : 'text-amber-50'}`}
          >
            {banner.title}
          </h3>
          <div className='mt-1.5'>
            <BannerMeta banner={display} limit={2} now={now} priceMode={priceMode} />
          </div>
        </div>
        <div className='shrink-0 text-right'>
          <Countdown entry={banner} now={now} />
        </div>
      </div>
      <button
        aria-current={selected ? 'true' : undefined}
        aria-label={`Show details for ${banner.title}`}
        className='absolute inset-0 z-20 w-full focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:outline-none focus-visible:ring-inset'
        onClick={() => {
          onSelect(banner.id)
        }}
        type='button'
      />
      {selected && onJumpToDetails ? <JumpToDetails onJump={onJumpToDetails} /> : null}
    </article>
  )
}
