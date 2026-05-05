import type {KeyboardEvent as ReactKeyboardEvent} from 'react'

import {act, renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {useAwakenerDetailSearch} from './useAwakenerDetailSearch'

const AWAKENERS: Awakener[] = [
  {
    id: 'awakener-0001',
    name: 'alpha',
    realm: 'CHAOS',
    faction: 'Test',
    type: 'ASSAULT',
    rarity: 'SSR',
    aliases: ['alpha'],
    tags: [],
    lineupToken: 'a',
  },
  {
    id: 'awakener-0002',
    name: 'beta',
    realm: 'AEQUOR',
    faction: 'Test',
    type: 'WARDEN',
    rarity: 'SR',
    aliases: ['beta'],
    tags: [],
    lineupToken: 'b',
  },
]

function createKeyboardEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as ReactKeyboardEvent<HTMLInputElement>
}

describe('useAwakenerDetailSearch', () => {
  it('cycles results with arrow keys and selects the active result on enter', () => {
    const onSelectAwakener = vi.fn()
    const {result} = renderHook(() =>
      useAwakenerDetailSearch({
        activeTab: 'skills',
        awakeners: AWAKENERS,
        onSelectAwakener,
      }),
    )

    act(() => {
      result.current.handleSearchQueryChange('a')
    })

    expect(result.current.searchResults.map((awakener) => awakener.id)).toEqual([
      'awakener-0001',
      'awakener-0002',
    ])
    expect(result.current.activeSearchIndex).toBe(0)

    act(() => {
      result.current.handleSearchInputKeyDown(createKeyboardEvent('ArrowDown'))
    })
    expect(result.current.activeSearchIndex).toBe(1)

    act(() => {
      result.current.handleSearchInputKeyDown(createKeyboardEvent('ArrowUp'))
    })
    expect(result.current.activeSearchIndex).toBe(0)

    act(() => {
      result.current.handleSearchInputKeyDown(createKeyboardEvent('Enter'))
    })

    expect(onSelectAwakener).toHaveBeenCalledWith(
      expect.objectContaining({id: 'awakener-0001'}),
      'skills',
    )
    expect(result.current.searchQuery).toBe('')
    expect(result.current.isSearchOpen).toBe(false)
  })
})
