import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import './builder-page.integration-mocks'

import {BuilderPage} from './BuilderPage'

describe('BuilderPage covenants', () => {
  it('shows covenant picker tab and covenant search placeholder', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('tab', {name: /covenants/i}))

    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'Search covenants (name, id)',
    )
  })

  it('sets covenant on active slot and allows clearing it from picker', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', {name: /set covenant/i}))
    fireEvent.click(screen.getByRole('button', {name: /deus ex machina covenant/i}))

    expect(screen.getByRole('button', {name: /edit covenant/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /not set covenant/i}))
    expect(screen.getAllByRole('button', {name: /set covenant/i}).length).toBeGreaterThan(0)
  })

  it('assigns covenant when awakener card is active and covenant is clicked in picker', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    fireEvent.click(screen.getByRole('tab', {name: /covenants/i}))
    fireEvent.click(screen.getByRole('button', {name: /deus ex machina covenant/i}))

    expect(screen.getByRole('button', {name: /edit covenant/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /remove active awakener/i})).toBeInTheDocument()
  })

  it('renders the unset covenant slot with the svg placeholder frame', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))

    const setCovenantButton = screen.getByRole('button', {name: /set covenant/i})
    const covenantTile = setCovenantButton.closest('.covenant-tile')

    expect(covenantTile).not.toBeNull()
    expect(covenantTile?.querySelector('.builder-covenant-placeholder-svg')).not.toBeNull()
  })
})
