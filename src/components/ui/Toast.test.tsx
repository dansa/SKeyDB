import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Toast } from './Toast'

describe('Toast', () => {
  it('renders a stack when messages are provided', () => {
    render(<Toast messages={['one', 'two']} />)

    const items = screen.getAllByRole('status')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('one')
    expect(items[1]).toHaveTextContent('two')
  })

  it('prefers stable entry ids when provided', () => {
    render(<Toast entries={[{ id: 5, message: 'one' }, { id: 7, message: 'two' }]} />)

    const items = screen.getAllByRole('status')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('one')
    expect(items[1]).toHaveTextContent('two')
  })
})
