import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CollectionPage } from './CollectionPage'

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
})
