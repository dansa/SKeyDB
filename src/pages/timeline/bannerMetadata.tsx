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
  limit?: number
  priceMode: TimelinePriceDisplayMode
  renderWhenEmpty?: boolean
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
  priceMode,
  renderWhenEmpty = false,
  separatorClass,
}: BannerMetadataListProps) {
  const items = getBannerMetadataItems(banner, priceMode, limit)
  const keyedItems = getKeyedBannerMetadataItems(items)

  if (items.length === 0 && !renderWhenEmpty) return null

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

function getBannerMetadataItems(
  banner: BannerEntry,
  priceMode: TimelinePriceDisplayMode,
  limit: number | undefined,
) {
  const displayPricing = formatTimelinePrice(banner.pricing, priceMode)
  const items = [
    ...getBannerDisplayTags(banner),
    ...(banner.customTags ?? []),
    displayPricing,
  ].filter((tag): tag is string => Boolean(tag))

  return typeof limit === 'number' ? items.slice(0, limit) : items
}
