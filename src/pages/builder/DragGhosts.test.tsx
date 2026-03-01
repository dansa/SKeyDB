import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../builder-page.integration-mocks'
import { TeamCardGhost } from './DragGhosts'
import type { TeamSlot } from './types'

describe('TeamCardGhost', () => {
  it('renders the shared meta row with level, dupe, and covenant visuals', () => {
    const slot: TeamSlot = {
      slotId: 'slot-1',
      awakenerName: 'goliath',
      faction: 'CHAOS',
      level: 77,
      wheels: [null, null],
      covenantId: 'c01',
    }

    const { container } = render(
      <TeamCardGhost awakenerOwnedLevel={5} slot={slot} wheelOwnedLevels={[null, null]} />,
    )

    expect(screen.getByText((_, element) => element?.textContent === 'Lv.77')).toBeInTheDocument()
    expect(container.querySelector('.builder-awakener-dupe-meta')).not.toBeNull()
    expect(container.querySelector('.builder-card-covenant-wrap .covenant-tile')).not.toBeNull()
  })
})
