import {clamp, roundToTenth} from '../layout-math'

export type QuickLineupLayoutMode = 'portrait' | 'landscape'

export interface QuickLineupLayoutMetrics {
  cardHeight: number
  cardWidth: number
  footerSize: number
  gap: number
  mode: QuickLineupLayoutMode
  pickerSize: number
  railSize: number
  willScroll: boolean
}

export interface QuickLineupSlotCardMetrics {
  covenantSize: number
  visualSize: number
  wheelHeight: number
}

const PORTRAIT_GAP = 6
const LANDSCAPE_GAP = 4
const PORTRAIT_FOOTER_SIZE = 32
const LANDSCAPE_FOOTER_SIZE = 28
const PORTRAIT_RAIL_RATIO = 0.255
const LANDSCAPE_RAIL_RATIO = 0.26
const PORTRAIT_RAIL_MIN = 112
const PORTRAIT_RAIL_MAX = 208
const PORTRAIT_CARD_MAX_WIDTH = 172
const LANDSCAPE_RAIL_MIN = 214
const LANDSCAPE_RAIL_MAX = 228
const LANDSCAPE_CARD_MIN_HEIGHT = 64
const LANDSCAPE_CARD_MAX_HEIGHT = 150
const SLOT_CARD_INNER_GAP = 2
const SLOT_CARD_INNER_PADDING = 2
const PORTRAIT_VISUAL_RATIO = 0.54
const LANDSCAPE_VISUAL_RATIO = 0.56
const PORTRAIT_COVENANT_RATIO = 0.34
const LANDSCAPE_COVENANT_RATIO = 0.314
const PORTRAIT_COVENANT_MIN = 24
const PORTRAIT_COVENANT_MAX = 46
const LANDSCAPE_COVENANT_MIN = 22
const LANDSCAPE_COVENANT_MAX = 40

export function getQuickLineupLayoutMode(
  availableWidth: number,
  availableHeight: number,
): QuickLineupLayoutMode {
  return availableWidth > availableHeight ? 'landscape' : 'portrait'
}

export function getQuickLineupLayoutMetrics(
  availableWidth: number,
  availableHeight: number,
  mode: QuickLineupLayoutMode = getQuickLineupLayoutMode(availableWidth, availableHeight),
): QuickLineupLayoutMetrics {
  if (mode === 'landscape') {
    return getLandscapeMetrics(availableWidth, availableHeight)
  }

  return getPortraitMetrics(availableWidth, availableHeight)
}

function getPortraitMetrics(
  availableWidth: number,
  availableHeight: number,
): QuickLineupLayoutMetrics {
  const railSize = roundToTenth(
    clamp(availableHeight * PORTRAIT_RAIL_RATIO, PORTRAIT_RAIL_MIN, PORTRAIT_RAIL_MAX),
  )
  const cardWidth = roundToTenth(
    clamp((availableWidth - PORTRAIT_GAP * 3) / 4, 0, PORTRAIT_CARD_MAX_WIDTH),
  )
  const pickerSize = roundToTenth(
    Math.max(0, availableHeight - railSize - PORTRAIT_FOOTER_SIZE - PORTRAIT_GAP),
  )

  return {
    cardHeight: railSize,
    cardWidth,
    footerSize: PORTRAIT_FOOTER_SIZE,
    gap: PORTRAIT_GAP,
    mode: 'portrait',
    pickerSize,
    railSize,
    willScroll: false,
  }
}

function getLandscapeMetrics(
  availableWidth: number,
  availableHeight: number,
): QuickLineupLayoutMetrics {
  const railSize = roundToTenth(
    clamp(availableWidth * LANDSCAPE_RAIL_RATIO, LANDSCAPE_RAIL_MIN, LANDSCAPE_RAIL_MAX),
  )
  const unclampedCardHeight = (availableHeight - LANDSCAPE_FOOTER_SIZE - LANDSCAPE_GAP * 5) / 4
  const cardHeight = roundToTenth(
    clamp(unclampedCardHeight, LANDSCAPE_CARD_MIN_HEIGHT, LANDSCAPE_CARD_MAX_HEIGHT),
  )
  const cardWidth = roundToTenth(Math.max(0, railSize - LANDSCAPE_GAP * 2))
  const pickerSize = roundToTenth(Math.max(0, availableWidth - railSize - LANDSCAPE_GAP))

  return {
    cardHeight,
    cardWidth,
    footerSize: LANDSCAPE_FOOTER_SIZE,
    gap: LANDSCAPE_GAP,
    mode: 'landscape',
    pickerSize,
    railSize,
    willScroll: unclampedCardHeight < LANDSCAPE_CARD_MIN_HEIGHT,
  }
}

export function getQuickLineupSlotCardMetrics(
  cardWidth: number,
  cardHeight: number,
  layout: QuickLineupLayoutMode,
): QuickLineupSlotCardMetrics {
  if (layout === 'landscape') {
    const visualSize = roundToTenth(cardWidth * LANDSCAPE_VISUAL_RATIO)
    const wheelAreaWidth = Math.max(
      0,
      cardWidth - visualSize - SLOT_CARD_INNER_PADDING * 2 - SLOT_CARD_INNER_GAP,
    )
    const wheelWidth = Math.max(0, (wheelAreaWidth - SLOT_CARD_INNER_GAP) / 2)
    const wheelHeight = roundToTenth(
      Math.min(Math.max(0, cardHeight - SLOT_CARD_INNER_PADDING * 2), wheelWidth * 2),
    )

    return {
      covenantSize: roundToTenth(
        clamp(
          Math.min(visualSize, cardHeight) * LANDSCAPE_COVENANT_RATIO,
          LANDSCAPE_COVENANT_MIN,
          LANDSCAPE_COVENANT_MAX,
        ),
      ),
      visualSize,
      wheelHeight,
    }
  }

  const visualSize = roundToTenth(cardHeight * PORTRAIT_VISUAL_RATIO)
  const wheelAreaHeight = Math.max(0, cardHeight - visualSize - SLOT_CARD_INNER_PADDING * 2)
  const wheelWidth = Math.max(
    0,
    (cardWidth - SLOT_CARD_INNER_PADDING * 2 - SLOT_CARD_INNER_GAP) / 2,
  )

  return {
    covenantSize: roundToTenth(
      clamp(
        Math.min(cardWidth, visualSize) * PORTRAIT_COVENANT_RATIO,
        PORTRAIT_COVENANT_MIN,
        PORTRAIT_COVENANT_MAX,
      ),
    ),
    visualSize,
    wheelHeight: roundToTenth(Math.min(wheelAreaHeight, wheelWidth * 2)),
  }
}
