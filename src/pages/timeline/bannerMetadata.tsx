import {Fragment} from 'react'

import type {BannerEntry} from '@/domain/timeline'
import {formatTimelinePrice, type TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

import {getBannerDisplayTags, getBannerTagColor, getBannerTagLabel} from './bannerTagDisplay'

interface BannerMetadataListProps {
  banner: BannerEntry
  className: string
  endedSeparatorClass: string
  endedTextClass: string
  fallbackClass: string
  isEnded: boolean
  /** Caps the tag list; the price is always shown when enabled. */
  limit?: number
  priceClass?: string
  priceMode: TimelinePriceDisplayMode
  renderWhenEmpty?: boolean
  showPrice?: boolean
  separatorClass: string
}

export function BannerMetadataList({
  banner,
  className,
  endedSeparatorClass,
  endedTextClass,
  fallbackClass,
  isEnded,
  limit,
  priceClass,
  priceMode,
  renderWhenEmpty = false,
  showPrice = true,
  separatorClass,
}: BannerMetadataListProps) {
  const tags = getBannerMetadataTags(banner, limit)
  const price = showPrice ? formatTimelinePrice(banner.pricing, priceMode) : undefined
  const keyedItems = getKeyedBannerMetadataItems(tags)

  if (tags.length === 0 && !price && !renderWhenEmpty) return null

  return (
    <div className={className}>
      {keyedItems.map(({key, tag}, index) => (
        <Fragment key={key}>
          {index > 0 ? (
            <span aria-hidden className={isEnded ? endedSeparatorClass : separatorClass}>
              &middot;
            </span>
          ) : null}
          <span className={isEnded ? endedTextClass : getBannerTagColor(tag, fallbackClass)}>
            {getBannerTagLabel(tag)}
          </span>
        </Fragment>
      ))}
      {price ? (
        <>
          {keyedItems.length ? (
            <span aria-hidden className={isEnded ? endedSeparatorClass : separatorClass}>
              &middot;
            </span>
          ) : null}
          <span
            className={
              isEnded ? endedTextClass : (priceClass ?? getBannerTagColor(price, fallbackClass))
            }
          >
            {price}
          </span>
        </>
      ) : null}
    </div>
  )
}

function getKeyedBannerMetadataItems(items: readonly string[]) {
  const occurrenceByTag = new Map<string, number>()
  return items.map((tag) => {
    const occurrence = (occurrenceByTag.get(tag) ?? 0) + 1
    occurrenceByTag.set(tag, occurrence)
    return {key: `${tag}:${String(occurrence)}`, tag}
  })
}

function getBannerMetadataTags(banner: BannerEntry, limit: number | undefined) {
  const items = [...getBannerDisplayTags(banner), ...(banner.customTags ?? [])].filter(
    (tag): tag is string => Boolean(tag),
  )
  return typeof limit === 'number' ? items.slice(0, limit) : items
}
