import type {ComponentProps} from 'react'

import {fireEvent, render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {BuilderV2TeamSummary} from './BuilderV2ModelTypes'
import {BuilderV2TeamManagement} from './BuilderV2TeamManagement'

function createTeam(overrides: Partial<BuilderV2TeamSummary>): BuilderV2TeamSummary {
  const id = overrides.id ?? 'team-1'
  return {
    id,
    name: overrides.name ?? 'Wave 1',
    isActive: overrides.isActive ?? false,
    deployedCount: 0,
    slotNames: ['Empty', 'Empty', 'Empty', 'Empty'],
    slots: [1, 2, 3, 4].map((slotNumber) => ({
      slotId: `${id}-slot-${String(slotNumber)}`,
      label: `Slot ${String(slotNumber)}`,
      slotNumber,
      name: 'Empty',
      awakener: null,
      portraitSrc: undefined,
      cardSrc: undefined,
      isEmpty: true,
      isSupport: false,
      wheelCount: 0,
      wheels: [null, null],
      hasCovenant: false,
      covenant: null,
    })),
    posseName: null,
    posseRealm: null,
    posseAssetSrc: undefined,
    isPosseOwned: true,
    isEmpty: true,
    ...overrides,
  }
}

function renderTeamManagement(overrides: Partial<ComponentProps<typeof BuilderV2TeamManagement>>) {
  const props = {
    canAddTeam: true,
    editingTeamId: null,
    editingTeamName: '',
    maxTeams: 10,
    teamPreviewMode: 'compact' as const,
    teams: [createTeam({id: 'team-1', name: 'Wave 1'}), createTeam({id: 'team-2', name: 'Wave 2'})],
    onAddTeam: vi.fn(),
    onBeginTeamRename: vi.fn(),
    onCancelTeamRename: vi.fn(),
    onCommitTeamRename: vi.fn(),
    onMoveTeamDown: vi.fn(),
    onMoveTeamUp: vi.fn(),
    onRequestApplyTeamTemplate: vi.fn(),
    onRequestDeleteTeam: vi.fn(),
    onRequestExportTeam: vi.fn(),
    onRequestResetTeam: vi.fn(),
    onSetActiveTeam: vi.fn(),
    onSetEditingTeamName: vi.fn(),
    onTeamPreviewModeChange: vi.fn(),
    ...overrides,
  }

  render(<BuilderV2TeamManagement {...props} />)
  return props
}

function expectElement(element: Element | null): asserts element is Element {
  expect(element).toBeInstanceOf(Element)
}

describe('BuilderV2TeamManagement', () => {
  it('uses native groups and lists for team controls and slots', () => {
    renderTeamManagement({})

    expect(screen.getByRole('group', {name: 'Team preview mode'})).toBeInTheDocument()
    expect(screen.getByRole('group', {name: 'Team template actions'})).toBeInTheDocument()
    expect(screen.getByRole('group', {name: 'Wave 2 actions'})).toBeInTheDocument()

    const waveOneSlots = screen.getByRole('list', {name: 'Wave 1 slots'})
    expect(within(waveOneSlots).getAllByRole('listitem')).toHaveLength(4)
  })

  it('activates a team from the explicit select button', () => {
    const onSetActiveTeam = vi.fn()

    renderTeamManagement({onSetActiveTeam})

    fireEvent.click(screen.getByRole('button', {name: 'Select Wave 2'}))

    expect(onSetActiveTeam).toHaveBeenCalledWith('team-2')
  })

  it('does not activate a team when clicking row action buttons', () => {
    const onRequestExportTeam = vi.fn()
    const onSetActiveTeam = vi.fn()

    renderTeamManagement({onRequestExportTeam, onSetActiveTeam})

    fireEvent.click(screen.getByRole('button', {name: 'Export Wave 2'}))

    expect(onRequestExportTeam).toHaveBeenCalledWith('team-2')
    expect(onSetActiveTeam).not.toHaveBeenCalled()
  })

  it('does not activate a team when clicking the rename icon', () => {
    const onBeginTeamRename = vi.fn()
    const onSetActiveTeam = vi.fn()

    renderTeamManagement({onBeginTeamRename, onSetActiveTeam})

    const renameButton = screen.getByRole('button', {name: 'Rename Wave 2'})
    const renameIcon = renameButton.querySelector('svg')
    expectElement(renameIcon)

    fireEvent.click(renameIcon)

    expect(onBeginTeamRename).toHaveBeenCalledWith('team-2')
    expect(onSetActiveTeam).not.toHaveBeenCalled()
  })
})
