import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { BuilderPage } from './BuilderPage'

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
})
