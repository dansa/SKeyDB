import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import './builder-page.integration-mocks'
import { BuilderPage } from './BuilderPage'

describe('BuilderPage wheels and covenants', () => {
  it('shows covenant picker tab and covenant search placeholder', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /covenants/i }))

    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Search covenants (name, id)')
  })

  it('uses a shared constrained scroll container for every picker tab', () => {
    render(<BuilderPage />)

    const pickerPanel = document.querySelector('[data-picker-zone="true"]')
    expect(pickerPanel).not.toBeNull()
    const pickerPanelClasses = Array.from(pickerPanel?.classList ?? [])
    expect(pickerPanelClasses.some((className) => className.startsWith('max-h-[calc(100dvh-'))).toBe(true)

    const tabNames = [/^awakeners$/i, /^wheels$/i, /^covenants$/i, /^posses$/i] as const
    for (const tabName of tabNames) {
      fireEvent.click(screen.getByRole('button', { name: tabName }))
      const scrollContainer = document.querySelector('.builder-picker-scrollbar')
      expect(scrollContainer).not.toBeNull()
      expect(scrollContainer?.classList.contains('flex-1')).toBe(true)
      expect(scrollContainer?.classList.contains('min-h-0')).toBe(true)
    }
  })

  it('sets covenant on active slot and allows clearing it from picker', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', { name: /set covenant/i }))
    fireEvent.click(screen.getByRole('button', { name: /deus ex machina covenant/i }))

    expect(screen.getByRole('button', { name: /edit covenant/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /not set covenant/i }))
    expect(screen.getAllByRole('button', { name: /set covenant/i }).length).toBeGreaterThan(0)
  })

  it('assigns covenant when awakener card is active and covenant is clicked in picker', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', { name: /change goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /covenants/i }))
    fireEvent.click(screen.getByRole('button', { name: /deus ex machina covenant/i }))

    expect(screen.getByRole('button', { name: /edit covenant/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove active awakener/i })).toBeInTheDocument()
  })

  it('treats both active slot sockets as wheel slots', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', { name: /set wheel/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /merciful nurturing/i }))
    expect(screen.getAllByRole('button', { name: /edit wheel/i })[0]).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /set wheel/i })[0])
    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'Search wheels (name, rarity, faction, awakener, main stat)',
    )
  })

  it('labels wheels already used in the active team inside picker', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', { name: /set wheel/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /merciful nurturing/i }))

    const wheelTile = screen.getByRole('button', { name: /merciful nurturing wheel/i })
    expect(wheelTile).toHaveTextContent(/already used/i)
  })

  it('keeps dedicated image scale classes for picker and card wheel tiles', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /wheels/i }))
    const pickerWheel = screen.getByRole('button', { name: /merciful nurturing wheel/i })
    const pickerImage = pickerWheel.querySelector('img')
    expect(pickerImage).not.toBeNull()
    expect(pickerImage?.classList.contains('builder-picker-wheel-image')).toBe(true)

    fireEvent.click(screen.getAllByRole('button', { name: /^awakeners$/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', { name: /set wheel/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /merciful nurturing/i }))

    const editWheelButton = screen.getAllByRole('button', { name: /edit wheel/i })[0]
    const cardWheelTile = editWheelButton?.closest('.wheel-tile')
    const cardImage = cardWheelTile?.querySelector('img')
    expect(cardImage).not.toBeNull()
    expect(cardImage?.classList.contains('builder-card-wheel-image')).toBe(true)
  })

  it('renders independent wheel rarity and mainstat filter controls', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /wheels/i }))

    const raritySsr = screen.getByRole('button', { name: 'SSR' })
    const mainstatCritRate = screen.getByRole('button', { name: /filter wheels by crit rate/i })

    fireEvent.click(raritySsr)
    expect(raritySsr).toHaveAttribute('aria-pressed', 'true')
    expect(mainstatCritRate).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(mainstatCritRate)
    expect(raritySsr).toHaveAttribute('aria-pressed', 'true')
    expect(mainstatCritRate).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses standard plus sigil for unset wheel slots on cards', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))

    const setWheelButtons = screen.getAllByRole('button', { name: /set wheel/i })
    const firstUnsetWheel = setWheelButtons[0]?.closest('.wheel-tile')
    expect(firstUnsetWheel).not.toBeNull()
    expect(firstUnsetWheel?.querySelector('.sigil-placeholder-wheel')).not.toBeNull()
    expect(firstUnsetWheel?.querySelector('.sigil-placeholder-remove')).toBeNull()
    expect(firstUnsetWheel?.querySelector('.sigil-remove-x')).toBeNull()
  })

  it('renders wheel remove action inside the active wheel tile', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getAllByRole('button', { name: /set wheel/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /merciful nurturing/i }))

    const removeButton = screen.getByRole('button', { name: /remove active wheel/i })
    expect(removeButton.closest('.wheel-tile')).not.toBeNull()
  })

  it('assigns wheel to first empty slot when awakener card is active', async () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', { name: /change goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /wheels/i }))
    fireEvent.click(screen.getByRole('button', { name: /merciful nurturing/i }))

    expect(screen.getAllByRole('button', { name: /edit wheel/i })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /set wheel/i })).toHaveLength(1)
  })

  it('keeps awakener active while quick-clicking two wheels from picker', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /goliath/i }))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', { name: /change goliath/i }))
    fireEvent.click(screen.getByRole('button', { name: /wheels/i }))
    fireEvent.click(screen.getByRole('button', { name: /merciful nurturing/i }))
    fireEvent.click(screen.getByRole('button', { name: /tablet of scriptures/i }))

    expect(screen.getByRole('button', { name: /remove active awakener/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /edit wheel/i })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /set wheel/i })).not.toBeInTheDocument()
  })
})
