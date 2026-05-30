import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'

import type {BannerEntry} from '@/domain/timeline'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

import {BannerMetadataList} from './bannerMetadata'
import {TimelineRichText} from './TimelineRichText'

const DRAWER_BASE_CLASS =
  'absolute inset-y-0 right-0 z-30 w-[calc(50%_+_1.75rem)] min-w-[11.75rem] max-w-[calc(100%_-_1.75rem)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'

const DRAWER_SURFACE_CLASS =
  'absolute inset-0 border-l border-amber-100/16 bg-[linear-gradient(180deg,rgba(9,16,29,0.42)_0%,rgba(9,16,29,0.88)_44%,rgba(4,8,16,0.98)_100%)] shadow-[-14px_0_26px_rgba(2,6,14,0.36)] backdrop-blur-[10px]'

const DRAWER_TOGGLE_CLASS =
  'absolute inset-y-0 left-0 z-30 grid w-7 place-items-center border-l border-amber-100/14 bg-slate-950/58 text-amber-100/78 shadow-[-6px_0_14px_rgba(2,6,14,0.32)] transition-[background-color,color] duration-150 hover:bg-slate-900/88 hover:text-amber-50 focus-visible:ring-2 focus-visible:ring-amber-200/45 focus-visible:outline-none motion-reduce:transition-none'

const DRAWER_BODY_BASE_CLASS =
  'relative z-10 flex h-full min-w-0 flex-col justify-center overflow-hidden py-5'

const DRAWER_BODY_STACK_CLASS =
  'flex max-h-full min-h-0 min-w-0 flex-col justify-center overflow-hidden'

const DRAWER_TITLE_BASE_CLASS =
  'ui-title line-clamp-3 shrink-0 text-[1.02rem] leading-[1.16] tracking-tight sm:text-[1.08rem]'

const DRAWER_TAGS_CLASS =
  'mt-2 flex min-w-0 shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.58rem] leading-none font-bold tracking-[0.16em] uppercase'

const DRAWER_DATE_CLASS =
  'mt-2 min-w-0 shrink-0 overflow-visible text-[0.56rem] leading-tight font-bold tracking-[0.14em] whitespace-normal uppercase text-amber-100/82'

const DRAWER_DESCRIPTION_CLASS =
  'ui-scrollbar mt-3 min-h-0 max-h-[6.75rem] overflow-y-auto pr-1 text-xs leading-[1.5] text-slate-400 focus-visible:ring-2 focus-visible:ring-amber-200/35 focus-visible:outline-none'

interface BannerInfoDrawerProps {
  banner: BannerEntry
  canCollapse: boolean
  countdownText: string | undefined
  countdownTitle: string | undefined
  isEnded: boolean
  open: boolean
  onToggle: () => void
  priceMode?: TimelinePriceDisplayMode
}

export function BannerInfoDrawer({
  banner,
  canCollapse,
  countdownText,
  countdownTitle,
  isEnded,
  open,
  onToggle,
  priceMode = 'silver-prime',
}: BannerInfoDrawerProps) {
  const drawerTransform = open ? 'translate-x-0' : 'translate-x-[calc(100%_-_1.75rem)]'
  const contentInset = canCollapse ? 'pr-4 pl-11' : 'px-5'

  return (
    <div className={`${DRAWER_BASE_CLASS} ${drawerTransform}`}>
      <div className={DRAWER_SURFACE_CLASS} />

      {canCollapse ? (
        <button
          aria-expanded={open}
          aria-label={
            open ? `Hide details for ${banner.title}` : `Show details for ${banner.title}`
          }
          className={DRAWER_TOGGLE_CLASS}
          onClick={onToggle}
          title={open ? 'Hide details' : 'Show details'}
          type='button'
        >
          {open ? <FaChevronRight aria-hidden /> : <FaChevronLeft aria-hidden />}
          {!open ? (
            <span
              aria-hidden
              className='absolute bottom-4 left-1/2 -translate-x-1/2 text-[0.46rem] leading-none font-bold tracking-[0.18em] uppercase [writing-mode:vertical-rl]'
            >
              Details
            </span>
          ) : null}
        </button>
      ) : null}

      {open || !canCollapse ? (
        <BannerDrawerBody
          banner={banner}
          contentInset={contentInset}
          countdownText={countdownText}
          countdownTitle={countdownTitle}
          isEnded={isEnded}
          priceMode={priceMode}
        />
      ) : null}
    </div>
  )
}

function BannerDrawerBody({
  banner,
  contentInset,
  countdownText,
  countdownTitle,
  isEnded,
  priceMode,
}: {
  banner: BannerEntry
  contentInset: string
  countdownText: string | undefined
  countdownTitle: string | undefined
  isEnded: boolean
  priceMode: TimelinePriceDisplayMode
}) {
  return (
    <div
      className={`${DRAWER_BODY_BASE_CLASS} ${contentInset} ${isEnded ? 'text-slate-500' : 'text-slate-100'}`}
      data-banner-drawer-body
    >
      <div className={DRAWER_BODY_STACK_CLASS}>
        <h3
          className={`${DRAWER_TITLE_BASE_CLASS} ${isEnded ? 'text-slate-500' : 'text-amber-50'}`}
        >
          {banner.title}
        </h3>
        <BannerMetadataList
          banner={banner}
          className={DRAWER_TAGS_CLASS}
          endedSeparatorClass='text-slate-700'
          endedTextClass='text-slate-600'
          fallbackClass='text-slate-300/88'
          isEnded={isEnded}
          priceMode={priceMode}
          renderWhenEmpty
          separatorClass='text-slate-600/75'
        />
        {countdownText ? (
          <div className={DRAWER_DATE_CLASS} title={countdownTitle}>
            {countdownText}
          </div>
        ) : null}
        {banner.description ? (
          <div aria-label={`Description for ${banner.title}`} className={DRAWER_DESCRIPTION_CLASS}>
            <TimelineRichText priceMode={priceMode} text={banner.description} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
