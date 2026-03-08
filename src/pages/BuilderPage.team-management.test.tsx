import {fireEvent, render, screen, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import './builder-page.integration-mocks'

import {BuilderPage} from './BuilderPage'

describe('BuilderPage team management', () => {
  it('shows a compact add-team tab action and hides it at max teams', () => {
    const {container} = render(<BuilderPage />)

    const builderTabbedContainer = container.querySelector('.tabbed-container')
    expect(builderTabbedContainer).not.toBeNull()

    fireEvent.click(
      within(builderTabbedContainer as HTMLElement).getByRole('button', {name: /add team tab/i}),
    )
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()

    for (let index = 0; index < 8; index += 1) {
      fireEvent.click(
        within(builderTabbedContainer as HTMLElement).getByRole('button', {name: /add team tab/i}),
      )
    }

    expect(container.querySelector('[data-team-name="Team 10"]')).not.toBeNull()
    expect(
      within(builderTabbedContainer as HTMLElement).queryByRole('button', {name: /add team tab/i}),
    ).toBeNull()
  })

  it('deletes an empty team directly from the top tab close action', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const builderTabbedContainer = container.querySelector('.tabbed-container')
    expect(builderTabbedContainer).not.toBeNull()

    fireEvent.click(
      within(builderTabbedContainer as HTMLElement).getByRole('button', {name: /close team 2/i}),
    )

    expect(screen.queryByRole('dialog', {name: /delete team 2/i})).not.toBeInTheDocument()
    expect(container.querySelector('[data-team-name="Team 2"]')).toBeNull()
  })

  it('asks for confirmation before deleting a non-empty team from the top tab close action', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    fireEvent.click(screen.getByRole('tab', {name: /^team 2$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    const builderTabbedContainer = container.querySelector('.tabbed-container')
    expect(builderTabbedContainer).not.toBeNull()

    fireEvent.click(
      within(builderTabbedContainer as HTMLElement).getByRole('button', {name: /close team 2/i}),
    )
    expect(screen.getByRole('dialog', {name: /delete team 2/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /cancel/i}))
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
  })

  it('confirms moving a locked posse from another team and supports cancel', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('tab', {name: /posses/i}))
    fireEvent.click(screen.getByRole('button', {name: /taverns opening/i}))

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    fireEvent.click(screen.getByRole('tab', {name: /^team 2$/i}))

    const tavernsOpeningButton = screen.getByRole('button', {name: /taverns opening/i})
    expect(tavernsOpeningButton).toHaveAttribute('aria-disabled', 'true')
    expect(tavernsOpeningButton).toHaveTextContent(/team 1/i)

    fireEvent.click(tavernsOpeningButton)
    expect(screen.getByRole('dialog', {name: /move taverns opening/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /cancel/i}))
    expect(screen.queryByRole('dialog', {name: /move taverns opening/i})).not.toBeInTheDocument()

    fireEvent.click(tavernsOpeningButton)
    expect(screen.getByRole('dialog', {name: /move taverns opening/i})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /^move$/i}))
    expect(screen.queryByRole('dialog', {name: /move taverns opening/i})).not.toBeInTheDocument()
  })

  it('deletes empty team without showing confirmation dialog', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    const deleteButton = within(team2Row as HTMLElement).getByRole('button', {name: /delete/i})
    fireEvent.click(deleteButton)
    expect(screen.queryByRole('dialog', {name: /delete team 2/i})).not.toBeInTheDocument()
    expect(container.querySelector('[data-team-name="Team 2"]')).toBeNull()
  })

  it('resets empty team immediately without showing confirmation dialog', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    const resetButton = within(team2Row as HTMLElement).getByRole('button', {name: /reset/i})
    fireEvent.click(resetButton)

    expect(screen.queryByRole('dialog', {name: /reset team 2/i})).not.toBeInTheDocument()
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
  })

  it('requires centered confirm and cancel before deleting a non-empty team', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    fireEvent.click(screen.getByRole('tab', {name: /^team 2$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    const refreshedTeam2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(refreshedTeam2Row).not.toBeNull()

    const deleteButton = within(refreshedTeam2Row as HTMLElement).getByRole('button', {
      name: /delete/i,
    })
    fireEvent.click(deleteButton)
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(screen.getByRole('dialog', {name: /delete team 2/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /cancel/i}))
    expect(screen.queryByRole('dialog', {name: /delete team 2/i})).not.toBeInTheDocument()
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()

    fireEvent.click(deleteButton)
    expect(screen.getByRole('dialog', {name: /delete team 2/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /delete team/i}))
    expect(container.querySelector('[data-team-name="Team 2"]')).toBeNull()
  })

  it('requires confirmation before resetting a non-empty team', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    fireEvent.click(screen.getByRole('tab', {name: /^team 2$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    expect(screen.getByRole('button', {name: /change goliath/i})).toBeInTheDocument()

    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    fireEvent.click(within(team2Row as HTMLElement).getByRole('button', {name: /reset/i}))

    expect(screen.getByRole('dialog', {name: /reset team 2/i})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /reset team/i}))
    expect(screen.queryByRole('dialog', {name: /reset team 2/i})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /change goliath/i})).not.toBeInTheDocument()
  })

  it('renames team inline and confirms with Enter', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    fireEvent.click(within(team2Row as HTMLElement).getByRole('button', {name: /rename team 2/i}))
    const renameInput = screen.getByRole('textbox', {name: /team name/i})
    fireEvent.change(renameInput, {target: {value: 'Arena Team'}})
    fireEvent.keyDown(renameInput, {key: 'Enter', code: 'Enter'})

    expect(container.querySelector('[data-team-name="Arena Team"]')).not.toBeNull()
  })

  it('cancels inline team rename on Escape', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    fireEvent.click(within(team2Row as HTMLElement).getByRole('button', {name: /rename team 2/i}))
    const renameInput = screen.getByRole('textbox', {name: /team name/i})
    fireEvent.change(renameInput, {target: {value: 'Temp Name'}})
    fireEvent.keyDown(renameInput, {key: 'Escape', code: 'Escape'})

    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(container.querySelector('[data-team-name="Temp Name"]')).toBeNull()
  })

  it('confirms inline team rename when clicking outside the input', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()

    fireEvent.click(within(team2Row as HTMLElement).getByRole('button', {name: /rename team 2/i}))
    const renameInput = screen.getByRole('textbox', {name: /team name/i})
    fireEvent.change(renameInput, {target: {value: 'Click Away Team'}})
    fireEvent.pointerDown(document.body)
    fireEvent.blur(renameInput)

    expect(container.querySelector('[data-team-name="Click Away Team"]')).not.toBeNull()
  })

  it('confirms moving a locked awakener from another team to active team', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    fireEvent.click(screen.getByRole('tab', {name: /^team 2$/i}))

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    expect(screen.getByRole('dialog', {name: /move goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /move instead/i}))
    expect(screen.queryByRole('dialog', {name: /move goliath/i})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: /change goliath/i})).toBeInTheDocument()

    const team1Row = container.querySelector('[data-team-name="Team 1"]')
    expect(team1Row).not.toBeNull()
    fireEvent.click(screen.getByRole('tab', {name: /^team 1$/i}))
    expect(screen.queryByRole('button', {name: /change goliath/i})).not.toBeInTheDocument()
  })

  it('can assign a duplicate awakener as support without removing the original team slot', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    fireEvent.click(screen.getByRole('tab', {name: /^team 2$/i}))

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    const moveDialog = screen.getByRole('dialog', {name: /move goliath/i})
    expect(within(moveDialog).getByRole('button', {name: /use as support/i})).toBeInTheDocument()

    fireEvent.click(within(moveDialog).getByRole('button', {name: /use as support/i}))

    expect(screen.queryByRole('dialog', {name: /move goliath/i})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: /change goliath/i})).toBeInTheDocument()
    expect(screen.getByText(/support awakener/i)).toBeInTheDocument()

    const team1Row = container.querySelector('[data-team-name="Team 1"]')
    expect(team1Row).not.toBeNull()
    fireEvent.click(screen.getByRole('tab', {name: /^team 1$/i}))
    expect(screen.getByRole('button', {name: /change goliath/i})).toBeInTheDocument()
  })
})
