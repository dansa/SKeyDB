import {describe, expect, it, vi} from 'vitest'

import {buildRelicActiveFilterChips} from './database-active-filter-chips'

describe('relic active filter chips', () => {
  it('builds query and category chips with clear actions', () => {
    const clearQuery = vi.fn()
    const setCategoryFilter = vi.fn()
    const chips = buildRelicActiveFilterChips(
      {
        categoryFilter: 'FADED_LEGACY',
        query: 'omen',
      },
      {clearQuery, setCategoryFilter},
    )

    expect(chips.map((chip) => chip.label)).toEqual(['Search: "omen"', 'Faded Legacy'])
    chips[0]?.onClear()
    chips[1]?.onClear()
    expect(clearQuery).toHaveBeenCalledOnce()
    expect(setCategoryFilter).toHaveBeenCalledWith('ALL')
  })
})
