import {clamp, roundToTenth} from './layout-math'
import {
  MOBILE_CARD_MAX_HEIGHT,
  MOBILE_CARD_MAX_WIDTH,
  MOBILE_CARD_MIN_HEIGHT,
} from './mobile-layout-metrics'

export type WideFocusedStage = 'stacked' | 'split'

export const FOCUSED_CARD_ART_WIDTH = MOBILE_CARD_MAX_WIDTH
export const FOCUSED_CARD_MIN_HEIGHT = MOBILE_CARD_MIN_HEIGHT
export const FOCUSED_CARD_ART_HEIGHT = MOBILE_CARD_MAX_HEIGHT
export const FOCUSED_SLOT_SIZE = 44
export const FOCUSED_STAGE_GAP = 8

const RED_ROW_HEIGHT = roundToTenth(
  ((FOCUSED_CARD_ART_WIDTH - FOCUSED_STAGE_GAP * 2) / 2.8) * 2 + 2,
)
const STACKED_STAGE_MIN_HEIGHT = FOCUSED_CARD_MIN_HEIGHT + RED_ROW_HEIGHT + FOCUSED_STAGE_GAP

export interface WideFocusedStageMetrics {
  stage: WideFocusedStage
  cardHeight: number
  cardWidth: number
  railSize: number
  redColumnWidth: number
  redRowHeight: number
  stageHeight: number
  willScroll: boolean
}

export function getWideFocusedStageMetrics(availableHeight: number): WideFocusedStageMetrics {
  const stageHeight = roundToTenth(Math.max(0, availableHeight))
  const stage = stageHeight >= STACKED_STAGE_MIN_HEIGHT ? 'stacked' : 'split'

  const cardHeight = roundToTenth(
    clamp(
      stage === 'stacked' ? stageHeight - RED_ROW_HEIGHT - FOCUSED_STAGE_GAP : stageHeight,
      FOCUSED_CARD_MIN_HEIGHT,
      FOCUSED_CARD_ART_HEIGHT,
    ),
  )

  return {
    stage,
    cardHeight,
    cardWidth: FOCUSED_CARD_ART_WIDTH,
    railSize: FOCUSED_SLOT_SIZE,
    redColumnWidth: roundToTenth(Math.max(0, (cardHeight - FOCUSED_STAGE_GAP * 2) / 5)),
    redRowHeight: RED_ROW_HEIGHT,
    stageHeight,
    willScroll: stageHeight < FOCUSED_CARD_MIN_HEIGHT,
  }
}
