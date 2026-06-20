import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {BuilderTeamsPanel} from './BuilderTeamsPanel'

describe('BuilderTeamsPanel', () => {
  it('renders team preview mode toggle and switches from compact to expanded', () => {
    const onTeamPreviewModeChange = vi.fn()

    render(
      <BuilderTeamsPanel
        activeTeamId='team-1'
        editingTeamId={null}
        editingTeamName=''
        editingTeamSurface={null}
        onAddTeam={vi.fn()}
        onApplyTeamTemplate={vi.fn()}
        onBeginTeamRename={vi.fn()}
        onCancelTeamRename={vi.fn()}
        onCommitTeamRename={vi.fn()}
        onDeleteTeam={vi.fn()}
        onEditTeam={vi.fn()}
        onEditingTeamNameChange={vi.fn()}
        onExportTeam={vi.fn()}
        onResetTeam={vi.fn()}
        onTeamPreviewModeChange={onTeamPreviewModeChange}
        ownedWheelLevelById={new Map()}
        posses={[]}
        teamPreviewMode='compact'
        teams={[
          {
            id: 'team-1',
            name: 'Team 1',
            slots: [
              {slotId: 'slot-1', wheels: [null, null]},
              {slotId: 'slot-2', wheels: [null, null]},
              {slotId: 'slot-3', wheels: [null, null]},
              {slotId: 'slot-4', wheels: [null, null]},
            ],
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Expanded'}))

    expect(onTeamPreviewModeChange).toHaveBeenCalledWith('expanded')
  })

  it('renders expanded slot previews when team preview mode is expanded', () => {
    render(
      <BuilderTeamsPanel
        activeTeamId='team-1'
        editingTeamId={null}
        editingTeamName=''
        editingTeamSurface={null}
        onAddTeam={vi.fn()}
        onApplyTeamTemplate={vi.fn()}
        onBeginTeamRename={vi.fn()}
        onCancelTeamRename={vi.fn()}
        onCommitTeamRename={vi.fn()}
        onDeleteTeam={vi.fn()}
        onEditTeam={vi.fn()}
        onEditingTeamNameChange={vi.fn()}
        onExportTeam={vi.fn()}
        onResetTeam={vi.fn()}
        onTeamPreviewModeChange={vi.fn()}
        ownedWheelLevelById={new Map([['SR19', 3]])}
        posses={[]}
        teamPreviewMode='expanded'
        teams={[
          {
            id: 'team-1',
            name: 'Team 1',
            slots: [
              {
                slotId: 'slot-1',
                awakenerId: 'awakener-0042',
                realm: 'CHAOS',
                wheels: ['SR19', null],
                covenantId: '001',
              },
              {slotId: 'slot-2', wheels: [null, null]},
              {slotId: 'slot-3', wheels: [null, null]},
              {slotId: 'slot-4', wheels: [null, null]},
            ],
          },
        ]}
      />,
    )

    expect(screen.getByAltText(/expanded team preview card/i)).toBeInTheDocument()
    expect(document.querySelectorAll('.builder-team-slot-preview-expanded')).toHaveLength(4)
  })

  it('selects a team from the non-slot row body without double-firing slot clicks', () => {
    const onEditTeam = vi.fn()
    const onExportTeam = vi.fn()

    render(
      <BuilderTeamsPanel
        activeTeamId='team-1'
        editingTeamId={null}
        editingTeamName=''
        editingTeamSurface={null}
        onAddTeam={vi.fn()}
        onApplyTeamTemplate={vi.fn()}
        onBeginTeamRename={vi.fn()}
        onCancelTeamRename={vi.fn()}
        onCommitTeamRename={vi.fn()}
        onDeleteTeam={vi.fn()}
        onEditTeam={onEditTeam}
        onEditingTeamNameChange={vi.fn()}
        onExportTeam={onExportTeam}
        onResetTeam={vi.fn()}
        onTeamPreviewModeChange={vi.fn()}
        ownedWheelLevelById={new Map()}
        posses={[]}
        teamPreviewMode='compact'
        teams={[
          {
            id: 'team-1',
            name: 'Team 1',
            slots: [
              {slotId: 'slot-1', wheels: [null, null]},
              {slotId: 'slot-2', wheels: [null, null]},
              {slotId: 'slot-3', wheels: [null, null]},
              {slotId: 'slot-4', wheels: [null, null]},
            ],
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByAltText('Team 1 posse'))
    expect(onEditTeam).toHaveBeenCalledOnce()
    expect(onEditTeam).toHaveBeenLastCalledWith('team-1')

    fireEvent.click(screen.getByRole('button', {name: /select team preview slot 1/i}))
    expect(onEditTeam).toHaveBeenCalledTimes(2)
    expect(onEditTeam).toHaveBeenLastCalledWith('team-1')

    fireEvent.click(screen.getByRole('button', {name: 'Export'}))
    expect(onExportTeam).toHaveBeenCalledWith('team-1')
    expect(onEditTeam).toHaveBeenCalledTimes(2)
  })

  it('shows a support chip on team previews for support slots', () => {
    render(
      <BuilderTeamsPanel
        activeTeamId='team-1'
        editingTeamId={null}
        editingTeamName=''
        editingTeamSurface={null}
        onAddTeam={vi.fn()}
        onApplyTeamTemplate={vi.fn()}
        onBeginTeamRename={vi.fn()}
        onCancelTeamRename={vi.fn()}
        onCommitTeamRename={vi.fn()}
        onDeleteTeam={vi.fn()}
        onEditTeam={vi.fn()}
        onEditingTeamNameChange={vi.fn()}
        onExportTeam={vi.fn()}
        onResetTeam={vi.fn()}
        onTeamPreviewModeChange={vi.fn()}
        ownedWheelLevelById={new Map()}
        posses={[]}
        teamPreviewMode='compact'
        teams={[
          {
            id: 'team-1',
            name: 'Team 1',
            slots: [
              {
                slotId: 'slot-1',
                awakenerId: 'awakener-0042',
                realm: 'CHAOS',
                level: 90,
                isSupport: true,
                wheels: [null, null],
              },
              {slotId: 'slot-2', wheels: [null, null]},
              {slotId: 'slot-3', wheels: [null, null]},
              {slotId: 'slot-4', wheels: [null, null]},
            ],
          },
        ]}
      />,
    )

    expect(screen.getByText('Support')).toBeInTheDocument()
  })
})
