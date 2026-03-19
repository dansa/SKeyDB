import {useCallback} from 'react'

import {AwakenerCard} from '../AwakenerCard'
import {clearCovenantAssignment, clearSlotAssignment, clearWheelAssignment} from '../team-state'
import {useBuilderDndState} from './builder-dnd-state'
import {useMeasuredElementSize} from './layout-hooks'
import {useBuilderStore} from './store/builder-store'
import {
  selectActiveSelection,
  selectActiveTeamSlots,
  selectIsQuickLineupActive,
} from './store/selectors'
import {getDisplayedAwakenerOwnedLevel} from './support-display'
import {resolveTabletBuilderCardHeightScale} from './tablet-layout-metrics'
import {useCollectionOwnership} from './useCollectionOwnership'

interface BuilderCardGridProps {
  availableHeight?: number
  compact?: boolean
}

export function BuilderCardGrid({availableHeight = 0, compact = false}: BuilderCardGridProps) {
  const slots = useBuilderStore(selectActiveTeamSlots)
  const activeSelection = useBuilderStore(selectActiveSelection)
  const isQuickLineupActive = useBuilderStore(selectIsQuickLineupActive)
  const toggleAwakener = useBuilderStore((s) => s.toggleAwakenerSelection)
  const toggleWheel = useBuilderStore((s) => s.toggleWheelSelection)
  const toggleCovenant = useBuilderStore((s) => s.toggleCovenantSelection)
  const clearSelection = useBuilderStore((s) => s.clearSelection)
  const jumpToQuickLineupStep = useBuilderStore((s) => s.jumpToQuickLineupStep)
  const setActiveTeamSlots = useBuilderStore((s) => s.setActiveTeamSlots)
  const {ownedAwakenerLevelByName, ownedWheelLevelById} = useCollectionOwnership()
  const {ref: gridRef, width: gridWidth} = useMeasuredElementSize()
  const {activeDragKind, predictedDropHover} = useBuilderDndState()
  const cardHeightScale =
    compact && gridWidth > 0 && availableHeight > 0
      ? resolveTabletBuilderCardHeightScale({
          availableHeight,
          gridWidth,
        })
      : 1

  const handleCardClick = useCallback(
    (slotId: string) => {
      if (isQuickLineupActive) {
        jumpToQuickLineupStep({kind: 'awakener', slotId})
        return
      }
      toggleAwakener(slotId)
    },
    [isQuickLineupActive, jumpToQuickLineupStep, toggleAwakener],
  )

  const handleWheelSlotClick = useCallback(
    (slotId: string, wheelIndex: number) => {
      if (isQuickLineupActive) {
        jumpToQuickLineupStep({kind: 'wheel', slotId, wheelIndex})
        return
      }
      toggleWheel(slotId, wheelIndex)
    },
    [isQuickLineupActive, jumpToQuickLineupStep, toggleWheel],
  )

  const handleCovenantSlotClick = useCallback(
    (slotId: string) => {
      if (isQuickLineupActive) {
        jumpToQuickLineupStep({kind: 'covenant', slotId})
        return
      }
      toggleCovenant(slotId)
    },
    [isQuickLineupActive, jumpToQuickLineupStep, toggleCovenant],
  )

  const handleRemoveActiveSelection = useCallback(
    (slotId: string) => {
      const state = useBuilderStore.getState()
      const sel = state.activeSelection
      if (sel?.slotId !== slotId) return

      const team = state.teams.find((t) => t.id === state.activeTeamId)
      if (!team) return

      if (sel.kind === 'awakener') {
        const result = clearSlotAssignment(team.slots, slotId)
        setActiveTeamSlots(result.nextSlots)
        clearSelection()
        return
      }

      if (sel.kind === 'wheel') {
        const result = clearWheelAssignment(team.slots, slotId, sel.wheelIndex)
        setActiveTeamSlots(result.nextSlots)
        clearSelection()
        return
      }

      const result = clearCovenantAssignment(team.slots, slotId)
      setActiveTeamSlots(result.nextSlots)
      clearSelection()
    },
    [clearSelection, setActiveTeamSlots],
  )

  return (
    <div
      className={`grid grid-cols-4 ${compact ? 'gap-2' : 'gap-4'}`}
      data-builder-card-height-scale={compact ? cardHeightScale.toFixed(2) : undefined}
      data-builder-grid-columns='4'
      data-builder-grid-density={compact ? 'compact' : 'default'}
      data-testid='builder-card-grid'
      ref={gridRef}
    >
      {slots.map((slot) => (
        <AwakenerCard
          activeKind={activeSelection?.slotId === slot.slotId ? activeSelection.kind : null}
          activeDragKind={activeDragKind}
          activeWheelIndex={
            activeSelection?.slotId === slot.slotId && activeSelection.kind === 'wheel'
              ? activeSelection.wheelIndex
              : null
          }
          cardHeightScale={compact ? cardHeightScale : 1}
          isActive={activeSelection?.slotId === slot.slotId && activeSelection.kind === 'awakener'}
          key={`${slot.slotId}:${slot.awakenerName ?? 'empty'}`}
          onCardClick={handleCardClick}
          onCovenantSlotClick={handleCovenantSlotClick}
          onRemoveActiveSelection={() => {
            handleRemoveActiveSelection(slot.slotId)
          }}
          onWheelSlotClick={handleWheelSlotClick}
          allowActiveRemoval={!isQuickLineupActive}
          awakenerOwnedLevel={getDisplayedAwakenerOwnedLevel(
            slot,
            slot.awakenerName ? (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null) : null,
          )}
          slot={slot}
          predictedDropHover={predictedDropHover}
          wheelOwnedLevels={[
            slot.wheels[0] ? (ownedWheelLevelById.get(slot.wheels[0]) ?? null) : null,
            slot.wheels[1] ? (ownedWheelLevelById.get(slot.wheels[1]) ?? null) : null,
          ]}
        />
      ))}
    </div>
  )
}
