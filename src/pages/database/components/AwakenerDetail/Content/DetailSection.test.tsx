import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {DetailSection} from './DetailSection'

describe('DetailSection', () => {
  it('renders the empty message when there are no items and no children', () => {
    render(<DetailSection emptyMessage='Nothing here yet.' items={[]} title='Talents' />)

    expect(screen.getByText('Talents')).toBeInTheDocument()
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('renders items, custom descriptions, and trailing children', () => {
    render(
      <DetailSection
        items={[
          {
            key: 't1',
            label: 'T1',
            name: 'First Talent',
            description: 'First description',
          },
        ]}
        renderDescription={(description) => <span>Decorated: {description}</span>}
        title='Talents'
      >
        <div>Extra footer</div>
      </DetailSection>,
    )

    expect(screen.getByText('T1')).toBeInTheDocument()
    expect(screen.getByText('First Talent')).toBeInTheDocument()
    expect(screen.getByText('Decorated: First description')).toBeInTheDocument()
    expect(screen.getByText('Extra footer')).toBeInTheDocument()
  })
})
