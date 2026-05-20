import {useState} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {getTimelineCountdownDisplay, getTimelineStatus, type BannerEntry} from '@/domain/timeline'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

import {BannerArtwork} from './BannerArtwork'
import {BannerInfoDrawer} from './BannerInfoDrawer'
import {BannerMetadataList} from './bannerMetadata'

const BANNER_CARD_BASE_CLASS =
  'group/banner relative aspect-[8/5] w-full max-w-[30rem] overflow-hidden rounded-[2px] border shadow-[0_12px_26px_rgba(2,6,23,0.28),inset_0_1px_0_rgba(255,244,202,0.05)] transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none'

const BANNER_CARD_DEFAULT_CLASS =
  'border-slate-700/50 bg-[radial-gradient(circle_at_14%_0%,rgba(76,96,128,0.2),transparent_44%),linear-gradient(180deg,rgba(9,16,29,0.96),rgba(4,9,17,0.98))] hover:border-amber-200/46 hover:shadow-[0_18px_34px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,244,202,0.08)]'

const BANNER_CARD_PINNED_CLASS =
  'border-amber-300/45 bg-[radial-gradient(circle_at_18%_0%,rgba(181,124,34,0.22),transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(5,10,18,0.98))] ring-1 ring-amber-300/10 ring-inset hover:border-amber-200/46 hover:shadow-[0_18px_34px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,244,202,0.08)]'

const BANNER_CARD_ENDED_CLASS =
  'border-slate-700/25 bg-[radial-gradient(circle_at_14%_0%,rgba(76,96,128,0.14),transparent_44%),linear-gradient(180deg,rgba(9,16,29,0.9),rgba(4,9,17,0.98))]'

const BANNER_ART_CLASS = 'absolute inset-0 bg-slate-950'
const BANNER_ART_ENDED_CLASS = `${BANNER_ART_CLASS} opacity-[0.58] saturate-50`
const BANNER_HERO_BASE_CLASS =
  'pointer-events-none absolute right-12 bottom-3 left-3 z-40 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
const BANNER_HERO_SURFACE_CLASS =
  'relative inline-grid min-w-[8.75rem] grid-cols-[minmax(0,max-content)] border border-amber-100/12 bg-slate-950/28 px-3 py-2 shadow-[0_8px_22px_rgba(2,6,14,0.34),inset_0_1px_0_rgba(255,244,202,0.04)] backdrop-blur-[2px]'
const BANNER_HERO_TITLE_CLASS =
  'ui-title -mb-[0.14em] min-w-0 overflow-hidden pb-[0.14em] text-ellipsis whitespace-nowrap text-[0.92rem] leading-[1.12] tracking-tight text-amber-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-[1rem]'
const BANNER_HERO_META_CLASS =
  'mt-1.5 flex min-w-0 items-center gap-x-1.5 overflow-hidden text-[0.56rem] leading-none font-bold tracking-[0.14em] whitespace-nowrap uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.92)]'
const BANNER_HERO_COUNTDOWN_CLASS =
  'mt-1 min-w-0 overflow-hidden text-[0.56rem] leading-none font-bold tracking-[0.14em] text-ellipsis whitespace-nowrap uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.92)]'

interface BannerCardProps {
  artworkLoading?: 'eager' | 'lazy'
  banner: BannerEntry
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
  priceMode?: TimelinePriceDisplayMode
}

export function BannerCard({
  artworkLoading = 'lazy',
  banner,
  now,
  onOpenDetail,
  priceMode = 'silver-prime',
}: BannerCardProps) {
  const [drawerPinnedOpen, setDrawerPinnedOpen] = useState(false)
  const status = getTimelineStatus(banner.startDate, banner.endDate, now)
  const countdownDisplay = getTimelineCountdownDisplay(banner.startDate, banner.endDate, now)
  const isEnded = status === 'ended'
  const drawerCanCollapse =
    Boolean(banner.customArt) ||
    (banner.featured?.length ?? 0) > 0 ||
    (banner.poolSlots?.length ?? 0) > 0
  const drawerOpen = !drawerCanCollapse || drawerPinnedOpen
  const showPinned = banner.pinned === true && status === 'active'
  const cardStateClass = isEnded
    ? BANNER_CARD_ENDED_CLASS
    : showPinned
      ? BANNER_CARD_PINNED_CLASS
      : BANNER_CARD_DEFAULT_CLASS

  return (
    <article className={`${BANNER_CARD_BASE_CLASS} ${cardStateClass}`}>
      <div className={isEnded ? BANNER_ART_ENDED_CLASS : BANNER_ART_CLASS}>
        <BannerArtwork
          customArt={banner.customArt}
          featured={banner.featured}
          loading={artworkLoading}
          onOpenDetail={onOpenDetail}
          poolSlots={banner.poolSlots}
          title={banner.title}
        />
      </div>

      <div className='pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_24%_12%,rgba(255,244,202,0.06),transparent_34%),linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.08)_58%,rgba(2,6,14,0.68))]' />
      <div className='pointer-events-none absolute inset-1 z-20 border border-amber-100/10' />

      <BannerCardHero
        banner={banner}
        countdownText={countdownDisplay?.text}
        countdownTitle={countdownDisplay?.title}
        hidden={drawerOpen}
        isEnded={isEnded}
        priceMode={priceMode}
      />

      <BannerInfoDrawer
        banner={banner}
        canCollapse={drawerCanCollapse}
        countdownText={countdownDisplay?.text}
        countdownTitle={countdownDisplay?.title}
        isEnded={isEnded}
        onToggle={() => {
          setDrawerPinnedOpen((current) => !current)
        }}
        open={drawerOpen}
        priceMode={priceMode}
      />
    </article>
  )
}

function BannerCardHero({
  banner,
  countdownText,
  countdownTitle,
  hidden,
  isEnded,
  priceMode,
}: {
  banner: BannerEntry
  countdownText?: string
  countdownTitle?: string
  hidden: boolean
  isEnded: boolean
  priceMode: TimelinePriceDisplayMode
}) {
  return (
    <div
      aria-hidden={hidden}
      className={`${BANNER_HERO_BASE_CLASS} ${
        hidden ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
      }`}
      data-banner-hero='summary'
    >
      <div className={BANNER_HERO_SURFACE_CLASS}>
        <h3 className={`${BANNER_HERO_TITLE_CLASS} ${isEnded ? 'text-slate-400' : ''}`}>
          {banner.title}
        </h3>
        <BannerMetadataList
          banner={banner}
          className={BANNER_HERO_META_CLASS}
          endedSeparatorClass='text-slate-700'
          endedTextClass='text-slate-500'
          fallbackClass='text-slate-300/90'
          isEnded={isEnded}
          limit={4}
          priceMode={priceMode}
          separatorClass='text-slate-500/85'
        />
        {countdownText ? (
          <div className={BANNER_HERO_COUNTDOWN_CLASS} title={countdownTitle}>
            {countdownText}
          </div>
        ) : null}
      </div>
    </div>
  )
}
