import {act, renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

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

function createAssignedSlot(
  slotId: string,
  overrides: Partial<ReturnType<typeof createEmptyTeamSlots>[number]> = {},
) {
  return {
    slotId,
    awakenerId: 'awakener-0021',
    realm: 'CHAOS',
    level: 60,
    wheels: [null, null] as [string | null, string | null],
    ...overrides,
  }
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

  it('uses the latest toast handler from stable team action callbacks', () => {
    const firstShowToast = vi.fn()
    const secondShowToast = vi.fn()
    const {result, rerender} = renderHook(
      ({showToast}: {showToast: (message: string) => void}) => useBuilderV2Model({showToast}),
      {initialProps: {showToast: firstShowToast}},
    )

    act(() => {
      result.current.requestApplyTeamTemplate('DTIDE_5')
    })

    const confirmTemplate = result.current.teamActionDialog?.onConfirm
    expect(confirmTemplate).toBeTypeOf('function')

    rerender({showToast: secondShowToast})

    act(() => {
      confirmTemplate?.()
    })

    expect(firstShowToast).not.toHaveBeenCalled()
    expect(secondShowToast).toHaveBeenCalledWith(
      'Applied D-Tide 5: renamed 1, created 4, removed 0.',
    )
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

  it('reorders teams to an explicit index for drag sorting while preserving the active team', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.addTeam()
      result.current.addTeam()
      result.current.addTeam()
    })
    const activeTeamId = result.current.activeTeamId

    act(() => {
      result.current.moveTeamToIndex(activeTeamId, 1)
    })

    expect(result.current.teams.map((team) => team.name)).toEqual([
      'Team 1',
      'Team 4',
      'Team 2',
      'Team 3',
    ])
    expect(result.current.activeTeamId).toBe(activeTeamId)

    act(() => {
      result.current.moveTeamToIndex(activeTeamId, 99)
    })

    expect(result.current.teams.map((team) => team.name)).toEqual([
      'Team 1',
      'Team 2',
      'Team 3',
      'Team 4',
    ])
    expect(result.current.activeTeamId).toBe(activeTeamId)
  })

  it('swaps cross-team awakener slots after validating the resulting teams', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0005',
      realm: 'AEQUOR',
    })
    teamOneSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0006',
      realm: 'AEQUOR',
    })
    teamOneSlots[2] = createAssignedSlot('slot-3', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
    })
    teamOneSlots[3] = createAssignedSlot('slot-4', {
      awakenerId: 'awakener-0042',
      realm: 'CHAOS',
      wheels: ['wheel-0050', null],
      covenantId: 'c01',
    })
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0007',
      realm: 'ULTRA',
    })
    teamTwoSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0008',
      realm: 'ULTRA',
    })
    teamTwoSlots[2] = createAssignedSlot('slot-3', {
      awakenerId: 'awakener-0010',
      realm: 'ULTRA',
    })
    teamTwoSlots[3] = createAssignedSlot('slot-4', {
      awakenerId: 'awakener-0002',
      realm: 'CARO',
      wheels: [null, 'wheel-0051'],
      covenantId: 'c02',
    })

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
      result.current.swapTeamSlots('team-1', 'slot-4', 'team-2', 'slot-4')
    })

    const teams = builderDraftStore.getState().teams
    expect(teams[0]?.slots[3]).toMatchObject({
      awakenerId: 'awakener-0002',
      realm: 'CARO',
      wheels: [null, 'wheel-0051'],
      covenantId: 'c02',
    })
    expect(teams[1]?.slots[3]).toMatchObject({
      awakenerId: 'awakener-0042',
      realm: 'CHAOS',
      wheels: ['wheel-0050', null],
      covenantId: 'c01',
    })
    expect(result.current.violationMessage).toBeNull()
    expect(result.current.activeTeamId).toBe('team-1')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-4'})
  })

  it('blocks cross-team slot swaps that would violate duplicate rules', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      wheels: ['wheel-0050', null],
    })
    teamOneSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0042',
      realm: 'CHAOS',
      wheels: [null, null],
    })
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0007',
      realm: 'ULTRA',
      wheels: ['wheel-0050', null],
    })

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
      result.current.swapTeamSlots('team-1', 'slot-2', 'team-2', 'slot-1')
    })

    const teams = builderDraftStore.getState().teams
    expect(teams[0]?.slots[1]?.awakenerId).toBe('awakener-0042')
    expect(teams[1]?.slots[0]?.awakenerId).toBe('awakener-0007')
    expect(result.current.violationMessage).toBe('That swap would break current builder rules.')
  })

  it('allows cross-team slot swaps that break duplicate rules when dupes are enabled', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      wheels: ['wheel-0050', null],
    })
    teamOneSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0042',
      realm: 'CHAOS',
      wheels: [null, null],
    })
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0007',
      realm: 'ULTRA',
      wheels: ['wheel-0050', null],
    })

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
      result.current.picker.setAllowDupes(true)
    })
    act(() => {
      result.current.swapTeamSlots('team-1', 'slot-2', 'team-2', 'slot-1')
    })

    const teams = builderDraftStore.getState().teams
    expect(teams[0]?.slots[1]?.awakenerId).toBe('awakener-0007')
    expect(teams[0]?.slots[1]?.wheels).toEqual(['wheel-0050', null])
    expect(teams[1]?.slots[0]?.awakenerId).toBe('awakener-0042')
    expect(result.current.violationMessage).toBeNull()
  })

  it('assigns picker awakeners to a team-list slot without activating that team', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: createEmptyTeamSlots()},
        ],
      })
    })
    act(() => {
      result.current.assignAwakenerToTeamSlot('awakener-0021', 'team-2', 'slot-3')
    })

    const teams = builderDraftStore.getState().teams
    expect(result.current.activeTeamId).toBe('team-1')
    expect(result.current.slots.every((slot) => slot.awakener === null)).toBe(true)
    expect(teams[1]?.slots[2]).toMatchObject({
      awakenerId: 'awakener-0021',
    })
    expect(result.current.violationMessage).toBeNull()
  })

  it('assigns picker wheels and covenants to team-list slots using slot-level targeting', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      wheels: [null, 'wheel-0051'],
    })

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
      result.current.assignWheelToTeamSlot('wheel-0050', 'team-2', 'slot-2')
      result.current.assignCovenantToTeamSlot('c01', 'team-2', 'slot-2')
    })

    expect(builderDraftStore.getState().teams[1]?.slots[1]).toMatchObject({
      wheels: ['wheel-0050', 'wheel-0051'],
      covenantId: 'c01',
    })
    expect(result.current.violationMessage).toBeNull()
  })

  it('advances quick lineup when picker items are dropped on active team-list slots', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.startQuickLineup()
    })
    const activeTeamId = result.current.activeTeamId

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-1',
    })

    act(() => {
      result.current.assignAwakenerToTeamSlot('awakener-0021', activeTeamId, 'slot-1')
    })

    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })

    act(() => {
      result.current.assignWheelToTeamSlot('wheel-0050', activeTeamId, 'slot-1', 0)
    })

    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 1,
    })

    act(() => {
      result.current.assignWheelToTeamSlot('wheel-0051', activeTeamId, 'slot-1', 1)
    })

    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0050', 'wheel-0051'])
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'covenant',
      slotId: 'slot-1',
    })

    act(() => {
      result.current.assignCovenantToTeamSlot('c01', activeTeamId, 'slot-1')
    })

    expect(result.current.slots[0]?.covenantId).toBe('c01')
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })
    expect(result.current.violationMessage).toBeNull()
  })

  it('confirms inactive team-list wheel transfers without retargeting active selection', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    const teamThreeSlots = createEmptyTeamSlots()
    teamOneSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
    })
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0007',
      realm: 'ULTRA',
    })
    teamThreeSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0042',
      realm: 'CHAOS',
      wheels: ['wheel-0050', null],
    })

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: teamOneSlots},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
          {id: 'team-3', name: 'Team 3', slots: teamThreeSlots},
        ],
      })
    })
    act(() => {
      result.current.selectWheelSlot('slot-2', 1)
    })
    act(() => {
      result.current.assignWheelToTeamSlot('wheel-0050', 'team-2', 'slot-1', 0)
    })

    expect(result.current.transferDialog?.title).toBe('Move Merciful Nurturing')
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-2', wheelIndex: 1})

    act(() => {
      result.current.transferDialog?.onConfirm()
    })

    const teams = builderDraftStore.getState().teams
    expect(teams[1]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(teams[2]?.slots[0]?.wheels).toEqual([null, null])
    expect(result.current.activeTeamId).toBe('team-1')
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-2', wheelIndex: 1})
    expect(result.current.violationMessage).toBeNull()
  })

  it('clears a team-list slot when it is dropped on the picker', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      wheels: ['wheel-0050', null],
      covenantId: 'c01',
    })

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
      result.current.clearTeamSlot('team-2', 'slot-1')
    })

    expect(builderDraftStore.getState().teams[1]?.slots[0]).toMatchObject({
      awakenerId: undefined,
      realm: undefined,
      level: undefined,
      wheels: [null, null],
      covenantId: undefined,
    })
  })

  it('swaps team-list wheels across teams without activating either team', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      wheels: ['wheel-0050', null],
    })
    teamTwoSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'ULTRA',
      wheels: [null, 'wheel-0051'],
    })

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
      result.current.moveTeamWheel('team-1', 'slot-1', 0, 'team-2', 'slot-2', 1)
    })

    const teams = builderDraftStore.getState().teams
    expect(teams[0]?.slots[0]?.wheels).toEqual(['wheel-0051', null])
    expect(teams[1]?.slots[1]?.wheels).toEqual([null, 'wheel-0050'])
    expect(result.current.activeTeamId).toBe('team-1')
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})
    expect(result.current.violationMessage).toBeNull()
  })

  it('does not move team-list wheels into slots that already carry the wheel', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      isSupport: true,
      wheels: ['wheel-0050', null],
    })
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: ['wheel-0050', null],
    })

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
      result.current.moveTeamWheel('team-2', 'slot-1', 0, 'team-1', 'slot-1', 1)
    })

    const teams = builderDraftStore.getState().teams
    expect(teams[0]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(teams[1]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.violationMessage).toBe('That swap would break current builder rules.')
    expect(result.current.activeSelection).toBeNull()
  })

  it('does not move same-team team-list wheels into slots that already carry the wheel', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamSlots = createEmptyTeamSlots()
    teamSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      isSupport: true,
      wheels: ['wheel-0050', null],
    })
    teamSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: ['wheel-0050', null],
    })

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [{id: 'team-1', name: 'Team 1', slots: teamSlots}],
      })
    })
    act(() => {
      result.current.moveTeamWheel('team-1', 'slot-2', 0, 'team-1', 'slot-1', 1)
    })

    const teams = builderDraftStore.getState().teams
    expect(teams[0]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(teams[0]?.slots[1]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.violationMessage).toBe('That swap would break current builder rules.')
    expect(result.current.activeSelection).toBeNull()
  })

  it('opens a transfer when moving a support wheel copy into a regular team-list slot', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    const teamThreeSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      wheels: ['wheel-0050', null],
    })
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      isSupport: true,
      wheels: ['wheel-0050', null],
    })
    teamThreeSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0007',
      realm: 'ULTRA',
    })

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: teamOneSlots},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
          {id: 'team-3', name: 'Team 3', slots: teamThreeSlots},
        ],
      })
    })
    act(() => {
      result.current.moveTeamWheel('team-2', 'slot-1', 0, 'team-3', 'slot-1', 0)
    })

    expect(result.current.transferDialog?.title).toBe('Move Merciful Nurturing')
    expect(builderDraftStore.getState().teams[0]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(builderDraftStore.getState().teams[2]?.slots[0]?.wheels).toEqual([null, null])

    act(() => {
      result.current.transferDialog?.onConfirm()
    })

    const teams = builderDraftStore.getState().teams
    expect(teams[0]?.slots[0]?.wheels).toEqual([null, null])
    expect(teams[1]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(teams[2]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.violationMessage).toBeNull()
  })

  it('moves team-list wheels to the first empty wheel socket on broad slot drops', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      wheels: ['wheel-0050', null],
    })
    teamTwoSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'ULTRA',
      wheels: [null, 'wheel-0051'],
    })

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
      result.current.moveTeamWheelToTeamSlot('team-1', 'slot-1', 0, 'team-2', 'slot-2')
    })

    const teams = builderDraftStore.getState().teams
    expect(teams[0]?.slots[0]?.wheels).toEqual([null, null])
    expect(teams[1]?.slots[1]?.wheels).toEqual(['wheel-0050', 'wheel-0051'])
    expect(result.current.violationMessage).toBeNull()
  })

  it('clears a team-list wheel when it is dropped on the picker', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      wheels: ['wheel-0050', 'wheel-0051'],
    })

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
      result.current.clearTeamWheel('team-2', 'slot-1', 0)
    })

    expect(builderDraftStore.getState().teams[1]?.slots[0]?.wheels).toEqual([null, 'wheel-0051'])
  })

  it('moves and clears team-list covenants without changing the active team', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      covenantId: 'c01',
    })
    teamTwoSlots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'ULTRA',
      covenantId: 'c02',
    })

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
      result.current.moveTeamCovenant('team-1', 'slot-1', 'team-2', 'slot-2')
    })

    expect(builderDraftStore.getState().teams[0]?.slots[0]?.covenantId).toBe('c02')
    expect(builderDraftStore.getState().teams[1]?.slots[1]?.covenantId).toBe('c01')
    expect(result.current.activeTeamId).toBe('team-1')
    expect(result.current.activeSelection).toEqual({kind: 'covenant', slotId: 'slot-1'})

    act(() => {
      result.current.clearTeamCovenant('team-2', 'slot-2')
    })

    expect(builderDraftStore.getState().teams[1]?.slots[1]?.covenantId).toBeUndefined()
    expect(result.current.violationMessage).toBeNull()
  })

  it('assigns an awakener to the first empty slot', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })

    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.selectedSlotId).toBe('slot-1')
  })

  it('sorts wheels through the shared picker model', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.picker.setTab('wheels')
      result.current.picker.setWheelSortKey('ENLIGHTEN')
      result.current.picker.setWheelSortKey('ALPHABETICAL')
      result.current.picker.toggleWheelSortDirection()
    })

    expect(result.current.picker.preferences.wheelSortKey).toBe('ALPHABETICAL')
    expect(result.current.picker.wheels.map((wheel) => wheel.name).slice(0, 3)).toEqual([
      'Merciful Nurturing',
      'Mute Witness',
      'Signal Through Silence',
    ])
  })

  it('keeps wheel recommendation promotion stable through cached picker metadata', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
      result.current.selectWheelSlot('slot-1', 0)
      result.current.picker.setTab('wheels')
      result.current.picker.setPromoteMatchingWheelMainstats(true)
    })

    expect(result.current.picker.wheels.map((wheel) => wheel.id).slice(0, 4)).toEqual([
      'wheel-0051',
      'wheel-0050',
      'wheel-0052',
      'wheel-0053',
    ])
    expect(result.current.picker.wheels[0]?.recommendationLabel).toBe('BiS')
    expect(result.current.picker.wheels[1]?.recommendationLabel).toBe('Good')
    expect(result.current.picker.wheels[2]?.recommendedMainstatKey).toBe('KEYFLARE_REGEN')
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

  it('keeps slot and posse selection changes coupled to the matching picker tab', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.selectPosse()
    })

    expect(result.current.activeSelection).toBeNull()
    expect(result.current.activeTeamTarget).toEqual({kind: 'posse'})
    expect(result.current.pickerTab).toBe('posses')

    act(() => {
      result.current.selectWheelSlot('slot-1', 0)
    })

    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
    expect(result.current.activeTeamTarget).toBeNull()
    expect(result.current.pickerTab).toBe('awakeners')

    act(() => {
      result.current.setPickerTab('awakeners')
    })
    act(() => {
      result.current.selectWheelSlot('slot-1', 0)
    })

    expect(result.current.activeSelection).toBeNull()
    expect(result.current.activeTeamTarget).toBeNull()
    expect(result.current.pickerTab).toBe('awakeners')
  })

  it('preserves same-batch toggle semantics for slot and posse targets', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.selectAwakenerSlot('slot-1')
      result.current.selectAwakenerSlot('slot-1')
    })

    expect(result.current.activeSelection).toBeNull()
    expect(result.current.activeTeamTarget).toBeNull()
    expect(result.current.pickerTab).toBe('awakeners')

    act(() => {
      result.current.selectPosse()
      result.current.selectPosse()
    })

    expect(result.current.activeSelection).toBeNull()
    expect(result.current.activeTeamTarget).toBeNull()
    expect(result.current.pickerTab).toBe('posses')
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

  it('assigns picker actions to explicit DnD targets without relying on selected state', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.selectAwakenerSlot('slot-4')
      result.current.assignAwakenerToSlot('awakener-0021', 'slot-2')
    })
    act(() => {
      result.current.assignWheelToSlot('wheel-0050', 'slot-2', 1)
    })
    act(() => {
      result.current.assignCovenantToSlot('c01', 'slot-2')
    })
    expect(result.current.selectedSlotId).toBe('slot-2')

    act(() => {
      result.current.assignPosse('posse-0033')
    })

    expect(result.current.slots[1]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.slots[1]?.wheels).toEqual([null, 'wheel-0050'])
    expect(result.current.slots[1]?.covenantId).toBe('c01')
    expect(result.current.activePosse?.id).toBe('posse-0033')
  })

  it('keeps slot loadout when replacing an awakener from the picker', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakenerToSlot('awakener-0021', 'slot-2')
    })
    act(() => {
      result.current.assignWheelToSlot('wheel-0050', 'slot-2', 0)
    })
    act(() => {
      result.current.assignCovenantToSlot('c01', 'slot-2')
    })
    act(() => {
      result.current.assignAwakenerToSlot('awakener-0042', 'slot-2')
    })

    expect(result.current.slots[1]?.awakener?.id).toBe('awakener-0042')
    expect(result.current.slots[1]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.slots[1]?.covenantId).toBe('c01')
  })

  it('assigns slot-level DnD wheels to the first empty wheel target', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakenerToSlot('awakener-0021', 'slot-2')
    })
    act(() => {
      result.current.assignWheelToSlot('wheel-0050', 'slot-2')
    })
    act(() => {
      result.current.assignWheelToSlot('wheel-0051', 'slot-2')
    })

    expect(result.current.slots[1]?.wheels).toEqual(['wheel-0050', 'wheel-0051'])
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
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

  it('swaps active-team wheels and keeps focus on the target socket', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots()
    slots[0] = createAssignedSlot('slot-1', {wheels: ['wheel-0050', null]})
    slots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: [null, 'wheel-0051'],
    })

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    act(() => {
      result.current.selectWheelSlot('slot-2', 1)
    })
    act(() => {
      result.current.assignWheel('wheel-0050')
    })

    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0051', null])
    expect(result.current.slots[1]?.wheels).toEqual([null, 'wheel-0050'])
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-2', wheelIndex: 1})
    expect(result.current.activeTeamTarget).toBeNull()
    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.violationMessage).toBeNull()
  })

  it('moves active-team wheels between sockets through the explicit DnD command path', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots()
    slots[0] = createAssignedSlot('slot-1', {wheels: ['wheel-0050', null]})
    slots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: [null, 'wheel-0051'],
    })

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    act(() => {
      result.current.moveWheel('slot-1', 0, 'slot-2', 0)
    })

    expect(result.current.slots[0]?.wheels).toEqual([null, null])
    expect(result.current.slots[1]?.wheels).toEqual(['wheel-0050', 'wheel-0051'])
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-2', wheelIndex: 0})
    expect(result.current.pickerTab).toBe('wheels')

    act(() => {
      result.current.moveWheel('slot-2', 0, 'slot-2', 1)
    })

    expect(result.current.slots[1]?.wheels).toEqual(['wheel-0051', 'wheel-0050'])
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-2', wheelIndex: 1})
  })

  it('does not move active-team wheels into slots that already carry the wheel', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots()
    slots[0] = createAssignedSlot('slot-1', {
      isSupport: true,
      wheels: ['wheel-0050', null],
    })
    slots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: ['wheel-0050', null],
    })

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    expect(result.current.activeSelection).toBeNull()

    act(() => {
      result.current.moveWheel('slot-2', 0, 'slot-1', 1)
    })

    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.slots[1]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.activeSelection).toBeNull()
    expect(result.current.violationMessage).toBe(
      'That assignment would break current builder rules.',
    )
  })

  it('moves active-team wheels to the first empty wheel socket on a slot-level drop', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots()
    slots[0] = createAssignedSlot('slot-1', {wheels: ['wheel-0050', null]})
    slots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: [null, 'wheel-0051'],
    })

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    act(() => {
      result.current.moveWheelToSlot('slot-1', 0, 'slot-2')
    })

    expect(result.current.slots[0]?.wheels).toEqual([null, null])
    expect(result.current.slots[1]?.wheels).toEqual(['wheel-0050', 'wheel-0051'])
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-2', wheelIndex: 0})
    expect(result.current.pickerTab).toBe('wheels')
  })

  it('does not activate a slot-level wheel drop that would duplicate a wheel in the loadout', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots()
    slots[0] = createAssignedSlot('slot-1', {
      isSupport: true,
      wheels: ['wheel-0050', null],
    })
    slots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: ['wheel-0050', null],
    })

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    act(() => {
      result.current.moveWheelToSlot('slot-2', 0, 'slot-1')
    })

    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.slots[1]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.activeSelection).toBeNull()
    expect(result.current.violationMessage).toBe(
      'That assignment would break current builder rules.',
    )
  })

  it('moves an active-team awakener with its loadout through the explicit DnD command path', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots()
    slots[0] = createAssignedSlot('slot-1', {
      wheels: ['wheel-0050', 'wheel-0051'],
      covenantId: 'c01',
    })
    slots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: ['wheel-0060', null],
      covenantId: 'c02',
    })

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    act(() => {
      result.current.moveAwakener('slot-1', 'slot-2')
    })

    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0007')
    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0060', null])
    expect(result.current.slots[0]?.covenantId).toBe('c02')
    expect(result.current.slots[1]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.slots[1]?.wheels).toEqual(['wheel-0050', 'wheel-0051'])
    expect(result.current.slots[1]?.covenantId).toBe('c01')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
    expect(result.current.pickerTab).toBe('awakeners')
  })

  it('keeps support slots from opening cross-team wheel transfers', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      isSupport: true,
    })
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: ['wheel-0050', null],
    })

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

    expect(result.current.transferDialog).toBeNull()
    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})
  })

  it('does not duplicate borrowed wheels inside a support slot', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamOneSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0021',
      isSupport: true,
    })
    teamTwoSlots[0] = createAssignedSlot('slot-1', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      wheels: ['wheel-0050', null],
    })

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
    act(() => {
      result.current.selectWheelSlot('slot-1', 1)
    })
    act(() => {
      result.current.assignWheel('wheel-0050')
    })

    expect(result.current.transferDialog).toBeNull()
    expect(result.current.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.wheels).toEqual(['wheel-0050', null])
    expect(result.current.violationMessage).toBe(
      'That assignment would break current builder rules.',
    )
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

  it('allows duplicate covenants inside the active team and keeps the covenant target active', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots()
    slots[0] = createAssignedSlot('slot-1', {covenantId: 'c01'})
    slots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
      covenantId: 'c02',
    })

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    act(() => {
      result.current.selectCovenantSlot('slot-2')
    })
    act(() => {
      result.current.assignCovenant('c01')
    })

    expect(result.current.slots[0]?.covenantId).toBe('c01')
    expect(result.current.slots[1]?.covenantId).toBe('c01')
    expect(result.current.activeSelection).toEqual({kind: 'covenant', slotId: 'slot-2'})
    expect(result.current.activeTeamTarget).toBeNull()
    expect(result.current.pickerTab).toBe('covenants')
    expect(result.current.violationMessage).toBeNull()
  })

  it('moves active-team covenants through the explicit DnD command path', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots()
    slots[0] = createAssignedSlot('slot-1', {covenantId: 'c01'})
    slots[1] = createAssignedSlot('slot-2', {
      awakenerId: 'awakener-0007',
      realm: 'CARO',
    })

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    act(() => {
      result.current.moveCovenant('slot-1', 'slot-2')
    })

    expect(result.current.slots[0]?.covenantId).toBeUndefined()
    expect(result.current.slots[1]?.covenantId).toBe('c01')
    expect(result.current.activeSelection).toEqual({kind: 'covenant', slotId: 'slot-2'})
    expect(result.current.pickerTab).toBe('covenants')
    expect(result.current.violationMessage).toBeNull()
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

  it('preserves explicit loadout picker tabs when an awakener slot remains active', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })
    act(() => {
      result.current.assignCovenant('c01')
    })
    act(() => {
      result.current.assignCovenant('c01')
    })

    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
    expect(result.current.pickerTab).toBe('covenants')
    expect(result.current.violationMessage).toBeNull()
  })

  it('keeps assignment violations on the relevant picker tab without mutating slots', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignWheel('wheel-0050')
    })

    expect(result.current.violationMessage).toBe(
      'Select a wheel slot or an awakened slot before assigning a wheel.',
    )
    expect(result.current.pickerTab).toBe('wheels')
    expect(
      result.current.slots.every((slot) => slot.wheels.every((wheelId) => wheelId === null)),
    ).toBe(true)

    act(() => {
      result.current.selectAwakenerSlot('slot-1')
    })
    act(() => {
      result.current.assignCovenant('c01')
    })

    expect(result.current.violationMessage).toBe('Covenants require an awakener in that slot.')
    expect(result.current.pickerTab).toBe('covenants')
    expect(result.current.slots[0]?.covenantId).toBeUndefined()
  })

  it('does not retarget the picker tab for an awakener assignment violation', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const slots = createEmptyTeamSlots().map((slot, index) =>
      createAssignedSlot(slot.slotId, {
        awakenerId: index % 2 === 0 ? 'awakener-0021' : 'awakener-0007',
        realm: index % 2 === 0 ? 'CHAOS' : 'CARO',
      }),
    )

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(slots)
    })
    act(() => {
      result.current.setPickerTab('wheels')
    })
    act(() => {
      result.current.assignAwakener('awakener-0002')
    })

    expect(result.current.violationMessage).toBe('No available slot can accept that awakener.')
    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.slots.map((slot) => slot.awakener?.id)).toEqual([
      'awakener-0021',
      'awakener-0007',
      'awakener-0021',
      'awakener-0007',
    ])
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

  it('clears the current picker target independently of the visible picker tab', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakenerToSlot('awakener-0021', 'slot-1')
    })
    act(() => {
      result.current.assignWheelToSlot('wheel-0050', 'slot-1', 0)
    })
    act(() => {
      result.current.assignCovenantToSlot('c01', 'slot-1')
    })
    act(() => {
      result.current.selectAwakenerSlot('slot-1')
      result.current.setPickerTab('posses')
    })

    expect(result.current.pickerClearTarget?.label).toBe('Clear Slot')

    act(() => {
      result.current.clearPickerTarget()
    })

    expect(result.current.slots[0]?.awakener).toBeNull()
    expect(result.current.slots[0]?.wheels).toEqual([null, null])
    expect(result.current.slots[0]?.covenantId).toBeUndefined()
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
  })

  it('clears selected wheel, covenant, and posse picker targets', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakenerToSlot('awakener-0021', 'slot-1')
    })
    act(() => {
      result.current.assignWheelToSlot('wheel-0050', 'slot-1', 0)
    })
    act(() => {
      result.current.assignCovenantToSlot('c01', 'slot-1')
    })
    act(() => {
      result.current.selectWheelSlot('slot-1', 0)
    })

    expect(result.current.pickerClearTarget?.ariaLabel).toBe('Clear Slot 1 Wheel 1')

    act(() => {
      result.current.clearPickerTarget()
    })

    expect(result.current.slots[0]?.wheels).toEqual([null, null])
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})

    act(() => {
      result.current.selectCovenantSlot('slot-1')
    })
    act(() => {
      result.current.clearPickerTarget()
    })

    expect(result.current.slots[0]?.covenantId).toBeUndefined()
    expect(result.current.activeSelection).toEqual({kind: 'covenant', slotId: 'slot-1'})

    act(() => {
      result.current.selectPosse()
    })
    act(() => {
      result.current.assignPosse('posse-0033')
    })
    act(() => {
      result.current.clearPickerTarget()
    })

    expect(result.current.activePosse).toBeNull()
    expect(result.current.activeTeamTarget).toEqual({kind: 'posse'})
  })

  it('uses the picker clear target as a quick lineup skip for slot targets', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.startQuickLineup()
    })

    expect(result.current.pickerClearTarget?.description).toBe('Leave Slot 1 empty')

    act(() => {
      result.current.clearPickerTarget()
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-2',
      wheelIndex: 0,
    })

    act(() => {
      result.current.clearPickerTarget()
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-2',
      wheelIndex: 1,
    })
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

  it('falls back to the awakener step when quick lineup targets empty gear slots', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.startQuickLineup()
    })

    act(() => {
      result.current.selectWheelSlot('slot-2', 0)
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})

    act(() => {
      result.current.selectCovenantSlot('slot-3')
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-3',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-3'})
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

  it('falls back to an empty awakener step when selecting empty quick lineup gear manually', () => {
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
      kind: 'awakener',
      slotId: 'slot-1',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
  })

  it('moves quick lineup back to the previous available target instead of history', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.startQuickLineup()
    })
    act(() => {
      result.current.selectAwakenerSlot('slot-3')
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-3',
    })

    act(() => {
      result.current.goBackQuickLineupStep()
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
  })

  it('keeps quick lineup open after assigning the final posse step', () => {
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

    expect(result.current.quickLineupSession?.currentStep).toEqual({kind: 'posse'})
    expect(result.current.activePosse?.id).toBe('posse-0033')
    expect(result.current.activeTeamTarget).toEqual({kind: 'posse'})
  })
})
