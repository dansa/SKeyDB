import {DragOverlay} from '@dnd-kit/core'

import {
  PickerAwakenerGhost,
  PickerPosseGhost,
  PickerWheelGhost,
  TeamCardGhost,
  TeamPreviewGhost,
  TeamWheelGhost,
} from './DragGhosts'
import type {DragData, Team, TeamPreviewMode, TeamSlot} from './types'

interface BuilderDragOverlayProps {
  activeDrag: DragData | null
  isRemoveIntent: boolean
  teamPreviewMode: TeamPreviewMode
  previewDraggedTeam: Team | null
  previewDraggedSlot: TeamSlot | undefined
  isPreviewRemoveIntent: boolean
  slotById: Map<string, TeamSlot>
  ownedAwakenerLevelByName: Map<string, number | null>
  ownedWheelLevelById: Map<string, number | null>
}

export function BuilderDragOverlay({
  activeDrag,
  isRemoveIntent,
  teamPreviewMode,
  previewDraggedTeam,
  previewDraggedSlot,
  isPreviewRemoveIntent,
  slotById,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
}: BuilderDragOverlayProps) {
  const activeDraggedSlot =
    activeDrag?.kind === 'team-slot' ? slotById.get(activeDrag.slotId) : undefined
  const activeDraggedAwakenerOwnedLevel = activeDraggedSlot?.awakenerName
    ? (ownedAwakenerLevelByName.get(activeDraggedSlot.awakenerName) ?? null)
    : null
  const activeDraggedWheelOwnedLevels: [number | null, number | null] = [
    activeDraggedSlot?.wheels[0]
      ? (ownedWheelLevelById.get(activeDraggedSlot.wheels[0]) ?? null)
      : null,
    activeDraggedSlot?.wheels[1]
      ? (ownedWheelLevelById.get(activeDraggedSlot.wheels[1]) ?? null)
      : null,
  ]

  return (
    <DragOverlay dropAnimation={null}>
      {previewDraggedSlot && previewDraggedTeam ? (
        <TeamPreviewGhost
          mode={teamPreviewMode}
          ownedAwakenerLevelByName={ownedAwakenerLevelByName}
          ownedWheelLevelById={ownedWheelLevelById}
          removeIntent={isPreviewRemoveIntent}
          team={{
            ...previewDraggedTeam,
            slots: [previewDraggedSlot],
          }}
        />
      ) : null}
      {activeDrag?.kind === 'picker-awakener' ? (
        <PickerAwakenerGhost awakenerName={activeDrag.awakenerName} />
      ) : null}
      {activeDrag?.kind === 'picker-wheel' ? (
        <PickerWheelGhost wheelId={activeDrag.wheelId} />
      ) : null}
      {activeDrag?.kind === 'picker-covenant' ? (
        <PickerWheelGhost wheelId={activeDrag.covenantId} isCovenant />
      ) : null}
      {activeDrag?.kind === 'picker-posse' ? (
        <PickerPosseGhost posseId={activeDrag.posseId} posseName={activeDrag.posseName} />
      ) : null}
      {activeDrag?.kind === 'team-slot' ? (
        <TeamCardGhost
          removeIntent={isRemoveIntent}
          slot={activeDraggedSlot}
          awakenerOwnedLevel={activeDraggedAwakenerOwnedLevel}
          wheelOwnedLevels={activeDraggedWheelOwnedLevels}
        />
      ) : null}
      {activeDrag?.kind === 'team-wheel' ? (
        <TeamWheelGhost
          removeIntent={isRemoveIntent}
          wheelId={activeDrag.wheelId}
          ownedLevel={ownedWheelLevelById.get(activeDrag.wheelId) ?? null}
        />
      ) : null}
      {activeDrag?.kind === 'team-covenant' ? (
        <TeamWheelGhost removeIntent={isRemoveIntent} wheelId={activeDrag.covenantId} isCovenant />
      ) : null}
    </DragOverlay>
  )
}
