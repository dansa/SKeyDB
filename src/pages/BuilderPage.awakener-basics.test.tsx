import {fireEvent, render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {COLLECTION_OWNERSHIP_KEY} from '@/domain/collection-ownership'

import './builder-page.integration-mocks'

import {BuilderPage} from './BuilderPage'

describe('BuilderPage awakener basics', () => {
  it('uses icon-only empty placeholders without helper text', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const {container} = render(<BuilderPage />)
    await Promise.resolve()

    expect(screen.queryByText(/tap to deploy/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^wheel$/i)).not.toBeInTheDocument()
    expect(container.querySelectorAll('.sigil-placeholder').length).toBeGreaterThan(0)
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('adds to the first empty slot when clicking a picker portrait', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /ramona: timeworn/i}))

    expect(screen.getByRole('button', {name: /change ramona: timeworn/i})).toBeInTheDocument()
  })

  it('displays collection awakener level as read-only Lv text on builder cards', () => {
    window.localStorage.setItem(
      COLLECTION_OWNERSHIP_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: '2026-01-01T00:00:00.000Z',
        payload: {
          ownedAwakeners: {'1': 0},
          awakenerLevels: {'1': 77},
          ownedWheels: {},
          ownedPosses: {},
          displayUnowned: true,
        },
      }),
    )

    render(<BuilderPage />)
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.load(screen.getByAltText(/goliath card/i))

    expect(screen.getByText((_, element) => element?.textContent === 'Lv.77')).toBeInTheDocument()
  })

  it('marks awakeners as in use after being assigned to the team', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    const goliathPortrait = screen.getByAltText(/goliath portrait/i)
    const goliathPickerButton = goliathPortrait.closest('button')

    expect(goliathPickerButton).not.toBeNull()
    expect(goliathPickerButton).toHaveAttribute('data-in-use', 'true')
    expect(goliathPickerButton).toHaveTextContent(/already used/i)
  })

  it('captures global typing into the active picker search', () => {
    render(<BuilderPage />)

    fireEvent.keyDown(window, {key: 'r'})
    fireEvent.keyDown(window, {key: 'a'})
    fireEvent.keyDown(window, {key: 'm'})
    fireEvent.keyDown(window, {key: 'o'})
    fireEvent.keyDown(window, {key: 'n'})
    fireEvent.keyDown(window, {key: 'a'})

    expect(screen.getByRole('searchbox')).toHaveValue('ramona')
  })

  it('marks alternate awakeners as used when one form is assigned', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /ramona portrait/i}))

    const timewornPortrait = screen.getByAltText(/ramona: timeworn portrait/i)
    const timewornPickerButton = timewornPortrait.closest('button')

    expect(timewornPickerButton).not.toBeNull()
    expect(timewornPickerButton).toHaveAttribute('data-in-use', 'true')
    expect(timewornPickerButton).toHaveTextContent(/already used/i)
  })

  it('replaces the active card when clicking an awakener in picker', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /ramona: timeworn/i}))

    expect(screen.queryByRole('button', {name: /change goliath/i})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: /change ramona: timeworn/i})).toBeInTheDocument()
  })

  it('shows remove action for active card and clears it', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /remove active awakener/i}))

    expect(screen.queryByRole('button', {name: /change goliath/i})).not.toBeInTheDocument()
  })

  it('toggles off active card when clicking the same card again', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    expect(screen.getByRole('button', {name: /remove active awakener/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    expect(screen.queryByRole('button', {name: /remove active awakener/i})).not.toBeInTheDocument()
  })

  it('switches active team when clicking the team row card', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    expect(screen.getByRole('button', {name: /change goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).toBeInstanceOf(HTMLElement)
    if (!(team2Row instanceof HTMLElement)) {
      throw new Error('Expected Team 2 row element')
    }
    const team2Tile = team2Row.querySelector('.builder-picker-tile')
    expect(team2Tile).toBeInstanceOf(HTMLElement)
    if (!(team2Tile instanceof HTMLElement)) {
      throw new Error('Expected Team 2 picker tile element')
    }

    fireEvent.click(team2Tile)
    expect(screen.queryByRole('button', {name: /change goliath/i})).not.toBeInTheDocument()
  })

  it('switches active team from the top team tabs', () => {
    const {container} = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /\+ add team/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    expect(screen.getByRole('button', {name: /change goliath/i})).toBeInTheDocument()

    const builderTabbedContainer = container.querySelector('.tabbed-container')
    expect(builderTabbedContainer).toBeInstanceOf(HTMLElement)
    if (!(builderTabbedContainer instanceof HTMLElement)) {
      throw new Error('Expected builder tabbed container element')
    }
    fireEvent.click(within(builderTabbedContainer).getByRole('tab', {name: /team 2/i}))

    expect(screen.queryByRole('button', {name: /change goliath/i})).not.toBeInTheDocument()
  })
})
