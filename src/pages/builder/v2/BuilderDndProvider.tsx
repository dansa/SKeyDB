import type {ReactNode} from 'react'

import {closestCenter, DndContext, DragOverlay} from '@dnd-kit/core'

import {
  PickerAwakenerGhost,
  PickerPosseGhost,
  PickerWheelGhost,
  TeamCardGhost,
  TeamWheelGhost,
} from '../DragGhosts'
import type {DragData} from '../types'
import {useBuilderStore} from './store/builder-store'
import {selectActiveTeamSlots} from './store/selectors'
import {useBuilderV2Dnd} from './useBuilderV2Dnd'
import {useCollectionOwnership} from './useCollectionOwnership'

interface BuilderDndProviderProps {
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
            slot?.awakenerName ? (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null) : null
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

export function BuilderDndProvider({children}: BuilderDndProviderProps) {
  const {
    activeDrag,
    isRemoveIntent,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useBuilderV2Dnd()

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        <DragGhostOverlay activeDrag={activeDrag} isRemoveIntent={isRemoveIntent} />
      </DragOverlay>
    </DndContext>
  )
}
