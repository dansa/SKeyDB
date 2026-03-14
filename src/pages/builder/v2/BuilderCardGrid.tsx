import {useCallback} from 'react'

import {AwakenerCard} from '../AwakenerCard'
import {clearSlotAssignment} from '../team-state'
import {useBuilderStore} from './store/builder-store'
import {selectActiveSelection, selectActiveTeamSlots} from './store/selectors'
import {useCollectionOwnership} from './useCollectionOwnership'

export function BuilderCardGrid() {
  const slots = useBuilderStore(selectActiveTeamSlots)
  const activeSelection = useBuilderStore(selectActiveSelection)
  const toggleAwakener = useBuilderStore((s) => s.toggleAwakenerSelection)
  const toggleWheel = useBuilderStore((s) => s.toggleWheelSelection)
  const toggleCovenant = useBuilderStore((s) => s.toggleCovenantSelection)
  const setActiveTeamSlots = useBuilderStore((s) => s.setActiveTeamSlots)
  const {ownedAwakenerLevelByName, ownedWheelLevelById} = useCollectionOwnership()

  const handleCardClick = useCallback(
    (slotId: string) => {
      toggleAwakener(slotId)
    },
    [toggleAwakener],
  )

  const handleWheelSlotClick = useCallback(
    (slotId: string, wheelIndex: number) => {
      toggleWheel(slotId, wheelIndex)
    },
    [toggleWheel],
  )

  const handleCovenantSlotClick = useCallback(
    (slotId: string) => {
      toggleCovenant(slotId)
    },
    [toggleCovenant],
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
      }
    },
    [setActiveTeamSlots],
  )

  return (
    <div className='grid grid-cols-4 gap-4'>
      {slots.map((slot) => (
        <AwakenerCard
          activeKind={activeSelection?.slotId === slot.slotId ? activeSelection.kind : null}
          activeWheelIndex={
            activeSelection?.slotId === slot.slotId && activeSelection.kind === 'wheel'
              ? activeSelection.wheelIndex
              : null
          }
          isActive={activeSelection?.slotId === slot.slotId && activeSelection.kind === 'awakener'}
          key={`${slot.slotId}:${slot.awakenerName ?? 'empty'}`}
          onCardClick={handleCardClick}
          onCovenantSlotClick={handleCovenantSlotClick}
          onRemoveActiveSelection={() => {
            handleRemoveActiveSelection(slot.slotId)
          }}
          onWheelSlotClick={handleWheelSlotClick}
          awakenerOwnedLevel={
            slot.awakenerName ? (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null) : null
          }
          slot={slot}
          wheelOwnedLevels={[
            slot.wheels[0] ? (ownedWheelLevelById.get(slot.wheels[0]) ?? null) : null,
            slot.wheels[1] ? (ownedWheelLevelById.get(slot.wheels[1]) ?? null) : null,
          ]}
        />
      ))}
    </div>
  )
}
