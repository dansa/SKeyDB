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

  it('requests editing from slot and posse previews without activating the whole row', () => {
    const onRequestEditTeamPosse = vi.fn()
    const onRequestEditTeamSlot = vi.fn()
    const onSetActiveTeam = vi.fn()

    renderTeamManagement({
      onRequestEditTeamPosse,
      onRequestEditTeamSlot,
      onSetActiveTeam,
    })

    const waveTwoSlots = screen.getByRole('list', {name: 'Wave 2 slots'})
    fireEvent.click(within(waveTwoSlots).getByRole('button', {name: /edit wave 2 slot 3/i}))
    fireEvent.click(screen.getByRole('button', {name: /edit wave 2 posse/i}))

    expect(onRequestEditTeamSlot.mock.calls[0][0]).toMatchObject({id: 'team-2'})
    expect(onRequestEditTeamSlot.mock.calls[0][1]).toMatchObject({slotId: 'team-2-slot-3'})
    expect(onRequestEditTeamSlot.mock.calls[0][2]).toBeInstanceOf(HTMLButtonElement)
    expect(onRequestEditTeamPosse.mock.calls[0][0]).toMatchObject({id: 'team-2'})
    expect(onRequestEditTeamPosse.mock.calls[0][1]).toBeInstanceOf(HTMLButtonElement)
    expect(onSetActiveTeam).not.toHaveBeenCalled()
  })

  it('splits expanded desktop slot gear into direct edit targets', () => {
    const onRequestEditTeamSlot = vi.fn()
    const team = createTeam({
      id: 'team-2',
      name: 'Wave 2',
      slots: [
        {
          slotId: 'team-2-slot-1',
          label: 'Slot 1',
          slotNumber: 1,
          name: 'Helot',
          awakener: {
            id: 'awakener-1',
            name: 'Helot',
            displayName: 'Helot',
            realm: 'CARO',
            level: 60,
            enlightenLevel: 3,
            cardSrc: undefined,
            portraitSrc: undefined,
            isSupport: false,
            isOwned: true,
          },
          portraitSrc: undefined,
          cardSrc: undefined,
          isEmpty: false,
          isSupport: false,
          wheelCount: 1,
          wheels: [
            {
              id: 'wheel-1',
              name: 'Wheel 1',
              assetSrc: undefined,
              miniAssetSrc: undefined,
              enlightenLevel: null,
              isOwned: true,
            },
            null,
          ],
          hasCovenant: true,
          covenant: {id: 'covenant-1', name: 'Covenant 1', assetSrc: undefined},
        },
        ...createTeam({id: 'team-2'}).slots.slice(1),
      ],
    })

    renderTeamManagement({
      onRequestEditTeamSlot,
      teamPreviewMode: 'expanded',
      teams: [team],
      variant: 'desktop',
    })

    const slot = within(screen.getByRole('list', {name: 'Wave 2 slots'})).getAllByRole(
      'listitem',
    )[0]

    fireEvent.click(within(slot).getByRole('button', {name: /edit wave 2 slot 1 awakener/i}))
    fireEvent.click(within(slot).getByRole('button', {name: /edit wheel 2/i}))
    fireEvent.click(within(slot).getByRole('button', {name: /edit wave 2 slot 1 covenant/i}))

    expect(onRequestEditTeamSlot.mock.calls[0][3]).toEqual({kind: 'awakener'})
    expect(onRequestEditTeamSlot.mock.calls[1][3]).toEqual({kind: 'wheel', wheelIndex: 1})
    expect(onRequestEditTeamSlot.mock.calls[2][3]).toEqual({kind: 'covenant'})
  })
})
