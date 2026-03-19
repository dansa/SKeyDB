import {clamp} from './layout-math'

const TABLET_BUILDER_COLUMNS = 4
const TABLET_BUILDER_GAP_PX = 8
const TABLET_CARD_ART_ASPECT_WIDTH = 25
const TABLET_CARD_ART_ASPECT_HEIGHT = 56
const TABLET_CARD_MIN_HEIGHT_SCALE = 0.65
const TABLET_CARD_MAX_HEIGHT_SCALE = 1
const TABLET_PICKER_MIN_HEIGHT_PX = 222
const TABLET_PICKER_PRIORITY_BAND_MAX_HEIGHT_PX = 730
const TABLET_STAGE_GAP_PX = 12
const TABLET_STAGE_BODY_MIN_WIDTH_PX = 560
const TABLET_STAGE_BODY_MAX_WIDTH_PX = 704
const TABLET_STAGE_BODY_HORIZONTAL_PADDING_PX = 16
const TABLET_STAGE_CHROME_HEIGHT_PX = 117
export const TABLET_LAYOUT_MIN_WIDTH_PX = 600
export const TABLET_LAYOUT_MIN_HEIGHT_PX = 600

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100
}

export function getTabletMainZoneHeight(viewportHeight: number): number {
  return Math.max(TABLET_LAYOUT_MIN_HEIGHT_PX, Math.round(viewportHeight))
}

function resolveTabletStageGridWidth(mainZoneWidth: number): number {
  return clamp(
    mainZoneWidth - TABLET_STAGE_BODY_HORIZONTAL_PADDING_PX,
    TABLET_STAGE_BODY_MIN_WIDTH_PX,
    TABLET_STAGE_BODY_MAX_WIDTH_PX,
  )
}

function resolveTabletNaturalCardHeight(gridWidth: number): number {
  const cardWidth =
    (gridWidth - TABLET_BUILDER_GAP_PX * (TABLET_BUILDER_COLUMNS - 1)) / TABLET_BUILDER_COLUMNS

  return (cardWidth * TABLET_CARD_ART_ASPECT_HEIGHT) / TABLET_CARD_ART_ASPECT_WIDTH
}

export function getTabletStageHeightBounds(mainZoneWidth: number): {
  idealHeight: number
  minHeight: number
} {
  if (mainZoneWidth <= 0) {
    return {
      idealHeight: TABLET_STAGE_CHROME_HEIGHT_PX,
      minHeight: TABLET_STAGE_CHROME_HEIGHT_PX,
    }
  }

  const gridWidth = resolveTabletStageGridWidth(mainZoneWidth)
  const naturalCardHeight = resolveTabletNaturalCardHeight(gridWidth)

  return {
    idealHeight: Math.round(TABLET_STAGE_CHROME_HEIGHT_PX + naturalCardHeight),
    minHeight: Math.round(
      TABLET_STAGE_CHROME_HEIGHT_PX + naturalCardHeight * TABLET_CARD_MIN_HEIGHT_SCALE,
    ),
  }
}

export function getTabletStageHeight({
  mainZoneHeight,
  mainZoneWidth,
}: {
  mainZoneHeight: number
  mainZoneWidth: number
}): number {
  if (mainZoneHeight <= 0) {
    return 0
  }

  const {idealHeight, minHeight} = getTabletStageHeightBounds(mainZoneWidth)
  const maxStageHeight = Math.max(
    0,
    mainZoneHeight - TABLET_PICKER_MIN_HEIGHT_PX - TABLET_STAGE_GAP_PX,
  )
  const compactStageHeight = Math.min(maxStageHeight, minHeight)

  if (maxStageHeight <= 0) {
    return 0
  }

  if (mainZoneHeight <= TABLET_PICKER_PRIORITY_BAND_MAX_HEIGHT_PX) {
    return compactStageHeight
  }

  const preferredPickerHeight = Math.max(
    TABLET_PICKER_MIN_HEIGHT_PX,
    TABLET_PICKER_PRIORITY_BAND_MAX_HEIGHT_PX - compactStageHeight - TABLET_STAGE_GAP_PX,
  )
  const pickerCappedStageHeight = Math.max(
    0,
    mainZoneHeight - preferredPickerHeight - TABLET_STAGE_GAP_PX,
  )

  return Math.round(clamp(idealHeight, compactStageHeight, pickerCappedStageHeight))
}

export function getTabletPickerHeight({
  mainZoneHeight,
  mainZoneWidth,
}: {
  mainZoneHeight: number
  mainZoneWidth: number
}): number {
  if (mainZoneHeight <= 0) {
    return TABLET_PICKER_MIN_HEIGHT_PX
  }

  const stageHeight = getTabletStageHeight({mainZoneHeight, mainZoneWidth})
  return Math.max(0, mainZoneHeight - stageHeight - TABLET_STAGE_GAP_PX)
}

interface ResolveTabletBuilderCardHeightScaleOptions {
  availableHeight: number
  gridWidth: number
}

export function resolveTabletBuilderCardHeightScale({
  availableHeight,
  gridWidth,
}: ResolveTabletBuilderCardHeightScaleOptions): number {
  if (gridWidth <= 0 || availableHeight <= 0) {
    return TABLET_CARD_MAX_HEIGHT_SCALE
  }

  const naturalCardHeight = resolveTabletNaturalCardHeight(gridWidth)
  const rawScale = availableHeight / naturalCardHeight

  return roundToTwoDecimals(
    Math.min(TABLET_CARD_MAX_HEIGHT_SCALE, Math.max(TABLET_CARD_MIN_HEIGHT_SCALE, rawScale)),
  )
}
