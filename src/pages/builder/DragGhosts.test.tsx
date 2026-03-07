import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import '../builder-page.integration-mocks'

import {TeamCardGhost, TeamPreviewGhost} from './DragGhosts'
import type {Team, TeamSlot} from './types'

describe('TeamCardGhost', () => {
  it('renders the shared meta row with level, dupe, and covenant visuals', () => {
    const slot: TeamSlot = {
      slotId: 'slot-1',
      awakenerName: 'goliath',
      realm: 'CHAOS',
      level: 77,
      wheels: [null, null],
      covenantId: 'c01',
    }

    const {container} = render(
      <TeamCardGhost awakenerOwnedLevel={5} slot={slot} wheelOwnedLevels={[null, null]} />,
    )

    expect(screen.getByText((_, element) => element?.textContent === 'Lv.77')).toBeInTheDocument()
    expect(container.querySelector('.builder-awakener-dupe-meta')).not.toBeNull()
    expect(container.querySelector('.builder-card-covenant-wrap .covenant-tile')).not.toBeNull()
  })
})

describe('TeamPreviewGhost', () => {
  it('renders expanded team preview content inside the drag ghost', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Team 1',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'ramona',
          realm: 'CHAOS',
          wheels: ['SR19', null],
          covenantId: 'c01',
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ],
    }

    const {container} = render(
      <TeamPreviewGhost
        mode='expanded'
        ownedAwakenerLevelByName={new Map([['ramona', 1]])}
        ownedWheelLevelById={new Map([['SR19', 3]])}
        team={team}
      />,
    )

    expect(container.querySelector('.builder-team-preview-ghost')).not.toBeNull()
    expect(screen.getByAltText(/expanded team preview card/i)).toBeInTheDocument()
    expect(container.querySelectorAll('.builder-team-slot-preview-wheel')).toHaveLength(8)
  })
})
