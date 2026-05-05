import {BuilderTeamSlotPreview} from './BuilderTeamSlotPreview'
import type {TeamPreviewMode, TeamSlot} from './types'

const EMPTY_OWNERSHIP_MAP = new Map<string, number | null>()

export function BuilderTeamPreviewStrip({
  teamId,
  slots,
  mode,
  ownedAwakenerLevelByName = EMPTY_OWNERSHIP_MAP,
  ownedWheelLevelById = EMPTY_OWNERSHIP_MAP,
  className = '',
  enableDragAndDrop = false,
}: {
  teamId: string
  slots: TeamSlot[]
  mode: TeamPreviewMode
  ownedAwakenerLevelByName?: Map<string, number | null>
  ownedWheelLevelById?: Map<string, number | null>
  className?: string
  enableDragAndDrop?: boolean
}) {
  return (
    <div
      className={`${mode === 'expanded' ? 'builder-team-preview-grid-expanded' : 'flex gap-1.5'} ${className}`.trim()}
    >
      {slots.map((slot, index) => (
        <BuilderTeamSlotPreview
          key={`${teamId}-${slot.slotId}`}
          slotIndex={index}
          mode={mode}
          ownedAwakenerLevelByName={ownedAwakenerLevelByName}
          ownedWheelLevelById={ownedWheelLevelById}
          slot={slot}
          teamId={teamId}
          enableDragAndDrop={enableDragAndDrop}
        />
      ))}
    </div>
  )
}
