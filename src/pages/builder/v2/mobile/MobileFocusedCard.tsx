import {useCallback} from 'react'

import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses} from '@/domain/posses'

import {clearSlotAssignment} from '../../team-state'
import {useBuilderStore} from '../store/builder-store'
import {selectActiveTeam, selectActiveTeamSlots} from '../store/selectors'
import {getDisplayedAwakenerOwnedLevel} from '../support-display'
import {useCollectionOwnership} from '../useCollectionOwnership'
import {FocusedActionBar} from './focused-card/FocusedActionBar'
import {WideFocusedStage} from './focused-card/FocusedStage'
import {useFocusedStageHostHeight} from './focused-card/hooks'
import type {WheelOwnedLevels} from './focused-card/types'
import {getWideFocusedStageMetrics} from './focused-layout'
import {MobileBuilderScreen} from './MobileBuilderScreen'
import type {PickerContext} from './MobileViewState'

const posses = getPosses()
const posseById = new Map(posses.map((posse) => [posse.id, posse]))

interface MobileFocusedCardProps {
  onBack: () => void
  onChangeSlotIndex: (index: number) => void
  onOpenPicker: (context: PickerContext) => void
  onQuickLineup: () => void
  shellMode?: 'device' | 'preview'
  slotIndex: number
}

export function MobileFocusedCard({
  onBack,
  onChangeSlotIndex,
  onOpenPicker,
  onQuickLineup,
  shellMode = 'device',
  slotIndex,
}: MobileFocusedCardProps) {
  const {height: stageHostHeight, ref: stageHostRef} = useFocusedStageHostHeight()
  const slots = useBuilderStore(selectActiveTeamSlots)
  const activeTeam = useBuilderStore(selectActiveTeam)
  const {ownedAwakenerLevelByName, ownedWheelLevelById} = useCollectionOwnership()
  const setActiveTeamSlots = useBuilderStore((state) => state.setActiveTeamSlots)
  const clearSelection = useBuilderStore((state) => state.clearSelection)
  const slot = slots[slotIndex]
  const slotId = slot.slotId

  const openPicker = useCallback(
    (context: Omit<PickerContext, 'slotId'>) => {
      onOpenPicker({slotId, ...context})
    },
    [onOpenPicker, slotId],
  )

  const handleChangeAwakener = useCallback(() => {
    openPicker({target: 'awakener'})
  }, [openPicker])

  const handleWheelClick = useCallback(
    (wheelIndex: number) => {
      openPicker({target: 'wheel', wheelIndex})
    },
    [openPicker],
  )

  const handleCovenantClick = useCallback(() => {
    openPicker({target: 'covenant'})
  }, [openPicker])

  const handlePosseClick = useCallback(() => {
    openPicker({target: 'posse'})
  }, [openPicker])

  const handleClearSlot = useCallback(() => {
    const nextSlots = clearSlotAssignment(slots, slotId).nextSlots
    clearSelection()
    setActiveTeamSlots(nextSlots)
  }, [clearSelection, setActiveTeamSlots, slotId, slots])

  const posse = activeTeam?.posseId ? posseById.get(activeTeam.posseId) : undefined
  const posseAsset = posse ? getPosseAssetById(posse.id) : undefined
  const awakenerOwnedLevel = getDisplayedAwakenerOwnedLevel(
    slot,
    slot.awakenerName ? (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null) : null,
  )
  const wheelOwnedLevels: WheelOwnedLevels = [
    slot.wheels[0] ? (ownedWheelLevelById.get(slot.wheels[0]) ?? null) : null,
    slot.wheels[1] ? (ownedWheelLevelById.get(slot.wheels[1]) ?? null) : null,
  ]
  const wideStageMetrics = getWideFocusedStageMetrics(stageHostHeight || window.innerHeight)
  const shouldAlignStageToTop = wideStageMetrics.willScroll
  const shouldAllowPageOverflow = stageHostHeight > 0 && wideStageMetrics.willScroll

  return (
    <MobileBuilderScreen
      allowPageOverflow={shouldAllowPageOverflow}
      shellMode={shellMode}
      testId='mobile-focused-shell'
    >
      <FocusedActionBar
        canClearSlot={Boolean(slot.awakenerName)}
        onBack={onBack}
        onClearSlot={handleClearSlot}
        onQuickLineup={onQuickLineup}
      />

      <div
        ref={stageHostRef}
        className={`flex min-h-0 flex-1 flex-col items-center ${
          shouldAlignStageToTop
            ? 'justify-start px-4 py-3'
            : 'justify-center overflow-hidden px-4 py-3'
        }`}
      >
        {slot.awakenerName ? (
          <WideFocusedStage
            awakenerOwnedLevel={awakenerOwnedLevel}
            layout={wideStageMetrics}
            onChangeAwakener={handleChangeAwakener}
            onChangeSlotIndex={onChangeSlotIndex}
            onCovenantClick={handleCovenantClick}
            onPosseClick={handlePosseClick}
            onWheelClick={handleWheelClick}
            posse={posse}
            posseAsset={posseAsset}
            slot={slot}
            slotIndex={slotIndex}
            slots={slots}
            wheelOwnedLevels={wheelOwnedLevels}
          />
        ) : (
          <WideFocusedStage
            layout={wideStageMetrics}
            onChangeAwakener={handleChangeAwakener}
            onChangeSlotIndex={onChangeSlotIndex}
            onPosseClick={handlePosseClick}
            posse={posse}
            posseAsset={posseAsset}
            slotIndex={slotIndex}
            slots={slots}
          />
        )}
      </div>
    </MobileBuilderScreen>
  )
}
