import {describe, expect, it, vi} from 'vitest'

import {buildRelicActiveFilterChips} from './database-active-filter-chips'

describe('relic active filter chips', () => {
  it('builds query, category, and rarity chips with clear actions', () => {
    const clearQuery = vi.fn()
    const setCategoryFilter = vi.fn()
    const setRarityFilter = vi.fn()
    const chips = buildRelicActiveFilterChips(
      {
        categoryFilter: 'FADED_LEGACY',
        query: 'omen',
        rarityFilter: 'SSR',
      },
      {clearQuery, setCategoryFilter, setRarityFilter},
    )

    expect(chips.map((chip) => chip.label)).toEqual(['Search: "omen"', 'Faded Legacy', 'SSR'])
    chips[0]?.onClear()
    chips[1]?.onClear()
    chips[2]?.onClear()
    expect(clearQuery).toHaveBeenCalledOnce()
    expect(setCategoryFilter).toHaveBeenCalledWith('ALL')
    expect(setRarityFilter).toHaveBeenCalledWith('ALL')
  })
})
