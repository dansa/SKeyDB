import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

    fireEvent.click(screen.getByRole('button', { name: 'Wheels' }))
    expect(screen.queryByRole('button', { name: /export box as png/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export wheels as png/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Posses' }))
    expect(screen.queryByRole('button', { name: /export box as png/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /export wheels as png/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Awakeners' }))
    expect(screen.getByRole('button', { name: /export box as png/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /export wheels as png/i })).not.toBeInTheDocument()
  })
})
