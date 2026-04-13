import {fireEvent, render, screen} from '@testing-library/react'
import {vi} from 'vitest'

import {type EventEntry} from '@/domain/timeline'

import {EventList} from './EventList'

vi.mock('@/domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => undefined,
}))

vi.mock('@/domain/wheel-assets', () => ({
  getWheelAssetById: () => undefined,
}))

vi.mock('@/domain/wheels', () => ({
  getWheels: () => [],
}))

describe('EventList', () => {
  it('keeps ended events collapsed by default, filters fluff archives, and shows rerun chips', () => {
    const now = new Date('2026-03-10T00:00:00.000Z')
    const events = [
      {
        id: 'active-rerun',
        title: 'Active Rerun Event',
        startDate: '2026-03-09T00:00:00.000Z',
        endDate: '2026-03-12T00:00:00.000Z',
        category: 'story',
        rerun: true,
      },
      {
        id: 'ended-story',
        title: 'Archived Story Event',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-08T00:00:00.000Z',
        category: 'story',
      },
      {
        id: 'ended-login',
        title: 'Archived Login Event',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-07T00:00:00.000Z',
        category: 'login',
      },
    ] as unknown as EventEntry[]

    render(<EventList events={events} now={now} />)

    expect(screen.getByText('Active Rerun Event')).toBeInTheDocument()
    expect(screen.getByText('Rerun')).toBeInTheDocument()
    expect(screen.getByText('Live').parentElement).toHaveAttribute(
      'title',
      'Mar 9, 2026 - Mar 12, 2026',
    )
    expect(screen.queryByText('Archived Story Event')).not.toBeInTheDocument()
    expect(screen.queryByText('Archived Login Event')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /ended/i}))

    expect(screen.getByText('Archived Story Event')).toBeInTheDocument()
    expect(screen.queryByText('Archived Login Event')).not.toBeInTheDocument()
  })
})
