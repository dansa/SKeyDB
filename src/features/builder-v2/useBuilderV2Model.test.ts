import {act, renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import './builder-v2-test-mocks'

import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import {builderDraftStore} from '@/stores/builderDraftStore'

import {createEmptyTeamSlots} from '../builder/constants'
import {useBuilderV2Model} from './useBuilderV2Model'

function getAssignedIdentityCount(awakenerIds: (string | undefined)[], targetId: string) {
  const targetIdentity = getAwakenerIdentityKeyById(targetId)
  return awakenerIds.filter(
    (awakenerId) => awakenerId && getAwakenerIdentityKeyById(awakenerId) === targetIdentity,
  ).length
}

describe('useBuilderV2Model', () => {
  it('initializes one active team with four slots', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    expect(result.current.activeTeamName).toBe('Team 1')
    expect(result.current.teams).toHaveLength(1)
    expect(result.current.slots).toHaveLength(4)
    expect(result.current.slots.every((slot) => slot.isEmpty)).toBe(true)
  })

  it('adds teams up to the max and activates the newly added team', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.addTeam()
    })

    expect(result.current.teams).toHaveLength(2)
    expect(result.current.activeTeamName).toBe('Team 2')
    expect(result.current.canAddTeam).toBe(true)

    act(() => {
      for (let index = 0; index < 8; index += 1) {
        result.current.addTeam()
      }
    })

    expect(result.current.teams).toHaveLength(result.current.maxTeams)
    expect(result.current.teams.at(-1)?.name).toBe('Team 10')
    expect(result.current.activeTeamName).toBe('Team 10')
    expect(result.current.canAddTeam).toBe(false)
  })

  it('renames teams with commit, cancel, blur, and blank-name no-op behavior', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.addTeam()
    })
    const teamTwoId = result.current.activeTeamId

    act(() => {
      result.current.beginTeamRename(teamTwoId)
      result.current.setEditingTeamName('Arena Team')
      result.current.commitTeamRename(teamTwoId)
    })

    expect(result.current.activeTeamName).toBe('Arena Team')
    expect(result.current.editingTeamId).toBeNull()

    act(() => {
      result.current.beginTeamRename(teamTwoId)
      result.current.setEditingTeamName('Temp Team')
      result.current.cancelTeamRename()
    })

    expect(result.current.activeTeamName).toBe('Arena Team')

    act(() => {
      result.current.beginTeamRename(teamTwoId)
      result.current.setEditingTeamName('   ')
      result.current.commitTeamRename(teamTwoId)
    })

    expect(result.current.activeTeamName).toBe('Arena Team')

    act(() => {
      result.current.beginTeamRename(teamTwoId)
      result.current.setEditingTeamName('Blur Team')
      result.current.commitTeamRename(teamTwoId)
    })

    expect(result.current.activeTeamName).toBe('Blur Team')
  })

  it('deletes empty teams directly and requires confirmation before deleting non-empty teams', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.addTeam()
    })
    const emptyTeamId = result.current.activeTeamId

    act(() => {
      result.current.requestDeleteTeam(emptyTeamId)
    })

    expect(result.current.teams).toHaveLength(1)
    expect(result.current.teamActionDialog).toBeNull()

    act(() => {
      result.current.addTeam()
      result.current.assignAwakener('awakener-0021')
    })
    const filledTeamId = result.current.activeTeamId

    act(() => {
      result.current.setActiveTeam('team-1')
      result.current.requestDeleteTeam(filledTeamId)
    })

    expect(result.current.teamActionDialog?.title).toBe('Delete Team 2')
    expect(result.current.teams).toHaveLength(2)

    act(() => {
      result.current.cancelTeamAction()
    })

    expect(result.current.teamActionDialog).toBeNull()
    expect(result.current.teams).toHaveLength(2)

    act(() => {
      result.current.requestDeleteTeam(filledTeamId)
    })
    act(() => {
      result.current.teamActionDialog?.onConfirm()
    })

    expect(result.current.teams).toHaveLength(1)
    expect(result.current.teams[0]?.name).toBe('Team 1')
  })

  it('requires confirmation before resetting a non-empty team', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })
    act(() => {
      result.current.requestResetTeam(result.current.activeTeamId)
    })

    expect(result.current.teamActionDialog?.title).toBe('Reset Team 1')
    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')

    act(() => {
      result.current.cancelTeamAction()
    })

    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')

    act(() => {
      result.current.requestResetTeam(result.current.activeTeamId)
    })
    act(() => {
      result.current.teamActionDialog?.onConfirm()
    })

    expect(result.current.teamActionDialog).toBeNull()
    expect(result.current.slots.every((slot) => slot.awakener === null)).toBe(true)
  })

  it('resets empty teams directly without opening a confirmation dialog', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.requestResetTeam(result.current.activeTeamId)
    })

    expect(result.current.teamActionDialog).toBeNull()
    expect(result.current.teams).toHaveLength(1)
    expect(result.current.activeTeamName).toBe('Team 1')
    expect(result.current.slots.every((slot) => slot.awakener === null)).toBe(true)
  })

  it('confirms D-Tide templates before applying team layout changes', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.requestApplyTeamTemplate('DTIDE_5')
    })

    expect(result.current.teamActionDialog?.title).toBe('Apply D-Tide 5')
    expect(result.current.teams).toHaveLength(1)

    act(() => {
      result.current.teamActionDialog?.onConfirm()
    })

    expect(result.current.teams).toHaveLength(5)
    expect(result.current.teams.map((team) => team.name)).toEqual([
      'Wave 1',
      'Wave 2',
      'Wave 3',
      'Wave 4',
      'Wave 5',
    ])

    act(() => {
      result.current.requestApplyTeamTemplate('DTIDE_10')
    })
    act(() => {
      result.current.teamActionDialog?.onConfirm()
    })

    expect(result.current.teams).toHaveLength(10)
    expect(result.current.teams.at(1)?.name).toBe('Wave 1 Extra')
    expect(result.current.teams.at(-1)?.name).toBe('Wave 5 Extra')
  })

  it('reorders teams with accessible up/down semantics while preserving the active team', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.addTeam()
      result.current.addTeam()
    })
    const activeTeamId = result.current.activeTeamId

    act(() => {
      result.current.moveTeamUp(activeTeamId)
    })

    expect(result.current.teams.map((team) => team.name)).toEqual(['Team 1', 'Team 3', 'Team 2'])
    expect(result.current.activeTeamId).toBe(activeTeamId)

    act(() => {
      result.current.moveTeamDown(activeTeamId)
    })

    expect(result.current.teams.map((team) => team.name)).toEqual(['Team 1', 'Team 2', 'Team 3'])
    expect(result.current.activeTeamId).toBe(activeTeamId)
  })

  it('assigns an awakener to the first empty slot', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })

    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.selectedSlotId).toBe('slot-1')
  })

  it('assigns an awakener to the selected slot', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.selectAwakenerSlot('slot-3')
    })
    act(() => {
      result.current.assignAwakener('awakener-0007')
    })

    expect(result.current.slots[2]?.awakener?.id).toBe('awakener-0007')
    expect(result.current.selectedSlotId).toBe('slot-3')
  })

  it('removes an awakener and clears that slot loadout', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(
        result.current.slots.map((slot, index) =>
          index === 0
            ? {
                slotId: slot.slotId,
                awakenerId: 'awakener-0021',
                realm: 'CHAOS',
                level: 70,
                wheels: ['wheel-0050', 'wheel-0051'] as [string | null, string | null],
                covenantId: 'c01',
              }
            : {
                slotId: slot.slotId,
                wheels: [null, null] as [string | null, string | null],
              },
        ),
      )
    })

    act(() => {
      result.current.removeAwakener('slot-1')
    })

    expect(result.current.slots[0]?.awakener).toBeNull()
    expect(result.current.slots[0]?.wheels).toEqual([null, null])
    expect(result.current.slots[0]?.covenantId).toBeUndefined()
    expect(result.current.selectedSlotId).toBe('slot-1')
  })

  it('moves alternate identities instead of adding duplicate copies', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0042')
    })
    act(() => {
      result.current.selectAwakenerSlot('slot-2')
    })
    act(() => {
      result.current.assignAwakener('awakener-0020')
    })

    const assignedIds = result.current.slots.map((slot) => slot.awakener?.id)
    expect(getAssignedIdentityCount(assignedIds, 'awakener-0042')).toBe(1)
    expect(result.current.slots[0]?.awakener).toBeNull()
    expect(result.current.slots[1]?.awakener?.id).toBe('awakener-0020')
  })

  it('opens a transfer dialog before moving an awakener from another team', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: teamOneSlots},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })

    expect(result.current.transferDialog?.title).toBe('Move Goliath')
    expect(result.current.slots.every((slot) => slot.awakener === null)).toBe(true)
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.awakenerId).toBe('awakener-0021')

    act(() => {
      result.current.cancelTransfer()
    })

    expect(result.current.transferDialog).toBeNull()
    expect(result.current.slots.every((slot) => slot.awakener === null)).toBe(true)
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.awakenerId).toBe('awakener-0021')
  })

  it('confirms an awakener transfer and clears the source team slot', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: teamOneSlots},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })

    act(() => {
      result.current.selectAwakenerSlot('slot-2')
    })
    act(() => {
      result.current.assignAwakener('awakener-0021')
    })
    act(() => {
      result.current.transferDialog?.onConfirm()
    })

    expect(result.current.transferDialog).toBeNull()
    expect(result.current.slots[1]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.awakenerId).toBeUndefined()
  })

  it('can use a transferred awakener as support without clearing the source team', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: teamOneSlots},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })

    expect(result.current.transferDialog?.supportLabel).toBe('Use as Support')

    act(() => {
      result.current.transferDialog?.onSupport?.()
    })

    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.slots[0]?.awakener?.isSupport).toBe(true)
    expect(result.current.slots[0]?.awakener?.level).toBe(90)
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.awakenerId).toBe('awakener-0021')
  })

  it('assigns a wheel to the selected wheel socket', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })
    act(() => {
      result.current.selectWheelSlot('slot-1', 1)
    })
    act(() => {
      result.current.assignWheel('wheel-0050')
    })

    expect(result.current.slots[0]?.wheels).toEqual([null, 'wheel-0050'])
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 1})
  })

  it('fills the first empty wheel socket when an awakener slot is active', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })
    act(() => {
      result.current.assignWheel('wheel-0050')
    })
    act(() => {
      result.current.assignWheel('wheel-0051')
    })

    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0050', 'wheel-0051'])
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
  })

  it('moves a wheel within the active team instead of duplicating it', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots()
    slots[0] = {
      ...slots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }
    slots[1] = {
      ...slots[1],
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      level: 60,
    }

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    act(() => {
      result.current.selectWheelSlot('slot-1', 0)
    })
    act(() => {
      result.current.assignWheel('wheel-0050')
    })
    act(() => {
      result.current.selectWheelSlot('slot-2', 1)
    })
    act(() => {
      result.current.assignWheel('wheel-0050')
    })

    expect(result.current.slots[0]?.wheels).toEqual([null, null])
    expect(result.current.slots[1]?.wheels).toEqual([null, 'wheel-0050'])
  })

  it('confirms a wheel transfer and clears the source wheel socket', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = {
      ...teamOneSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      level: 60,
      wheels: ['wheel-0050', null],
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: teamOneSlots},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })
    act(() => {
      result.current.selectWheelSlot('slot-1', 0)
    })
    act(() => {
      result.current.assignWheel('wheel-0050')
    })

    expect(result.current.transferDialog?.title).toBe('Move Merciful Nurturing')
    expect(result.current.slots[0]?.wheels).toEqual([null, null])
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.wheels).toEqual(['wheel-0050', null])

    act(() => {
      result.current.transferDialog?.onConfirm()
    })

    expect(result.current.transferDialog).toBeNull()
    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.wheels).toEqual([null, null])
  })

  it('assigns and clears a covenant on a selected slot', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })
    act(() => {
      result.current.selectCovenantSlot('slot-1')
    })
    act(() => {
      result.current.assignCovenant('c01')
    })

    expect(result.current.slots[0]?.covenantId).toBe('c01')
    expect(result.current.slots[0]?.covenantName).toBe('Deus Ex Machina')

    act(() => {
      result.current.clearCovenant('slot-1')
    })

    expect(result.current.slots[0]?.covenantId).toBeUndefined()
    expect(result.current.activeSelection).toEqual({kind: 'covenant', slotId: 'slot-1'})
  })

  it('keeps repeated wheel and covenant assignments quiet', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })
    act(() => {
      result.current.selectWheelSlot('slot-1', 0)
    })
    act(() => {
      result.current.assignWheel('wheel-0050')
    })
    act(() => {
      result.current.assignWheel('wheel-0050')
    })

    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.violationMessage).toBeNull()

    act(() => {
      result.current.selectCovenantSlot('slot-1')
    })
    act(() => {
      result.current.assignCovenant('c01')
    })
    act(() => {
      result.current.assignCovenant('c01')
    })

    expect(result.current.slots[0]?.covenantId).toBe('c01')
    expect(result.current.violationMessage).toBeNull()
  })

  it('assigns and clears the active team posse', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.selectPosse()
    })
    act(() => {
      result.current.assignPosse('posse-0033')
    })

    expect(result.current.activePosse?.name).toBe('Taverns Opening')
    expect(builderDraftStore.getState().teams[0]?.posseId).toBe('posse-0033')

    act(() => {
      result.current.clearPosse()
    })

    expect(result.current.activePosse).toBeNull()
    expect(builderDraftStore.getState().teams[0]?.posseId).toBeUndefined()
  })

  it('confirms a posse transfer and clears the source team posse', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: createEmptyTeamSlots(), posseId: 'posse-0033'},
        ],
      })
    })
    act(() => {
      result.current.selectPosse()
    })
    act(() => {
      result.current.assignPosse('posse-0033')
    })

    expect(result.current.transferDialog?.title).toBe('Move Taverns Opening')
    expect(builderDraftStore.getState().teams[0]?.posseId).toBeUndefined()
    expect(builderDraftStore.getState().teams[1]?.posseId).toBe('posse-0033')

    act(() => {
      result.current.transferDialog?.onConfirm()
    })

    expect(result.current.transferDialog).toBeNull()
    expect(builderDraftStore.getState().teams[0]?.posseId).toBe('posse-0033')
    expect(builderDraftStore.getState().teams[1]?.posseId).toBeUndefined()
    expect(result.current.activeTeamTarget).toEqual({kind: 'posse'})
  })

  it('waits to advance quick lineup until a cross-team transfer is confirmed', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })
    act(() => {
      result.current.startQuickLineup()
    })
    act(() => {
      result.current.assignAwakener('awakener-0021')
    })

    expect(result.current.transferDialog?.title).toBe('Move Goliath')
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-1',
    })
    expect(result.current.slots[0]?.awakener).toBeNull()

    act(() => {
      result.current.transferDialog?.onConfirm()
    })

    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.awakenerId).toBeUndefined()
  })

  it('runs quick lineup through awakener and loadout assignment steps', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.startQuickLineup()
    })

    expect(result.current.quickLineupSession?.currentStepIndex).toBe(0)
    expect(result.current.quickLineupSession?.totalSteps).toBe(17)
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
    expect(result.current.slots.every((slot) => slot.awakener === null)).toBe(true)

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})

    act(() => {
      result.current.assignWheel('wheel-0050')
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 1,
    })

    act(() => {
      result.current.assignWheel('wheel-0051')
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'covenant',
      slotId: 'slot-1',
    })
    expect(result.current.pickerTab).toBe('covenants')

    act(() => {
      result.current.assignCovenant('c01')
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })
    expect(result.current.pickerTab).toBe('awakeners')
  })

  it('restores the original active team when quick lineup is canceled', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })
    act(() => {
      result.current.selectPosse()
    })
    act(() => {
      result.current.assignPosse('posse-0033')
    })

    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.activePosse?.id).toBe('posse-0033')

    act(() => {
      result.current.startQuickLineup()
    })

    expect(result.current.slots.every((slot) => slot.awakener === null)).toBe(true)
    expect(result.current.activePosse).toBeNull()

    act(() => {
      result.current.cancelQuickLineup()
    })

    expect(result.current.quickLineupSession).toBeNull()
    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.activePosse?.id).toBe('posse-0033')
  })

  it('jumps quick-lineup focus when selecting a different target manually', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.startQuickLineup()
    })
    act(() => {
      result.current.skipQuickLineupStep()
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })

    act(() => {
      result.current.selectWheelSlot('slot-1', 1)
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 1,
    })
    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 1})
  })

  it('completes quick lineup after assigning the final posse step', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.startQuickLineup()
    })
    act(() => {
      result.current.skipQuickLineupStep()
    })
    act(() => {
      result.current.skipQuickLineupStep()
    })
    act(() => {
      result.current.skipQuickLineupStep()
    })
    act(() => {
      result.current.skipQuickLineupStep()
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({kind: 'posse'})
    expect(result.current.pickerTab).toBe('posses')
    expect(result.current.activeTeamTarget).toEqual({kind: 'posse'})

    act(() => {
      result.current.assignPosse('posse-0033')
    })

    expect(result.current.quickLineupSession).toBeNull()
    expect(result.current.activePosse?.id).toBe('posse-0033')
    expect(result.current.activeTeamTarget).toBeNull()
  })
})
