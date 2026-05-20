import {createRef} from 'react'

import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {WheelDatabaseFilters} from './WheelDatabaseFilters'

describe('WheelDatabaseFilters', () => {
  it('does not advertise mainstat text as searchable', () => {
    render(
      <WheelDatabaseFilters
        mainstatFilter='ALL'
        onMainstatFilterChange={vi.fn()}
        onQueryChange={vi.fn()}
        onRarityFilterChange={vi.fn()}
        onRealmFilterChange={vi.fn()}
        query=''
        rarityFilter='ALL'
        realmFilter='ALL'
        searchInputRef={createRef<HTMLInputElement>()}
      />,
    )

    expect(screen.getByRole('searchbox', {name: 'Search wheels'})).toHaveAttribute(
      'placeholder',
      'Name, owner, realm, rarity, or effect',
    )
  })
})
