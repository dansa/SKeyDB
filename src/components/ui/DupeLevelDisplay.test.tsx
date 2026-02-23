import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DupeLevelDisplay } from './DupeLevelDisplay'

describe('DupeLevelDisplay', () => {
  it('renders nothing for null level', () => {
    const { container } = render(<DupeLevelDisplay level={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders filled slots and overflow slot for high levels', () => {
    const { container } = render(<DupeLevelDisplay level={6} />)

    const filled = container.querySelectorAll('.collection-dupe-slot-filled')
    expect(filled).toHaveLength(3)
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})

