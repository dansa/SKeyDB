import {describe, expect, it, vi} from 'vitest'

import {buildRelicActiveFilterChips} from './database-active-filter-chips'

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
