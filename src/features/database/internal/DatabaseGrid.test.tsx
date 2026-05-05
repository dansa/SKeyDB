import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {getAwakeners} from '@/domain/awakeners'

import {DatabaseGrid} from './DatabaseGrid'

describe('DatabaseGrid', () => {
  it('defers lower-priority grid portraits while keeping the first twenty-four cards eager', () => {
    render(<DatabaseGrid awakeners={getAwakeners().slice(0, 30)} onSelectAwakener={vi.fn()} />)

    expect(screen.getAllByRole('button', {name: /View details for/})).toHaveLength(30)

    const images = screen.getAllByRole('img')

    expect(images).toHaveLength(30)
    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[0]).toHaveAttribute('fetchpriority', 'high')
    expect(images[23]).toHaveAttribute('loading', 'eager')
    expect(images[23]).toHaveAttribute('fetchpriority', 'high')
    expect(images[24]).toHaveAttribute('loading', 'lazy')
    expect(images[24]).toHaveAttribute('fetchpriority', 'low')
    expect(images[29]).toHaveAttribute('loading', 'lazy')
    expect(images[29]).toHaveAttribute('fetchpriority', 'low')
  })
})
