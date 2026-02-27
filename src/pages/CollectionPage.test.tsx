import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CollectionPage } from './CollectionPage'

vi.mock('../domain/awakeners', () => ({
  getAwakeners: () => [
    { id: 1, name: 'ramona', faction: 'CHAOS', aliases: ['ram'] },
    { id: 2, name: 'ogier', faction: 'CHAOS', aliases: ['ogi'] },
  ],
}))

vi.mock('../domain/wheels', () => ({
  getWheels: () => [
    {
      id: 'C01',
      assetId: 'Weapon_Full_C01',
      name: 'Birth of a Soul',
      rarity: 'SSR',
      faction: 'CHAOS',
      awakener: 'ramona',
      mainstatKey: 'CRIT_RATE',
    },
    {
      id: 'C02',
      assetId: 'Weapon_Full_C02',
      name: 'Call of the Deep',
      rarity: 'SSR',
      faction: 'CHAOS',
      awakener: 'ogier',
      mainstatKey: 'ATK',
    },
    {
      id: 'SR01',
      assetId: 'Weapon_Full_SR01',
      name: 'Practice Wheel',
      rarity: 'SR',
      faction: 'NEUTRAL',
      awakener: '',
      mainstatKey: 'ATK',
    },
  ],
  getWheelMainstatLabel: () => '',
}))

vi.mock('../domain/posses', () => ({
  getPosses: () => [
    { id: '01', index: 1, name: 'Manor Echoes', faction: 'CHAOS', isFadedLegacy: false, awakenerName: 'ramona' },
    { id: '02', index: 2, name: 'Faded Legacy', faction: 'NEUTRAL', isFadedLegacy: true },
  ],
}))

vi.mock('../domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
}))

vi.mock('../domain/wheel-assets', () => ({
  getWheelAssetById: () => null,
}))

vi.mock('../domain/posse-assets', () => ({
  getPosseAssetById: () => null,
}))

vi.mock('./collection/OwnedAwakenerBoxExport', () => ({
  OwnedAwakenerBoxExport: () => <button type="button">Export box as PNG (owned only)</button>,
}))

