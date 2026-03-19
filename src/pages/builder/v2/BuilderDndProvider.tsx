import {useMemo, useState, type ReactNode} from 'react'

import {closestCenter, DndContext, DragOverlay} from '@dnd-kit/core'

import {
  PickerAwakenerGhost,
  PickerPosseGhost,
  PickerWheelGhost,
  TeamCardGhost,
  TeamWheelGhost,
} from '../DragGhosts'
import {resolvePredictedDropHover} from '../predicted-drop-hover'
import type {DragData} from '../types'
import {BuilderDndStateProvider} from './BuilderDndStateContext'
import {useBuilderStore} from './store/builder-store'
import {selectActiveTeamSlots} from './store/selectors'
import {getDisplayedAwakenerOwnedLevel} from './support-display'
import type {BuilderV2ActionsResult} from './useBuilderV2Actions'
import {useBuilderV2Dnd} from './useBuilderV2Dnd'
import {useCollectionOwnership} from './useCollectionOwnership'

interface BuilderDndProviderProps {
  actions: Pick<
    BuilderV2ActionsResult,
    | 'handleDropPickerAwakener'
    | 'handleDropPickerCovenant'
    | 'handleDropPickerWheel'
    | 'handleDropTeamCovenant'
    | 'handleDropTeamCovenantToSlot'
    | 'handleDropTeamWheel'
    | 'handleDropTeamWheelToSlot'
    | 'handleSetActivePosse'
  >
  children: ReactNode
}

function DragGhostOverlay({
  activeDrag,
  isRemoveIntent,
}: {
  activeDrag: DragData | null
  isRemoveIntent: boolean
}) {
  const slots = useBuilderStore(selectActiveTeamSlots)
  const {ownedAwakenerLevelByName, ownedWheelLevelById} = useCollectionOwnership()

  if (!activeDrag) return null

  switch (activeDrag.kind) {
    case 'picker-awakener':
      return <PickerAwakenerGhost awakenerName={activeDrag.awakenerName} />
    case 'picker-wheel':
      return <PickerWheelGhost wheelId={activeDrag.wheelId} />
    case 'picker-covenant':
      return <PickerWheelGhost isCovenant wheelId={activeDrag.covenantId} />
    case 'picker-posse':
      return <PickerPosseGhost posseId={activeDrag.posseId} posseName={activeDrag.posseName} />
    case 'team-slot': {
      const slot = slots.find((s) => s.slotId === activeDrag.slotId)
      return (
        <TeamCardGhost
          awakenerOwnedLevel={
            slot
              ? getDisplayedAwakenerOwnedLevel(
                  slot,
                  slot.awakenerName
                    ? (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null)
                    : null,
                )
              : null
          }
          removeIntent={isRemoveIntent}
          slot={slot}
          wheelOwnedLevels={[
            slot?.wheels[0] ? (ownedWheelLevelById.get(slot.wheels[0]) ?? null) : null,
            slot?.wheels[1] ? (ownedWheelLevelById.get(slot.wheels[1]) ?? null) : null,
          ]}
        />
      )
    }
    case 'team-wheel':
      return (
        <TeamWheelGhost
          ownedLevel={ownedWheelLevelById.get(activeDrag.wheelId) ?? null}
          removeIntent={isRemoveIntent}
          wheelId={activeDrag.wheelId}
        />
      )
    case 'team-covenant':
      return (
        <TeamWheelGhost isCovenant removeIntent={isRemoveIntent} wheelId={activeDrag.covenantId} />
      )
    case 'team-row':
      return null
    default:
      return null
  }
}

export function BuilderDndProvider({actions, children}: BuilderDndProviderProps) {
  const slots = useBuilderStore(selectActiveTeamSlots)
  const {
    activeDrag,
    isRemoveIntent,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useBuilderV2Dnd(actions)
  const [predictedDropHover, setPredictedDropHover] =
    useState<ReturnType<typeof resolvePredictedDropHover>>(null)
  const slotById = useMemo(() => new Map(slots.map((slot) => [slot.slotId, slot])), [slots])
  const dndState = useMemo(
    () => ({
      activeDragKind: activeDrag?.kind ?? null,
      predictedDropHover,
    }),
    [activeDrag?.kind, predictedDropHover],
  )

  function handleWrappedDragStart(event: Parameters<typeof handleDragStart>[0]) {
    setPredictedDropHover(null)
    handleDragStart(event)
  }

  function handleWrappedDragOver(event: Parameters<typeof handleDragOver>[0]) {
    const overId = typeof event.over?.id === 'string' ? event.over.id : undefined
    const dragData = event.active.data.current as DragData | undefined
    setPredictedDropHover(resolvePredictedDropHover(dragData, overId, slotById))
    handleDragOver(event)
  }

  function handleWrappedDragEnd(event: Parameters<typeof handleDragEnd>[0]) {
    setPredictedDropHover(null)
    handleDragEnd(event)
  }

  function handleWrappedDragCancel() {
    setPredictedDropHover(null)
    handleDragCancel()
  }

  return (
    <BuilderDndStateProvider value={dndState}>
      <DndContext
        autoScroll={false}
        collisionDetection={closestCenter}
        onDragCancel={handleWrappedDragCancel}
        onDragEnd={handleWrappedDragEnd}
        onDragOver={handleWrappedDragOver}
        onDragStart={handleWrappedDragStart}
        sensors={sensors}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          <DragGhostOverlay activeDrag={activeDrag} isRemoveIntent={isRemoveIntent} />
        </DragOverlay>
      </DndContext>
    </BuilderDndStateProvider>
  )
}
