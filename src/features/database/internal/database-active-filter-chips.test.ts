import {describe, expect, it, vi} from 'vitest'

import {
  buildPosseActiveFilterChips,
  buildRelicActiveFilterChips,
} from './database-active-filter-chips'

describe('relic active filter chips', () => {
  it('builds query, category, and tier chips with clear actions', () => {
    const clearQuery = vi.fn()
    const setCategoryFilter = vi.fn()
    const setTierFilter = vi.fn()
    const chips = buildRelicActiveFilterChips(
      {
        categoryFilter: 'FADED_LEGACY',
        query: 'omen',
        tierFilter: 'CURSED',
      },
      {clearQuery, setCategoryFilter, setTierFilter},
    )

    expect(chips.map((chip) => chip.label)).toEqual(['Search: "omen"', 'Faded Legacy', 'Cursed'])
    chips[0]?.onClear()
    chips[1]?.onClear()
    chips[2]?.onClear()
    expect(clearQuery).toHaveBeenCalledOnce()
    expect(setCategoryFilter).toHaveBeenCalledWith('ALL')
    expect(setTierFilter).toHaveBeenCalledWith('ALL')
  })
})

describe('posse active filter chips', () => {
  it('treats All as the unfiltered type and clears type chips back to All', () => {
    const actions = {
      clearQuery: vi.fn(),
      setRealmFilter: vi.fn(),
      setTypeFilter: vi.fn(),
    }

    expect(
      buildPosseActiveFilterChips({query: '', realmFilter: 'ALL', typeFilter: 'ALL'}, actions),
    ).toEqual([])

    const chips = buildPosseActiveFilterChips(
      {query: '', realmFilter: 'ALL', typeFilter: 'PRIMORDIAL_MEMORY'},
      actions,
    )
    expect(chips.map((chip) => chip.label)).toEqual(['Primordial Memories'])

    chips[0]?.onClear()
    expect(actions.setTypeFilter).toHaveBeenCalledWith('ALL')
  })
})