vi.mock('./collection/OwnedWheelBoxExport', () => ({
  OwnedWheelBoxExport: () => <button type="button">Export wheels as PNG (owned only)</button>,
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CollectionPage global search capture', () => {
  it('captures global typing into the collection searchbox', () => {
    render(<CollectionPage />)

    fireEvent.keyDown(window, { key: 'r' })
    fireEvent.keyDown(window, { key: 'a' })

    const searchbox = screen.getByRole('searchbox')
    expect(searchbox).toHaveValue('ra')
    expect(searchbox).toHaveFocus()
  })

  it('clears searchbox on Escape', () => {
    render(<CollectionPage />)

    fireEvent.keyDown(window, { key: 't' })
    fireEvent.keyDown(window, { key: 'e' })
    fireEvent.keyDown(window, { key: 's' })
    fireEvent.keyDown(window, { key: 't' })
    expect(screen.getByRole('searchbox')).toHaveValue('test')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('saves ownership snapshot to file and shows status', () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /save to file/i }))

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrlSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/saved skeydb-collection-/i)).toBeInTheDocument()
  })

  it('shows explicit error when loading invalid snapshot file', async () => {
    const { container } = render(<CollectionPage />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(input).toBeTruthy()

    const badFile = new File(['not-json'], 'broken.json', { type: 'application/json' })
    fireEvent.change(input!, { target: { files: [badFile] } })

    await waitFor(() => {
      expect(screen.getByText(/load failed: file is not valid json\./i)).toBeInTheDocument()
    })
  })

  it('shows tab-specific owned box export buttons', () => {
    render(<CollectionPage />)

    expect(screen.getByRole('button', { name: /export box as png/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /export wheels as png/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Wheels' }))
    expect(screen.queryByRole('button', { name: /export box as png/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export wheels as png/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Posses' }))
    expect(screen.queryByRole('button', { name: /export box as png/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /export wheels as png/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Awakeners' }))
    expect(screen.getByRole('button', { name: /export box as png/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /export wheels as png/i })).not.toBeInTheDocument()
  })

  it('hides unowned items when display unowned is toggled off', () => {
    render(<CollectionPage />)

    expect(screen.getByText('Ramona')).toBeInTheDocument()
    expect(screen.getByText('Ogier')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /toggle ownership for ramona/i }))

    fireEvent.click(screen.getByRole('button', { name: /toggle display unowned/i }))

    expect(screen.queryByText('Ramona')).not.toBeInTheDocument()
    expect(screen.getByText('Ogier')).toBeInTheDocument()
  })

  it('uses compact sort ear and keeps group-by-faction in navigation', () => {
    render(<CollectionPage />)

    expect(screen.queryByText(/^Sort$/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /toggle grouping awakeners by faction/i })).toBeInTheDocument()
  })

  it('sorts unowned awakeners last when display unowned is enabled', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /toggle ownership for ramona/i }))
    fireEvent.click(screen.getByRole('button', { name: /apply changes/i }))

    const titles = Array.from(document.querySelectorAll('.collection-card-title')).map((element) =>
      element.textContent?.trim(),
    )
    expect(titles[0]).toBe('Ogier')
    expect(titles[1]).toBe('Ramona')
  })

  it('hides awakener level editor for unowned awakeners', () => {
    render(<CollectionPage />)

    expect(screen.getByRole('button', { name: /edit awakener level for ramona/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /toggle ownership for ramona/i }))

    expect(screen.queryByRole('button', { name: /edit awakener level for ramona/i })).not.toBeInTheDocument()
  })

  it('sorts posses by ownership then index', () => {
    render(<CollectionPage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Posses' }))

    const initialTitles = Array.from(document.querySelectorAll('.collection-card-title')).map((element) =>
      element.textContent?.trim(),
    )
    expect(initialTitles[0]).toBe('Manor Echoes')
    expect(initialTitles[1]).toBe('Faded Legacy')

    fireEvent.click(screen.getByRole('button', { name: /toggle ownership for manor echoes/i }))

    const afterToggleTitles = Array.from(document.querySelectorAll('.collection-card-title')).map((element) =>
      element.textContent?.trim(),
    )
    expect(afterToggleTitles[0]).toBe('Faded Legacy')
    expect(afterToggleTitles[1]).toBe('Manor Echoes')
  })

  it('freezes awakener card order after level edits until apply changes is clicked', () => {
    render(<CollectionPage />)

    expect(screen.queryByRole('button', { name: /apply changes/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ogier/i }))
    const ogierLevelInput = screen.getByRole('textbox', { name: /awakener level for ogier/i })
    fireEvent.change(ogierLevelInput, { target: { value: '90' } })
    fireEvent.keyDown(ogierLevelInput, { key: 'Enter' })

    expect(screen.getByRole('button', { name: /apply changes/i })).toBeInTheDocument()

    const titlesBeforeApply = Array.from(document.querySelectorAll('.collection-card-title')).map((element) =>
      element.textContent?.trim(),
    )
    expect(titlesBeforeApply[0]).toBe('Ramona')
    expect(titlesBeforeApply[1]).toBe('Ogier')

    fireEvent.click(screen.getByRole('button', { name: /apply changes/i }))

    const titlesAfterApply = Array.from(document.querySelectorAll('.collection-card-title')).map((element) =>
      element.textContent?.trim(),
    )
    expect(titlesAfterApply[0]).toBe('Ogier')
    expect(titlesAfterApply[1]).toBe('Ramona')
  })

  it('freezes wheel card order after enlighten edits until apply changes is clicked', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('tab', { name: 'Wheels' }))
    expect(screen.queryByRole('button', { name: /apply changes/i })).not.toBeInTheDocument()

    const callOfTheDeepTitle = screen.getByText('Call of the Deep')
    const callOfTheDeepCard = callOfTheDeepTitle.closest('.collection-card-frame')
    expect(callOfTheDeepCard).toBeTruthy()
    fireEvent.click(within(callOfTheDeepCard as HTMLElement).getByRole('button', { name: /increase enlighten level/i }))

    expect(screen.getByRole('button', { name: /apply changes/i })).toBeInTheDocument()

    const titlesBeforeApply = Array.from(document.querySelectorAll('.collection-card-title')).map((element) =>
      element.textContent?.trim(),
    )
    expect(titlesBeforeApply[0]).toBe('Birth of a Soul')
    expect(titlesBeforeApply[1]).toBe('Call of the Deep')

    fireEvent.click(screen.getByRole('button', { name: /apply changes/i }))

    const titlesAfterApply = Array.from(document.querySelectorAll('.collection-card-title')).map((element) =>
      element.textContent?.trim(),
    )
    expect(titlesAfterApply[0]).toBe('Call of the Deep')
    expect(titlesAfterApply[1]).toBe('Birth of a Soul')
  })

  it('uses click-to-edit awakener level with Lv. prefix inside editor', () => {
    render(<CollectionPage />)

    expect(screen.getByRole('button', { name: /edit awakener level for ramona/i })).toHaveTextContent('Lv.60')
    expect(screen.queryByRole('textbox', { name: /awakener level for ramona/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))

    const ramonaLevelInput = screen.getByRole('textbox', { name: /awakener level for ramona/i })
    fireEvent.change(ramonaLevelInput, { target: { value: '73' } })
    fireEvent.keyDown(ramonaLevelInput, { key: 'Enter' })

    expect(screen.getByRole('button', { name: /edit awakener level for ramona/i })).toHaveTextContent('Lv.73')
  })

  it('updates the active level textbox immediately when using level chevrons', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))

    const ramonaLevelInput = screen.getByRole('textbox', { name: /awakener level for ramona/i })
    expect(ramonaLevelInput).toHaveValue('60')

    fireEvent.click(screen.getByRole('button', { name: /increase awakener level for ramona/i }))
    expect(ramonaLevelInput).toHaveValue('61')
  })

  it('steps level while shift+scrolling on card when level edit is active', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))
    const ramonaLevelInput = screen.getByRole('textbox', { name: /awakener level for ramona/i })
    expect(ramonaLevelInput).toHaveValue('60')

    const ramonaOwnershipButton = screen.getByRole('button', { name: /toggle ownership for ramona/i })
    const ramonaCard = ramonaOwnershipButton.closest('.collection-card-frame')
    expect(ramonaCard).toBeTruthy()
    const ramonaScope = within(ramonaCard as HTMLElement)
    expect(ramonaScope.getByRole('button', { name: /decrease enlighten level/i })).toBeDisabled()

    fireEvent.wheel(ramonaCard as HTMLElement, { deltaY: -80 })
    expect(ramonaLevelInput).toHaveValue('60')
    expect(ramonaScope.getByRole('button', { name: /decrease enlighten level/i })).toBeDisabled()

    fireEvent.wheel(ramonaCard as HTMLElement, { deltaY: -80, shiftKey: true })
    expect(ramonaLevelInput).toHaveValue('61')
    expect(ramonaScope.getByRole('button', { name: /decrease enlighten level/i })).toBeDisabled()

    fireEvent.wheel(ramonaCard as HTMLElement, { deltaY: 80, shiftKey: true })
    expect(ramonaLevelInput).toHaveValue('60')
    expect(ramonaScope.getByRole('button', { name: /decrease enlighten level/i })).toBeDisabled()
  })

  it('steps level while shift+scrolling directly on active level input', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))
    const ramonaLevelInput = screen.getByRole('textbox', { name: /awakener level for ramona/i })
    expect(ramonaLevelInput).toHaveValue('60')

    fireEvent.wheel(ramonaLevelInput, { deltaY: -90, shiftKey: true })
    expect(ramonaLevelInput).toHaveValue('61')

    fireEvent.wheel(ramonaLevelInput, { deltaY: 90, shiftKey: true })
    expect(ramonaLevelInput).toHaveValue('60')
  })

  it('commits level edit on outside click without toggling ownership', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))
    const ramonaLevelInput = screen.getByRole('textbox', { name: /awakener level for ramona/i })
    fireEvent.change(ramonaLevelInput, { target: { value: '73' } })

    const ownershipButton = screen.getByRole('button', { name: /toggle ownership for ramona/i })
    fireEvent.mouseDown(ownershipButton)
    fireEvent.click(ownershipButton)

    expect(screen.queryByRole('textbox', { name: /awakener level for ramona/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit awakener level for ramona/i })).toHaveTextContent('Lv.73')
    expect(screen.getByRole('button', { name: /edit awakener level for ramona/i })).not.toBeDisabled()
  })

  it('commits level edit and swallows ownership toggle when clicking another awakener card', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))
    const ramonaLevelInput = screen.getByRole('textbox', { name: /awakener level for ramona/i })
    fireEvent.change(ramonaLevelInput, { target: { value: '72' } })

    const ogierOwnershipButton = screen.getByRole('button', { name: /toggle ownership for ogier/i })
    fireEvent.mouseDown(ogierOwnershipButton)
    fireEvent.click(ogierOwnershipButton)

    expect(screen.queryByRole('textbox', { name: /awakener level for ramona/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit awakener level for ramona/i })).toHaveTextContent('Lv.72')
    expect(screen.getByRole('button', { name: /edit awakener level for ogier/i })).toBeInTheDocument()
  })

  it('does not keep swallow state after non-card outside click commit', () => {
    vi.useFakeTimers()
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))
    fireEvent.change(screen.getByRole('textbox', { name: /awakener level for ramona/i }), {
      target: { value: '74' },
    })

    fireEvent.mouseDown(screen.getByRole('button', { name: /set owned/i }))
    fireEvent.click(screen.getByRole('button', { name: /set owned/i }))

    act(() => {
      vi.advanceTimersByTime(1)
    })

    fireEvent.mouseDown(screen.getByRole('button', { name: /toggle ownership for ogier/i }))
    fireEvent.click(screen.getByRole('button', { name: /toggle ownership for ogier/i }))

    expect(screen.queryByRole('button', { name: /edit awakener level for ogier/i })).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('keeps edit mode open when pressing a disabled level chevron', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))
    const levelInput = screen.getByRole('textbox', { name: /awakener level for ramona/i })
    fireEvent.change(levelInput, { target: { value: '90' } })
    fireEvent.keyDown(levelInput, { key: 'Enter' })

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))
    const disabledIncrease = screen.getByRole('button', { name: /increase awakener level for ramona/i })
    expect(disabledIncrease).toBeDisabled()

    fireEvent.pointerDown(disabledIncrease)

    expect(screen.getByRole('textbox', { name: /awakener level for ramona/i })).toBeInTheDocument()
  })

  it('repeats level increases while holding the increase chevron', () => {
    vi.useFakeTimers()
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))
    const levelInput = screen.getByRole('textbox', { name: /awakener level for ramona/i })
    const increaseButton = screen.getByRole('button', { name: /increase awakener level for ramona/i })

    fireEvent.pointerDown(increaseButton)
    act(() => {
      vi.advanceTimersByTime(750)
    })
    fireEvent.pointerUp(increaseButton)

    expect(Number(levelInput.getAttribute('value'))).toBeGreaterThan(61)
    vi.useRealTimers()
  })

  it('bumps enlighten with shift + wheel on hovered card', () => {
    render(<CollectionPage />)

    const ramonaOwnershipButton = screen.getByRole('button', { name: /toggle ownership for ramona/i })
    const ramonaCard = ramonaOwnershipButton.closest('.collection-card-frame')
    expect(ramonaCard).toBeTruthy()

    const ramonaScope = within(ramonaCard as HTMLElement)
    const decreaseBefore = ramonaScope.getByRole('button', { name: /decrease enlighten level/i })
    expect(decreaseBefore).toBeDisabled()

    fireEvent.wheel(ramonaCard as HTMLElement, { deltaY: -100, shiftKey: true })

    const decreaseAfter = ramonaScope.getByRole('button', { name: /decrease enlighten level/i })
    expect(decreaseAfter).not.toBeDisabled()
  })

  it('shows scoped batch actions per tab', () => {
    render(<CollectionPage />)

    expect(screen.getByRole('button', { name: /set owned/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set unowned/i })).toBeInTheDocument()
    expect(screen.getByText(/^Enlightens:$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^\+4$/i })).toBeInTheDocument()
    expect(screen.getByText(/^Levels:$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^\+10$/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Wheels' }))
    expect(screen.getByText(/^Enlightens:$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^\+4$/i })).toBeInTheDocument()
    expect(screen.queryByText(/^Levels:$/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^\+10$/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Posses' }))
    expect(screen.queryByText(/^Enlightens:$/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^\+4$/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/^Levels:$/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^\+10$/i })).not.toBeInTheDocument()
  })

  it('applies awakener level ±10 batch actions with 1<->10 normalization', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit awakener level for ramona/i }))
    const ramonaLevelInput = screen.getByRole('textbox', { name: /awakener level for ramona/i })
    fireEvent.change(ramonaLevelInput, { target: { value: '1' } })
    fireEvent.keyDown(ramonaLevelInput, { key: 'Enter' })
    expect(screen.getByRole('button', { name: /edit awakener level for ramona/i })).toHaveTextContent('Lv.1')

    fireEvent.click(screen.getByRole('button', { name: /^\+10$/i }))
    expect(screen.getByRole('button', { name: /edit awakener level for ramona/i })).toHaveTextContent('Lv.10')

    fireEvent.click(screen.getByRole('button', { name: /^-10$/i }))
    expect(screen.getByRole('button', { name: /edit awakener level for ramona/i })).toHaveTextContent('Lv.1')
  })

  it('applies wheel enlighten +12 batch action to filtered wheels', () => {
    render(<CollectionPage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Wheels' }))

    fireEvent.click(screen.getByRole('button', { name: /^\+12$/i }))

    const firstWheelCard = screen.getByRole('button', { name: /toggle ownership for birth of a soul/i }).closest('.collection-card-frame')
    const secondWheelCard = screen.getByRole('button', { name: /toggle ownership for call of the deep/i }).closest('.collection-card-frame')
    expect(firstWheelCard).toBeTruthy()
    expect(secondWheelCard).toBeTruthy()

    const firstWheelScope = within(firstWheelCard as HTMLElement)
    const secondWheelScope = within(secondWheelCard as HTMLElement)

    expect(firstWheelScope.getByRole('button', { name: /increase enlighten level/i })).toBeDisabled()
    expect(firstWheelScope.getByRole('button', { name: /decrease enlighten level/i })).not.toBeDisabled()
    expect(secondWheelScope.getByRole('button', { name: /increase enlighten level/i })).toBeDisabled()
    expect(secondWheelScope.getByRole('button', { name: /decrease enlighten level/i })).not.toBeDisabled()
  })

  it('does not toggle unowned entries to owned when applying enlighten presets', () => {
    render(<CollectionPage />)

    fireEvent.click(screen.getByRole('button', { name: /toggle ownership for ramona/i }))
    expect(screen.queryByRole('button', { name: /edit awakener level for ramona/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^\+4$/i }))

    expect(screen.queryByRole('button', { name: /edit awakener level for ramona/i })).not.toBeInTheDocument()
  })
})

