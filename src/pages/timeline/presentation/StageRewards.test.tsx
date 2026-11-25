import {fireEvent, render, screen, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {getNotableLoginDays} from './loginCalendar'
import {StageRewards} from './StageRewards'

describe('StageRewards', () => {
  it('shows milestone-only rewards directly under the Rewards section', () => {
    const {container} = render(
      <StageRewards
        category='milestone'
        groups={[]}
        missions={[{label: 'Spend 100', standard: [{name: 'Silver', amount: '×10'}]}]}
        priceMode='silver-prime'
      />,
    )
    expect(screen.getByRole('heading', {name: 'Rewards'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'By milestone (1)'})).toBeInTheDocument()
    expect(screen.getByRole('table', {name: 'Rewards by milestone'})).toBeInTheDocument()
    expect(screen.getByText('Spend 100')).toBeVisible()
    expect(container.querySelector('details')).toBeNull()
  })

  it('keeps Prime thresholds visible and adds extraction estimates only in USD mode', () => {
    const props = {
      category: 'milestone' as const,
      groups: [],
      missions: [
        {silverPrimeExtracted: 5000, standard: [{name: 'Silver', amount: '×10'}]},
        {label: '100 Awakens', standard: [{name: 'Dreamspark', amount: '×100'}]},
      ],
    }
    const {rerender} = render(<StageRewards {...props} priceMode='silver-prime' />)
    expect(screen.getByRole('rowheader', {name: '5,000 Silver Prime extracted'})).toBeVisible()
    expect(screen.queryByText('~$76 USD')).not.toBeInTheDocument()

    rerender(<StageRewards {...props} priceMode='usd-estimate' />)
    expect(
      screen.getByRole('rowheader', {name: '5,000 Silver Prime extracted ~$76 USD'}),
    ).toBeVisible()
    expect(screen.getByRole('rowheader', {name: '100 Awakens'})).toBeVisible()
  })

  it('separates guaranteed raid rewards from the two outcomes of one drop roll', () => {
    render(
      <StageRewards
        category='raid'
        groups={[
          {title: 'Final Battle first-clear rewards', items: [{name: 'Silver', amount: '×10,000'}]},
        ]}
        missions={[
          {
            label: 'Final Avatar',
            standard: [{name: 'Silver', amount: '×100'}],
            dropRoll: [
              {name: 'Pure Core', amount: '×1', chancePercent: 75},
              {name: 'Ethereal Core', amount: '×1', chancePercent: 25},
            ],
          },
        ]}
        priceMode='silver-prime'
      />,
    )
    fireEvent.click(screen.getByText('Boss Avatar drops', {selector: 'summary'}))
    const table = screen.getByRole('table', {name: 'Boss Avatar drops'})
    const roll = within(table).getByRole('group', {name: 'One random drop'})
    expect(within(table).getByText('Silver')).toBeVisible()
    expect(within(roll).queryByText('Silver')).not.toBeInTheDocument()
    expect(within(roll).getByRole('button', {name: 'Pure Core ×1, 75% chance'})).toBeVisible()
    expect(within(roll).getByRole('button', {name: 'Ethereal Core ×1, 25% chance'})).toBeVisible()
  })

  it('uses feature rows for small highlights and a grid for larger groups', () => {
    const items = [
      {name: 'Thirsting Brush', amount: '×4'},
      {name: 'Candy Snatcher', amount: '×1'},
      {name: 'Rota Fortunae', amount: '×2'},
    ]
    const {rerender} = render(
      <StageRewards groups={[{items: items.slice(0, 2)}]} priceMode='silver-prime' />,
    )
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Thirsting Brush ×4'})).toHaveTextContent('×4')
    expect(screen.getByRole('button', {name: 'Candy Snatcher ×1'})).not.toHaveTextContent('×1')
    rerender(<StageRewards groups={[{items}]} priceMode='silver-prime' />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('shows highlights before materials and separately inside choices', () => {
    render(
      <StageRewards
        priceMode='silver-prime'
        groups={[
          {
            title: 'Box',
            summaryCount: 2,
            choiceCount: 1,
            items: [
              {name: 'Silver', amount: '×10'},
              {name: 'Thirsting Brush', amount: '×1'},
              {name: 'Dreamspark', amount: '×1'},
              {name: 'Candy Snatcher', amount: '×1'},
            ],
          },
        ]}
      />,
    )
    expect(
      screen.getByText('Thirsting Brush').compareDocumentPosition(screen.getByText('Silver')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    const disclosure = screen.getByText('Choice pool (2) · pick 1').closest('details')
    if (!disclosure) throw new Error('Choices disclosure not found')
    fireEvent.click(screen.getByText('Choice pool (2) · pick 1'))
    expect(
      within(disclosure)
        .getByText('Candy Snatcher')
        .compareDocumentPosition(within(disclosure).getByText('Dreamspark')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('labels stock disclosures and keeps the claim schedule with its paid pack', () => {
    render(
      <StageRewards
        priceMode='silver-prime'
        groups={[
          {
            title: 'Offer Tribute limited stock',
            summaryCount: 1,
            items: [
              {name: 'Silver', amount: '×10'},
              {name: 'Dreamshard', amount: '×2'},
            ],
          },
          {
            title: 'Paid Archives',
            price: '1980 Silver Prime',
            items: [{name: 'Silver', amount: '×1'}],
            claims: [{label: 'Day 2', items: [{name: 'Dreamshard', amount: '×1'}]}],
          },
          {title: 'Early purchase bonus', items: [{name: 'Silver', amount: '×5'}]},
        ]}
      />,
    )
    expect(screen.getByText('More stock (1)')).toBeInTheDocument()
    const claims = screen.getByText('Paid claim schedule')
    expect(
      claims.compareDocumentPosition(screen.getByText('Early purchase bonus')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('marks login days that give a one-off item or more than the usual amount', () => {
    const core = (amount: string) => ({name: 'Luminous Core', amount})
    const silver = {name: 'Silver', amount: '×5,000'}
    const items = [
      core('×1'),
      core('×1'),
      core('×2'),
      core('×1'),
      core('×1'),
      core('×1'),
      core('×3'),
      silver,
      silver,
      {name: 'Dream Ticket', amount: '×1'},
    ]
    expect([...getNotableLoginDays(items)].sort((a, b) => a - b)).toEqual([2, 6, 9])
    render(<StageRewards groups={[{layout: 'days', items}]} priceMode='silver-prime' />)
    expect(screen.getByLabelText('Day 7: Luminous Core ×3, bonus day')).toHaveAttribute(
      'data-notable',
      'true',
    )
    expect(screen.getByLabelText('Day 1: Luminous Core ×1')).not.toHaveAttribute('data-notable')
  })

  it('collapses identical login rewards into one item and a count', () => {
    render(
      <StageRewards
        priceMode='silver-prime'
        groups={[
          {
            layout: 'days',
            items: Array.from({length: 16}, () => ({name: 'To the Stars', amount: '×1'})),
          },
        ]}
      />,
    )
    expect(screen.getByText('Awarded on each of the first 16 logins.')).toBeInTheDocument()
    expect(screen.getAllByText('To the Stars')).toHaveLength(1)
    expect(screen.queryByLabelText(/^Day /)).not.toBeInTheDocument()
  })
})
