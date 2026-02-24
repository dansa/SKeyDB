import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { COLLECTION_OWNERSHIP_KEY } from '../domain/collection-ownership'
import './builder-page.integration-mocks'
import { BuilderPage } from './BuilderPage'

describe('BuilderPage awakeners and teams', () => {
  it('uses icon-only empty placeholders without helper text', () => {
    const { container } = render(<BuilderPage />)

    expect(screen.queryByText(/tap to deploy/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^wheel$/i)).not.toBeInTheDocument()
    expect(container.querySelectorAll('.sigil-placeholder').length).toBeGreaterThan(0)
  })

  it('adds to the first empty slot when clicking a picker portrait', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /ramona: timeworn/i }))

    expect(screen.getByRole('button', { name: /change ramona: timeworn/i })).toBeInTheDocument()
  })

  it('displays collection awakener level as read-only Lv text on builder cards', () => {
    window.localStorage.setItem(
      COLLECTION_OWNERSHIP_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: '2026-01-01T00:00:00.000Z',
        payload: {
          ownedAwakeners: { '1': 0 },
          awakenerLevels: { '1': 77 },
          ownedWheels: {},
          ownedPosses: {},
          displayUnowned: true,
        },
      }),
    )

    render(<BuilderPage />)
    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))

    expect(
      screen.getByText((_, element) => element?.textContent === 'Lv.77'),
    ).toBeInTheDocument()
  })

  it('marks awakeners as in use after being assigned to the team', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))

    const goliathPortrait = screen.getByAltText(/goliath portrait/i)
    const goliathPickerButton = goliathPortrait.closest('button')

    expect(goliathPickerButton).not.toBeNull()
    expect(goliathPickerButton).toHaveAttribute('data-in-use', 'true')
    expect(goliathPickerButton).toHaveTextContent(/already used/i)
  })

  it('captures global typing into the active picker search', async () => {
    const user = userEvent.setup()
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('heading', { name: /builder/i }))
    await user.keyboard('ramona')

    expect(screen.getByRole('searchbox')).toHaveValue('ramona')
  })

  it('marks alternate awakeners as used when one form is assigned', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /ramona portrait/i }))

    const timewornPortrait = screen.getByAltText(/ramona: timeworn portrait/i)
    const timewornPickerButton = timewornPortrait.closest('button')

    expect(timewornPickerButton).not.toBeNull()
    expect(timewornPickerButton).toHaveAttribute('data-in-use', 'true')
    expect(timewornPickerButton).toHaveTextContent(/already used/i)
  })

  it('replaces the active card when clicking an awakener in picker', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /change goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /ramona: timeworn/i }))

    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change ramona: timeworn/i })).toBeInTheDocument()
  })

  it('shows remove action for active card and clears it', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /change goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /remove active awakener/i }))

    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
  })

  it('toggles off active card when clicking the same card again', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /change goliath/i }))
    expect(screen.getByRole('button', { name: /remove active awakener/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /change goliath/i }))
    expect(screen.queryByRole('button', { name: /remove active awakener/i })).not.toBeInTheDocument()
  })

  it('switches active team when clicking the team row card', async () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    fireEvent.click(within(team2Row as HTMLElement).getByText('Team 2'))
    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
  })

  it('confirms moving a locked posse from another team and supports cancel', async () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /posses/i }))
    fireEvent.click(screen.getByRole('button', { name: /taverns opening/i }))

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    fireEvent.click(within(team2Row as HTMLElement).getByText('Team 2'))

    const tavernsOpeningButton = screen.getByRole('button', { name: /taverns opening/i })
    expect(tavernsOpeningButton).toHaveAttribute('aria-disabled', 'true')
    expect(tavernsOpeningButton).toHaveTextContent(/used in 1st team/i)

    fireEvent.click(tavernsOpeningButton)
    expect(screen.getByRole('dialog', { name: /move taverns opening/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog', { name: /move taverns opening/i })).not.toBeInTheDocument()

    fireEvent.click(tavernsOpeningButton)
    expect(screen.getByRole('dialog', { name: /move taverns opening/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^move$/i }))
    expect(screen.queryByRole('dialog', { name: /move taverns opening/i })).not.toBeInTheDocument()
  })

  it('deletes empty team without showing confirmation dialog', async () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    const deleteButton = within(team2Row as HTMLElement).getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    expect(screen.queryByRole('dialog', { name: /delete team 2/i })).not.toBeInTheDocument()
    expect(container.querySelector('[data-team-name="Team 2"]')).toBeNull()
  })

  it('requires centered confirm/cancel before deleting a non-empty team', async () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    fireEvent.click(within(team2Row as HTMLElement).getByText('Team 2'))
    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))

    const refreshedTeam2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(refreshedTeam2Row).not.toBeNull()

    const deleteButton = within(refreshedTeam2Row as HTMLElement).getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(screen.getByRole('dialog', { name: /delete team 2/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog', { name: /delete team 2/i })).not.toBeInTheDocument()
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()

    fireEvent.click(deleteButton)
    expect(screen.getByRole('dialog', { name: /delete team 2/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /delete team/i }))
    expect(container.querySelector('[data-team-name="Team 2"]')).toBeNull()
  })

  it('renames team inline and confirms with Enter', () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    fireEvent.click(within(team2Row as HTMLElement).getByRole('button', { name: /rename team 2/i }))
    const renameInput = within(team2Row as HTMLElement).getByRole('textbox', { name: /team name/i })
    fireEvent.change(renameInput, { target: { value: 'Arena Team' } })
    fireEvent.keyDown(renameInput, { key: 'Enter', code: 'Enter' })

    expect(container.querySelector('[data-team-name="Arena Team"]')).not.toBeNull()
  })

  it('cancels inline team rename on Escape', () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    fireEvent.click(within(team2Row as HTMLElement).getByRole('button', { name: /rename team 2/i }))
    const renameInput = within(team2Row as HTMLElement).getByRole('textbox', { name: /team name/i })
    fireEvent.change(renameInput, { target: { value: 'Temp Name' } })
    fireEvent.keyDown(renameInput, { key: 'Escape', code: 'Escape' })

    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(container.querySelector('[data-team-name="Temp Name"]')).toBeNull()
  })

  it('confirms inline team rename when clicking outside the input', async () => {
    const user = userEvent.setup()
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    fireEvent.click(within(team2Row as HTMLElement).getByRole('button', { name: /rename team 2/i }))
    const renameInput = within(team2Row as HTMLElement).getByRole('textbox', { name: /team name/i })
    fireEvent.change(renameInput, { target: { value: 'Click Away Team' } })
    await user.click(screen.getByRole('heading', { name: /builder/i }))

    expect(container.querySelector('[data-team-name="Click Away Team"]')).not.toBeNull()
  })

  it('confirms moving a locked awakener from another team to active team', async () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    fireEvent.click(within(team2Row as HTMLElement).getByText('Team 2'))

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    expect(screen.getByRole('dialog', { name: /move goliath/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^move$/i }))
    expect(screen.queryByRole('dialog', { name: /move goliath/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()

    const team1Row = container.querySelector('[data-team-name="Team 1"]')
    expect(team1Row).not.toBeNull()
    fireEvent.click(within(team1Row as HTMLElement).getByText('Team 1'))
    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
  })

  it('blocks locked awakener move by faction cap before showing move confirmation', async () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    fireEvent.click(within(team2Row as HTMLElement).getByText('Team 2'))

    fireEvent.click(screen.getByRole('button', { name: /agrippa/i }))
    fireEvent.click(screen.getByRole('button', { name: /casiah/i }))
    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))

    expect(screen.queryByRole('dialog', { name: /move goliath/i })).not.toBeInTheDocument()
    expect(screen.getByText(/invalid move: a team can only contain up to 2 factions/i)).toBeInTheDocument()
  })

  it('resets builder with confirmation and allows undo from the same action slot', async () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /reset builder/i }))
    expect(screen.getByRole('dialog', { name: /reset builder/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^reset$/i }))

    expect(container.querySelector('[data-team-name="Team 2"]')).toBeNull()
    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /undo reset/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /undo reset/i }))

    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()
  })
})
