import { Button } from '../../components/ui/Button'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { FaCheck, FaChevronLeft, FaChevronRight, FaXmark } from 'react-icons/fa6'
import type { ActiveSelection, DragData, PredictedDropHover, QuickLineupSession, TeamSlot } from './types'
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
  teamRealms: Set<string>
  teamSlots: TeamSlot[]
  awakenerLevelByName: Map<string, number>
  ownedAwakenerLevelByName: Map<string, number | null>
  ownedWheelLevelById: Map<string, number | null>
  resolvedActiveSelection: ActiveSelection
  quickLineupSession: QuickLineupSession | null
  activeDragKind?: DragData['kind'] | null
  predictedDropHover?: PredictedDropHover
  onBeginTeamRename: (teamId: string, currentName: string, surface?: 'header' | 'list') => void
  onCommitTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onEditingTeamNameChange: (nextName: string) => void
  onOpenPossePicker: () => void
  onStartQuickLineup: () => void
  onFinishQuickLineup: () => void
  onCancelQuickLineup: () => void
  onBackQuickLineupStep: () => void
  onSkipQuickLineupStep: () => void
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
  teamRealms,
  teamSlots,
  awakenerLevelByName,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  resolvedActiveSelection,
  quickLineupSession,
  activeDragKind = null,
  predictedDropHover = null,
  onBeginTeamRename,
  onCommitTeamRename,
  onCancelTeamRename,
  onEditingTeamNameChange,
  onOpenPossePicker,
  onStartQuickLineup,
  onFinishQuickLineup,
  onCancelQuickLineup,
  onBackQuickLineupStep,
  onSkipQuickLineupStep,
  onCardClick,
  onWheelSlotClick,
  onCovenantSlotClick,
  onRemoveActiveSelection,
}: BuilderActiveTeamPanelProps) {
  const currentQuickLineupLabel = (() => {
    const step = quickLineupSession?.currentStep
    if (!step) {
      return null
    }
    if (step.kind === 'posse') {
      return 'Posse'
    }

    const slot = teamSlots.find((entry) => entry.slotId === step.slotId)
    const slotLabel = `Awakener ${step.slotId.replace('slot-', '')}`
    const awakenerLabel = slot?.awakenerName ? formatAwakenerNameForUi(slot.awakenerName) : `Empty Slot ${step.slotId.replace('slot-', '')}`

    if (step.kind === 'awakener') {
      return slotLabel
    }
    if (step.kind === 'wheel') {
      return `${awakenerLabel} - Wheel ${step.wheelIndex + 1}`
    }
    return `${awakenerLabel} - Covenant`
  })()

  return (
    <div className="px-4 pt-4 pb-1">
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
        teamRealms={Array.from(teamRealms)}
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
            awakenerLevel={
              slot.awakenerName
                ? slot.isSupport
                  ? 90
                  : (awakenerLevelByName.get(slot.awakenerName) ?? 60)
                : 60
            }
            awakenerOwnedLevel={
              slot.awakenerName ? (slot.isSupport ? 15 : (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null)) : null
            }
            wheelOwnedLevels={[
              slot.wheels[0] ? (slot.isSupport ? 15 : (ownedWheelLevelById.get(slot.wheels[0]) ?? null)) : null,
              slot.wheels[1] ? (slot.isSupport ? 15 : (ownedWheelLevelById.get(slot.wheels[1]) ?? null)) : null,
            ]}
            predictedDropHover={predictedDropHover}
            slot={slot}
            allowActiveRemoval={!quickLineupSession}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-end border-t border-slate-500/40 pt-3">
        <div className="flex max-w-full flex-col items-end gap-1.5 text-right">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {quickLineupSession ? (
              <>
                <Button
                  className="h-[26px] px-2 py-1 text-[10px] uppercase tracking-wide"
                  disabled={!quickLineupSession.canGoBack}
                  onClick={onBackQuickLineupStep}
                  type="button"
                >
                  <span className="inline-flex items-center gap-1">
                    <FaChevronLeft aria-hidden className="text-[9px]" />
                    <span>Back</span>
                  </span>
                </Button>
                <Button
                  className="h-[26px] px-2 py-1 text-[10px] uppercase tracking-wide"
                  onClick={onSkipQuickLineupStep}
                  type="button"
                >
                  <span className="inline-flex items-center gap-1">
                    <span>Next</span>
                    <FaChevronRight aria-hidden className="text-[9px]" />
                  </span>
                </Button>
                <Button
                  aria-label="Cancel quick team lineup"
                  className="h-[26px] px-2 py-1 text-[10px] uppercase tracking-wide"
                  onClick={onCancelQuickLineup}
                  title="Cancel quick team lineup"
                  type="button"
                  variant="danger"
                >
                  <span className="inline-flex items-center gap-1">
                    <FaXmark aria-hidden className="text-[9px]" />
                    <span>Cancel</span>
                  </span>
                </Button>
                <Button
                  aria-label="Finish quick team lineup"
                  className="h-[26px] px-2 py-1 text-[10px] uppercase tracking-wide"
                  onClick={onFinishQuickLineup}
                  title="Finish quick team lineup"
                  type="button"
                  variant="success"
                >
                  <span className="inline-flex items-center gap-1">
                    <FaCheck aria-hidden className="text-[9px]" />
                    <span>Finish</span>
                  </span>
                </Button>
              </>
            ) : (
              <Button
                className="h-[26px] px-2 py-1 text-[10px] uppercase tracking-wide"
                onClick={onStartQuickLineup}
                type="button"
              >
                Quick Team Lineup
              </Button>
            )}
          </div>
          <p className="min-h-[1rem] text-[11px] tracking-wide text-slate-300">
            {quickLineupSession
              ? `Step ${quickLineupSession.currentStepIndex + 1} / ${quickLineupSession.totalSteps}: ${currentQuickLineupLabel}`
              : null}
          </p>
        </div>
      </div>
    </div>
  )
}
