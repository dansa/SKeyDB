import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {DatabaseTabSection} from './DatabaseTabSection'

describe('DatabaseTabSection', () => {
  it('announces collapsible section state and region linkage', () => {
    render(
      <DatabaseTabSection collapsible defaultCollapsed title='Talents'>
        <div>Section content</div>
      </DatabaseTabSection>,
    )

    const toggle = screen.getByRole('button', {name: /Talents/})

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', {name: 'Talents'})).not.toBeInTheDocument()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const region = screen.getByRole('region', {name: 'Talents'})

    expect(region).toHaveTextContent('Section content')
    expect(toggle).toHaveAttribute('aria-controls', region.getAttribute('id'))
  })
})
