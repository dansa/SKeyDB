import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {AwakenerGridCard} from './AwakenerGridCard'

describe('AwakenerGridCard', () => {
  it('renders database card stats at the basic max level instead of level 1', () => {
    const awakener = {
      id: 'awakener-0024',
      numericId: 24,
      name: '24',
      faction: 'Test',
      realm: 'CARO',
      aliases: ['24'],
      stats: {
        CON: 52,
        ATK: 66,
        DEF: 30,
      },
      primaryScalingBase: 30,
      statScaling: {
        CON: 1.65,
        ATK: 2.1,
        DEF: 0.95,
      },
      tags: [],
      lineupToken: 'T',
    } as Awakener

    render(<AwakenerGridCard awakener={awakener} index={0} onSelect={vi.fn()} />)

    expect(screen.getByText('149')).toBeInTheDocument()
    expect(screen.getByText('189')).toBeInTheDocument()
    expect(screen.getByText('86')).toBeInTheDocument()
    expect(screen.queryByText('52')).not.toBeInTheDocument()
  })
})
