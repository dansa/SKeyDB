import {describe, expect, test} from 'vitest'

import type {ActiveSelection, Team} from '@/features/builder/types'

import {createBuilderDraftStore, createDefaultBuilderDraft} from './builderDraftStore'

function createTeam(id: string): Team {
  return {
    id,
    name: id,
    slots: [
      {slotId: `${id}-slot-1`, wheels: [null, null]},
      {slotId: `${id}-slot-2`, wheels: [null, null]},
      {slotId: `${id}-slot-3`, wheels: [null, null]},
      {slotId: `${id}-slot-4`, wheels: [null, null]},
    ],
  }
}

describe('builderDraftStore', () => {
  test('default draft has one team with four empty slots', () => {
    const draft = createDefaultBuilderDraft()

    expect(draft.teams).toHaveLength(1)
    expect(draft.activeTeamId).toBe(draft.teams[0]?.id)
    expect(draft.teams[0]?.slots).toEqual([
      {slotId: 'slot-1', wheels: [null, null]},
      {slotId: 'slot-2', wheels: [null, null]},
      {slotId: 'slot-3', wheels: [null, null]},
      {slotId: 'slot-4', wheels: [null, null]},
    ])
  })

  test('replaceBuilderDraft sets teams and activeTeamId', () => {
    const store = createBuilderDraftStore()
    const nextDraft = {teams: [createTeam('team-beta')], activeTeamId: 'team-beta'}
    store.getState().setActiveSelection({kind: 'awakener', slotId: 'slot-1'})
    store.getState().beginTeamRename('team-1', 'Team 1', 'header')
    store.getState().startQuickLineup()

    store.getState().replaceBuilderDraft(nextDraft)

    expect(store.getState().teams).toEqual(nextDraft.teams)
    expect(store.getState().activeTeamId).toBe('team-beta')
    expect(store.getState().activeSelection).toBeNull()
    expect(store.getState().editingTeamId).toBeNull()
    expect(store.getState().editingTeamName).toBe('')
    expect(store.getState().editingTeamSurface).toBeNull()
    expect(store.getState().quickLineupState).toBeNull()
  })

  test('resetBuilderDraft returns and stores a fresh default draft', () => {
    const store = createBuilderDraftStore({
      teams: [createTeam('team-beta')],
      activeTeamId: 'team-beta',
    })
    store.getState().setActiveSelection({kind: 'awakener', slotId: 'team-beta-slot-1'})
    store.getState().beginTeamRename('team-beta', 'Team Beta', 'list')
    store.getState().startQuickLineup()

    const resetDraft = store.getState().resetBuilderDraft()

    expect(resetDraft).toEqual(createDefaultBuilderDraft())
    expect(store.getState().teams).toEqual(resetDraft.teams)
    expect(store.getState().activeTeamId).toBe(resetDraft.activeTeamId)
    expect(store.getState().activeSelection).toBeNull()
    expect(store.getState().editingTeamId).toBeNull()
    expect(store.getState().editingTeamName).toBe('')
    expect(store.getState().editingTeamSurface).toBeNull()
    expect(store.getState().quickLineupState).toBeNull()
    expect(resetDraft.teams).not.toBe(createDefaultBuilderDraft().teams)
  })

  test('setTeams accepts updater form', () => {
    const store = createBuilderDraftStore()

    store.getState().setTeams((teams) => [...teams, createTeam('team-beta')])

    expect(store.getState().teams.map((team) => team.id)).toEqual(['team-1', 'team-beta'])
  })

  test('hydrateBuilderDraft clears transient UI state and stores teams and activeTeamId', () => {
    const store = createBuilderDraftStore()
    const nextDraft = {teams: [createTeam('team-beta')], activeTeamId: 'team-beta'}
    store.getState().setActiveSelection({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})
    store.getState().beginTeamRename('team-1', 'Team 1', 'header')
    store.getState().startQuickLineup()

    store.getState().hydrateBuilderDraft(nextDraft)

    expect(store.getState().teams).toEqual(nextDraft.teams)
    expect(store.getState().activeTeamId).toBe('team-beta')
    expect(store.getState().activeSelection).toBeNull()
    expect(store.getState().editingTeamId).toBeNull()
    expect(store.getState().editingTeamName).toBe('')
    expect(store.getState().editingTeamSurface).toBeNull()
    expect(store.getState().quickLineupState).toBeNull()
  })

  test('setTeams reconciles activeTeamId to the first team when the active team disappears', () => {
    const store = createBuilderDraftStore({
      teams: [createTeam('team-alpha'), createTeam('team-beta')],
      activeTeamId: 'team-beta',
    })

    store.getState().setTeams((teams) => teams.filter((team) => team.id !== 'team-beta'))

    expect(store.getState().teams.map((team) => team.id)).toEqual(['team-alpha'])
    expect(store.getState().activeTeamId).toBe('team-alpha')
  })

  test('setActiveTeamId falls back to the effective active team when passed a missing team', () => {
    const store = createBuilderDraftStore({
      teams: [createTeam('team-alpha'), createTeam('team-beta')],
      activeTeamId: 'team-beta',
    })

    store.getState().setActiveTeamId('missing-team')

    expect(store.getState().activeTeamId).toBe('team-beta')
  })

  test('updateActiveTeam and setActiveTeamSlots mutate the effective active team', () => {
    const alpha = createTeam('team-alpha')
    const beta = createTeam('team-beta')
    const store = createBuilderDraftStore({
      teams: [alpha, beta],
      activeTeamId: 'missing-team',
    })
    const nextSlots = beta.slots.map((slot, index) =>
      index === 0 ? {...slot, awakenerId: 'awakener-0021'} : slot,
    )

    store.getState().updateActiveTeam((team) => ({...team, name: 'Updated Alpha'}))
    store.getState().setActiveTeamId('team-beta')
    store.getState().setActiveTeamSlots(nextSlots)

    expect(store.getState().teams[0]?.name).toBe('Updated Alpha')
    expect(store.getState().teams[1]?.slots).toEqual(nextSlots)
  })

  test('commitTeamRename trims non-empty names and clears edit state', () => {
    const store = createBuilderDraftStore()
    const teamId = store.getState().teams[0]?.id ?? ''

    store.getState().beginTeamRename(teamId, 'Team 1', 'header')
    store.getState().setEditingTeamName(' Arena Squad ')
    store.getState().commitTeamRename(teamId)

    expect(store.getState().teams[0]?.name).toBe('Arena Squad')
    expect(store.getState().editingTeamId).toBeNull()
    expect(store.getState().editingTeamName).toBe('')
    expect(store.getState().editingTeamSurface).toBeNull()
  })

  test('quick lineup start, advance, back, jump, and cancel expose focus metadata', () => {
    const store = createBuilderDraftStore()
    const focusFor = (selection: ActiveSelection, pickerTab: string | null) => ({
      pickerTab,
      selection,
    })

    expect(store.getState().startQuickLineup()).toEqual(
      focusFor({kind: 'awakener', slotId: 'slot-1'}, 'awakeners'),
    )
    expect(store.getState().quickLineupState?.currentStepIndex).toBe(0)

    expect(store.getState().advanceQuickLineupStep()).toEqual(
      focusFor({kind: 'awakener', slotId: 'slot-2'}, 'awakeners'),
    )

    expect(store.getState().goBackQuickLineupStep()).toEqual(
      focusFor({kind: 'awakener', slotId: 'slot-1'}, 'awakeners'),
    )

    expect(
      store.getState().jumpToQuickLineupStep({kind: 'wheel', slotId: 'slot-1', wheelIndex: 1}),
    ).toEqual(focusFor({kind: 'awakener', slotId: 'slot-1'}, 'awakeners'))

    expect(store.getState().jumpToQuickLineupStep({kind: 'awakener', slotId: 'slot-3'})).toEqual(
      focusFor({kind: 'awakener', slotId: 'slot-3'}, 'awakeners'),
    )

    expect(store.getState().goBackQuickLineupStep()).toEqual(
      focusFor({kind: 'awakener', slotId: 'slot-2'}, 'awakeners'),
    )

    expect(store.getState().cancelQuickLineup()).toEqual(focusFor(null, null))
    expect(store.getState().quickLineupState).toBeNull()
    expect(store.getState().activeSelection).toBeNull()
  })
})
