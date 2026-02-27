import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TabbedContainer } from './TabbedContainer'

describe('TabbedContainer', () => {
  it('renders tabs and calls on change', () => {
    const onTabChange = vi.fn()
    render(
      <TabbedContainer
        activeTabId="a"
        onTabChange={onTabChange}
        tabs={[
          { id: 'a', label: 'Tab A' },
          { id: 'b', label: 'Tab B' },
        ]}
      >
        <div>Body</div>
      </TabbedContainer>,
    )

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    const tabA = screen.getByRole('tab', { name: 'Tab A' })
    const tabB = screen.getByRole('tab', { name: 'Tab B' })
    expect(tabA).toBeInTheDocument()
    expect(tabB).toBeInTheDocument()
    expect(tabA).toHaveAttribute('aria-selected', 'true')
    expect(tabB).toHaveAttribute('aria-selected', 'false')
    expect(tabA).toHaveAttribute('aria-controls')
    expect(tabB).toHaveAttribute('aria-controls')
    const tabPanel = screen.getByRole('tabpanel')
    expect(tabPanel).toBeInTheDocument()
    expect(tabPanel).toHaveAttribute('aria-labelledby', tabA.getAttribute('id'))
    expect(screen.getByText('Body')).toBeInTheDocument()

    fireEvent.click(tabB)
    expect(onTabChange).toHaveBeenCalledWith('b')
  })

  it('renders optional close actions without triggering tab change', () => {
    const onTabChange = vi.fn()
    const onTabClose = vi.fn()

    render(
      <TabbedContainer
        activeTabId="a"
        canCloseTab={(tab) => tab.id !== 'a'}
        onTabChange={onTabChange}
        onTabClose={onTabClose}
        tabs={[
          { id: 'a', label: 'Tab A' },
          { id: 'b', label: 'Tab B' },
        ]}
      >
        <div>Body</div>
      </TabbedContainer>,
    )

    expect(screen.queryByRole('button', { name: /close tab a/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close tab b/i }))
    expect(onTabClose).toHaveBeenCalledWith('b')
    expect(onTabChange).not.toHaveBeenCalled()
  })
})

