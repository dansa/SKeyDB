import type {ReactNode} from 'react'

import type {TeamSlot} from '../../../types'
import type {WideFocusedStageMetrics} from '../focused-layout'
import {LandscapeLoadout} from './FocusedLoadout'
import {EmptySlotDisplay, FocusedPortrait, FocusedPortraitFooter} from './FocusedPortrait'
import {FocusedPosseSquareButton, SlotThumbnails} from './FocusedShared'
import type {FocusedPosse, WheelOwnedLevels} from './types'

interface WideStageFrameProps {
  card: ReactNode
  currentIndex: number
  layout: WideFocusedStageMetrics
  loadout: ReactNode
  onPosseClick: () => void
  onSelect: (index: number) => void
  posse: FocusedPosse | undefined
  posseAsset?: string
  slots: TeamSlot[]
}

function WideStageFrame({
  card,
  currentIndex,
  layout,
  loadout,
  onPosseClick,
  onSelect,
  posse,
  posseAsset,
  slots,
}: WideStageFrameProps) {
  const cardColumnStyle = {width: `${String(layout.cardWidth)}px`}

  if (layout.stage === 'stacked') {
    return (
      <div
        className='flex w-fit max-w-full items-center gap-2 self-center'
        data-stage='stacked'
        data-testid='mobile-focused-stage'
      >
        <SplitStageRail
          currentIndex={currentIndex}
          onPosseClick={onPosseClick}
          onSelect={onSelect}
          posse={posse}
          posseAsset={posseAsset}
          railSize={layout.railSize}
          slots={slots}
        />
        <div className='flex max-w-full flex-col gap-2' style={cardColumnStyle}>
          {card}
          {loadout}
        </div>
      </div>
    )
  }

  return (
    <div
      className='flex w-fit max-w-full items-center gap-2 self-center'
      data-stage='split'
      data-testid='mobile-focused-stage'
    >
      <SplitStageRail
        currentIndex={currentIndex}
        onPosseClick={onPosseClick}
        onSelect={onSelect}
        posse={posse}
        posseAsset={posseAsset}
        railSize={layout.railSize}
        slots={slots}
      />
      <div className='max-w-full' data-testid='mobile-focused-card-column' style={cardColumnStyle}>
        {card}
      </div>
      {loadout}
    </div>
  )
}

function SplitStageRail({
  currentIndex,
  onPosseClick,
  onSelect,
  posse,
  posseAsset,
  railSize,
  slots,
}: {
  currentIndex: number
  onPosseClick: () => void
  onSelect: (index: number) => void
  posse: FocusedPosse | undefined
  posseAsset?: string
  railSize: number
  slots: TeamSlot[]
}) {
  return (
    <div className='flex shrink-0 flex-col gap-1'>
      <FocusedPosseSquareButton
        onClick={onPosseClick}
        posse={posse}
        posseAsset={posseAsset}
        size={railSize}
      />
      <div data-testid='mobile-focused-slot-rail'>
        <SlotThumbnails
          columnGapClass='gap-1'
          currentIndex={currentIndex}
          onSelect={onSelect}
          orientation='column'
          size={railSize}
          slots={slots}
        />
      </div>
    </div>
  )
}

interface WideFocusedStageSharedProps {
  layout: WideFocusedStageMetrics
  onChangeAwakener: () => void
  onChangeSlotIndex: (index: number) => void
  onPosseClick: () => void
  posse: FocusedPosse | undefined
  posseAsset?: string
  slotIndex: number
  slots: TeamSlot[]
}

type WideFocusedStageProps =
  | (WideFocusedStageSharedProps & {
      awakenerOwnedLevel: number | null
      onCovenantClick: () => void
      onWheelClick: (wheelIndex: number) => void
      slot: TeamSlot
      wheelOwnedLevels: WheelOwnedLevels
    })
  | (WideFocusedStageSharedProps & {
      awakenerOwnedLevel?: number | null
      onCovenantClick?: undefined
      onWheelClick?: undefined
      slot?: undefined
      wheelOwnedLevels?: undefined
    })

export function WideFocusedStage({
  layout,
  onChangeAwakener,
  onChangeSlotIndex,
  onPosseClick,
  posse,
  posseAsset,
  slotIndex,
  slots,
  ...contentProps
}: WideFocusedStageProps) {
  const stageFrameProps = {
    currentIndex: slotIndex,
    layout,
    onPosseClick,
    onSelect: onChangeSlotIndex,
    posse,
    posseAsset,
    slots,
  }

  const splitLayout = layout.stage === 'split' ? layout : undefined

  if (contentProps.slot) {
    const {awakenerOwnedLevel, onCovenantClick, onWheelClick, slot, wheelOwnedLevels} = contentProps

    return (
      <WideStageFrame
        {...stageFrameProps}
        card={
          <FocusedPortrait
            cardHeight={layout.cardHeight}
            footer={<FocusedPortraitFooter awakenerOwnedLevel={awakenerOwnedLevel} slot={slot} />}
            onChangeAwakener={onChangeAwakener}
            slot={slot}
          />
        }
        loadout={
          <LandscapeLoadout
            layout={splitLayout}
            onCovenantClick={onCovenantClick}
            onWheelClick={onWheelClick}
            slot={slot}
            wheelOwnedLevels={wheelOwnedLevels}
          />
        }
      />
    )
  }

  return (
    <WideStageFrame
      {...stageFrameProps}
      card={<EmptySlotDisplay cardHeight={layout.cardHeight} onChangeAwakener={onChangeAwakener} />}
      loadout={<LandscapeLoadout layout={splitLayout} />}
    />
  )
}
