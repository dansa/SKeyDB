import type { ActiveSelection, DragData, PredictedDropHover, TeamSlot } from './types'
import { ActiveTeamHeader } from './ActiveTeamHeader'
import { AwakenerCard } from './AwakenerCard'

type BuilderActiveTeamPanelProps = {
  activeTeamId: string
  activeTeamName: string
  isEditingTeamName: boolean
  editingTeamName: string
  activePosseAsset?: string
  activePosseName?: string
  isActivePosseOwned: boolean
  teamFactions: Set<string>
  teamSlots: TeamSlot[]
  awakenerLevelByName: Map<string, number>
  ownedAwakenerLevelByName: Map<string, number | null>
  ownedWheelLevelById: Map<string, number | null>
  resolvedActiveSelection: ActiveSelection
  activeDragKind?: DragData['kind'] | null
  predictedDropHover?: PredictedDropHover
  onBeginTeamRename: (teamId: string, currentName: string, surface?: 'header' | 'list') => void
  onCommitTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onEditingTeamNameChange: (nextName: string) => void
  onOpenPossePicker: () => void
  onCardClick: (slotId: string) => void
  onWheelSlotClick: (slotId: string, wheelIndex: number) => void
  onCovenantSlotClick: (slotId: string) => void
  onRemoveActiveSelection: (slotId: string) => void
}

export function BuilderActiveTeamPanel({
  activeTeamId,
  activeTeamName,
  isEditingTeamName,
  editingTeamName,
  activePosseAsset,
  activePosseName,
  isActivePosseOwned,
  teamFactions,
  teamSlots,
  awakenerLevelByName,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  resolvedActiveSelection,
  activeDragKind = null,
  predictedDropHover = null,
  onBeginTeamRename,
  onCommitTeamRename,
  onCancelTeamRename,
  onEditingTeamNameChange,
  onOpenPossePicker,
  onCardClick,
  onWheelSlotClick,
  onCovenantSlotClick,
  onRemoveActiveSelection,
}: BuilderActiveTeamPanelProps) {
  return (
    <div className="p-4">
      <ActiveTeamHeader
        activeTeamId={activeTeamId}
        activeTeamName={activeTeamName}
        isEditingTeamName={isEditingTeamName}
        editingTeamName={editingTeamName}
        activePosseAsset={activePosseAsset}
        activePosseName={activePosseName}
        isActivePosseOwned={isActivePosseOwned}
        onBeginTeamRename={onBeginTeamRename}
        onCommitTeamRename={onCommitTeamRename}
        onCancelTeamRename={onCancelTeamRename}
        onEditingTeamNameChange={onEditingTeamNameChange}
        onOpenPossePicker={onOpenPossePicker}
        teamFactions={Array.from(teamFactions)}
      />

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {teamSlots.map((slot) => (
          <AwakenerCard
            key={`${slot.slotId}:${slot.awakenerName ?? 'empty'}`}
            activeKind={resolvedActiveSelection?.slotId === slot.slotId ? resolvedActiveSelection.kind : null}
            activeWheelIndex={
              resolvedActiveSelection?.slotId === slot.slotId && resolvedActiveSelection.kind === 'wheel'
                ? resolvedActiveSelection.wheelIndex
                : null
            }
            activeDragKind={activeDragKind}
            isActive={resolvedActiveSelection?.slotId === slot.slotId && resolvedActiveSelection.kind === 'awakener'}
            onCardClick={onCardClick}
            onCovenantSlotClick={onCovenantSlotClick}
            onRemoveActiveSelection={() => onRemoveActiveSelection(slot.slotId)}
            onWheelSlotClick={onWheelSlotClick}
            awakenerLevel={slot.awakenerName ? (awakenerLevelByName.get(slot.awakenerName) ?? 60) : 60}
            awakenerOwnedLevel={
              slot.awakenerName ? (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null) : null
            }
            wheelOwnedLevels={[
              slot.wheels[0] ? (ownedWheelLevelById.get(slot.wheels[0]) ?? null) : null,
              slot.wheels[1] ? (ownedWheelLevelById.get(slot.wheels[1]) ?? null) : null,
            ]}
            predictedDropHover={predictedDropHover}
            slot={slot}
          />
        ))}
      </div>
    </div>
  )
}
