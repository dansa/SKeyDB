import type { ActiveSelection, TeamSlot } from './types'
import { ActiveTeamHeader } from './ActiveTeamHeader'
import { AwakenerCard } from './AwakenerCard'

type BuilderActiveTeamPanelProps = {
  activeTeamName: string
  activePosseAsset?: string
  activePosseName?: string
  teamFactions: Set<string>
  teamSlots: TeamSlot[]
  resolvedActiveSelection: ActiveSelection
  onOpenPossePicker: () => void
  onCardClick: (slotId: string) => void
  onWheelSlotClick: (slotId: string, wheelIndex: number) => void
  onRemoveActiveSelection: (slotId: string) => void
}

export function BuilderActiveTeamPanel({
  activeTeamName,
  activePosseAsset,
  activePosseName,
  teamFactions,
  teamSlots,
  resolvedActiveSelection,
  onOpenPossePicker,
  onCardClick,
  onWheelSlotClick,
  onRemoveActiveSelection,
}: BuilderActiveTeamPanelProps) {
  return (
    <div className="border border-amber-200/35 bg-slate-900/45 p-4">
      <ActiveTeamHeader
        activeTeamName={activeTeamName}
        activePosseAsset={activePosseAsset}
        activePosseName={activePosseName}
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
            isActive={resolvedActiveSelection?.slotId === slot.slotId && resolvedActiveSelection.kind === 'awakener'}
            onCardClick={onCardClick}
            onRemoveActiveSelection={() => onRemoveActiveSelection(slot.slotId)}
            onWheelSlotClick={onWheelSlotClick}
            slot={slot}
          />
        ))}
      </div>
    </div>
  )
}
