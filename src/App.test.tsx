import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App shell', () => {
  it('renders app navigation and title', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /skeydb/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /characters/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /builder/i })).toBeInTheDocument()
  })
})
