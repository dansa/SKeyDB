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

    const svgSlots = container.querySelectorAll('.collection-dupe-slot-svg-art')
    expect(svgSlots).toHaveLength(4)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('reserves overflow slot even when level does not overflow', () => {
    const { container } = render(<DupeLevelDisplay level={2} />)

    const svgSlots = container.querySelectorAll('.collection-dupe-slot-svg-art')
    expect(svgSlots).toHaveLength(4)
    expect(container.querySelector('.collection-dupe-svg-slot-overflow-hidden')).toBeInTheDocument()
  })

  it('renders dupe container', () => {
    const { container } = render(<DupeLevelDisplay level={6} />)
    expect(container.querySelector('.collection-dupe-svg')).toBeInTheDocument()
  })
})

