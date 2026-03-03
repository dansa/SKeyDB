import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import './builder-page.integration-mocks'
import { BuilderPage } from './BuilderPage'

describe('BuilderPage quick lineup', () => {
  it('starts quick team lineup and moves between quick-lineup steps with next and back controls', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /quick team lineup/i }))
    expect(screen.getByText(/step 1 \/ 17: awakener 1/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByText(/step 5 \/ 17: awakener 2/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(/step 1 \/ 17: awakener 1/i)).toBeInTheDocument()
  })

  it('switches the picker to wheels and covenants as quick lineup advances after assigning an awakener', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /quick team lineup/i }))

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove active awakener/i })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^wheels$/i })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('tab', { name: /^wheels$/i })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('tab', { name: /^covenants$/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/goliath - covenant/i)).toBeInTheDocument()
  })

  it('returns to the previous wheel step when backing up from the covenant step during quick lineup', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /quick team lineup/i }))
    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('tab', { name: /^wheels$/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/goliath - wheel 2/i)).toBeInTheDocument()
  })

  it('cancels quick team lineup by restoring the original active team state', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /quick team lineup/i }))
    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel quick team lineup/i }))
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()
  })

  it('keeps quick lineup focus when clicking outside the builder cards', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /quick team lineup/i }))
    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    expect(screen.getByText(/goliath - wheel 1/i)).toBeInTheDocument()

    fireEvent.pointerDown(document.body)

    expect(screen.getByText(/goliath - wheel 1/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^wheels$/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('hides active wheel remove actions during quick lineup', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', { name: /set wheel/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /merciful nurturing/i }))

    expect(screen.getByRole('button', { name: /remove active wheel/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /quick team lineup/i }))
    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))

    expect(screen.queryByRole('button', { name: /remove active wheel/i })).not.toBeInTheDocument()
  })

  it('jumps quick lineup focus when clicking a different slot manually', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /quick team lineup/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    fireEvent.click(screen.getAllByRole('button', { name: /deploy awakeners/i })[0])

    expect(screen.getByRole('tab', { name: /^awakeners$/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/step 1 \/ 17: awakener 1/i)).toBeInTheDocument()
  })

  it('blocks locked awakener move by realm cap before showing move confirmation', () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: /^team 2$/i }))

    fireEvent.click(screen.getByRole('button', { name: /agrippa/i }))
    fireEvent.click(screen.getByRole('button', { name: /casiah/i }))
    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))

    expect(screen.queryByRole('dialog', { name: /move goliath/i })).not.toBeInTheDocument()
    expect(screen.getByText(/invalid move: a team can only contain up to 2 realms/i)).toBeInTheDocument()
  })

  it('resets builder with confirmation and allows undo from the same action slot', () => {
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /reset builder/i }))
    const dialog = screen.getByRole('dialog', { name: /reset builder/i })
    expect(dialog).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /^reset$/i }))

    expect(container.querySelector('[data-team-name="Team 2"]')).toBeNull()
    expect(screen.queryByRole('button', { name: /change goliath/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /undo reset/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /undo reset/i }))

    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()
  })
})
