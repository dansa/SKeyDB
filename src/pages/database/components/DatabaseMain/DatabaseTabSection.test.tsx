import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {
  DatabaseTabProse,
  DatabaseTabRow,
  DatabaseTabSection,
  DatabaseTabSubsection,
} from './DatabaseTabSection'

describe('DatabaseTabSection', () => {
  it('uses ASCII collapse labels and toggles the section content', () => {
    render(
      <DatabaseTabSection collapsible defaultCollapsed title='Build Notes'>
        <div>Section content</div>
      </DatabaseTabSection>,
    )

    expect(screen.getByRole('button', {name: /Build Notes/i})).toHaveTextContent('Show')
    expect(screen.queryByText('Section content')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /Build Notes/i}))

    expect(screen.getByRole('button', {name: /Build Notes/i})).toHaveTextContent('Hide')
    expect(screen.getByText('Section content')).toBeInTheDocument()
  })

  it('renders subsection dividers, tab rows, and prose content', () => {
    const {container} = render(
      <>
        <DatabaseTabSection title='Static'>
          <div>Static content</div>
        </DatabaseTabSection>
        <DatabaseTabSubsection>
          <div>First row</div>
          <div>Second row</div>
        </DatabaseTabSubsection>
        <DatabaseTabRow label='Label' showDivider>
          <div>Row content</div>
        </DatabaseTabRow>
        <DatabaseTabProse baseFontPx={14}>Prose copy</DatabaseTabProse>
      </>,
    )

    expect(screen.getByText('Static content')).toBeInTheDocument()
    expect(screen.getByText('First row')).toBeInTheDocument()
    expect(screen.getByText('Second row')).toBeInTheDocument()
    expect(screen.getByText('Label')).toBeInTheDocument()
    expect(screen.getByText('Row content')).toBeInTheDocument()
    expect(screen.getByText('Prose copy')).toHaveStyle({
      fontSize: 'calc(var(--desc-font-scale, 1) * 14px)',
    })
    expect(container.querySelectorAll('.bg-linear-to-r')).not.toHaveLength(0)
  })
})
