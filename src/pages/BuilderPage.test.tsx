import { render, screen } from '@testing-library/react'
import { within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { BuilderPage } from './BuilderPage'
import { encodeMultiTeamCode, encodeSingleTeamCode } from '../domain/import-export'
import type { Team } from './builder/types'

function makeImportTeam(name: string, awakenerName: string): Team {
  return {
    id: `${name}-id`,
    name,
    slots: [
      { slotId: 'slot-1', awakenerName, faction: 'AEQUOR', level: 60, wheels: [null, null] },
      { slotId: 'slot-2', wheels: [null, null] },
      { slotId: 'slot-3', wheels: [null, null] },
      { slotId: 'slot-4', wheels: [null, null] },
    ],
  }
}

describe('BuilderPage placeholders', () => {
  it('uses icon-only empty placeholders without helper text', () => {
    const { container } = render(<BuilderPage />)

    expect(screen.queryByText(/tap to deploy/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^wheel$/i)).not.toBeInTheDocument()
    expect(container.querySelectorAll('.sigil-placeholder').length).toBeGreaterThan(0)
  })

  it('adds to the first empty slot when clicking a picker portrait', async () => {
    const user = userEvent.setup()
    render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /ramona: timeworn/i }))

    expect(screen.getByRole('button', { name: /change ramona: timeworn/i })).toBeInTheDocument()
  })

  it('marks awakeners as in use after being assigned to the team', async () => {
    const user = userEvent.setup()
    render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /goliath/i }))

    const goliathPortrait = screen.getByAltText(/goliath portrait/i)
    const goliathPickerButton = goliathPortrait.closest('button')

    expect(goliathPickerButton).not.toBeNull()
    expect(goliathPickerButton).toHaveAttribute('data-in-use', 'true')
    expect(goliathPickerButton).toHaveTextContent(/already used/i)
  })

  it('captures global typing into the active picker search', async () => {
    const user = userEvent.setup()
    render(<BuilderPage />)

    await user.click(screen.getByRole('heading', { name: /builder/i }))
    await user.keyboard('ramona')

    expect(screen.getByRole('searchbox')).toHaveValue('ramona')
  })

  it('marks alternate awakeners as used when one form is assigned', async () => {
    const user = userEvent.setup()
    render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /ramona portrait/i }))

    const timewornPortrait = screen.getByAltText(/ramona: timeworn portrait/i)
    const timewornPickerButton = timewornPortrait.closest('button')

    expect(timewornPickerButton).not.toBeNull()
    expect(timewornPickerButton).toHaveAttribute('data-in-use', 'true')
    expect(timewornPickerButton).toHaveTextContent(/already used/i)
  })

  it('replaces the active card when clicking an awakener in picker', async () => {
    const user = userEvent.setup()
    render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /goliath/i }))
    await user.click(screen.getByRole('button', { name: /change goliath/i }))
    await user.click(screen.getByRole('button', { name: /ramona: timeworn/i }))

    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change ramona: timeworn/i })).toBeInTheDocument()
  })

  it('shows remove action for active card and clears it', async () => {
    const user = userEvent.setup()
    render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /goliath/i }))
    await user.click(screen.getByRole('button', { name: /change goliath/i }))
    await user.click(screen.getByRole('button', { name: /remove active awakener/i }))

    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
  })

  it('switches active team when clicking the team row card', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /goliath/i }))
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    await user.click(within(team2Row as HTMLElement).getByText('Team 2'))
    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
  })

  it('confirms moving a locked posse from another team and supports cancel', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /posses/i }))
    await user.click(screen.getByRole('button', { name: /taverns opening/i }))

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    await user.click(within(team2Row as HTMLElement).getByText('Team 2'))

    const tavernsOpeningButton = screen.getByRole('button', { name: /taverns opening/i })
    expect(tavernsOpeningButton).toHaveAttribute('aria-disabled', 'true')
    expect(tavernsOpeningButton).toHaveTextContent(/used in 1st team/i)

    await user.click(tavernsOpeningButton)
    expect(screen.getByRole('dialog', { name: /move taverns opening/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog', { name: /move taverns opening/i })).not.toBeInTheDocument()

    await user.click(tavernsOpeningButton)
    expect(screen.getByRole('dialog', { name: /move taverns opening/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^move$/i }))
    expect(screen.queryByRole('dialog', { name: /move taverns opening/i })).not.toBeInTheDocument()
  })

  it('deletes empty team without showing confirmation dialog', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    const deleteButton = within(team2Row as HTMLElement).getByRole('button', { name: /delete/i })
    await user.click(deleteButton)
    expect(screen.queryByRole('dialog', { name: /delete team 2/i })).not.toBeInTheDocument()
    expect(container.querySelector('[data-team-name="Team 2"]')).toBeNull()
  })

  it('requires centered confirm/cancel before deleting a non-empty team', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    await user.click(within(team2Row as HTMLElement).getByText('Team 2'))
    await user.click(screen.getByRole('button', { name: /goliath/i }))

    const refreshedTeam2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(refreshedTeam2Row).not.toBeNull()

    const deleteButton = within(refreshedTeam2Row as HTMLElement).getByRole('button', { name: /delete/i })
    await user.click(deleteButton)
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(screen.getByRole('dialog', { name: /delete team 2/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog', { name: /delete team 2/i })).not.toBeInTheDocument()
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()

    await user.click(deleteButton)
    expect(screen.getByRole('dialog', { name: /delete team 2/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete team/i }))
    expect(container.querySelector('[data-team-name="Team 2"]')).toBeNull()
  })

  it('renames team inline and confirms with Enter', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    await user.click(within(team2Row as HTMLElement).getByRole('button', { name: /rename team 2/i }))
    const renameInput = within(team2Row as HTMLElement).getByRole('textbox', { name: /team name/i })
    await user.clear(renameInput)
    await user.type(renameInput, 'Arena Team{Enter}')

    expect(container.querySelector('[data-team-name="Arena Team"]')).not.toBeNull()
  })

  it('cancels inline team rename on Escape', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    await user.click(within(team2Row as HTMLElement).getByRole('button', { name: /rename team 2/i }))
    const renameInput = within(team2Row as HTMLElement).getByRole('textbox', { name: /team name/i })
    await user.clear(renameInput)
    await user.type(renameInput, 'Temp Name{Escape}')

    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(container.querySelector('[data-team-name="Temp Name"]')).toBeNull()
  })

  it('confirms inline team rename when clicking outside the input', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    await user.click(within(team2Row as HTMLElement).getByRole('button', { name: /rename team 2/i }))
    const renameInput = within(team2Row as HTMLElement).getByRole('textbox', { name: /team name/i })
    await user.clear(renameInput)
    await user.type(renameInput, 'Click Away Team')
    await user.click(screen.getByRole('heading', { name: /builder/i }))

    expect(container.querySelector('[data-team-name="Click Away Team"]')).not.toBeNull()
  })

  it('confirms moving a locked awakener from another team to active team', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /goliath/i }))

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    await user.click(within(team2Row as HTMLElement).getByText('Team 2'))

    await user.click(screen.getByRole('button', { name: /goliath/i }))
    expect(screen.getByRole('dialog', { name: /move goliath/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^move$/i }))
    expect(screen.queryByRole('dialog', { name: /move goliath/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()

    const team1Row = container.querySelector('[data-team-name="Team 1"]')
    expect(team1Row).not.toBeNull()
    await user.click(within(team1Row as HTMLElement).getByText('Team 1'))
    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
  })

  it('blocks locked awakener move by faction cap before showing move confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /goliath/i }))

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    await user.click(within(team2Row as HTMLElement).getByText('Team 2'))

    await user.click(screen.getByRole('button', { name: /agrippa/i }))
    await user.click(screen.getByRole('button', { name: /casiah/i }))
    await user.click(screen.getByRole('button', { name: /goliath/i }))

    expect(screen.queryByRole('dialog', { name: /move goliath/i })).not.toBeInTheDocument()
    expect(screen.getByText(/invalid move: a team can only contain up to 2 factions/i)).toBeInTheDocument()
  })

  it('exports and imports a single team using t1 code', async () => {
    const user = userEvent.setup()
    render(<BuilderPage />)

    const t1Code = encodeSingleTeamCode(makeImportTeam('Imported Team', 'goliath'))

    await user.click(screen.getByRole('button', { name: /import/i }))
    const importDialog = screen.getByRole('dialog', { name: /import teams/i })
    await user.type(within(importDialog).getByRole('textbox', { name: /import code/i }), t1Code)
    await user.click(within(importDialog).getByRole('button', { name: /^import$/i }))

    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()
    expect(screen.getByText(/team imported/i)).toBeInTheDocument()
  })

  it('imports mt1 code after replace confirmation', async () => {
    const user = userEvent.setup()
    const teamA = makeImportTeam('Alpha', 'goliath')
    const teamB = makeImportTeam('Beta', 'ramona')
    const mtCode = encodeMultiTeamCode([teamA, teamB], teamB.id)
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /import/i }))
    const importDialog = screen.getByRole('dialog', { name: /import teams/i })
    await user.type(within(importDialog).getByRole('textbox', { name: /import code/i }), mtCode)
    await user.click(within(importDialog).getByRole('button', { name: /^import$/i }))

    expect(screen.getByRole('dialog', { name: /replace current teams/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^replace$/i }))

    expect(container.querySelector('[data-team-name="Team 1"]')).not.toBeNull()
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /change ramona/i })).toBeInTheDocument()
  })

  it('imports t1 into active team when active team is empty', async () => {
    const user = userEvent.setup()
    const t1Code = encodeSingleTeamCode(makeImportTeam('Imported Team', 'goliath'))
    const { container } = render(<BuilderPage />)

    await user.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    await user.click(within(team2Row as HTMLElement).getByText('Team 2'))

    await user.click(screen.getByRole('button', { name: /import/i }))
    const importDialog = screen.getByRole('dialog', { name: /import teams/i })
    await user.type(within(importDialog).getByRole('textbox', { name: /import code/i }), t1Code)
    await user.click(within(importDialog).getByRole('button', { name: /^import$/i }))

    expect(container.querySelector('[data-team-name="Team 3"]')).toBeNull()
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /team 2/i })).toBeInTheDocument()
  })

})
