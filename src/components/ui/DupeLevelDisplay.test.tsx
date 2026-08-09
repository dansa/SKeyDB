import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {DupeLevelDisplay} from './DupeLevelDisplay'

describe('DupeLevelDisplay', () => {
  it('renders nothing for null level', () => {
    const {container} = render(<DupeLevelDisplay level={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders filled slots and overflow slot for high levels', () => {
    const {container} = render(<DupeLevelDisplay level={6} />)

    const svgSlots = container.querySelectorAll('.collection-dupe-slot-svg-art')
    expect(svgSlots).toHaveLength(4)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('reserves overflow slot even when level does not overflow', () => {
    const {container} = render(<DupeLevelDisplay level={2} />)

    const svgSlots = container.querySelectorAll('.collection-dupe-slot-svg-art')
    expect(svgSlots).toHaveLength(4)
    expect(container.querySelector('.collection-dupe-svg-slot-overflow-hidden')).toBeInTheDocument()
  })

  it('renders dupe container', () => {
    const {container} = render(<DupeLevelDisplay level={6} />)
    expect(container.querySelector('.collection-dupe-svg')).toBeInTheDocument()
  })

  it('can omit the overflow slot while preserving the filled diamonds', () => {
    const {container} = render(<DupeLevelDisplay level={6} showOverflowSlot={false} />)

    const svgSlots = container.querySelectorAll('.collection-dupe-slot-svg-art')
    expect(svgSlots).toHaveLength(3)
    expect(container.querySelector('.collection-dupe-svg-slot-overflow')).not.toBeInTheDocument()
    expect(screen.queryByText('3')).not.toBeInTheDocument()
  })

  it('keeps its slots presentational unless level selection is enabled', () => {
    render(<DupeLevelDisplay level={2} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('selects a different exact level while leaving the current level as a no-op', () => {
    const onSelect = vi.fn()

    render(
      <DupeLevelDisplay
        level={2}
        levelSelection={{
          getAriaLabel: (level) => `Choose E${String(level)}`,
          onSelect,
        }}
      />,
    )

    const currentLevel = screen.getByRole('button', {name: 'Choose E2'})
    expect(currentLevel).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(currentLevel)
    expect(onSelect).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', {name: 'Choose E3'}))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith(3)
  })
})
