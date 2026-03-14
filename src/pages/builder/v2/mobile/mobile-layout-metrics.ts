import type {CSSProperties} from 'react'

import {clamp, roundToTenth} from './layout-math'

export const MOBILE_CARD_MAX_WIDTH = 240
export const MOBILE_CARD_MAX_HEIGHT = 600
export const MOBILE_CARD_MIN_HEIGHT = 240
export const MOBILE_CARD_WIDTH_RATIO = 2 / 5
export const MOBILE_GRID_GAP = 8
export const MOBILE_GRID_PADDING = 8
const MOBILE_OVERVIEW_MIN_HEIGHT_RATIO = 0.4

export interface OverviewGridMetrics {
  cardHeight: number
  cardWidth: number
  columns: 2 | 4
  contentHeight: number
  contentWidth: number
  gap: number
  requiresPageScroll: boolean
  rows: 1 | 2
  totalGridHeight: number
}

interface OverviewGridCandidate {
  cardHeight: number
  cardWidth: number
  columns: 2 | 4
  requiresPageScroll: boolean
  rows: 1 | 2
  totalGridHeight: number
}

export function getOverviewGridMetrics(
  availableWidth: number,
  availableHeight: number,
): OverviewGridMetrics {
  const contentWidth = Math.max(0, availableWidth - MOBILE_GRID_PADDING * 2)
  const contentHeight = Math.max(0, availableHeight - MOBILE_GRID_PADDING * 2)
  const grid = pickBestOverviewGrid(contentWidth, contentHeight)

  return {
    cardHeight: grid.cardHeight,
    cardWidth: grid.cardWidth,
    columns: grid.columns,
    contentHeight: roundToTenth(contentHeight),
    contentWidth: roundToTenth(contentWidth),
    gap: MOBILE_GRID_GAP,
    requiresPageScroll: grid.requiresPageScroll,
    rows: grid.rows,
    totalGridHeight: grid.totalGridHeight,
  }
}

export function getMobileCardFrameStyle({
  cardHeight,
  cardWidth,
}: {
  cardHeight?: number
  cardWidth?: number
} = {}): CSSProperties {
  return {
    ...(cardWidth ? {width: `${String(cardWidth)}px`} : {}),
    height: `${String(cardHeight && cardHeight > 0 ? cardHeight : MOBILE_CARD_MAX_HEIGHT)}px`,
    maxHeight: `${String(MOBILE_CARD_MAX_HEIGHT)}px`,
  }
}

function pickBestOverviewGrid(contentWidth: number, contentHeight: number) {
  if (contentWidth >= contentHeight) {
    return buildOverviewGridCandidate(4, contentWidth, contentHeight)
  }

  return buildOverviewGridCandidate(2, contentWidth, contentHeight)
}

function buildOverviewGridCandidate(
  columns: 2 | 4,
  contentWidth: number,
  contentHeight: number,
): OverviewGridCandidate {
  const rows = columns === 4 ? 1 : 2
  const cellWidth = Math.max(0, (contentWidth - MOBILE_GRID_GAP * (columns - 1)) / columns)
  const cellHeight = Math.max(0, (contentHeight - MOBILE_GRID_GAP * (rows - 1)) / rows)
  const cardWidth = roundToTenth(Math.min(MOBILE_CARD_MAX_WIDTH, cellWidth))
  const naturalCardHeight = roundToTenth(cardWidth / MOBILE_CARD_WIDTH_RATIO)
  const maxCardHeight = Math.min(MOBILE_CARD_MAX_HEIGHT, naturalCardHeight)
  const minCardHeight = Math.min(
    maxCardHeight,
    roundToTenth(naturalCardHeight * MOBILE_OVERVIEW_MIN_HEIGHT_RATIO),
  )
  const unclampedCardHeight = Math.min(cellHeight, maxCardHeight)
  const cardHeight = roundToTenth(clamp(unclampedCardHeight, minCardHeight, maxCardHeight))
  const totalGridHeight = roundToTenth(
    cardHeight * rows + MOBILE_GRID_GAP * (rows - 1) + MOBILE_GRID_PADDING * 2,
  )

  return {
    cardHeight,
    cardWidth,
    columns,
    requiresPageScroll: unclampedCardHeight < minCardHeight,
    rows,
    totalGridHeight,
  }
}
